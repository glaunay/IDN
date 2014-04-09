package nodeMapper;

use lib qw(/home/glaunay/lib/perl /var/www/cgi-bin/lib/perl);
use strict;
use common;



=pod perl subroutines to perform server-side
    cytoscape.js variable setting
=cut



=pod 
    constructor call takes a sif file as input
=cut
sub new {
    my $class = shift @_;
    my $self = {
	nodesList => [],
	edgesList => []
    };
    bless $self, $class;
    
    my $p = common::arg_parser (@_);
    if (!common::slid ($p->{ inputFile } || $p->{ database })) {
	print STDERR "madatory argument missing";
	return;
    }
    if (!open FILE, "<$p->{ inputFile }") {
	print STDERR "error opening input file \" $p->{ inputFile }\"\n";
	return;
    }
    $self->{ DB } = $p->{ database };

    while (my $l = <FILE>) {
	#print $l;
	my ($nameA, $link, $nameB) = split /[\s]+/, $l;
	#print "[$nameA, $link, $nameB]\n";
	for my $iName ($nameA, $nameB) {
	    $self->_addNode (name => $iName);
	}
	$self->_addEdge (partners => [$nameA, $nameB], relationship => $link);
    }	    
    
    return $self;
}

=pod 
    _addNode : constructor subroutine called to create all nodes related infromations
    stored attributes are [(name acedb identifier), (common name)]
=cut
sub _addNode {
    my $self = shift;
    
    my $p = common::arg_parser (@_);
    if (!common::slid ($p->{ name })) {
	print STDERR "madatory argument missing";
	return;
    }
    my $node = {};
    
    $node->{ name } =  $p->{ name };
    #($self->_nodeIsKnown ($node->{ name })) && return 1;

    if ($self->_nodeIsKnown ($node->{ name })) {
	#print "$node->{ name } is known\n";
	return 1;
    }
    
    my @aceObjects = $self->{ DB }->fetch (-query => "find BioMolecule $node->{ name }");
    #print "--- BioMolecule entry content ---\n" . $aceObjects[0]->asString; #->asString        
    $node->{ type } = $aceObjects[0]->get('Type')->at();
    if ($node->{ type } eq "Multimer") {
	$node->{ commonName } = $aceObjects[0]->get('Multimer_Name')->at();	
    } elsif ($node->{ type } eq "Prot") {
	$node->{ commonName } = $aceObjects[0]->get('Common_Name')->at(); 
    } elsif ($node->{ type } eq "Protein_Fragment") {
	$node->{ commonName } = $aceObjects[0]->get('FragmentName')->at(); 
    } elsif ($node->{ type } eq "Glycosaminoglycan") {
	$node->{ commonName } = $aceObjects[0]->get('GAG_Name')->at(); 
    } elsif ($node->{ type } eq "Cation") {
	$node->{ commonName } = $aceObjects[0]->get('Cation_Name')->at(); 
    } elsif ($node->{ type } =~ /ipid$/) {
	$node->{ commonName } = $aceObjects[0]->get('Glycolipid_Name')->at(); 
    } elsif ($node->{ type } =~ /Phospholipid/) {
	$node->{ commonName } = $aceObjects[0]->get('Phospholipid_Name')->at(); 
    } elsif ($node->{ type } =~ /Inorganic/) {
	$node->{ commonName } = $aceObjects[0]->get('Inorganic_Name')->at(); 
    } 
    #print "$node->{ name } loaded\n";
    push @{$self->{ nodesList } }, $node;
    return 1;
}

sub _nodeIsKnown {
    my $self = shift;
    my $nodeName = shift;
    
    (defined ($self->_getNode ($nodeName))) && return 1;

    return 0;
}

sub _getNode {
    my $self = shift;
    my $nodeName = shift;
    
    foreach my $node (@{$self->{ nodesList }}) {
	($node->{ name } eq "$nodeName") && return $node;
    }
    
    return;
}

=pod 
    _addEdge : constructor subroutine called to create link between interacting nodes 
    and their related informations:
    stored attributes are [left, right (pointers to nodes), kinetics, detection method]
=cut
sub _addEdge {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    my ($a, $b) = @{$p->{ partners }};
    
    my $edge =  {};
    $edge->{ left }  = $self->_getNode ($a);
    $edge->{ right } = $self->_getNode ($b);
    $edge->{ type } = $p->{ relationship };
    $edge->{ experimentsArray } = [];
    my @belongsTo = qw /ml po bc/; # is multimer, fragment or covalently bound
    
    $edge->{ id } = "${a}_$b";
    if (!common::list_exist(\@belongsTo, $edge->{ type })) {
	my $associationName = "${a}_$b";
	#print "trying $associationName\n";
	my @aceObjects = $self->{ DB }->fetch (-query => "find Association $associationName");
	if (@aceObjects == 0) {
	    $associationName = "${b}_$a";
	  #  print "trying $associationName (find Association $associationName)\n";
	    @aceObjects = $self->{ DB }->fetch (-query => "find Association $associationName");
	}
	
# Do smthg with association content
	$edge->{ id } = $associationName;
	#print "-edge acedb input-\n";
	#print $aceObjects[0]->asString . "\n";
	# do we store source data provider and device pairs ?
	my @sources  = $aceObjects[0]->get('Source');
	#print "array size : " . scalar (@sources) . "\n";
	#print "array content : (@sources)\n";
	@aceObjects = $self->{ DB }->fetch (-query => "find Association $associationName; follow Experiment");
# Do smthg with experiment content
	#print "toto:@aceObjects\n";
	foreach my $aceExperiment (@aceObjects) {
	    my $h = {};
	    $h->{ id } = $aceExperiment->name;
	    $h->{ pmid } = $aceExperiment->get('PMID')->at();
	    $h->{ detectionMethod } = $aceExperiment->get('Interaction_Detection_Method')->right(2); #->at()	    
	    foreach my $kinect (qw /Kd KD_nM Kinetics Ka_Ms Kd_s/) {
		if (defined (my $tag = $aceExperiment->get($kinect) )) {
		    $h->{ $kinect } = $tag->at();
		}
	    }
	    push @{$edge->{ experimentsArray }}, $h;
	    #print "--------\n";
	    #foreach my $k (keys(%{$h})) {
	#	print "-->$k => $h->{$k}\n";
	 #   }
	}	
	
    } else {
#	print "Belonging type \'$a $b\'\n";
    }
    
    push @{$self->{ edgesList }}, $edge;
}


=pod
    encoder public method
    supported type : JSON
    format parameters : 
    -complete, the json object stores all object attributes
    style paramters :
    -default, to complete
=cut
sub encode {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    #    $object = '{"nodesArray" : ["toto", "tata"], "edgesArray" : ["kiki", "koko"]}';
    
    my $object = '{"nodesArray" : [';
    
    foreach my $node (@{$self->{ nodesList }}) {
	my $string = '{"data" : {' .
	' "id" : "' . $node->{ commonName } . '", ' .
	'"weight" : 10 }, "classes" : "' . $node->{ type } . '"' .
	'}';
	$object .= "$string,\n"; 	
    }
    $object =~ s/\,$/],\n"edgesArray" : [/;
    
    foreach my $edge (@{$self->{ edgesList }}) {
	my $string = '{"data" : { "id" : "' . $edge->{ id }. '", '.
	    '"source" : "' . $edge->{ left }->{ commonName } . '",' .
	    '"target" : "' . $edge->{ right }->{ commonName } . '",' .
	    '"weight" : 12}, "classes" : "' . $edge->{ type } . '"';
	    if ($p->{ format } eq "complete") {
		$string .= '",' . '"experimentsArray" : [';
		
		foreach my $experimentData (@{$edge->{ experimentsArray }}) {
		    $string .= '{';
		    foreach my $field (keys(%{ $experimentData })) {
			$string .= '"' . $field. '" : "' . $experimentData->{ $field } . '",';
		    }
		    $string =~ s/\,$/},/;
		}
		$string =~ s/\,$//; # warning the belongs to edges 
		$string .= "]"; # type have empty Experiments Array
	}
	$object .= "$string},\n";	
    }
    
    $object =~ s/\,$/]}/;

    return $object;
}



1;
