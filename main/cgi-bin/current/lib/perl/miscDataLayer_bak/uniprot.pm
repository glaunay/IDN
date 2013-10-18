package miscDataLayer::uniprot;
=pod
    package to fecth uniprot data records
    TO DO

    add get synonym and get unigene to gene data mapper
    mapper referenced datastructures are specified in newtworkMapper.pm

=cut

use strict;
use common;
use JSON;
#use XML::Parser;
use XML::LibXML;
use Data::Dumper;
use Scalar::Util qw(tainted);


our $BASE_URL='http://www.uniprot.org/uniprot'; 


sub new {
    my $class = shift @_;
    my $self = {
	
    };
    bless $self, $class;
    
    my $p = common::arg_parser (@_);
    common::sloft($p->{ options }->{ name }) || die "missing arguments";
    warn "trying to fetch data for $p->{ options }->{ name } ... (uniprot)";

    # we untaint name
    if (tainted($p->{ options }->{ name })) {
	print "$p->{ options }->{ name } is tainted!\n";
    }
    my ($name) = $p->{ options }->{ name } =~ /([0-9A-Z]+)/;
    my $query = "curl $BASE_URL/$name.xml";
    
    my $response = `/usr/bin/curl $BASE_URL/$name.xml 2> /dev/null`;
    if ($response =~ /404 Not Found/) {
	warn "query \"$query\" failed";
	return;
    }
    if ($response !~ /xml/) {
	warn "not an xml response";
	return;
    }
  
    # We initialize the XML::Lib object once
    my $parser = XML::LibXML->new();
    my $doc = $parser->parse_string ($response);
    $self->{ xmlTree } = XML::LibXML::XPathContext->new( $doc->documentElement()  );
    $self->{ xmlTree }->registerNs('ns', 'http://uniprot.org/uniprot');
    
    warn "fetchCore seems successfull for \"$name\"";

    return $self;
}

=pod summonDataMapper
    we create a local copy of the container to avoid mess with any actual data content
    a mapper is a set key w: values referencing anonymous function
    each function expects the following arguments
    the selfObject.  
    the mapper will ensure that the correct data structure will be returned when
    the passed object will asked for a particlular attribute (key)
=cut
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
		my $value = "DUMMY";

		my @nodes = $object->{ xmlTree }->findnodes('//ns:entry/ns:protein/ns:recommendedName/ns:fullName');
		if (@nodes == 0) {
		    @nodes = $object->{ xmlTree }->findnodes('//ns:entry/ns:protein/ns:submittedName/ns:fullName');
		}
		if (@nodes > 0) {
		    $value = $nodes[0]->textContent;
		}
		return $value;
	    };	    	 
	    
	}
	elsif ($key eq "biofunc") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = "DUMMY";
		
		my @nodes = $object->{ xmlTree }->findnodes('//ns:entry/ns:comment[@type="function"]/ns:text');
		if (@nodes > 0) {
		    $value = "";
		}
		foreach my $node (@nodes) {
		    $value .= $node->textContent . "\n";
		}
		
		return $value;
	    };
	} 
	elsif ($key eq "uniprotKW") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];
		
		my @attributes = $object->{ xmlTree }->findnodes( '//ns:keyword/@id' );
		foreach my $attr (@attributes) {
		    my $node = $attr->getOwnerElement();
=pod
		    my $h = {
			key => $attr->value,
			text => $node->textContent
		    };
=cut
		    push @{$value}, $attr->value;
		}
		
		return $value;
	    };
	}
	elsif ($key eq "pfam") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];

		my @nodes = $object->{ xmlTree }->findnodes( '//ns:dbReference[@type="Pfam"]' );
		foreach my $node (@nodes) {
		    my ($pfamID) = $node->findnodes('./@id');
		    push @{$value}, $pfamID->value;
		}

		return $value;
	    };
	}
	elsif ($key eq "go") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];
		
		my @attributes = $object->{ xmlTree }->findnodes( '//ns:dbReference[@type="GO"]/ns:property[@type="term"]/@value' );
		foreach my $attr (@attributes) {
		    my $node = $attr->getOwnerElement();
		    $node = $node->parentNode;
		    push @{$value}, $node->getAttribute ("id");
		}

		return $value;
=pod
		my $h = {
		text => $attr->value,
		term => $value
	    };
=cut
		    
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
		
		my @nodes = $object->{ xmlTree }->findnodes( '//ns:gene' );
		foreach my $node (@nodes) {
		    my @nameNodes = $object->{ xmlTree }->findnodes('./ns:name', $node);
		    foreach my $nameNode (@nameNodes) {
			push @{$value->{ geneName }}, $nameNode->textContent;
		    }
		}
		
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
		my @nodes = $object->{ xmlTree }->findnodes( '//ns:organism/ns:name[@type="scientific"]' );
		if (@nodes > 0) {
		    $value->{ scientific } = $nodes[0]->textContent;
		    my $node =  $nodes[0]->parentNode;
		    my @snodes = $object->{ xmlTree }->findnodes('./ns:dbReference',$node );
		    $value->{ id } = $snodes[0]->getAttribute ("id");
		}
		
		return $value;
	    };
	}
	elsif ($key eq "tissue") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];
		
		my @nodes = $object->{ xmlTree }->findnodes('//ns:comment[@type="tissue specificity"]/ns:text' );
		foreach my $node (@nodes) {
		    push @{$value}, $node->textContent;
		}
		
		return $value;
	    };
	}
	elsif ($key eq "location") {
	    $mapper->{ $key } = sub { 
		my $object = shift @_;
		my $value = [];

		my @nodes = $object->{ xmlTree }->findnodes( '//ns:comment[@type="subcellular location"]/ns:subcellularLocation/ns:location' );
		foreach my $node (@nodes) {
		    push @{$value}, $node->textContent;
		}

		return $value;
	    };
	}
    } # mapper keys loop

    open DBG, ">/tmp/mapper.dbg" or die $!;
    print DBG Dumper($mapper);
    close DBG;        
    warn "returning mapper";
    return $mapper;
}


1;

