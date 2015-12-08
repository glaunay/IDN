package networkMapper::aster;
use Log::Log4perl qw(get_logger :levels);
use Scalar::Util qw(blessed dualvar isweak readonly refaddr reftype tainted
                        weaken isvstring looks_like_number set_prototype);
use CHI;
use Data::Dumper;
use common;
use strict;
our $ASTERS_ADDRESS = "/tmp/asterStore_DVL";

my $logger = get_logger ("networkMapper::aster");
$logger->level($ERROR);

=pod constructor
    read out the subnetwork from cache
    reindex source/target id
=cut

sub new {
    my $self = {};
    my $class = shift;
    bless $self, $class;
    my $p = common::arg_parser(@_);	
    
    my $asterStore = CHI->new(
	serializer => 'Data::Dumper',
	driver     => 'File',
	root_dir   => $ASTERS_ADDRESS,
	cache_size => '1000m'
	);
    
    my $data = $asterStore->get($p->{ key }) ;
    defined ($data) || return;
    $logger->trace("Aster found for $p->{ key }, reading out ...");
    my @nameList;
    foreach my $node (@{ $data->{ nodeArray } }) {
	push @nameList,  $node->{ name };
    }
    $logger->trace("node name list :\n" . Dumper(@nameList));
    $self->{ links } = $data->{ links };
    $self->{ nodeArray } = $data->{ nodeArray };
    $self->{ idLinkTable } = {};
    $self->{ nameLinkTable } = {};
    $self->{ idNodeTable } = {};  
    $self->{ nameNodeTable } =  {};  
    my $idMapperOtN = {};
    $logger->trace("Aster temp conten:\n" . Dumper($self));

# reset id
    for (my $i = 0; $i < @{ $self->{ nodeArray } }; $i++) {
	my $oldID = $self->{ nodeArray }->[$i]->{ id };
	$idMapperOtN->{ $oldID } = $i; 
	$self->{ nodeArray }->[$i]->{ id } = $i;	
	$logger->trace("node $self->{ nodeArray }->[$i]->{ name } id change $oldID -> $self->{ nodeArray }->[$i]->{ id }");
    }

    foreach my $link (@{ $self->{ links } }) {
	$logger->trace("link source target: $link->{ source } $link->{ target }");	
	$link->{ source } = $idMapperOtN->{ $link->{ source } };
	$link->{ target } = $idMapperOtN->{ $link->{ target } };
	$logger->trace("link source target: $link->{ source } $link->{ target }");	
    }
    
    $self->_createNodeAccessors();
    $self->_createLinkAccessors();    

    $logger->trace("DEVEL::\n aster named \"$p->{ key }\" content:\n" . Dumper($self));

    return $self;
}


sub _createNodeAccessors {
    my $self = shift;
    my $IDaccessor = {};
    my $nameAccessor = {};
    foreach my $node (@{$self->{ nodeArray }}) {
	$logger->trace("referencing node " . $node->{ name });
	if (!defined ($node->{ id })) {
	    $logger->error("current node does not have id attribute");	    
	    return;
	}	
        # should check name existence too
	if (common::slid ($IDaccessor->{ $node->{ id }}, $nameAccessor->{ $node->{ name } })) {
	    $logger->warn("Redundancy found while setting quick accessor for node:\n" .
			      Dumper($node) );
	    next;
	}
	$IDaccessor->{ $node->{ id }} = $node;	
	$nameAccessor->{ $node->{ name }} = $node;
    }
    
    $logger->trace("ID accessor set");
    
    $self->{ idNodeTable } = $IDaccessor;  
    $self->{ nameNodeTable } = $nameAccessor;  

    foreach my $id (keys(%{  $self->{ idNodeTable } })) {
	$logger->trace("-->$id");	
    }
    
}

sub _createLinkAccessors {
    my $self = shift;
    
    for (my $iLink = 0; $iLink < @{ $self->{ links } }; $iLink++) {
	$logger->trace("creating accessor for link " . Dumper($self->{ links }->[$iLink]));
	
	my $iNode =  $self->{ idNodeTable }->{ $self->{ links }->[$iLink]->{ source } };
	my $jNode =  $self->{ idNodeTable }->{ $self->{ links }->[$iLink]->{ target } };
	
	
	my $iName = $iNode->{ name };
	my $jName = $jNode->{ name };
	defined ($iName) || $logger->logdie("No node catched with id " . $self->{ links }->[$iLink]->{ source });
	defined ($jName) || $logger->logdie("No node catched with id " . $self->{ links }->[$iLink]->{ target });
	
	$logger->trace("about to create link accessor for :\n " . Dumper($self->{ links }->[$iLink]));	
	$logger->trace("about to create link accessor for $iLink:\n " . Dumper($self->{ links }->[$iLink]));
	
	if (! defined ($self->{ idLinkTable }->{ $iNode->{ id } })) {
	    $self->{ idLinkTable }->{ $iNode->{ id } } = { };
	} 
	$self->{ idLinkTable }->{ $iNode->{ id } }->{ $jNode->{ id } } =  $self->{ links }->[ $iLink ];
	
	if (! defined ($self->{ idLinkTable }->{ $jNode->{ id } })) {
	    $self->{ idLinkTable }->{ $jNode->{ id } } = { };
	}
	$self->{ idLinkTable }->{ $jNode->{ id } }->{ $iNode->{ id } } = $self->{ links }->[ $iLink ];
	
	if (! defined ($self->{ nameLinkTable }->{ $iName })) {
	    $self->{ nameLinkTable }->{ $iName } = { };
	} 
	$self->{ nameLinkTable }->{ $iName }->{ $jName } =  $self->{ links }->[ $iLink ];
	
	if (! defined ($self->{ nameLinkTable }->{ $jName })) {
	    $self->{ nameLinkTable }->{ $jName } = { };
	}       
	$self->{ nameLinkTable }->{ $jName }->{ $iName } = $self->{ links }->[ $iLink ];
	$logger->trace("success");
    }
    $logger->trace("exiting");
}


sub getNode {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    defined ( $p->{ id }) && return $self->{ idNodeTable }->{ $p->{ id } };
    defined ( $p->{ name }) && return $self->{ nameNodeTable }->{ $p->{ name } };
    
    return;
}

1;
