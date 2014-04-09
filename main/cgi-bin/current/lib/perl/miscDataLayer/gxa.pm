package miscDataLayer::gxa;

use strict;
use CGI;
use JSON;

=pod
interface to the gene expression atlas REST service at ebi

please see http://www.ebi.ac.uk/gxa/help/AtlasApis for documentation

=cut

our $BASE_URL='http://www.ebi.ac.uk/gxa/api/v1?'; 


sub new {
    my $class = shift @_;
    my $self = {
	
    };
    bless $self, $class;
    
    my $p = common::arg_parser (@_);

    my $query;
    foreach my $key ( keys (%{$p->{ options }})) {
	$query .= $key . "= ". $p->{ options }->{ $key } . '&'; 
	$query =~ s/&$//;
    }
    
    my $response = `curl $BASE_URL$query`;
    
    warn "TOTO";

    warn $response;
}

1;
