package miscDataLayer::uniprot;
=pod
    package to fecth uniprot data records
    TO DO

    add get synonym and get unigene to gene data mapper
    mapper referenced datastructures are specified in newtworkMapper.pm
    adding a $self->{ isFragment } => PRO_XXXXXXX

=cut

use strict;
use common;
use JSON;
#use XML::Parser;
use XML::LibXML;
use Data::Dumper;
use Scalar::Util qw(tainted);
use Log::Log4perl qw(get_logger :levels);

my $logger = get_logger("miscDataLayer::uniprot"); 
$logger->level($ERROR);

our $BASE_URL='http://www.uniprot.org/uniprot'; 


sub new {
    my $class = shift @_;
    my $self = {
	
    };
    bless $self, $class;
    
    my $p = common::arg_parser (@_);
    common::sloft($p->{ options }->{ name }) || die "missing arguments";
    $logger->trace("trying to fetch data for $p->{ options }->{ name } ... (uniprot)");

    # we untaint name
    if (tainted($p->{ options }->{ name })) {
	print "$p->{ options }->{ name } is tainted!\n";
    }
    my ($name) = $p->{ options }->{ name } =~ /([\S]+)/;
    # Pro Feature we need to fish the base protein name    
    if ($name =~ /^([\S]+){0,}(PRO_[\d]+)/) {	
	
	$self->{ isFragment } = $2;
	my $fishUrl = 'http://www.uniprot.org/uniprot/?query=' . $self->{ isFragment }  . '&limit=1&format=tab';
	my $curlRequest = "curl -H \"Content-Type:text\" \'$fishUrl\' 2> /dev/null";
	my $searchTab = `$curlRequest`;
	my @buffer = split /\n/, "$searchTab";

	if (scalar (@buffer) == 0) {
                $logger->error("while fishing for base protein of \"$name\", request $fishUrl failed");              
                return;
	}	
	($name) = ($buffer[1] =~ /^([\S]+)/);
	$logger->trace("successfully found $name as base protein for \"$self->{ isFragment }\"");          
    }
    
    my $query = "curl $BASE_URL/$name.xml";
    
    my $response = `/usr/bin/curl $BASE_URL/$name.xml 2> /dev/null`;
    if ($response =~ /404 Not Found/) {
	$logger->warn("query \"$query\" failed");
	return;
    }
    if ($response !~ /xml/) {
	$logger->error("warn not an xml response");
	return;
    }
  
    # We initialize the XML::Lib object once
    my $parser = XML::LibXML->new();
    my $doc = $parser->parse_string ($response);
    $self->{ xmlTree } = XML::LibXML::XPathContext->new( $doc->documentElement()  );
    $self->{ xmlTree }->registerNs('ns', 'http://uniprot.org/uniprot');

    $self->_resolveName($name);
    
    $logger->info("fetchCore seems successfull for \"$name\"");

    return $self;
}

=pod getIsoformList
    return a list of container storing isoform node data from xml uniprot
    container = {
    id => '',
    names => [ '...', '...'],
    sequences => {
           type => '',
           refence => "xxx yyy zzz uuu",
           boundaries => [{id => "xxx",
                           begin => [seg1Start, ... , segnStart],
                           end => [seg1End, ... , segnEnd]
                          }, 
                           { id => "yyy", ....}
                          ]
                }
}
    
=cut

sub getIsoformList {
    my $self = shift;

    my $container = {
	type => 'isoformList',
	data => []
    };
    
    my @nodes = $self->{ xmlTree }->findnodes('//ns:entry/ns:comment[@type="alternative products"]/ns:isoform');
    foreach my $node (@nodes) {
	my $data = {
	    id => '',
	    names => [],
	    sequence => {
		type => '',
		reference => '',
		boundaries => []
	    }	    
	};
	
	my @tNode = $self->{ xmlTree }->findnodes('./ns:id', $node);
	$data->{ id } = $tNode[0]->textContent;
	my @sNodes = $self->{ xmlTree }->findnodes('./ns:name', $node);
	foreach my $ssNode (@sNodes) {
	    push @{$data->{ names }}, $ssNode->textContent;	
	}
	@sNodes = $self->{ xmlTree }->findnodes('./ns:sequence', $node);
	foreach my $ssNode (@sNodes) {
	    $data->{ sequence }->{ type } = $ssNode->getAttribute ("type");
	    $data->{ sequence }->{ reference } = $ssNode->getAttribute ("ref");		
	    if (defined($data->{ sequence }->{ reference })) {
		foreach my $id (split /[\s]+/, $data->{ sequence }->{ reference }) {
		    @tNode = $self->{ xmlTree }->findnodes('//ns:entry/ns:feature[@id="' . $id  . '"]');
		    my $limitContainer = {
			begin => [],
			end => [],
			id => $id
		    };
		    my @bNode = $self->{ xmlTree }->findnodes('./ns:location/ns:begin', $tNode[0]);
		    my @eNode = $self->{ xmlTree }->findnodes('./ns:location/ns:end', $tNode[0]);
		    for (my $i = 0; $i < @bNode; $i++) {
			push @{$limitContainer->{ begin }}, $bNode[$i]->getAttribute ("position");
			push @{$limitContainer->{ end }}, $eNode[$i]->getAttribute ("position"),		  
		    }			    
		    push @{$data->{ sequence }->{ boundaries }}, $limitContainer;
		}
	    }
	}		    
	push @{$container->{ data }}, $data;
    }

    return $container;
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
	if ($key eq "name") {
	    

	}#  && next; # already set by calling routine
	
	if ($key eq "common") {	 	 	
	    $mapper->{ $key } = sub { 
		my $object = shift @_;			
		my $value = "DUMMY";
		
		if (defined($self->{ isFragment })) {
		    $logger->trace("I MUST ACCOUNT FOR $self->{ isFragment }");
		    
		}

		my @nodes = $object->{ xmlTree }->findnodes('//ns:entry/ns:protein/ns:recommendedName/ns:fullName');
		if (@nodes == 0) {
		    @nodes = $object->{ xmlTree }->findnodes('//ns:entry/ns:protein/ns:submittedName/ns:fullName');
		}
		if (@nodes > 0) {
		    $value = $nodes[0]->textContent;
		}
		return chomp ($value);
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
		
		return chomp ($value);
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

    $logger->info("returning mapper for object named $mapper->{ name }");
    return $mapper;
}


sub _resolveName {
    my $self = shift;
    
    

}


1;

