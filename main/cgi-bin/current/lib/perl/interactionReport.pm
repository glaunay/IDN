package matrixDB::interactionReport;

use strict;

use common;
use Data::Dumper;


=pod
    return all association ace object linked to a particular biomolecule
    
    returns : [
           {
	    name => $biomolecule,
	    associations => []
           },
            ...
    ]
=cut
sub getAssociation {
    my $p = common::arg_parser (@_);
    
    common::slid ($p->{ dataType }, $p->{ biomoleculeArray },$p->{ DB }) || die "wrong parameters types";

    my $associationsData = [];    
    foreach my $biomolecule (@{$p->{ biomoleculeArray }}) {
	my $request = "query find biomolecule $biomolecule;follow Association;";
	my $container = {
	    name => $biomolecule,
	    associations => []
	};
	my @assocObjects = $p->{ DB }->fetch (-query=> $request);
	foreach my $aceAssociation (@assocObjects) {
	    my $partners = $aceAssociation->get('biomolecule');
	    my @col = $partners->col();
#	    warn "======>@col";
	    if (@col == 1) {
		push (@col, $col[0]);
	    }
	    my @tmp;
	    foreach my $aceBiomolecule (@col) {
		push @tmp, $aceBiomolecule->name;
	    }
	    push @{$container->{ associations }}, \@tmp;
	}
	push @{$associationsData}, $container;
    }

    return $associationsData;
}
