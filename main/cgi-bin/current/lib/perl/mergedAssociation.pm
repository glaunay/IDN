package mergedAssociation;

use strict;
use Log::Log4perl qw(get_logger);
use Scalar::Util qw(blessed dualvar isweak readonly refaddr reftype tainted
                        weaken isvstring looks_like_number set_prototype);
use biomoleculeMapper;
use Data::Dumper;
use common;
use psimi;

my $logger = get_logger("mergedAssociation"); 

=pod simplify and SPEED UP overall filtering and clustering of mitab data
    constant psimi record is kept with internal array index store for each association
=cut

sub new {
    my $class = shift @_;
    my $self = {};
    bless $self, $class;
    my $p = common::arg_parser (@_);
    
    $self->{ mergedAssociationList } = [];
    $self->{ interactorList } = [];
    $self->{ psimiPassedRecord } = undef;
    
    common::sloft ($p->{ fromTemplate }, $p->{ matrixdbPairs }) || $logger->logdie("required parameter matrixdbPairs");
    
    if (defined ($p->{ fromTemplate }) ) {
	foreach my $key (qw / mergedAssociationList interactorList psimiPassedRecord/) {
	    $self->{ $key } = $p->{ fromTemplate }->{ $key };
	}
	return $self;
    }
    
    # create initial interactors and association list;
    foreach my $matrixdbAssoc (@{$p->{ matrixdbPairs }}) {
	my $node = $self->_newInteractionNode ();
	$node->{ formedBy } = [$matrixdbAssoc->[0], $matrixdbAssoc->[1]];
	$node->{ isa } = "matrixdbSeed";
	push @{$self->{ mergedAssociationList }}, $node;
	$self->_mayAddInteractor ($matrixdbAssoc->[0]);
	$self->_mayAddInteractor ($matrixdbAssoc->[1]);
		
    }    

    $logger->trace("constructor returns " . Dumper($self));
    return $self;
}

sub filterOut {
    my $self = shift;
    my $p = common::arg_parser (@_);

    
    my $biomoleculeMapperObject = $p->{ mutatorObject };
    my $psimiObjectList = $p->{ psimiObjectList };
    $logger->trace(scalar (@{$psimiObjectList}) . " total psimi records to register for reduction");
    for (my $i = 0; $i < @{$psimiObjectList}; $i++) {
	# try to convert current name into matrixDB special biomolecule
	my $tmpPair = $psimiObjectList->[$i]->getSimpleInteractorPair();	
	my $pair = [
	     $biomoleculeMapperObject->mutateToMatrixdb(key => $tmpPair->[0]),
	     $biomoleculeMapperObject->mutateToMatrixdb(key => $tmpPair->[1])
	    ];
	$self->_mayAddInteractor ($pair->[0]);
	$self->_mayAddInteractor ($pair->[1]);
	
	my $bool = 0;
	foreach my $pNode (@{$self->{ mergedAssociationList }}) {
	    $logger->trace("{$pNode->{ formedBy }->[0], $pNode->{ formedBy }->[1]} checked against " .
			   "{$pair->[0], $pair->[1]}  ");
	    if (
		($pNode->{ formedBy }->[0] eq $pair->[0] && $pNode->{ formedBy }->[1] eq $pair->[1]) ||
		($pNode->{ formedBy }->[0] eq $pair->[1] && $pNode->{ formedBy }->[1] eq $pair->[0]) 
		) {
		push @{$pNode->{ psimiElementIndex }}, $i;
		$bool = 1;
		last;
	    }
	}
	$bool && next;
	my $nNode = $self->_newInteractionNode(); 
	$nNode->{ formedBy } = [$pair->[0], $pair->[1]];
	$nNode->{ isa } = "psicquicSeed";
	push @{$nNode->{ psimiElementIndex }}, $i;


	push @{$self->{ mergedAssociationList }}, $nNode;
    }

    $self->{ psimiPassedRecord } = $psimiObjectList;

    $logger->trace("filterOut aggregate a final set of association " . scalar(@{$self->{ mergedAssociationList }}) .
		   "\n" . Dumper($self) );
    
    $logger->trace("filterOut done");
}

sub _newInteractorNode {
    my $self = shift;
    return   {
	name => '',
	involvedIn => [] # psimi Record Index
    };
}

sub _newInteractionNode {
    my $self = shift;
    
    return {
	isa => '',
	formedBy => [],
	psimiElementIndex => []
    };
}

sub _mayAddInteractor {
    my $self = shift;

    my $string = shift;

    $self->_isKnownInteractor ($string) && return 0;
    $self->_addInteractor ($string);

    return 1;
}
sub _isKnownInteractor {
    my $self = shift;

    my $string = shift;

    
    return common::listExist ($self->{ interactorList }, $string);    
}

sub _addInteractor {
    my $self = shift;

    my $string = shift;
    push @{$self->{ interactorList }}, $string;    
}

sub getInteractorNumber {
    my $self = shift;
    
    return scalar (@{$self->{ interactorList }});
}

sub getInteractionNumber {
    my $self = shift;
    
    return scalar (@{$self->{ mergedAssociationList }});
}


sub getInteractorList {
    my $self = shift;
    
    my @array = @{$self->{ interactorList }};

    return \@array;
}

sub getInteractionNodes {
    my $self = shift;
    my $p = common::arg_parser(@_);
    if (defined ($p->{ perIndex })) {
	my @array;
	foreach my $i (@{$p->{ perIndex }}) {
	    push @array, $self->{ mergedAssociationList }->[$i];
	}
	return \@array;
    }
    
    if (defined ($p->{ perInteractor })) {
#TO DO
#	return $self->{ mergedAssociationList }->[$p->{ perIndex }];
    }

    $logger->error("unknown interaction node querying");
    return;
}


sub getInteractorPairedList {
    my $self = shift @_;
    my $p;
    if (@_ > 0) {
	$logger->trace("parsing");
	$p = common::arg_parser(@_);
    }
    
    my @array;
    # optionaly a list of index can be specified
    if (defined($p)) {
	
	if (defined ($p->{ perIndex })) {
	
	    foreach my $index (@{ $p->{ perIndex }}) {
		my $node = $self->{  mergedAssociationList }->[$index];
		(defined ($node)) || next;
		push @array, $node->{ formedBy };
	    }
	    $logger->trace("returning " . Dumper(@array));
	    return \@array;
	}
    }

# by default return the whole set of pairs
    foreach my $node (@{$self->{  mergedAssociationList }}) {
	push @array, $node->{ formedBy };
    }

    $logger->trace("returning total pair of interactors");
    
    return \@array;
}

sub isMatrixdbSeed {
    my $self = shift;
    my $p = common::arg_parser(@_);
    
    my $node = $self->{  mergedAssociationList }->[$p->{ perIndex }];
    if (!defined($node)) {
	$logger->error("index $p->{ perIndex } is no valid node index");
	return 0;
    }
    
    $node->{ isa } eq 'matrixdbSeed' && return 1;    
    return 0;    
}

sub getPsimiNumber {
    my $self = shift;
    my $p = common::arg_parser(@_);
    
    my $node = $self->{  mergedAssociationList }->[$p->{ perIndex }];
    if (!defined($node)) {
	$logger->error("index $p->{ perIndex } is no valid node index");
	return [];
    }
    
    return $node->{ psimiElementIndex };    
}

sub hasPsimiEvidences {
    my $self = shift;
    my $p = common::arg_parser(@_);
    
    my $node = $self->{  mergedAssociationList }->[$p->{ perIndex }];
    if (!defined($node)) {
	$logger->error("index $p->{ perIndex } is no valid node index");
	return 0;
    }
    scalar (@{$node->{ psimiElementIndex }}) && return 1;
    
    return 0;    
}

sub fetchPsimiRecord {
    my $self = shift;
    my $p = common::arg_parser(@_);
    
    my @psimiRecord;
	
    foreach my $index (@{$p->{ perIndex }}) {
	my $node = $self->{ mergedAssociationList }->[$index];
	if (!defined ($node)) {
	    $logger->error("index $index is no valid node index");
	    next;
	}
	foreach my $i (@{$node->{ psimiElementIndex }}) {
	    if (!defined ($self->{ psimiPassedRecord }->[$i])) {
		$logger->error("index $i is no valid psimiElement index");
		next;
	    }	 
	    push @psimiRecord, $self->{ psimiPassedRecord }->[$i];
	}
    }
    
    $logger->trace ("returning " . scalar (@psimiRecord) . " psimi records");
    return \@psimiRecord;    
}




1;
