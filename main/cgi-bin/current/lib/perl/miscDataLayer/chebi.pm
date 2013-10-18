package miscDataLayer::chebi;
use strict;
use common;
use SOAP::Lite + trace => qw(debug);

sub new {
  my $class = shift @_;
  my $self = {
  };
  bless $self, $class;
  my $p = common::arg_parser(@_);
  common::slid($p->{ name }) || die "name argument required";

  $self->prepareChebiRequest(name => $p->{ name });
  
  return $self;
}

sub prepareChebiRequest {
    my $self = shift;

    my $p = common::arg_parser (@_);

    my $WSDL = 'http://www.ebi.ac.uk/webservices/chebi/2.0/webservice?wsdl';
    my $nameSpace = 'http://www.ebi.ac.uk/webservices/chebi';
    my $soap = SOAP::Lite
	-> uri($nameSpace)
	-> proxy($WSDL);
    
# Setup method and parameters
    my $method = SOAP::Data->name('getCompleteEntity')
	->attr({xmlns => $nameSpace});
    print "About to call with $p->{ name }\n";
    my @params = ( SOAP::Data->name(chebiId => $p->{ name }));

# Call method
    $self->{ soapCall } = $soap->call($method => @params);
    
# Retrieve for example all ChEBI identifiers for the ontology parents
    # my @stuff = $som->valueof('//OntologyParents//chebiId');
   
    # my @stuff = $self->{ soapCall }->valueof('//chebiName');
    #print "STUFF HERREEE @stuff\n";
    
    
}

sub summonDataMapper {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    my %mapperObj = %{$p->{ template }};    
    my $mapper = \%mapperObj;

   
    
    foreach my $key (keys (%mapperObj)) {
	($key eq "name")  && next; # already set by calling routine
	
	if ($key eq "common") {	 	 	
	    $mapper->{ $key } = sub { 
		my $object = shift @_;			
	
		my @tmpValue = $object->{ soapCall }->valueof('//chebiAsciiName');
		
		my $value = defined($tmpValue[0]) ? $tmpValue[0] : 'N/A';
		
		return $value;
	    };	    	 
	    
	}
	elsif ($key eq "biofunc") {
	    $mapper->{ $key } = sub { 
		
		my $object = shift @_;			
		
		my @tmpValue = $object->{ soapCall }->valueof('//definition');
		
		my $value = defined($tmpValue[0]) ? $tmpValue[0] : 'N/A';
		
		return $value;
	    };
	} 
	elsif ($key eq "uniprotKW") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];
		
		return $value;
	    };
	}
	elsif ($key eq "pfam") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];

		return $value;
	    };
	}
	elsif ($key eq "go") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];
	
		return $value;
	    };
	}
	elsif ($key eq "gene") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = { 
		    geneName => [],
		    synonym => [],
		    uniGene => []	
		};
			
		return $value;
	    };
	}
	elsif ($key eq "specie") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = {
		    scientific => "",
		    id => ""
		};
		
		return $value;
	    };
	}
	elsif ($key eq "tissue") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];
	
		return $value;
	    };
	}
	elsif ($key eq "location") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];

		return $value;
	    };
	}
    } # mapper keys loop

    warn "------>returning mapper for chebi object named $mapper->{ name }";
    return $mapper;
}


1;
