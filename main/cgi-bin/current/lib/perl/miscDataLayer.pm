package miscDataLayer;
=pod
    Interface to set eligible data records foreach matrixDB objects
    TODO: for any provided biomolecule name fill attribute required by nodeMapper
=cut

use strict;
use common;

use JSON;
use miscDataLayer::chebi;
use miscDataLayer::uniprot;
use miscDataLayer::gxa;


use Log::Log4perl qw(get_logger);
our $logger = get_logger ("miscDataLayer");

sub newList {
    my $p = common::arg_parser (@_);
    (common::sloft ($p->{ nameList })) || die "missing argument";
    
    my $container = {
	dataList => []
    };
    
    foreach my $name (@{$p->{ nameList }}) {
	my $singleton = miscDataLayer->new (name => $name);
	push @{$container->{ dataList }}, $singleton;
    }
}


# biomolecule bean

# uniprot identifier

# matrixdb reserved identifier

sub new {
    my $class = shift @_;
    my $self = {
	type => '', #  uniprotId, matrixdbId
	core => undef # object received from appropriate miscDataLayer package 
    };
    bless $self, $class;
    
    my $p = common::arg_parser (@_);
    (common::sloft ($p->{ name })) || die "missing argument";
    
    $self->{ name } = $p->{ name };
    $self->_guessDataProvider ();
    (defined($self-> { type })) || return $self;
    $self->_fetchCore ();
       
    
    return $self;
}


sub _guessDataProvider {
    my $self = shift;     
   
    if ($self->{ name } =~ /^(PFRAG|MULT)/) {
	$self->{ type } = "matrixDB";
	return;
    }
    if ($self->{ name } =~ /^CHEBI/) {
	$self->{ type } = "chebi";
	return;
    }
    if (common::isUniprotID(string => $self->{ name }, options =>['sloppySearch','enablePRO'])) {
	$self->{ type } = "uniprot";
	return;
    }
    if ($self->{ name } =~ /^EBI-[\d]+/) {
	$self->{ type } = "ebiComplex";
	return;
    }

    warn "Could not guess data provider from \"$self->{ name }\"";
    return;
}

sub _fetchCore {
    my $self = shift;

   
    if ($self->{ type } eq "uniprot") {

	my $nTry = 0;
	while ($nTry < 5) {
	    $self->{ core } = miscDataLayer::uniprot->new(options => { name => $self->{ name }});
	    (defined ($self->{ core })) && return 1;
	    $nTry++;
	    $logger->warn("unable to fetch data at try $nTry / 5 ...");
	    sleep 1;	   	    
	}	      	
    } elsif ($self->{ type } eq "chebi") {
	my $nTry = 0;
	while ($nTry < 5) {
	    $self->{ core } = miscDataLayer::chebi->new(name => $self->{ name });
	    (defined ($self->{ core })) && return 1;
	    $nTry++;
	    $logger->warn("unable to fetch data try $nTry / 5 ...");
	    sleep 1;	    	    
	}
    }
    
    $logger->error("Could not fetch core data for $self->{ name }");
 
    return;    
}


sub getCoreObject {
    my $self = shift;

    (defined ($self->{ core }))  && return $self->{ core };
    
    $logger->trace("\"$self->{ name }\" returning emptyCore");
    return { 
	type => 'emptyCore'
    };    
}
=pod
    summon the suitable mapper corresponding to node container in networkMapper.pm   
    in case no core could be fetched (lag issuer unknown provider) return a default mapper
=cut
sub summonDataMapper {
    my $self = shift;
    my $p = common::arg_parser (@_);
    my $mapper;
    if (defined ($self->{ core })) {	
	if ($self->{ type } eq "uniprot") {
	    $logger->info ("returning uniprot data mapper");
	    $mapper = $self->{ core }->summonDataMapper (template => $p->{ template });	
	    return $mapper;
	} elsif ($self->{ type } eq "chebi") {
	    $logger->info ("returning chebi data mapper");
	    $mapper = $self->{ core }->summonDataMapper (template => $p->{ template });	
	    return $mapper;
	}	
    }  
    
    $logger->info ($self->{ name } . " core not defined/referenced\n returning empty data mapper");
    foreach my $key (keys (%{$p->{ template }}) ) {	    
	($key eq "name")  && next; # already set by calling routine
	if ($key eq "uniprotKW" || $key eq "go" || $key eq "pfam") {
		$mapper->{ $key } = sub { 
		    my $object = shift @_;			
		    return  [];
		};
		next;
	}
	$mapper->{ $key } = sub { 
	    my $object = shift @_;			
	    return  "N/A";
	}; 
    }
   # $logger->info ($self->{ name } ." core not defined/referenced\n returning empty data mapper");
    
    return $mapper;
}

1;
