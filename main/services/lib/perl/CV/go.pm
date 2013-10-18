package go;

use Data::Dumper;
use strict;
use common;
use JSON;


=pod A package to represent and interogate the go controlled vocabulary    
    the specification must be provided as json format
    protype is build with `cat go.obo | bin/converterObo2Json.pl  > go.json`

    PLEASE see client_GoTest.pl for client side interface/queries
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
    close JSON;
    
    bless $self, $class;
    
    $logger = $p->{ logFile };
    
    if (defined ($p->{ subset })) {
	my $nodeList = $self->_getNodeList (selectorSet => $p->{ subset });	
	$self->{ termsList } = $nodeList; 	
    }
    # direct reference to node per GOTERM id
    $self->{ shortcut } = {};
    for (my $i = 0; $i < scalar(@{$self->{ termsList }}); $i++) {
	foreach my $key (@{$self->{ termsList }->[$i]->{ id }}) {
	    $self->{ shortcut }->{ $key } = $self->{ termsList }->[$i];  
	}
    }
    
    if (defined ($p->{ options })) {
	if (! common::listExist ($p->{ options }, 'NoWire')) {
	    $logger->print ("wiring " . scalar (@{$self->{ termsList }}) . " terms\n");    
	    $self->_wire();
	}
    }
    
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
    print "$cnt obo relationships wired\n";

}

sub _getNode {
    my $self = shift;
    my $p = common::arg_parser (@_);
  
    #direct access through id
    if (exists ($p->{ selectorSet }->{ id })) {
	my $refID = $p->{ selectorSet }->{ id };
	if (exists($self->{ shortcut }->{ $refID })){ 	  
	    $logger->print("\nSuccess:quick term acces for provided id:\"$refID\"\n");	
	    return $self->{ shortcut }->{ $refID };
	}
	$logger->print("\nWarning:quick term acces failed for provided id:\"$refID\"\n");	
    }    
    
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
    
    warn "getNode:: no node found with selectors " . Dumper ($p->{ selectorSet }) . "\n";
    return;
}

sub _getNodeList {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    my @list = ();
    foreach my $node (@{$self->{ termsList }}) {
	my $bool = 1;
	foreach my $selKey (keys (%{$p->{ selectorSet }})) {
	    my $value = $p->{ selectorSet }->{ $selKey };
	    if (!defined ($node->{ $selKey })) { $bool = 0;last; }
	 #   print "@{$node->{ $selKey }} vs $value\n";
	    if (!common::listExist ($node->{ $selKey }, $value)){ $bool = 0; last; }
	}
	$bool || next; 
	
	push @list, $node;
    }
    warn "found " . scalar (@list) . " terms with selectors " . Dumper ($p->{ selectorSet }) . "\n";

    (@list == 0)  && warn "getNode:: no node found with selectors " . Dumper ($p->{ selectorSet }) . "\n";

    return \@list;
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
		  #  print "checking \"$kValue\" vs /$word/\n";
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

# handle response for error 
sub request {
    my $self = shift;
    
    my $requestContainer = shift;
   
    # simple attribute query
    if (exists ($requestContainer->{ goSlimSelector })) {
	my $goSlimContainer = $self->mapToSlim (selectors => $requestContainer->{ goSlimSelector });
	(defined ($goSlimContainer)) || return;
	return {
	    dataSource => "go",
	    dataValue => $goSlimContainer,
	    dataType => "goSlimContainer"
	};
    } elsif (exists ($requestContainer->{ goNodeSelector })) {
	my $goNodeContainer = $self->getNodeContainer (selectors => $requestContainer->{ goNodeSelector });
	(defined ($goNodeContainer)) || return;
	return {
	    dataSource => "go",
	    dataValue => $goNodeContainer,
	    dataType => "goNodeContainer"
	};
    }

}

=pod useless goslim_generic is part of the go extended annotation

sub addSlim {
    my $self = shift;
    
    (defined ($p->{ slimFile }) || 
     die "you did not provide a slim file for CV GO tree annotation");
    open JSON, "<$p->{ slimFile }" || die $!;
    my $string = <JSON>;
    my $slimContainer = decode_json ($string);
    
    foreach my $slim (@{$slimContainer}) {
	
	
    }
    
}
=cut

sub _getSlimTerm {
    my $self = shift;

    my $p = common::arg_parser (@_);
    my $node = $p->{ node };

    my $terms = [];
    # current node is a slim
    if (exists ($node->{ subset })) {
	if (common::listExist($node->{ subset }, "goslim_generic")) {
	    return [ { name => $node->{ name }->[0] , 
		       goId => $node->{ id }->[0]}
		];
	}
    }
    # otherwise keep digging
    foreach my $subNode (@{$node ->{ parentRef }}) {
	my $subTerms = $self->_getSlimTerm(node => $subNode);
	foreach my $subTerm (@{$subTerms}) {
	    push @{$terms}, $subTerm;
	}
    }

    return $terms;        
}

sub getNodeContainer {
    my $self = shift;
    my $p = common::arg_parser(@_);
    my $node = $self->_getNode(selectorSet => $p->{ selectors });
    if (!defined($node)) { print "getNodeContainer failed\n"; return;}
     my $container = {
	 node => $node
     };
   # print "Selector\n" . Dumper ($p->{ selectors }) . "\nnodeContainer:\n" . Dumper ($node) . "\n";    
    
    return $container;
}

sub mapToSlim {
    my $self = shift;
    my $p = common::arg_parser(@_);
    
    my $node = $self->_getNode(selectorSet => $p->{ selectors });
    if (!defined($node)) { print "mapToSlim failed\n"; return;}
    my $slimTerm = $self->_getSlimTerm ( node => $node );
    
    my $container = {
	slimTermList => $slimTerm
    };
    print "Selector\n" . Dumper ($p->{ selectors }) . "\nSlimTerm\n" . Dumper ($slimTerm) . "\n";    
    
    return $container;
}

1;
