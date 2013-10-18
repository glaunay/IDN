package mi;

use Data::Dumper;
use strict;
use common;
use JSON;

=pod A package to represent and interogate the molecular interaction controlled vocabulary    
    the specification must be provided as json format
    protype is build with `cat psi-mi.obo | bin/oboOLSNestedJsonExporter.pl  > psimi_obo.json`
=cut

our $logger; # fh object sent to constructor    

sub new {
    my $class = shift @_;
    my $p = common::arg_parser (@_);
    
    (defined ($p->{ seed }) || 
     die "you did not provide a specification file for CV construction");
    open JSON, "<$p->{ seed }" || die $!;
    my $string = <JSON>;
    my $self = decode_json ($string);
    
    bless $self, $class;
    $logger = $p->{ logFile };

    $self->_wire();
    
    return $self;
}


=pod 
    add reference to son and parent nodes
=cut 

sub _wire {
    my $self = shift;
    my $cnt = 0;
   # open DBG, ">/tmp/miDbg.txt";
    foreach my $term (@{$self->{ termsList }}) {
	if (defined ($term->{ is_a })){
	    #warn "has to wire $term->{ name }->[0]";
	    $term->{ parentRef } = []; 
	    foreach my $parentId (@{$term->{ is_a }}) {
		my $parentNode = $self->_getNode(selectorSet => { id => $parentId });
		(defined ($parentNode)) || die "no node get with id \"$parentId\"";
		push @{$term->{ parentRef }}, $parentNode; 
		$cnt++;
	    }
	#    print DBG "$term->{ name }->[0] , pref \n";
	    foreach my $pNode (@{$term->{ parentRef }}) {
	#	print DBG "\t$pNode->{ name }->[0]\n";
	    } 
	}

    }
    #close DBG;
    $logger->print ("$cnt obo relationships wired\n");
    
}

sub _getNode {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    foreach my $node (@{$self->{ termsList }}) {
	my $bool = 1;
	foreach my $selKey (keys (%{$p->{ selectorSet }})) {
	    my $value = $p->{ selectorSet }->{ $selKey };
	    if (!defined ($node->{ $selKey })) { $bool = 0;last; }
	 #   print "@{$node->{ $selKey }} vs $value\n";
	    if (!common::listExist ($node->{ $selKey }, $value)){ $bool = 0; last; }
	}
	$bool || next; 
	
	return $node;
    }

    warn "no node found with selectors " . Dumper ($p->{ selectorSet }) . "\n";
    return;
}

sub _getNodeSloppy { 
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    foreach my $node (@{$self->{ termsList }}) {
	my $bool = 1;
	foreach my $selKey (keys (%{$p->{ selectorSet }})) {
	    if (!defined ($node->{ $selKey })) { $bool = 0;last; }

	    my $value = $p->{ selectorSet }->{ $selKey };

	    foreach my $kValue (@{$node->{ $selKey }}) {		
		foreach my $word (split(/[\s]+/, $value)) {
		    warn "checking \"$kValue\" vs /$word/\n";
		    $word =~ s/[\[\]\(\)]/ /g;
		    if ( $kValue !~ /$word/) {			
			$bool = 0;
			last;
		    }
		    $bool || last;
		}
	    }	
	}
	$bool || next; 
	
	return $node;
    }

    warn "no node found with selectors " . Dumper ($p->{ selectorSet }) . "\n";
    return;

}





=pod
    attribute => key_x,   # the wanted value  
    selectorSet => { key_1 => value_1,  key_n => value_n } # the set of selector

=cut
sub get {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    (common::slid($p->{ selectorSet }, $p->{ attribute })) ||
	die "you did not specify selectorList or a wanted attribute " . Dumper ($p);
    common::isHashRef ($p->{ selectorSet }) || 
	die "provided selector(s) is not a hash table";

    my $node;
    if (exists ($p->{ options })) {
	if (common::listExist($p->{ options }, 'sloppySearch')) {
	    $node = $self->_getNodeSloppy (selectorSet => $p->{ selectorSet });
	}
    } else { 
	$node = $self->_getNode (selectorSet => $p->{ selectorSet });
    }
    (!defined ($node)) && return;
    
    if (!defined ($node->{ $p->{ attribute } })) {
	warn "requested attribute \"$p->{ attribute }\" not found in current node";
	return;
    }
    
    return $node->{ $p->{ attribute } };           
}


sub isTerm {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
}


sub _nodeSelectorMatch {
    my $self = shift;
    my $p = common::arg_parser (@_);


    my $node = $p->{ node };
    my $bool = 1;
    foreach my $selKey (keys (%{$p->{ selectorSet }})) {
	my $value = $p->{ selectorSet }->{ $selKey };
	if (!defined ($node->{ $selKey })) { $bool = 0;last; }
	#   print "@{$node->{ $selKey }} vs $value\n";
	if (!common::listExist ($node->{ $selKey }, $value)){ $bool = 0; last; }
    }
    
    return $bool;
}

sub _checkParent {
    my $self = shift;
    my $p = common::arg_parser (@_);
    my $cNode = $p->{ node };
    my $selector = $p->{ selectorSet };
    
    $self->_nodeSelectorMatch(node => $cNode, selectorSet => $selector) && return 1;
    
    foreach my $pNode (@{$cNode->{ parentRef }}) {
	my $test = $self->_checkParent (node => $pNode, selectorSet => $selector);
	$test && return 1;	
    }
    
    return 0;
}

# handle response for error 
sub request {
    my $self = shift;
    
    my $requestContainer = shift;

    # test if a given node is sonof
    if (exists($requestContainer->{ isSonOf })) {
	my $pSelectors = $requestContainer->{ isSonOf };
	
	$logger->print ("perform a is son of search");
	my $cNode = $self->_getNode (selectorSet => $requestContainer->{ selectors });
	
	my $isSonBool = $self->_checkParent (node => $cNode, selectorSet => $pSelectors);
	
	my $dataValue = $isSonBool ? 'isSon' : 'notSon';
	return {
	    dataSource => "mi",
	    dataValue => [$dataValue],
	    dataType => "parentalBoolean"
	}
    # simple attribute query
    } elsif (exists ($requestContainer->{ askFor })) {
	my $attrList = '';
	$attrList = $self->get (attribute => $requestContainer->{ askFor },
				selectorSet => $requestContainer->{ selectors },
				options => ['sloppySearch']
	    );
	if (!defined ($attrList)) {
	    $attrList = ['N/A'];
	} else {
	    #print "handsome ! ". Dumper ($requestContainer->{ selectors }) . " -- delivered --> @{$attrList}\n"; 
	}
	return {
	    dataSource => "mi",
	    dataValue => $attrList,
	    dataType => $requestContainer->{ askFor }
	}
    }

}


1;
