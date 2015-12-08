package miscAssociationLayer;
=pod
    Interface between psimi and matrixdb association Data
=cut

use strict;
use common;

use Log::Log4perl qw(get_logger :levels);
use Data::Dumper;
use JSON;

my $logger = get_logger("miscAssociationLayer"); 
$logger->level($ERROR);

=pod
    merge "Experiments" list elements from psicquic and matrix db in a single list
    to be attached as an Experiments attribute to an Association descriptor (link)
=cut
sub mergeLink {
    my $p = common::arg_parser (@_);
    
    $logger->trace("Merging following Association data container:\n" .
		   Dumper( $p->{ psicquic }) . "\n" .
		   Dumper( $p->{ matrixdb }) . "\n"
	);         

    #my $knowledgeType =
    
    my $container = $p->{ matrixdb };
    
    #if ($p->{ matrix})
}

1;
