package psicquicQuery;
use strict;
use common;
use Data::Dumper;
use psimi;
use JSON;
use Log::Log4perl qw(get_logger :levels);
use biomoleculeMapper;
use base ('browserExporter');

=pod
    GL 20130612
    added PRO-FEATURES EXPANSION
    

=cut


our $MAX_HIT_PER_QUERY = 1000;

my $logger = get_logger("psicquicQuery"); 
$logger->level($ERROR);

## Auxilliary functions, not object methods
sub getEligibleTags {
    my @tags = qw /biomol_search pubmed_search interactom_builder/;
    
    return \@tags;
}

sub isPsicquicQuery {
    my $query = shift @_;
    my $tagArray = getEligibleTags ($query);
    
    return  common::list_exist ($tagArray, $query->param('searchType'));
}

sub getRegistry {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
  
    if ($p->{ format } eq "dialogBox") {
	my $htmlDiv = "<div id=\"dialogDiv\"><table id=\"imexModalTable\">"; # <style = "ui.dialog"> necessary ? or dialog.load applies style ?
	my $cnt = 0;
	$htmlDiv .= "<tr>";
	foreach my $service (@{$self->{ serviceList }}) {
	   # warn "CNT::$cnt \"$service->{ name }\"";
	    $cnt++;
	    my $status="disabled = \"disabled\"";
	    if ($service->{ active } eq "true") {
		$status = "";
	    }
	    $htmlDiv .= "<td><label><input type=\"checkbox\" name=\"$service->{ name }\" $status />$service->{ name }</label></td>";	    	    
	    if (($cnt % 3 == 0) && ($cnt < @{$self->{ serviceList }})) {
		$htmlDiv .= "</tr><tr>";
	    }
	}	
	$htmlDiv .= "</tr></table>";
#	$htmlDiv .= "<input class=\"ui-button ui-button-text-only ui-widget ui-state-default ui-corner-all\" type=\"button\"id=\"setServiceListButton\"/>Validate</input>";
	
	$htmlDiv .= "<div id=\"setServiceButton\"/></div>";
	return $htmlDiv;
    } elsif ($p->{ format } eq "json") {
	my $json = "{ \"registry\" : [";
	foreach my $service (@{$self->{ serviceList }}) {
	    $json .= "{\"name\" : \"$service->{ name }\", \"status\" : \"$service->{ active }\", \"count\" : \"$service->{ count }\"}, ";
	}
	$json =~ s/, $/]}/;
	return $json;
    }

    

}
#$self->serviceTags/ name soapUrl restUrl active count restExample/; 

=pod
 Constructor & methods

    default is tabular 2.7 foramt
=cut
sub new {
    my $class = shift @_;
    my $self = {};
    bless $self, $class;
    
    $logger->trace("TIMEprofile:(start)");     
    
    $self->{ defaultTabFormat } = "?format=tab27";

    # first call list services
    if (!$self->setServicesList()) {
	$logger->error("Coulnt set psicquic services list");
	return;
    }
    (@_ ==  0) && return $self;
    $logger->trace("contructor argument array:\n" . Dumper(@_));
    my $p = common::arg_parser (@_);
    
    # Basically if no argument is provided to contructor
    # the object is returned at this point
    # Otherwise ...
    
    # Declare JSON mapper
    $self->declareAssociationData ();    
    # Declare SOAP/REST method
    $self->{ requestMethod } = $p->{ method };
    
    if (defined ($p->{ inputContent })) {
	$self->{ rawInputContent } = $p->{ inputContent };
	# extract from passed cgi parameters the miql query
	$self->miqlGenerate (type => $p->{ inputType }, species => $p->{ species }, query => $p->{ inputContent });
	# extract from passed cgi parameters the providers list
	$self->providerListExtract (providers => $p->{ providers });
    } elsif (defined($p->{ pairwiseCheck })) {
	$self->{ checkPair } = $p->{ pairwiseCheck };
	$self->performPairwiseRequest(species => $p->{ species });
	return $self;
    } else {   
	print STDERR "no inputContent supplied to psicquicQuery constructor\n";
	return $self;	 
	
    }
    
  
    $self->runSeedRequest ();   

    # deeper search called when construct interactome
    (defined($p->{ degree })) || return $self;

    if ($p->{ degree } == 2) {    
	$self->miqlExpandGenerate () && $self->runExpandRequest ();
    }
    

    $logger->trace("TIMEprofile:(exit)");     
    
    return $self;
}

sub hasDataTable {
    my $self = shift @_;
    
    if (defined ($self->{ dataTable })) {
	(@{$self->{ dataTable }} > 0)  && return 1;
    }
    
    return 0;
}

sub hasData {
    my $self = shift @_;
    
    my $cnt = 0;
    foreach my $stack (@{$self->_getStacks()}) {
	foreach my $response (@{$stack}) {	  
	    foreach my $psimiObject (@{$response->{ psimiList }}) {
		$cnt++;
	    }
	}
    }
    $cnt > 0 && return 1;
    
    return 0;
}

sub enumerate {
    my $self = shift @_;
    
    my $cnt = 0;
    foreach my $stack (@{$self->_getStacks()}) {
	foreach my $response (@{$stack}) {	  
	    foreach my $psimiObject (@{$response->{ psimiList }}) {
		$cnt++;
	    }
	}
    }

    return $cnt;
}


=pod
    stackProcess
    Parse latest stack of response out of performRequest.
    strip out the the raw html into psimi object and
    set the jobs status accordingly
=cut
sub stackProcess {
    my $self = shift;
    
    my $currentStack = $self->_getLatestStack ();
  
    $logger->info(scalar(@{$currentStack}) . " psicquic requests to parse");
    foreach my $response (@{$currentStack}) {
	$response->{ status } = "NULL";
	if ($response->{ htmlResponse } eq "") {
	    $logger->warn ("empty REST request");
	    next;
	};
	
	my @buffer = split ('\n', $response->{ htmlResponse });
	
	if (@buffer > 0) {
	    $response->{ status } = "CONTENT";	    
	} 
	$logger->info("$response->{ request } returned non empty document[". scalar (@buffer)."]!");
	$logger->trace("@buffer");
	open BUF, ">/tmp/psq_buffer.tab" or die $!;
	print BUF join("\n",@buffer);
	close BUF;
	$response->{ psimiList } = [];		
	foreach my $hit (@buffer) {
	    $logger->trace("Trying to feed psimiconstructor with:\n\"$hit\"");
	    my $psimiObject = psimi->new ($hit);
	    defined($psimiObject) || next;
	    if (! $psimiObject->isValid()) {
		$logger->warn("following psimi object found invalid discarded".
			      Dumper($psimiObject));
		next;
	    }
	    push @{$response->{ psimiList }}, $psimiObject; 
	}	
    }
}

sub list {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    if (defined ($p->{ toFile })) {
	open OUT, ">$p->{ toFile }" or die $!;
	foreach my $stack (@{$self->_getStacks()}) {
	    foreach my $response (@{$stack}) {
		foreach my $psimiObject (@{$response->{ psimiList }}) {		
		    print OUT "psimiObject:\n" . $psimiObject->asString ();
		}	    
	    }	  
	}    
	close OUT;
    }
}
=pod
    a function to select limited information in psimifield
    referenced psimi objects are effectively modified
=cut
sub strip {
    my $self = shift;
    
    foreach my $stack (@{$self->_getStacks()}) {
	foreach my $response (@{$stack}) {	  
	    for (my $iPsimiObject = 0;  $iPsimiObject < @{$response->{ psimiList }}; $iPsimiObject++) {		
		$response->{ psimiList }->[$iPsimiObject]->psimiStriper();	
	    }
	}
    }    
}
=pod
    # COULD PARRALLELLIZED performRequest CALLS IN TWO SUBROUTINES ABOVE
=cut

=pod
    runSeedRequest
    1st call to psicquic uses the miql string to query a set of providers   
=cut
sub runSeedRequest {
    my $self = shift;
    warn "Seed Requesting " . scalar (@{$self->{ providerList }}) . " services";
    $self->{ primaryRequestStack } = [];
    #open DBG, ">/tmp/dbg.lst";
    foreach my $provider (@{$self->{ providerList }}) {
	#print DBG Dumper ($provider);
	my $response = $self->performRequest (service => $provider, miql => $self->{ miql }); # FORK ??
	push @{$self->{ primaryRequestStack }}, $response;
    }    
    #close DBG;
    $self->stackProcess ();       
    $logger->trace("seedRequest done");
}

sub miqlExpandGenerate {
    my $self = shift;

    my $liste = $self->listInteractors (options => ['uniprotkb']);
    if (@{$liste} == 0) {
	warn "Empty interactors list, unable to generate expanded miql!";
	return 0;
    }
    $self->{ miqlExpanded } = join (' OR id:', @{$liste});
    $self->{ miqlExpanded } = "id:$self->{ miqlExpanded }";
    
    $logger->info("expanded ql query is \"$self->{ miqlExpanded }\"\n");    
    return 1;
}

=pod
    runExpandRequest
    2nt set of call to psicquic 
    concatenate all partner of seed molecule
    to search for their partners
=cut
sub runExpandRequest {
    my $self = shift @_;
    
    warn "running Expand request\n->\"$self->{ miqlExpanded }\"";
    $self->{ expandedRequestStack } = [];
    foreach my $provider (@{$self->{ providerList }}) {
	my $response = $self->performRequest (service => $provider, miql => $self->{ miqlExpanded }); # FORK ??
	push @{$self->{ expandedRequestStack }}, $response;
    }
    $self->stackProcess ();    
   
}
=pod
    performPairwiseRequest 
    a special type of psicquic request used for graph closure
=cut
sub performPairwiseRequest {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
    
    my $idOne = $self->{ checkPair }->[0];
    my $idTwo = $self->{ checkPair }->[1];
    
    my $specieTag = @{$p->{ species } } > 0 ? "" : join("%20AND%20", @{$p->{ species } });
    $specieTag =~ s/%20AND%20$//;
    my $requestArray = ["idA:$idOne%20AND%20idB:$idTwo" . $specieTag,"idB:$idOne%20AND%20idA:$idTwo" . $specieTag];
    $logger->trace("requestArray is " . Dumper($requestArray));
    foreach my $provider (@{$self->{ providerList }}) {	    
	foreach my $miql (@{ $requestArray }) {
	    my $h = {};
	    $h->{ request } = "$p->{ service }->{ restUrl }query/" . $miql . $self->{ defaultTabFormat };
	    $logger->info("performing psicquic REST request\n$h->{ request }");
	    $h->{ htmlResponse } = `curl "$h->{ request }" 2> /dev/null`;
	    $h->{ provider } = $p->{ service }->{ name };
	    #http://www.ebi.ac.uk/Tools/webservices/psicquic/intact/webservices/current/search/query/id:P04637P98160%20AND%20species:9606?firstResult=0&maxResults=99999
	    push @{ $self->{ primaryRequestStack } }, $h;
	}
    }
    $self->stackProcess ();    
}


=pod
    performRequest 
    self explanatory, requires miql and providerList attribute to be set
    --> populates $self->{ requestList } = [];
=cut
sub performRequest {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
    
    my $h = {};
    $h->{ request } = "$p->{ service }->{ restUrl }query/" . $p->{ miql } . $self->{ defaultTabFormat };
    $logger->info("performing psicquic REST request\n$h->{ request }");
    $h->{ htmlResponse } = `curl "$h->{ request }" 2> /dev/null`;
    $h->{ provider } = $p->{ service }->{ name };
    #http://www.ebi.ac.uk/Tools/webservices/psicquic/intact/webservices/current/search/query/id:P04637P98160%20AND%20species:9606?firstResult=0&maxResults=99999
    return $h;
}

=pod
miqlGenerate
    Map data imported from a post argument string to 
    psicquic valid miql string (lucene-like query language).
    list of identifiers can be provided in single string
    id:(PXXXXX%20PYYYYYY) 

    ie set the $self->{ miql } content
  NB: A full miql query can be posted for dev purposes using the miql key
  #$self->{ miql } = $self->getInputValue (key => 'miql');

    PRO Features expansion
    PRO_XXXXXXX -> *-PRO_XXXXXXX
=cut
    
sub miqlGenerate {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
    my $idType;
    if ($p->{ type } eq "biomol_search") {
	$idType = "id";	
	$p->{ query } =~ s/^(PRO_[\d]+)$/\*-$1/;
    
    } elsif ($p->{ type } eq "pubmed_search") {
	$idType = "pubid";
    }

    $self->{ miql } = "${idType}:$p->{ query }%20";
   # Example request input supplied as list
    my $specie;
    if (@{$p->{ species }} == 0) {
	$specie = '';
    } elsif (@{$p->{ species }} == 1) {
# GL 20130716, ensure both interactors are 9606
#	$specie = "species:$p->{ species }->[0]%20";
	$specie = "%20(%20taxidA:$p->{ species }->[0]%20AND%20taxidB:$p->{ species }->[0]%20)%20";

    } else {
	$specie = "species:(%20";
	foreach my $spec (@{$p->{ species }}) {
	    $specie .= "$spec OR ";
	}
	$specie =~ s/ OR /\%20)%20/;
    }
    $self->{ miql } .= "AND%20$specie"; 
	
    $logger->info("generated query is ::\"$self->{ miql }\"");
    
# pubid:(10837477 OR 12029088)
#    $self->{ miql } = $self->getInputValue (key => 'miql');
    
}

=pod
    providerListExtract
    extract from the cgi-passed arguments
    the list of imex database to query
    ie set the $self->{ providerList } content which is a list of reference to service hash
=cut
sub providerListExtract {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
#    my $string = $self->getInputValue (key => 'providers');
    $self->{ providerList } = [];    
    foreach my $service (split (/[\s]+/, $p->{ providers })) {
	my $serviceRef = $self->_getService (name => $service);
	defined ($serviceRef) || warn "Could not set service for \"$service\"";
	push (@{$self->{ providerList }}, $serviceRef);
    }       
}

=pod
    listInteractors
    list all interactors in all stacks or in provided "source" buffer
=cut
sub listInteractors {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    my @interactorsList;


    if ($p->{ source } eq "psimiRecord") {
	$logger->info("Listing interactors of a psimiRecord of " . scalar(@{$self->{ psimiRecord }}) . " elements");
	foreach my $psimiObject (@{$self->{ psimiRecord }}) {
	    my @ids = qw/A B/;
	    foreach my $id (@ids) {		
		my $array = $psimiObject->getAsList (key => 'Unique identifier for interactor ' . $id);
		my $value = $array->[0];
		if (defined ($p->{ options })) {
		    $logger->trace("raw name is $value");
		    if (common::listExist ($p->{ options }, "nameSimple")) {
			my @tmp = split (':', $value);
			$value = $tmp[0];
			if (@tmp == 2) {
			    $value = $tmp[1]; 
			}
			elsif (@tmp == 3) { # chebi:"CHEBI:16024"
			    $value = $tmp[1] . ":" . $tmp[2]; 
			}
		    }
		}
		$value =~ s/"//g;
		$logger->info("and i push $value");		
		push @interactorsList, $value;	    
	    }
	}
    } else {
    
	my $stackList = $self->_getStacks();       
	warn "listing interactors for 2nd pass out of " . scalar (@{$stackList}) . " stacks\n";
	
	foreach my $stack (@{$stackList}) {	
	    foreach my $response (@{ $stack }) {
		foreach my $psimiObject (@{$response->{ psimiList }}) {
		    my $idA = $psimiObject->get(key => 'Unique identifier for interactor A');
		    my $idB = $psimiObject->get(key => 'Unique identifier for interactor B');
		    if (common::list_exist ($p->{ options }, 'uniprotkb')) {
			if ($idA =~ /uniprotkb:([A-Z0-9-]+)/) {			
			    push @interactorsList, $1;			
			}
			if ($idB =~ /uniprotkb:([A-Z0-9-]+)/) {
			    push @interactorsList, $1;		
			}			       		
		    } else {
			$idA =~ s/([^:]+)$/$1/;
			$idB =~ s/([^:]+)$/$1/;
			push @interactorsList, $idA;
			push @interactorsList, $idB;
		    }
		}
	    }
	}
    }

    $logger->info("PSQ " . scalar(@interactorsList) . " interactors listed");
    (@interactorsList == 0) && return;
    my $array = common::uniqList(\@interactorsList);
    $logger->info("PSQ " . scalar(@{$array}) . " interactors listed:\n" . Dumper($array));
    return $array;
}

=pod
    _getStacks
    returns a list of currently populated stacks A COMPLETER
=cut
sub _getStacks {
    my $self = shift;
    
    my @liste;
    my @eligibleStackLabel = qw /primaryRequestStack expandedRequestStack/;
    for (my $i = 0; $i <  scalar(@eligibleStackLabel); $i++) {
	if (defined ($self->{ $eligibleStackLabel[$i] })) {
	    push @liste, $self->{ $eligibleStackLabel[$i] };
	}
    }
    
    return \@liste;
}

sub _getLatestStack {
    my $self = shift;
    my @eligibleStackLabel = qw /primaryRequestStack expandedRequestStack/;
    for (my $i = scalar(@eligibleStackLabel) - 1; $i >= 0; $i--) {
	if (defined ($self->{ $eligibleStackLabel[$i] })) {	
	    return $self->{ $eligibleStackLabel[$i] };
	}
    }
    warn "Trying to return latest stack, but no stack defined !";
    return;
}

sub _getService {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
    
    my $serviceRef = common::getHashFromListByKeyValue ( 
	list => $self->{ serviceList }, 
	keyValue => ['name', $p->{ name }]
	);
    
    return $serviceRef;
}

sub _getServiceAttribute {
    my $self = shift @_;
    my $p = common::arg_parser (@_);

    my $service = common::getHashFromListByKeyValue (list => $self->{ serviceList }, keyValue => ['name', $p->{ name }]);

    return $service->{ $p->{ attribute }};
}

sub setServicesList {
    my $self = shift @_;
    
    $self->{ serviceListXml } = `curl 'http://www.ebi.ac.uk/Tools/webservices/psicquic/registry/registry?action=ACTIVE&format=xml' 2> /dev/null`;

    defined ( $self->{ serviceListXml }) || return 0;

    @{$self->{ serviceTags }} = qw/ name soapUrl restUrl active count restExample/; 
    $self->{ serviceList } = [];
    
    my @rawBlocks = split /<\/{0,1}service>/, $self->{ serviceListXml };
    
    shift @rawBlocks;pop @rawBlocks;
    foreach my $service (@rawBlocks) { # =~ /<service>(.*)<\/service>/g
	($service =~  /^[\s\n]*$/ || !defined ($service)) && next;
	my $h = {};
	for my $xmlTag (@{$self->{ serviceTags }}) {
	    if ($service =~ /<$xmlTag>(.*)<\/$xmlTag>/) {
		my $value = $1;
		$h->{ $xmlTag } = $value;
	    }
	}
	push @{$self->{ serviceList }}, $h; 
    }
    return 1;
}

sub printServicesList {
    my $self = shift @_;
    warn "Printing services::\n";

    foreach my $service (@{$self->{ serviceList }}) {
	for my $xmlTag (@{$self->{ serviceTags }}) {	
	    warn "$xmlTag : $service->{ $xmlTag }";	    
	}
    }
}


=pod
    getInputContent
    Parse the query input out of CGI parameter, following format is expected
    CGI_lvl: queryString=[QUERY_INPUT_STRING]
    QUERY_INPUT_STRING =~ /([^,]+)/g;
    each query field (key, value) =~ /^([^:]+):(.+)$/g
    BEWARE VALUE CAN CONTAIN semicolumn
=cut
sub getInputValue {
    my $self = shift;
    my $p = common::arg_parser (@_);

    my @data = split (',', $self->{ rawInputContent });
    foreach my $field (@data) {
	if ($field =~ /^$p->{ key }:(.+)/) {
	    return $1;
	}
    }
    
    print STDERR "WARNING key \"$p->{ key }\" not found in queryInput \"$self->{ rawInputContent }\"\n";
    return;
}

=pod
    matrixdbQueryMap
    Extract psimidata and map them on the JSON matrixdb Browser data structure (multiple response laying multiple psimi 
    in a single dataTable list)
    The mapping is defined as JSON header to psimiheader term
=cut
sub matrixdbQueryMap {
    my $self = shift @_;
    

    $self->{ dataTable } = [];# Storage datastructure processed by the JSON exporter    
    
    my $psimiMap = {
        # JSON attr               #Psimi column tag
	'A Interactor' =>   'Unique identifier for interactor A',
	'A Common name' =>  'Aliases for A', 
	'A Gene name' =>  'Alternative identifier for interactor A',
	'A Biological Role' => 'Biological role A', 
	'A TaxID' =>  'NCBI Taxonomy identifier for interactor A',
	'B Interactor' =>   'Unique identifier for interactor B',
	'B Common name' =>  'Aliases for B', 
	'B Gene name' =>  'Alternative identifier for interactor B',
	'B Biological Role' => 'Biological role B', 
	'B TaxID' =>  'NCBI Taxonomy identifier for interactor B',
	'Source database' => 'Source databases',
	'Interaction identifier(s)' => 'Interaction identifier(s)'
    };    
    
    
    if (defined  ($self->{ psimiRecord })) {
	warn "psimiRecord found avoiding request stack for matrixdbQuery mapping";
	open LOG, ">/tmp/psimiMap.log";
	foreach my $psimiObject (@{$self->{ psimiRecord }}){
	    print LOG Dumper ($psimiObject) . "\n";
	    my $dataToExport = {};
	    foreach my $key (@{$self->{ headers }->{ association }}) {
		($key eq "id") && next;
		my $mappedKey = $psimiMap->{ $key };
		defined ($mappedKey) || die "$key undefined!!";
		#warn "--> $key : $psimiObject->get (key => $mappedKey)";
		$dataToExport->{ $key } = $psimiObject->get (key => $mappedKey);
	    }
	    push @{$self->{ dataTable }}, $dataToExport;
	}
	close LOG;
	warn "dataTable size is " . scalar (@{$self->{ dataTable }});
	return;	
    }

    foreach my $stack (@{$self->_getStacks()}) {
	foreach my $response (@{$stack}) {	  
	    foreach my $psimiObject (@{$response->{ psimiList }}) {
		my $dataToExport = {};
		foreach my $key (@{$self->{ headers }->{ association }}) {
		    ($key eq "id") && next;
		    if ($key eq 'Source database') {
			$dataToExport->{ $key } = $response->{ provider };
			next;
		    }
		    my $mappedKey = $psimiMap->{ $key };
		    defined ($mappedKey) || die "$key undefined!!";
		    warn "--> $key : $psimiObject->get (key => $mappedKey)";
 		    $dataToExport->{ $key } = $psimiObject->get (key => $mappedKey);
		}
		push @{$self->{ dataTable }}, $dataToExport;
	    }
	}
    }
 
#    foreach my $hData (@{$self->{ dataTable }}) {
#	warn Dumper($hData);
#    }
   
}

=pod eliminate redundancy in the psimiobject list
=cut
sub _uniqInteractorPairs {
    my $self = shift;
   
    my $psimiObjectListFull = $self->_listInteractorPairs ();
    my $psimiObjectListRedux = [];
    
    if (scalar (@{$psimiObjectListFull}) > $MAX_HIT_PER_QUERY) {
	$logger->error("Current psiquic hit list exceeds limits, no redundancy check perform \n");
	return $psimiObjectListFull;
    }
     
    my $registrator = {};
    foreach my $psimiObjectCurr (@{$psimiObjectListFull}) {
	my $partnairArray = $psimiObjectCurr->getInteractorsQuick(); 
	if (exists($registrator->{ $partnairArray->[0] })) {
	    exists($registrator->{ $partnairArray->[0] }->{ $partnairArray->[1] }) && next;
	}

	if (exists($registrator->{ $partnairArray->[1] })) {
	    exists($registrator->{ $partnairArray->[1] }->{ $partnairArray->[0] }) && next;
	}
	if (!exists($registrator->{ $partnairArray->[0] })) { $registrator->{ $partnairArray->[0] } = {};}
	$registrator->{ $partnairArray->[0] }->{ $partnairArray->[1] } = "TAGGED";
	
	push @{$psimiObjectListRedux}, $psimiObjectCurr;		
    }
   
    $logger->trace ("fullpsimilist : " . scalar (@{$psimiObjectListFull}) . " -> rdx : " . scalar (@{$psimiObjectListRedux}));

    return $psimiObjectListRedux;
}

sub getPsimiObjectList {
    my $self = shift;
    
    my $array = $self->_listInteractorPairs();

    return $array;
}

# BEWARE the method is badly named ! use the one above
sub _listInteractorPairs {
    my $self = shift;
    my @listPsimiObject;

    foreach my $stack (@{$self->_getStacks()}) {
	foreach my $response (@{$stack}) {	  
	    foreach my $psimiObject (@{$response->{ psimiList }}) {
		push @listPsimiObject, $psimiObject;
	    }		
	}
    }
    
    return \@listPsimiObject;
}

=pod
    return a list of psimiobject
    processing options can be specified
    optional bluePrint argument is a list of containers
    {
    A => {
            uniprot => [],
            chebi => []
         },
    B => {
            uniprot => [],
            chebi => []
         }    
    }
    specifying already known associations we should purge from returned list
    
=cut
sub retrievePsimiList {
    my $self = shift;
    my $p = common::arg_parser (@_);
    $logger->trace("running retrieve PsimiList");
    
    my $psimiObjectList = [];
    if (!defined ($p->{ options })) {
        $psimiObjectList = $self->_listInteractorPairs();	
    } else {
	if (common::listExist($p->{ options }, "nonRedundant")) {
	    $psimiObjectList =  $self->_uniqInteractorPairs ();
	} else {
	    $psimiObjectList = $self->_listInteractorPairs();
	}
    }
    
    open DBG, ">/tmp/bluep-PrintFiltering.log";
    if (defined ($p->{ bluePrint })) {
	my @psimiObjectListTmp = @{$psimiObjectList};
	$psimiObjectList = [];
	foreach my $psimiObject (@psimiObjectListTmp) {
	    my $bool = 1;
	    my $interactorSet = $psimiObject->getInteractorSet();
	    foreach my $refInteractorSet (@{$p->{ bluePrint }}) {
		my $currInteractorSet = $psimiObject->getInteractorSet();
		print DBG "BP: " . Dumper($refInteractorSet);
		print DBG "PSM:" . Dumper($currInteractorSet);
		if (psimi::similarInteractors (psimiOne => $psimiObject, anyContainer => $refInteractorSet)) {
		    print DBG "Found similar interactions\n";
		    $bool = 0;
		    last;
		}
	    }
	    if ($bool) {
		print DBG "adding " . $psimiObject->asString() . "\n";
		push @{$psimiObjectList}, $psimiObject;
	    }
	}
    }
    close DBG;
    
    warn "retrieved psimi list length : " . scalar (@{$psimiObjectList});
    $self->{ psimiRecord } = $psimiObjectList;

    return $psimiObjectList;	
}


=pod not a method 
    given an association description in matrix db generate the container;
=cut
 sub generateBluePrint {
     my $p = common::arg_parser (@_);

     my $bluePrint = [];

     open DBG, ">/tmp/blueprint.txt";

     if (defined ($p->{ from })) {
	 if ($p->{ from } eq "flat") {
	     print DBG "flat blueprint generator\n";
	     foreach my $association (@{$p->{ data }}) {
		my $container = {
		    A => {
			uniprot => [],
			chebi => [],
			unknown => [$association->[0]]
		    },
			    B => {
				uniprot => [],
				chebi => [],
				unknown => [$association->[1]],			    
			}    
		};
		push @{$bluePrint}, $container;
	    }
	    print DBG Dumper ($bluePrint);
	}
	elsif ($p->{ from } eq "interactionReport") {
	    foreach my $interactionReport (@{$p->{ data }}) {
		foreach my $association (@{$interactionReport->{ associations }}) {
		    my $container = {
			A => {
			    uniprot => [],
			    chebi => [],
			    unknown => [$association->[0]]
			},
				B => {
				    uniprot => [],
				    chebi => [],
				    unknown => [$association->[1]],			    
			    }    
		    };
		    push @{$bluePrint}, $container;
		}		
	    }
	    print DBG Dumper ($bluePrint);
	}    
	elsif ($p->{ from } eq "matrixQueryJSON") {
	    my $associationsList = decode_json ($p->{ data });
	    
	    print DBG Dumper($p->{ data });
	    print DBG "\n######\n";
	    print DBG Dumper($associationsList);
	    print DBG "\n######\n";
	    
	    foreach my $assoc (@{$associationsList->{ aaData }}) {
		print DBG " $assoc->[0] -- $assoc->[5]\n";
		
		my $container =  {
		    A => {
		    uniprot => [],
		    chebi => [],
		    unknown => [$assoc->[0]]
		    },
			B => {
			    uniprot => [],
			    chebi => [],
			    unknown => [$assoc->[5]],			    
		    }    
		};
		push @{$bluePrint}, $container;
	    }		
	}
    }
    close DBG;

    return $bluePrint;
}



=pod
    export psicqui data with different level of informations 
    to different format.

    registred format   =  ""
    registred info lvl =  "richLink_1.0" 
    
=cut
sub exportData {
    my $self = shift;

    my $p = common::arg_parser (@_);
    
    (common::slid($p->{ source }, $p->{ type })) || die "missing argument";
    ($p->{ type } eq "richLink_1.0")  || die "unknown data export type";
    
    my @exportList;
    
    my $genericMapper = _getMapper ();
    
    foreach my $psimiObject (@{$self->{ psimiRecord }}) {
	my $container = {    # see  *linkData specs:  in networkMapper.pm
	    Adata => [
		 #   [],[],[],[],[],[],[],[],[],[],[]
		],
	    Bdata => [
		 #   [],[],[],[],[],[],[],[],[],[],[]
                ],
	    iData => [ 
	#	[],[], [], [], [], []
	    ]
	};
	foreach my $interactor (qw /A B/) {
	    foreach my $gKey (@{$genericMapper->{ xData }}) {
		my $rKey = "$gKey$interactor";
		push @{$container->{"${interactor}data" }}, $genericMapper->{ xDataMapper }->{ $gKey } ($rKey, $psimiObject);
	    }	    
	}
	foreach my $key (@{$genericMapper->{ iData }}) {
	    push @{$container->{ iData }}, $genericMapper->{ iDataMapper }->{ $key } ($key, $psimiObject);		
	}	

	push @exportList, {
	    eData => { provider => "psicquic",
		       content => $container
	    }};
    }
    warn "Returning exporter";

    return \@exportList;
}

=pod
    object to ensure mapping up to 2.7 version of psimi

=cut

sub _getMapper {
    return {
	xData => ["Unique identifier for interactor ",
		 "Alternative identifier for interactor ",
		 "Aliases for ",                           
		 "NCBI Taxonomy identifier for interactor ",  
		 "Biological role ",                           
		 "Experimental role ",                        
		 "Interactor type ",                          
		 "Annotations for interactor ",             
		 "Xref for interactor ",
		 "Stoichiometry for interactor ",
		 "Participant identification method for interactor "],
	xDataMapper => {
	    "Unique identifier for interactor " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
	
		return $rawValue;
	    },
	    "Alternative identifier for interactor " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Aliases for " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },                           
	    "NCBI Taxonomy identifier for interactor " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },  
	    "Biological role " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },                           
	    "Experimental role " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },                        
	    "Interactor type " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
	    
		return $rawValue;
	    },                          
	    "Annotations for interactor " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },             
	    "Xref for interactor " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Stoichiometry for interactor " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Participant identification method for interactor " => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    }
	},
	iData => ["Interaction detection methods",
		 "Identifier of the publication",
		 "Interaction types",
		 "Annotations for the interaction",
		 "Parameters of the interaction",
		 "Interaction identifier(s)"],
	iDataMapper => {
	    "Interaction detection methods" => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Identifier of the publication" => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Interaction types" => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Annotations for the interaction" => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Parameters of the interaction" => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    },
	    "Interaction identifier(s)" => sub {
		my $key = shift;
		my $psimiObject = shift;
		my $rawValue = $psimiObject->getAsList (key => $key);
		
		return $rawValue;
	    }
	}
    };
}

1;


