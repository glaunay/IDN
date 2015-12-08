package psimi;

use common;
use strict;
use Log::Log4perl qw(get_logger :levels);
use Data::Dumper;
use vars qw/$MITAB_FORMATS/;

my $MITAB_FORMATS = {    latest => '2.7',
    nbFields => {
	'2.7' => 42,
	'2.6' => 36,
	'2.5' => 15,	    
	},
    fields => [
	'Unique identifier for interactor A',
	'Unique identifier for interactor B',
	'Alternative identifier for interactor A',
	'Alternative identifier for interactor B',
	'Aliases for A',
	'Aliases for B',
	'Interaction detection methods',
	'First author',
	'Identifier of the publication',
	'NCBI Taxonomy identifier for interactor A',
	'NCBI Taxonomy identifier for interactor B',
	'Interaction types',
	'Source databases',
	'Interaction identifier(s)',
	'Confidence score',
	'Complex expansion',
	'Biological role A',
	'Biological role B',
	'Experimental role A',
	'Experimental role B',
	'Interactor type A',
	'Interactor type B',
	'Xref for interactor A',
	'Xref for interactor B',
	'Xref for the interaction',
	'Annotations for interactor A',
	'Annotations for Interactor B',
	'Annotations for the interaction',
	'NCBI Taxonomy identifier for the host organism',
	'Parameters of the interaction',
	'Creation date',
	'Update date',
	'Checksum for interactor A',
	'Checksum for interactor B',
	'Checksum for interaction',
	'negative',
	'Feature(s) for interactor A',
	'Feature(s) for interactor B',
	'Stoichiometry for interactor A',
	'Stoichiometry for interactor B',
	'Participant identification method for interactor A',
	'Participant identification method for interactor B'
	]
};


my $logger = get_logger("psimi"); 
$logger->level($ERROR);

=pod psimi list methods
    get (psimiObjectList => $scalar,
    selectors => { 
    interactors => [ string ...]
    })
=cut
sub getObject {
    my $p = common::arg_parser (@_);

    defined ($p->{ psimiObjectList }) || die "You must provide a psimiObject List";
    my @knownSelectors = qw /interactors/;
    defined ($p->{ selectors }) || die "You must provide selector to get from psimiObject List";
    
    if (defined ($p->{ selectors }->{ interactors })) {

	foreach my $psimi (@{$p-> { psimiObjectList }}) {
	    my $container = $psimi->getInteractorSet();
	    my $cnt = 0;
	    foreach my $name (@{$p->{ selectors }->{ interactors }}) {	  
		foreach my $partner (qw /A B/) {
		    foreach my $tag (qw /uniprot unknown chebi/) {
		#	warn "UHU [@{$container->{ $partner }->{ $tag }}] <-- see me -- $name \n";
			if (common::listExist( $container->{ $partner }->{ $tag }, $name) ) {
			    $cnt += 1;
		#	    warn ">>>>>>>gotcha<<<<<<< CNT == $cnt";
			    last;
			}
		    }
		}
	    }
	    $cnt == scalar (@{$p->{ selectors }->{ interactors }}) && return $psimi;
	}
	 warn "!!!no match found in current psimiObjectList for \"@{$p->{ selectors }->{ interactors }}\"\n";
    }
    return;
}


sub getObjects {
    my $p = common::arg_parser (@_);
    
    defined ($p->{ psimiObjectList }) || die "You must provide a psimiObject List";
    my @knownSelectors = qw /interactors/;
    defined ($p->{ selectors }) || die "You must provide selector to get from psimiObject List";
    my @objectList = ();
    
    if (defined ($p->{ selectors }->{ interactors })) {
	foreach my $psimi (@{$p-> { psimiObjectList }}) {
	    my $container = $psimi->getInteractorSet();
	    my $cnt = 0;
	    my $booked = "X";
	    SEL : foreach my $name (@{$p->{ selectors }->{ interactors }}) {	  
		foreach my $partner (qw /A B/) {
		    ($partner eq $booked)  && next;
		    foreach my $tag (qw /uniprot unknown chebi/) {
			if (common::listExist( $container->{ $partner }->{ $tag }, $name) ) {
			#    $logger->info ("bing $name --> \"@{$container->{ $partner }->{ $tag }}\"");
			    $cnt += 1;
			    $booked = $partner;
			    next SEL;
			}
		    }
		}
	    }
	    $cnt != scalar (@{$p->{ selectors }->{ interactors }}) && next;
	    $logger->info("@{$p->{ selectors }->{ interactors }} selectors fired a PSM " .
			  "match with following interactor set: \n ". Dumper($container));
	    push @objectList, $psimi;
	}	
    }
    
    if (@objectList == 0) {
	$logger->warn ("!!!no match found in current psimiObjectList for following selector \n" .
		       Dumper ($p->{ selectors }) 
	    );
    } else {
	$logger->info ("fetched " . scalar(@objectList) . " psimi objects w/ following selector \n" .
		       Dumper ($p->{ selectors })
	    );
    }

    return \@objectList;
}



sub getPartnersList {
    my $p = common::arg_parser (@_);
    defined ($p->{ psimiObjectList }) || die "You must provide a psimiObject List";
    defined ($p->{ options }) || die "you must provide some kind of format options";
    my @list;
    
    if (common::listExist ($p->{ options }, "flatPairs")) {
	foreach my $psimi (@{$p->{ psimiObjectList }}) {
	
	    my $container = $psimi->getInteractorSet();
	    my @couple;
	    for my $id (qw/A B/) {
		for my $type (qw/uniprot chebi unknwon/) {
		    my $string = shift (@{$container->{ $id }->{ $type }});
		    defined ($string) || next;
		  
		    push @couple, $string;
		    last;
		}
	    }
	    $logger->info("TOTO pushing [@couple]");
	    push @list, \@couple;				
	}
    }		       
    
    return \@list;
}

sub new {
    my $self = {};
    my $class = shift @_;
    bless $self, $class;
    
    my $rawLine = shift;          
    

    if (! $self->isValidMitabVersion($rawLine)) {
	$logger->error("not a valid psimi content:\n\"$rawLine\"");
	return;
    }
    
    $self->{ fieldName } = $MITAB_FORMATS->{ fields };
    $self->{ data } = {};
    
    my @array = split /\t/, $rawLine;  
    for (my $i = 0; $i < @array; $i++) {		
	$array[$i] =~ s/^[\s]*([\S].*)[\s]*$/$1/;	
	$self->{ data }->{ $self->{ fieldName }->[$i] } = $array[$i];
    }
    for (my $j = 0; $j ==  @array; $j++) {		
	$self->{ data }->{ $self->{ fieldName }->[$j] } = '-';
    }
    
    
    return $self;  
}


=pod
    missing or invalid element in the mitab format can be fatal 
    to package relying on psimi
    Fell free to add test conditions 
=cut
sub isValid {
    my $self = shift;
    
    foreach my $id (qw /A B/) {
	my $string = $self->{ data }->{'Unique identifier for interactor ' . $id };
	(common::isUniprotID(string => $string, options =>['sloppySearch','enablePRO', 'enableIsoform'])) && next;
	($string =~ /(CHEBI:[\d]+|EBI-[\d]+)/) && next;

	$logger->trace("NOT a valid identifier $string");
	return 0;		
    }   
    
    return 1;
}

sub getInteractorsQuick {
    my $self = shift;
    my $a = $self->get(key => 'Unique identifier for interactor A');
    my $b = $self->get(key => 'Unique identifier for interactor B');
    $a =~ s/(uniprotkb:|intact:)//i; 
    $b =~ s/(uniprotkb:|intact:)//i;
    
    return [$a, $b];
}

sub asString {
    my $self = shift;
    my @array;

    for (my $i = 0; $i < $self->{ nbFields }; $i++) {
	push @array, $self->{ data }->{ $self->{ fieldName }->[$i] };
    }
    
    return join ("\t", @array);	
}

sub isValidMitabVersion {
    my $self = shift;
    my $line = shift;
    
    my @array = split /\t/, $line;  
    foreach my $mitabVersion (keys (%{$MITAB_FORMATS->{ nbFields }})) {
	if ($MITAB_FORMATS->{ nbFields }->{ $mitabVersion } == @array) {
	    $self->{ format } = $mitabVersion;
	    $self->{ nbFields } = $MITAB_FORMATS->{ nbFields }->{ $mitabVersion };	    
	    return 1;
	}	
    }

    warn "Unable to guess version of mitab input[" . scalar(@array)." fields] :\"$line\"";	
    return 0;
}

sub guessMitabVersion {
    my $self = shift;
    (defined ($self->{ format })) && return $self->{ format };
    
    return;    
}

=pod
    getTabulateIntels
    returns a list of asked parameters
=cut
sub getTabulateIntels {
    my $self = shift;

    my $p = common::arg_parser (@_);
    my @liste;
    foreach my $parameter (@{$p->{ parameters }}) {
	push @liste, $self->{ data }->{ $parameter };
    }
    
    return \@liste;
}

=pod 
    reduce this column information to the first occurrence AND  strip provider name
=cut
sub psimiStriper {
    my $self = shift;
    
    for (my $i = 0; $i < $self->{ nbFields }; $i++) {
	my $previousValue = $self->{ data }->{ $self->{ fieldName }->[$i] };#$self->{ $self->{ format }->{ fields }->[$i] };
	my @array = split '\|', $previousValue;
	my $valueSimple = $array[0];
	if ($i <= 1) { # unique identifier
	    if ($valueSimple =~ /:/){
		if ($valueSimple =~ /(chebi:[\d]+)/i) {
		    $valueSimple = $1;
		}
		elsif (common::isUniprotID(string => $valueSimple, options =>['sloppySearch','enablePRO', 'enableIsoform'])) {
		    my $toto = $valueSimple;
		    $valueSimple = common::grepUniprotID(string => $valueSimple, options =>['sloppySearch','enablePRO', 'enableIsoform']);
		    $logger->warn("$toto striped as $valueSimple");
		} else {
		    $logger->warn ("UNKNWONW UNIQUE PSIMI INTERACTOR IDENTIFIER " . $valueSimple);
		}
	    }
	}
	$self->{ data }->{ $self->{ fieldName }->[$i] } = $valueSimple; #$self->{ $self->{ format }->{ fields }->[$i]} = $array[0];
    }       
}


# Warning several pmids
sub pmid {
    my $self = shift;
    my ($pmid) = ($self->{ data }->{'Identifier of the publication'} =~ /pubmed:([\d]+)/);
   
    return $pmid;
}

sub next {
    my $self = shift;
    ($self->{'rightNode'}) && return $self->{'rightNode'};
    
    return;
}

sub get_interactors {
    my $self = shift;
    
    my $parameters = common::arg_parser (@_);

    foreach my $opt (@{$parameters->{ 'Options' }}) {
	if ($opt eq "asUniprot") {
	    my ($a) = ($self->{ data }->{'Unique identifier for interactor A'} =~ /uniprotkb:([A-Z0-9]+)/);
	    my ($b) = ($self->{ data }->{'Unique identifier for interactor B'} =~ /uniprotkb:([A-Z0-9]+)/);
	    return ($a, $b);
	}	
    }
    
    return ($self->{ data }{'Unique identifier for interactor A'}, $self->{ data }->{'Unique identifier for interactor B'});     
}

=pod
    return a container w/ A and B keys referencing list of uniprot, chebi, unknwon DB identifiers
=cut
sub getInteractorSet {
    my $self = shift;      
  
    my $container = {
	A => {
	    uniprot => [],
	    chebi => [],
	    unknown => []
	},
	B => {
	    uniprot => [],
	    chebi => [],
	    unknown => []
          }
    };
    
    for my $id (qw/A B/) {
	foreach my $element (split ('\|', $self->{ data }->{'Unique identifier for interactor ' . $id})) {	  
	    if (common::isUniprotID (string => $element, options => ['sloppySearch', 'enablePRO', 'enableIsoform'])) {
		my $value = common::grepUniprotID (string => $element, 
						   options => ['sloppySearch', 'enablePRO', 'enableIsoform']);
		$logger->trace("storing UP $value");
		push @{$container->{ $id }->{ uniprot }}, $value;
	    } elsif ($element =~ /chebi:([0-9]+)$/) {
		$logger->trace("storing CHB $1");
		push @{$container->{ $id }->{ chebi }}, $1;	
	    } else {
		my ($str) = ($element =~ /([^:]+)$/);
		if (defined ($str)) {
		    push @{$container->{ $id }->{ unknown }}, $str;
		}
	    }	
	}
    }
    
    return $container;
}



=pod 
    WARNING only uniprot element are checked
    
    not a method, two psimi objects must be supplied
    anyContainer must be of the form
    {
    A => [],
    B => []
    }


=cut
sub similarInteractors {
    my $p = common::arg_parser (@_);
    
    my ($psimiOne, $psimiTwo, $anyContainer);
    my $oneA = $p->{ psimiOne }->get(key => 'Unique identifier for interactor A');
    my $oneB = $p->{ psimiOne }->get(key => 'Unique identifier for interactor B');
    my $twoA = $p->{ psimiTwo }->get(key => 'Unique identifier for interactor A');
    my $twoB = $p->{ psimiTwo }->get(key => 'Unique identifier for interactor B');
    $logger->trace("[$oneA , $twoA] VS [$oneB , $twoB]");
    $logger->trace(Dumper( $p->{ psimiOne }));
    (($oneA eq $twoA) && ($oneB eq $twoB)) && return 1;
    (($oneB eq $twoA) && ($oneA eq $twoB)) && return 1;
    $logger->trace("NOT IDENTICAL");
    return 0;

    if (defined ($p->{ psimiOne })){
	$psimiOne = $p->{ psimiOne }->getInteractorSet();
    }
    if (defined ($p->{ psimiTwo })){
	$psimiTwo = $p->{ psimiTwo }->getInteractorSet();
    }

    if (defined ($p->{ anyContainer })) {
	$anyContainer = $p->{ anyContainer };
    }
 
    if (common::slid ($psimiOne, $psimiTwo) ) {
	# A == A && B == B
	for my $molType (qw /uniprot chebi/) {
	    if (common::listUnionSize( $psimiOne->{ A }->{ $molType }, $psimiTwo->{ A }->{ $molType }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ $molType }, $psimiTwo->{ A }->{ unknown }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ unknown }, $psimiTwo->{ A }->{ $molType }) > 0 
		){
		if (common::listUnionSize( $psimiOne->{ B }->{ $molType }, $psimiTwo->{ B }->{ $molType }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ $molType }, $psimiTwo->{ B }->{ unknown }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ unknown }, $psimiTwo->{ B }->{ $molType }) > 0 
		    ) {
		    return 1;
		}
	    }
	    # A == B && B == A 
	    if (common::listUnionSize( $psimiOne->{ A }->{ $molType }, $psimiTwo->{ B }->{ $molType }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ $molType }, $psimiTwo->{ B }->{ unknown }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ unknown }, $psimiTwo->{ B }->{ $molType }) > 0 
		){
		if (common::listUnionSize( $psimiOne->{ B }->{ $molType }, $psimiTwo->{ A }->{ $molType }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ $molType }, $psimiTwo->{ A }->{ unknown }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ unknown }, $psimiTwo->{ A }->{ $molType }) > 0 
		    ) {
		    return 1;
		}
	    }
	}
	return 0;
    }
            
    (common::slid($psimiOne, $anyContainer)) || die "null Object to compare";
    # A == A && B == B
	for my $molType (qw /uniprot chebi/) {
	    if (common::listUnionSize( $psimiOne->{ A }->{ $molType }, $anyContainer->{ A }->{ $molType }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ $molType }, $anyContainer->{ A }->{ unknown }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ unknown }, $anyContainer->{ A }->{ $molType }) > 0 
		){
		if (common::listUnionSize( $psimiOne->{ B }->{ $molType }, $anyContainer->{ B }->{ $molType }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ $molType }, $anyContainer->{ B }->{ unknown }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ unknown }, $anyContainer->{ B }->{ $molType }) > 0 
		    ) {
		    return 1;
		}
	    }
	    # A == B && B == A 
	    if (common::listUnionSize( $psimiOne->{ A }->{ $molType }, $anyContainer->{ B }->{ $molType }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ $molType }, $anyContainer->{ B }->{ unknown }) > 0 ||
		common::listUnionSize( $psimiOne->{ A }->{ unknown }, $anyContainer->{ B }->{ $molType }) > 0 
		){
		if (common::listUnionSize( $psimiOne->{ B }->{ $molType }, $anyContainer->{ A }->{ $molType }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ $molType }, $anyContainer->{ A }->{ unknown }) > 0 ||
		    common::listUnionSize( $psimiOne->{ B }->{ unknown }, $anyContainer->{ A }->{ $molType }) > 0 
		    ) {
		    return 1;
		}
	    }
	}
    
    return 0;
}

# Optional argument to discard lines of no interest
sub parsefile {
    my $file = shift @_;
    my $parameters = common::arg_parser (@_);
    
    my @objects;

    open DATA, "<$file" or die $!;
    
    while (my $line = <DATA>) {
	(($line =~ /^#/) || ($line !~ /[\S]/)) && next;
	my $obj = psimi->new ($line);
	push @objects, $obj;
	if ($#objects > 0) {
	    $objects[$#objects - 1]->{ rightNode } = $objects[$#objects]; 
	    $objects[$#objects]->{ leftNode } = $objects[$#objects - 1]; 
	}
    }
    
    print "psimi::parsefile(\"$file\"): " . @objects . " objects successfully parsed\n";
    return \@objects;
}


## Get all intact interactions data involving a particular biomolecule
sub fathom_interactant {
    my $arr_intact = shift;
    my $biomol = shift;
    #die  scalar(@$arr_intact) . "\n$biomol\n";
    
    my @intact_dat;
    
    for (my $i = 0; $i < @{$arr_intact}; $i++) {
	my $exp = $arr_intact->[$i];	
	my ($a, $b) = $exp->get_interactors (Options => ['asUniprot']);
	if (defined ($a)) {	    
	    ($a eq $biomol) && push @intact_dat, $arr_intact->[$i];
	}
	if (defined ($b)) {
	    ($b eq $biomol) && push @intact_dat, $arr_intact->[$i];
	}	
    }
    
    scalar (@intact_dat) == 0 && return;
    return \@intact_dat;
}


=pod get a particualr data field
    any 2.5, 2.6, 2.7 field is accepted and test newer first
    options ->asList, noPrefix
    
=cut
sub get {
    my $self = shift;
    my $p = common::arg_parser (@_);
#    warn "psimi_get::\"$p->{ key }\"\n";
            
    my $value = $self->{ data }->{$p->{ key }};    
    if (!defined ($value)) {
	$value = '-';
    }
    
    defined ($p->{ options }) || return $value;
    
    if (common::listExist ($p->{ options }, 'literal') ) {
	my @tmp = ($value =~ /\(([^\)]+)\)/g);
	$value = join ('|',@tmp);
	$logger->info("extracting literal as \n" . "@tmp");
    }
    if (common::listExist ($p->{ options }, 'noLiteral') ) {
	$value =~ s/(\([^\)]+\))//g;     
    }
    if (common::listExist ($p->{ options }, 'noPrefix') ) {
	$value =~ s/[\S^:]+:([\S^:]+)/$1/g;     
    }
    if (common::listExist ($p->{ options }, 'postfixDB') ) {
	$value =~ s/([\S^:]+):([\S^:]+)/${2}\[DB:$1\]/g;     
    }
    if (common::listExist ($p->{ options }, 'asList') ) {
        my @array = split ('\|', $value);
	$value = \@array;
    } 
    if (common::listExist ($p->{ options }, 'asSingle') ) {
        my @array = split ('\|', $value);
	$value = $array[0];
    } 

    return $value;
}

sub getAsList {
    my $self = shift;
    my $p = common::arg_parser (@_);
#    warn "psimi_get::\"$p->{ key }\"\n";
            
    my $value = $self->{ data }->{$p->{ key }};    
    if (!defined ($value)) {
	$value = '-';
    }
    
    my @array = split ('\|', $value);
    
    return \@array;
}


=pod frequently asked data container

=cut

sub getSimpleInteractorPair {
    my $self = shift;
  
    my @list;
    foreach my $letter (qw/A B/) {
	my $string = $self->{ data }->{'Unique identifier for interactor ' . $letter};
	if (common::isUniprotID(string => $string, options => ['sloppySearch', 'enablePRO', 'enableIsoform'])) {
	    my $value = common::grepUniprotID(string => $string, options => ['sloppySearch', 'enablePRO', 'enableIsoform']);
	    push @list, $value;
	    next;
	}

	elsif ($string =~ /(CHEBI:[\d]+)/) {
	    push @list, $1;
	    next;
	} 
	elsif ($string =~ /(EBI-[\d]+)/) {
	    push @list, $1;
	    next;
	}
	    
	$logger->error ("unknown biomolecule type at \"$string\" psimiObject dump:\n" . Dumper ($self));
    }
    
    $logger->trace("returning " . Dumper(@list));
    return \@list;

}
=pod different numerical parameters associated with kinetics
    can be found in psimi records:
    
    
=cut

sub getKineticsData {
    my $self = shift;

    my $parameterList = $self->get(key => 'Parameters of the interaction', options => ['asList']);
    
    my $dataContainer = { 
	KD1_nM => 'NA', 
	KD2_nM => 'NA',
	Range_nM => 'NA',
	AssociationRate1 => 'NA',
	AssociationRate2 => 'NA',
	DissociationRate1 => 'NA',
	DissociationRate2 => 'NA',
	Kinetics_Comments => 'NA',
	Interaction_Model => 'NA',	
    };
    
    my $data = $self->get(key => 'Parameters of the interaction', options => ['asList']);
    $logger->info("Potential Kinetic raw mitab line\n\"@{$data}\"\n");

    my $kdRegExp = 'kd:([0-9\.]+x10\^[-0-9]+)([\s]+~[\d\.]+){0,1}\(([\w]+)\)';       
    foreach my $string (@{$data}) {
	if (my ($value, $range, $unit) = ($string =~ /$kdRegExp/)) {
	    $logger->trace("Found kd data here \"$string\"\n");
	    # convert value and range to nm
	    $value =~ s/x10\^/E/;
	    my ($dim) = ($value =~ /E([-\d]+)/);
	    $range =~ s/[~\s]+//g;
	    $range = "${range}E$dim";
	    $value /= 1.0E-9;
	    $range /= 1.0E-9;
	    if ($range != 0) {
		$dataContainer->{ 'Range_nM' } = $range;
	    }
	    if ($dataContainer->{ 'KD1_nM' } ne 'NA' && $dataContainer->{ 'KD2_nM' } ne 'NA') {
		$logger->error("unexpected number of kd in psimi object");
		last;
	    }
	    my $kdKey = $dataContainer->{ 'KD1_nM' } eq 'NA' ? 'KD1_nM' : 'KD2_nM';
	    
	    $logger->trace("Assinging kd $value to $kdKey");
	    $dataContainer->{ $kdKey } = $value;
	}
    }
    $logger->trace("returning kinetic data container:\n" . Dumper($dataContainer));
    
    return $dataContainer;
}
sub getPublicationData  {
    my $self = shift;
  
    my $dataContainer = { 
	pmid => '',
	imex => ''
    };
    
    
    my $value = $self->get(key => 'Identifier of the publication');
    
    my ($imex) = ($value =~ /imex:(IM[^|]+)/);
    $dataContainer->{ imex } = defined $imex ? $imex : 'NA';
    my ($pmid) = ($value =~ /pubmed:([0-9]+)/);
    $dataContainer->{ pmid } = defined $pmid ? $pmid : 'NA';
    
    $logger->info ("psimi publicationData raw \"$value\"\n");
    $logger->info ("psimi publicationData container" . Dumper ($dataContainer));
    return $dataContainer;
}
=pod	EXTRACTION OF psimi data relevant to 
    "Features" : {
		    	       "experimental" : "listType_knownExperimentalFeatureDescriptor",
               	       	       "binding" : "listType_bindingSiteDataDescriptor",
			       "ptm" : "listType_ptmDescriptor",
			       "pointMutation" : "listType_pointMutationDescriptor"
		    }
	TAKES PLACE HERE
    the returned container shall be later used by the psimi interactionReport mapper on each listType key
	 
Feature(s) for interactor A: describe features for participant A such as binding sites, PTMs, tags, etc. Represented as feature_type:range(text), 
where feature_type is the feature type as described in the PSI-MI controlled vocabulary. For the PTMs, the MI ontology terms are obsolete and the PSI-MOD ontology should be used instead.
 The text can be used for feature type names, feature names, interpro cross references, etc. For instance : sufficient to bind:27-195,201-133 (IPR000785). 
The use of the following characters is allowed to describe a range position : ‘?’ (undetermined position), ‘n’ (n terminal range), ‘c’ (c-terminal range), ‘>x’ (greater than x),
 ‘<’ (less than x), ‘x1..x1’ (fuzzy range position Ex : 5..5-9..10). The character '-' is used to separate start position(s) from end position(s). Multiple features separated by '|'. 
Multiple ranges per feature separated by ','. However, It is not possible to represent linked features/ranges. Ex: gst tag:n-n(n-terminal region)|sufficient to bind:23-45. or binding site:23..24-46,33-33
=cut
sub getInteractorFeatures {
    my $self = shift;
    $logger->trace("running gif");
    my $p = common::arg_parser (@_);
    
    defined($p->{ id }) || $logger->logdie("unproper argument");
    common::listExist(['A', 'B'], $p->{ id }) || $logger->logdie ("specified id must be A or B");

    # split all field in array
    my @array = $self->get(key => 'Feature(s) for interactor ' . $p->{ id }, options => ['asList']);
    # check if its element feature psimi key of interest.
    if (@array == 1 && $array[0] eq "") {
	$logger->info("INCREDIBLE\n@array\n");
    }
    $logger->info("gif Failed with\n@array\n");
    
    return;

=pod    
    my $psimiRootKey => { 
	bindingSite => 'MI:0117',
	mutation => 'MI:0118',
	experimentalFeature => 'MI:0505',
	mutationFeatures => '',
	ptmFeaturesKey => '' 
    };
    
    # here run sonOf request on CVmi server
=cut    
    return;

}


1;

=pod

FORMAT
------

The column contents should be as follows:

1.  Unique identifier for interactor A, represented as databaseName:ac, where 
    databaseName is the name of the corresponding database as defined in the 
    PSI-MI controlled vocabulary, and ac is the unique primary identifier of 
    the molecule in the database. Identifiers from multiple databases can be 
    separated by "|". It is recommended that proteins be identified by stable 
    identifiers such as their UniProtKB or RefSeq accession number.
2.  Unique identifier for interactor B.
3.  Alternative identifier for interactor A, for example the official gene 
    symbol as defined by a recognised nomenclature committee. Representation 
    as databaseName:identifier. Multiple identifiers separated by "|". 
4.  Alternative identifier for interactor B.
5.  Aliases for A, separated by "|". Representation as databaseName:identifier. 
    Multiple identifiers separated by "|". 
6.  Aliases for B.
7.  Interaction detection methods, taken from the corresponding PSI-MI controlled 
    vocabulary, and represented as darabaseName:identifier(methodName), 
    separated by "|".
8.  First author surname(s) of the publication(s) in which this interaction has 
    been shown, optionally followed by additional indicators, e.g. "Doe-2005-a". 
    Separated by "|".
9.  Identifier of the publication in which this interaction has been shown. 
    Database name taken from the PSI-MI controlled vocabulary, represented as 
    databaseName:identifier. Multiple identifiers separated by "|".
10. NCBI Taxonomy identifier for interactor A. Database name for NCBI taxid taken 
    from the PSI-MI controlled vocabulary, represented as databaseName:identifier. 
    Multiple identifiers separated by "|". 
    Note: In this column, the databaseName:identifier(speciesName) notation is only 
    there for consistency. Currently no taxonomy identifiers other than NCBI taxid are 
    anticipated, apart from the use of -1 to indicate "in vitro" and -2 to indicate 
    "chemical synthesis".
11. NCBI Taxonomy identifier for interactor B.
12. Interaction types, taken from the corresponding PSI-MI controlled vocabulary, and 
    represented as dataBaseName:identifier(interactionType), separated by "|".
13. Source databases and identifiers, taken from the corresponding PSI-MI controlled 
    vocabulary, and represented as databaseName:identifier(sourceName). Multiple source 
    databases can be separated by "|".
14. Interaction identifier(s) in the corresponding source database, represented by 
    databaseName:identifier
15. Confidence score. Denoted as scoreType:value. There are many different types of 
    confidence score, but so far no controlled vocabulary. Thus the only current 
    recommendation is to use score types consistently within one source. 
    Multiple scores separated by "|".

All columns are mandatory.



IntAct has added 11 additional columns to this format in order to accomodate the needs of the user community:

16. Experimental role(s) of interactor A, taken from the corresponding PSI-MI controlled vocabulary, and 
    represented as dataBaseName:identifier(role). Multiple roles separated by "|".
17. Experimental role(s) of interactor B, taken from the corresponding PSI-MI controlled vocabulary, and 
    represented as dataBaseName:identifier(role). Multiple roles separated by "|".
18. Biological role(s) of interactor A, taken from the corresponding PSI-MI controlled vocabulary, and 
    represented as dataBaseName:identifier(role). Multiple roles separated by "|".
19. Biological role(s) of interactor B, taken from the corresponding PSI-MI controlled vocabulary, and 
    represented as dataBaseName:identifier(role). Multiple roles separated by "|".
20. Properties (CrossReference) of interactor A, represented as dataBaseName:identifier(label).
    Multiple properties separated by "|".
21. Properties (CrossReference) of interactor A, represented as dataBaseName:identifier(label)
    Multiple properties separated by "|".
22. Molecule Type of interactor A, taken from the corresponding PSI-MI controlled vocabulary, and 
    represented as dataBaseName:identifier(type)
23. Molecule Type of interactor B, taken from the corresponding PSI-MI controlled vocabulary, and 
    represented as dataBaseName:identifier(type)
24. NCBI Taxonomy identifier of the host organism in which the experiment was carried out.
    Multiple organisms separated by "|".
25. Expansion method(s) should the binary interaction have been produced computationaly from a complex.
    If the field is empty, it is safe to assume that a binary interaction was reported in the corresponding 
    publication. Multiple methods separated by "|".
26. Dataset name(s) with which this interaction has been tagged.
    Multiple datasets separated by "|".
27. Annotation(s) of interactor A, are free text values that have been annotated under a specific annotation topic.
    Represented as type:text
    Multiple organisms separated by "|".
28. Annotation(s) interactor B , are free text values that have been annotated under a specific annotation topic.
    Represented as type:text
    Multiple organisms separated by "|".
29. Parameter(s) interactor A, are numerical parameter reported during the experimental process.
    Represented as type:numerical_value(unit).
    Multiple organisms separated by "|".
30. Parameter(s) interactor B, are numerical parameter reported during the experimental process.
    Represented as type:numerical_value(unit).
    Multiple organisms separated by "|".
31. Parameter(s) interaction, are numerical parameter reported during the experimental process.
    Represented as type:numerical_value(unit).
    Multiple organisms separated by "|".

Where values are missing, an empty cell is marked by "-".

















=cut
