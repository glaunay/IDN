package miscDataLayer::chebi;
use strict;
use common;
use SOAP::Lite + trace => qw(debug);

sub new {
  my $class = shift @_;
  my $self = {
  };
  bless $self, $class;
}

sub prepareRequest {
    my $p = common::arg_parser (@_);
  #  $p->{ name };
  #  $p->{ provider };

    if ($p->{ provider } eq "chebi") {
	prepareChebiRequest (name => $p->{ name });	
    }

}


sub prepareChebiRequest {
    my $p = common::arg_parser (@_);

    my $WSDL = 'http://www.ebi.ac.uk/webservices/chebi/2.0/webservice?wsdl';
    my $nameSpace = 'http://www.ebi.ac.uk/webservices/chebi';
    my $soap = SOAP::Lite
	-> uri($nameSpace)
	-> proxy($WSDL);
    
# Setup method and parameters
    my $method = SOAP::Data->name('getCompleteEntity')
	->attr({xmlns => $nameSpace});
    my @params = ( SOAP::Data->name(chebiId => $p->{ name }));

# Call method
    my $som = $soap->call($method => @params);
    
# Retrieve for example all ChEBI identifiers for the ontology parents
#@stuff = $som->valueof('//OntologyParents//chebiId');
#print @stuff;
    

}

1;
