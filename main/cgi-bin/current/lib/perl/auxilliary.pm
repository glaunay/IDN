package auxilliary;

use strict;
use common;
use SOAP::Lite + trace => qw(debug);

=pod TODO
    defines data collection w/ chebi
    do the same with uniprot
=cut


=pod guessDataProvider (aceObject => $aceObject)
set of rules to guess primary provider of data
for uniprot: http://www.uniprot.org/manual/accession_numbers
=cut
sub guessDataProvider {
    my $p = common::arg_parser (@_) ;
    if (!defined ($p->{ aceObject }->name)) {
	warn "auxilliary::guessDataProvider no name field in provided aceObject";
	return;
    }
    if ($p->{ aceObject }->name =~ /^(PFRAG|MULT)/) {
	return "matrixDB";
    }
    if ($p->{ aceObject }->name =~ /^CHEBI/) {
	return "CHEBI";
    }
    if ($p->{ aceObject }->name =~ /^[A-N,R-Z]{1}[0-9]{1}[A-Z]{1}[A-Z,0-9]{1}[A-Z,0-9]{1}[0-9]{1}$/ ||
	$p->{ aceObject }->name =~ /^[O,P,Q]{1}[0-9]{1}[A-Z,0-9]{1}[A-Z,0-9]{1}[A-Z,0-9]{1}[0-9]$/) {
	return "uniprot";
    }

    warn "auxilliary::guessDataProvider \"$p->{ aceObject }->name\" no provider found";
    return;
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
