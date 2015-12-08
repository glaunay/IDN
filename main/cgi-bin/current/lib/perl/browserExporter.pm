package browserExporter;
use strict;
use Data::Dumper;
use JSON;
use Log::Log4perl qw(get_logger);

our $logger = get_logger ("browserExporter");


=pod
    interface package between 
    - matrixdb/psciquic search triggered by the client  
    - json object returned to the browser  --> interactionDataTable
    
    JSON data structure: 
    aaData [ .... ]   // dataTable component Feeding
    addData [ ... ]   // additionnal data to represent as qtip or additionnal row 
   
=cut

sub declareAssociationData {
    my $self = shift @_;        
    # order list of json attribute
    # must be coherent with init_hash and fill_hash
    $self->{ headers } = { experiment => ['id',
					  'Pmid', 'Detection Method', 
					  'A Experimental Role', 'A identification',
					  'B Experimental Role', 'B identification'],
			   association => ['id',
					   'A Interactor', 'A Common name', 'A Gene name', 
					   'A Biological Role', 'A TaxID', 
					   'B Interactor', 'B Common name', 'B Gene name', 
					   'B Biological Role', 'B TaxID',
					   'Source database', 'Interaction identifier(s)']
    };
    
}

# here we purge redundancy  w/vs psicquic but keep original name of matrix biomolecule intact for now
sub fuseJSON {
    my $p = common::arg_parser (@_);
    $logger->trace("fuseJSON on "  .scalar(@{$p->{ jsonList }}) . " json association string");

    (@{$p->{ jsonList }} == 1) && return $p->{ jsonList }->[0];
    my @jsonSub;

    $logger->info("trying to fuse JSON association data");

    my $matrixDB_JSON = decode_json($p->{ jsonList }->[0]);
    my $psicquic_JSON = decode_json($p->{ jsonList }->[1]);
    
    $logger->info("aaData sizes are " . scalar(@{$matrixDB_JSON->{ aaData }}) . 
	" and " . scalar (@{$psicquic_JSON->{ aaData }})
	);

    $logger->trace(Dumper($matrixDB_JSON));
    $logger->trace(Dumper($psicquic_JSON));
    my @regularInteractors = [];
    
    my $aaData = [];
#   $logger->info("matrixDB biomolecule name regulation:\n") . 
    foreach my $assoc (@{$matrixDB_JSON->{ aaData }}) {
	my $partnerOne = $p->{ matrixdbQuery }->generateRegularBiomoleculeName (string => $assoc->[0]);
	my $partnerTwo = $p->{ matrixdbQuery }->generateRegularBiomoleculeName (string => $assoc->[5]);
	push @regularInteractors, [$partnerOne, $partnerTwo];
#	$logger->trace("$assoc->[0] --> $partnerOne <INTERACT> $assoc->[5] --> $partnerTwo\n");
	push @{$aaData}, $assoc;
    }
    
    
    foreach my $assoc (@{$psicquic_JSON->{ aaData }}) {
	my $bool = 1;
	foreach my $refInter (@regularInteractors) {
	    if (
		($refInter->[0] eq $assoc->[0] && $refInter->[1] eq $assoc->[5]) ||
		($refInter->[0] eq $assoc->[5] && $refInter->[1] eq $assoc->[0])
		) {
		$logger->trace("$refInter->[0] $refInter->[1] matches $assoc->[0] $assoc->[5]");
		$bool = 0;
		last;
	    }
	}
	$bool || next;
	
	push @{$aaData}, $assoc;
	push @regularInteractors, [$assoc->[0], $assoc->[5]];	    
    }
    
    my $container = { aaData => $aaData };
    $logger->trace("Final container aaData has " . scalar(@{$aaData}) . " elements:\n".Dumper($container));
    
    my $fusedJSON = encode_json ($container);    
    
    return $fusedJSON;
}


sub encodeJSON {
    my $self = shift @_;
  
    my $jsonObject = "{ \"aaData\": [\n";
    warn "JSON encoding " . scalar (@{$self->{ dataTable }}) . " interactions";
    (@{$self->{ dataTable }} == 0) && return "{ \"aaData\": []}\n";
   
    foreach my $assoc (@{$self->{ dataTable }}) {
	$logger->trace("stuff:\n" . Dumper($assoc));
	$jsonObject .= "\t[\n";
	foreach my $headerAsKey (@{$self->{ headers }->{ association }}) {
	    ($headerAsKey eq "map") && next;
	    ($headerAsKey eq "id") && next;
	    ($headerAsKey eq "type") && next;
	    
	    if (! defined ($assoc->{ $headerAsKey })) {		
	#	$logger->error (">>>>FATAL DUMP (association)<<<");
	#	print_hash ($assoc);
	#	$logger->logdie ("--->\'$headerAsKey\' undefined ");
	    }
	    my $value = $assoc->{ $headerAsKey };
	    $value =~ s/"/\\"/g;
	    
	    #$jsonObject .= " \"$assoc->{ $headerAsKey }\",";
	    $jsonObject .= " \"$value\",";
	}
	$jsonObject =~ s/,$/],\n/;
=pod	
	foreach my $exp (@{$assoc->{ experimentArray }}) {
	    foreach my $headerAsKey (@{$self->{ headers }->{ experiment }}) {
	#	my $titi = '"' . $exp->{ $headerAsKey } . '",';
	#	warn "ttt \'$titi\'";
		if (!defined ($exp->{ $headerAsKey })) {
		    warn ">>>>FATAL DUMP (experiment)<<<";
		    print_hash ($assoc);
		    die "$headerAsKey key refers to an undefined \$exp hash value";
		}
		$jsonObject .= '"' . $exp->{ $headerAsKey } . '",';
	    }
	    $jsonObject =~ s/,$/],\n\t\t[/;
	}
=cut
	#$jsonObject .= "\t]\n";
    }
    $jsonObject =~ s/,$/]}\n/;   
    
    return $jsonObject;
}

1;


