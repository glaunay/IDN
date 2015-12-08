package networkMapper;
use IO::Socket::UNIX qw( SOCK_STREAM );
use Data::UUID;
use Log::Log4perl qw(get_logger :levels);
use Scalar::Util qw(blessed dualvar isweak readonly refaddr reftype tainted
                        weaken isvstring looks_like_number set_prototype);

use biomoleculeMapper;
use strict;
our $CACHE_ADDRESS = "/tmp/networkCache_DVL";
our $ASTERS_ADDRESS = "/tmp/asterStore_DVL";


our $logger = get_logger ("networkMapper");
$logger->level($ERROR);

# TO DO
#    - Add mapperSocket to networkObject
#    
#  *get rid of that  $mapableObject = $dataLayer->{ core };
#  make of uniprot&co heritage of miscDataLayer
#  *get rid of ugly json string (nodewriter)
#    
#    SPECIFICATIONS
#
#  *linkData specs:       IE "richLink_1.0"
#    link : {
#    Adata : [
#             ["Unique identifier for interactor A", ...  ],
#             ["Alternative identifier for interactor A", ...  ],     
#             ["Aliases for A", ...  ],                              
#             ["NCBI Taxonomy identifier for interactor A", ...  ],    
#             ["Biological role A", ...  ],                            
#             ["Experimental role A", ...  ],                          
#             ["Interactor type A", ...  ],                          
#             ["Annotations for interactor A", ...  ],                 
#             ["Xref for interactor A", ...  ],
#             ["Stoichiometry for interactor A"],
#             ["Participant identification method for interactor A"]
#    ],
#    Bdata : [
#                ...  
#                    ],
#    iData : [
#             ["Interaction detection methods", ... ],
#             ["Identifier of the publication", ... ],
#             ["Interaction types", ... ],
#             ["Annotations for the interaction", ... ],
#             ["Parameters of the interaction", ... ],
#             ["Interaction identifier(s)", ... ]
#            ] 
#}   
 
    
#    NODE MAPPING CASE CHECKED
#    acedb : name, type, common
#    uniprot: name, type, commo
    
    
#    NOTE
#    psicquic incoming data name are of the form 
#    database:moleculeID we clean them.
#    if we fail to fetch data from matrixDB we fall back to datalayer.
#    added location => [] attributes in nodemapper from miscDataLayer::uniprot

   

# NOTE TYPE is a simple string  could evolve to encompass more data notably genuine or inferred character    

use lib qw(lib/perl);

use strict;
use Data::Dumper;
use common;
use Ace 1.51;
use Ace::Browser::AceSubs qw(:DEFAULT DoRedirect);
use Ace::Browser::SearchSubs;
use JSON;
use miscDataLayer;
use matrixDB::interactionReport;
use psimi::interactionReport;
use miscAssociationLayer;
use matrixdbQuery;

#
#    This module maps a list of biomolecule and their interactions in a json
#    object embarking required attributes to be used in the networkt javascript module
#    
#
#  ---- networkNodes prototype ----
#   	my $node = {
#            index => scalar [Mandatory]
#	    name => $biomoleculeName,
#            common => "",                                  
#            biofunc => "",
#            tissue => [],
#            uniprotKW => [],
#	    pfam => [],
#            tpm => [],
#	    go => [],
#	    gene => {
#		geneName => [],
#		synonym => [],
#		uniGene => []
#	    }, 	    
#	    specie => "",	    
#            type => "",
#            relationship => {
#		isFragmentOf => [],
#		hasFragment => [],
#		hasComponent => [],
#		isComponentOf => [],
#		boundTo => [] 
#	    },
#            location => [],
#            id = ''
#	};
#
#     ---- networkEdges specifications ----
#     link = {"source":0 ,"target":1, "type" : "boundTo/partOf/fragmentOf/association"},


#    Object constructor
#    biomoleculeArray : list of matrixdb biomolecule identifier; [MANDATORY]
#    interactionArray : list of biomolecule association; [OPTIONAL]
#    AssociationObject (see asssociationObject.pm)
sub new {
        my $self = {};
	my $class = shift;
	bless $self, $class;
	$logger->info("Creating network Mapper");
	my $p = common::arg_parser(@_);	

	$self->{ DB } = $p->{ DB };
	$self->{ nodeDataType } = 'LOCAL';
	# Mappers for node annotations and statistics
	$self->{ socketMappers } = {};
	$self->{ staticMappers } = {};
	# Data array and hash table accessors to it
	$self->{ links } = [];
	$self->{ nodeArray } = [];	
	$self->{ idLinkTable } = {};
	$self->{ nameLinkTable } = {};
	$self->{ idNodeTable } = {};  
	$self->{ nameNodeTable } =  {};  
	$self->{ networkData } = {}; # Statistic data container
	
	defined ($p->{ mappersSocketDef }) && $self->_setSockets ($p->{ mappersSocketDef });
	defined ($p->{ mappersFileDef }) && $self->_setMappers ($p->{ mappersFileDef });
	
	if (!defined($p->{ DB }) ) {
	  $logger->logdie("no valid arguments provided");
	    return;
	  }
#    use a previously save network
	
	if (defined ($p->{ networkUI })) {
	  $self->cacheReader (key => $p->{ networkUI });
	  $self->createNodeAccessors(); # reference node per id key && name
	  $self->createLinkAccessors(); # reference link per id key && name
	    
	    #$self->deleteNodes (nodeNameList => $p->{ delElements }->{ nodes });
	    #$self->pruneLinks ()
	    $self->dumper("/tmp/reloaded");
	    $logger->trace("THIS IS THE CACHE OUT NETWORK\n nodeArray:\n" . Dumper($self->{ nodeArray })   . "\nLinkArray:\n" . Dumper($self->{ links }));
	    defined ($p->{ asterCollection }) && $self->addAsters ($p->{ asterCollection });
	    $self->dumper("/tmp/reloaded2");
	    return $self;
	} 


#    Construct a network from scratch
	if (!common::sloft ($p->{ biomoleculeArray }, $p->{ fromAssocJSON }, $p->{ mergedAssociationObject })) {
	    $logger->logdie ("no valid arguments provided");
	    return;
	}

 	my $biomoleculeArray = [];	
	
	if (defined ($p->{ biomoleculeArray })) {
	  $logger->info("using specified biomolecule names");
	    $biomoleculeArray = $p->{ biomoleculeArray };
	} elsif (defined ($p->{ fromAssocJSON })) {
	    $logger->info("Extracting biomolecules from JSON associations");
	    $biomoleculeArray = $self->_unstackJSON($p->{ fromAssocJSON });	  
	} elsif (defined ($p->{ mergedAssociationObject })) {
	    $logger->info("Extracting biomolecules from association object");
	    $biomoleculeArray = $p->{ mergedAssociationObject }->getInteractorList();
	}
	
#	$self->_cleanPsicquicPrefix($biomoleculeArray);


	$self->_fillingNodes (array => $biomoleculeArray);
	$self->addNodeAttributes(attr => ['id']); # index is required for D3 data elements
	$self->createNodeAccessors(); # reference node per id key && name
	
	(defined ($p->{ mergedAssociationObject })) &&
	    $self->_createLinks (mergedAssociationObject => $p->{ mergedAssociationObject });
	(defined ($p->{ flatInteractionArray })) &&
	    $self->_createLinks (flatInteractionArray => $p->{ flatInteractionArray });
	(defined ($p->{ interactionArray })) &&
	    $self->_createLinks (interactionArray => $p->{ interactionArray });
	
	defined ($p->{ asterCollection }) && $self->addAsters ($p->{ asterCollection });
	return $self;
}
# createLinkAccessors 
#    USE ONLY when network is reloaded from previous
#    otherwise use createLink (push,register)
sub createLinkAccessors {
    my $self = shift;
    for (my $iLink = 0; $iLink < @{ $self->{ links } }; $iLink++ ) {
	my $link =  $self->{ links }->[ $iLink ];
	$logger->trace("reloading register $link->{ source } $link->{ target }");
	$logger->trace("reloading register $self->{ idNodeTable }->{ $link->{ source } }->{ name } " .
		       "$self->{ idNodeTable }->{ $link->{ target } }->{ name }");	
	$self->_registerLink (iID => $link->{ source }, jID => $link->{ target }, iLink => $iLink);
	my $refLink = $self->{ nameLinkTable }->{ $self->{ idNodeTable }->{ $link->{ source } }->{ name } }->{ $self->{ idNodeTable }->{ $link->{ target } }->{ name } };
	$logger->trace("content:\n" . Dumper($refLink));
    }
}

sub createNodeAccessors {
    my $self = shift;
    my $IDaccessor = {};
    my $nameAccessor = {};
    foreach my $node (@{$self->{ nodeArray }}) {
        if (!defined ($node->{ id })) {
	    $logger->error("current node does not have id attribute");	    
	    return;
	}	
        # should check name existence too
	(common::slid ($IDaccessor->{ $node->{ id }}, $nameAccessor->{ $node->{ name } })) &&
	    $logger->logdie("Redundancy found while setting quick accessor for node:\n" .
			    Dumper($node) );
	$IDaccessor->{ $node->{ id }} = $node;	
	$nameAccessor->{ $node->{ name }} = $node;
    }
    
    $logger->trace("ID accessor set");
    $self->{ idNodeTable } = $IDaccessor;  
    $self->{ nameNodeTable } = $nameAccessor;  
 
}

#set up a non redundant list of biomolecule if a matrixdb key is possible we keep it
#    for all other acases we keep the external source reference
sub _unstackJSON {
    my $self = shift;
    my $jsonStringAssociation = shift;
    
    my $jsonObject = decode_json($jsonStringAssociation);
    
    $logger->trace("json association to unstack holds  ". scalar (@{$jsonObject->{ aaData }}) .  " elements :\n" . Dumper($jsonObject));
 
  
    my $biomoleculeList = [];
    foreach my $assoc (@{$jsonObject->{ aaData }} ) {
	foreach my $i ( 0, 5) {
	    my $name = $self->{ nameMutator }->mutateToMatrixdb(key => $assoc->[$i]);
	    common::listExist ($biomoleculeList, $name) && next;	    
	    push @{$biomoleculeList}, $name;
	}
    }
    $logger->info("Partner list extraction from JSON Association done");
    
    $logger->trace("unstack biomolecule list holds " . scalar(@{$biomoleculeList}) . " elements:\n" . Dumper($biomoleculeList) );
    
    return $biomoleculeList;
}


sub _setSockets {
    my $self = shift;
    my $socketDef = shift;
    
    $logger->info("reading socket mappers definition");
    my $info = "";
    foreach my $key (keys(%{$socketDef})) {
	my $socketPath = $socketDef->{ $key };
	$logger->info("$key socket : using Socket $socketPath");
	$self->{ socketMappers }->{ $key } = IO::Socket::UNIX->new(
	    Type => SOCK_STREAM,
	    Peer => $socketPath,
	    )
	    or $logger->logdie("Can't connect to server: $!");
	$info .= " $key ";
    }	
    
    $logger->info("successfully set [$info] sockets");    
}

#mapper can be static (hash table) --> store under staticMapper attribute
#    or objects -> base attribute of their own
sub _setMappers {
    my $self = shift;
    my $fileDef = shift;
    $logger->info("reading mappers file definition");
    my $info = "";
    foreach my $key (keys(%{$fileDef})) {
	if ($key eq "nameMutator") { 
	    $self->{ nameMutator } = biomoleculeMapper->new(template => $fileDef->{ $key });    
	    $logger->trace("name mutator successfully read from $fileDef->{ $key }");
	    next;	   
	}
	
	my $file = $fileDef->{ $key };
	open MAP, "<$file" or die $!;
	my $mapText = <MAP>;
	close MAP;    
	$self->{ staticMappers }->{ $key } = decode_json ($mapText);
    	$info .= " $key ";
    }	
    
    $logger->info("successfully set [$info] tree mappers");   
}

sub _pushLink {
    my $self = shift;
    my ($iName, $jName) = @_;
    my @list;
    my $regularName = $self->{ nameMutator }->mutateToRegular(key => $iName);
#    my $i = $self->getNodeIndex (name => $regularName);
    my $i = $self->{ nameNodeTable }->{ $regularName }->{ id };
    defined ($i) || $logger->logdie("Error no node index found for $regularName ($iName)");
    $logger->trace("index found for $regularName is $i");
    $regularName = $self->{ nameMutator }->mutateToRegular(key => $jName);
#    my $j = $self->getNodeIndex (name => $regularName);
    my $j = $self->{ nameNodeTable }->{ $regularName }->{ id };
    defined ($j) || $logger->logdie("Error no node index found for $regularName ($jName)");
    $logger->trace("index found for $regularName is $j");
    my $id = scalar(@{$self->{ links }});
    push @{$self->{ links }}, {
	id => $id,
	source => common::min ($i, $j),
	target => common::max ($i, $j),
	type => "association" # boundTo/partOf/fragmentOf/association
    };
    $self->_registerLink(iID => $i, jID => $j);
   # $logger->trace($list[0] . " - " . $list[1] . " LINK created");
}

# delete the database psicquic prefix
sub _cleanPsicquicPrefix {
    my $self = shift;
    my $arrayRef = shift;
    
    for (my $i = 0; $i < @{$arrayRef}; $i++) {
	$logger->trace("PSQPFX $arrayRef->[$i]");
	if ($arrayRef->[$i] =~ /CHEBI/) {
	    $arrayRef->[$i] =~ s/^.*(CHEBI:[\d]+).*$/$1/;
	    next;
	}
	$arrayRef->[$i] =~ s/^[^:]+://;
    }
}


sub _isKnownLink {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    if (common::slid($p->{ iID }, $p->{ jID })) {
	defined ($self->{ idLinkTable }->{ $p->{ iID } }->{ $p->{ jID } }) && return 1;
    } elsif (common::slid($p->{ iName }, $p->{ jName })) {
	defined ($self->{ nameLinkTable }->{ $p->{ iName } }->{ $p->{ jName } }) && return 1;
    } elsif (common::slid($p->{ iNode }, $p->{ jNode }) ) {
	defined ($self->{ nameLinkTable }->{ $p->{ iNode }->{ name } }->{ $p->{ jNode }->{ name } }) && return 1;
    }
    
    return 0;
}


sub _getLink {
    my $self = shift;
    my $p = common::arg_parser (@_);
    my $link;
    if (common::slid($p->{ iID }, $p->{ jID })) {
	$link = $self->{ idLinkTable }->{ $p->{ iID } }->{ $p->{ jID } };
	return $link;
    } elsif (common::slid($p->{ iName }, $p->{ jName })) {
	$link = $self->{ nameLinkTable }->{ $p->{ iName } }->{ $p->{ jName } };
	return $link;
    } elsif (common::slid($p->{ iNode }, $p->{ jNode }) ) {
	$link = $self->{ nameLinkTable }->{ $p->{ iNode }->{ name } }->{ $p->{ jNode }->{ name } };
	return $link;
    }
    
    $logger->error("Don't know how to get asked link, you provided:\n". Dumper($p));
    return;
}


# Create the basic source, target (int) attributes of each link
#     Also create a LinkTable referencing all knwon links
sub _createLinks {
    my $self = shift;   
    my $p = common::arg_parser (@_);
    
    if (defined ($p->{ mergedAssociationObject })) { # container defined in mergedAssociation.pm
	$logger->info("Creating links using mergedAssociationObject");
	my $partnerPairList = $p->{ mergedAssociationObject }->getInteractorPairedList();	
	foreach my $partnerArray (@{$partnerPairList}) {
	    $logger->trace("i would like to create $partnerArray->[0]<>$partnerArray->[1]");
	    $self->_pushLink($partnerArray->[0], $partnerArray->[1]);	    
	}
	$logger->info("managed to populate a now " . scalar (@{$self->{ links }}) . " link attributes");
	return;	
    }   
    
    if (defined ($p->{ interactionArray })) { # container defined in interactionReport.pm
	foreach my $interactor (@{$p->{ interactionArray }}) {
	    foreach my $partnerArray (@{$interactor->{ associations }} ) {
		$self->_pushLink($partnerArray->[0], $partnerArray->[1]);	    		
	    }
	}	
	warn "managed to create a " . scalar (@{$self->{ links }}) . " link attributes";
	return;	
    }   
    
    if (defined ($p->{ flatInteractionArray })) { # container defined in interactionReport.pm
	foreach my $partnerArray (@{$p->{ flatInteractionArray }} ) {	    
	    $self->_pushLink($partnerArray->[0], $partnerArray->[1]);
	}
	warn "managed to create a " . scalar (@{$self->{ links }}) . " link attributes";
	return;	
    } 
    
}
# _registerLink Populates the $self->{ idLinkTable }, $self->{ nameLinkTable } attributes
#    An optional argument iLink can be specified to reference a link somewhere in the linkArray
#    otherwise the referenced link will be the last in the linkArray
sub _registerLink {
    my $self = shift;
    my $p = common::arg_parser(@_);
    my $i = $p->{ iID };
    my $j = $p->{ jID };
    my $iLink = defined ( $p->{ iLink } ) ? $p->{ iLink } : scalar(@{$self->{ links }}) - 1;
    
    my $iNode =  $self->{ idNodeTable }->{ $i };
    my $jNode =  $self->{ idNodeTable }->{ $j };
#    defined($iNode) || $logger->logdie("--->empty idnodeTable for id $i:\n". Dumper($self->{ idNodeTable }) );
#    defined($jNode) || $logger->logdie("--->empty idnodeTable for id $j:\n". Dumper($self->{ idNodeTable }) );
    
    
    my $iName = $self->{ nameMutator }->mutateToRegular (key => $iNode->{ name });
    my $jName = $self->{ nameMutator }->mutateToRegular (key => $jNode->{ name });
    
    $logger->trace(" i will add link $iName <> $jName");
    
    if (! defined ($self->{ idLinkTable }->{ $iNode->{ id } })) {
	$self->{ idLinkTable }->{ $iNode->{ id } } = { };
    } 
    $self->{ idLinkTable }->{ $iNode->{ id } }->{ $jNode->{ id } } =  $self->{ links }->[ $iLink ];

    if (! defined ($self->{ idLinkTable }->{ $jNode->{ id } })) {
	$self->{ idLinkTable }->{ $jNode->{ id } } = { };
    }
    $self->{ idLinkTable }->{ $jNode->{ id } }->{ $iNode->{ id } } = $self->{ links }->[ $iLink ];
    
    if (! defined ($self->{ nameLinkTable }->{ $iName })) {
	$self->{ nameLinkTable }->{ $iName } = { };
    } 
    $self->{ nameLinkTable }->{ $iName }->{ $jName } =  $self->{ links }->[ $iLink ];

    if (! defined ($self->{ nameLinkTable }->{ $jName })) {
	$self->{ nameLinkTable }->{ $jName } = { };
    }
    $self->{ nameLinkTable }->{ $jName }->{ $iName } = $self->{ links }->[ $iLink ];

}

# _jsonNodeNameFixer
#A HACK TO RETURN STANDARD BIOMOLECULE NAME
#create a hash table referencing a node by both its name and ist aceAccessor (if any)
#then we loop over partner names in json data list aaData and replace any string by
#the actual name of the node referenced through this string
sub _jsonNodeNameFixer {
    my $self = shift;
    my $p = common::arg_parser (@_);
 
    my $target = $p->{ jsonString };
    
    $logger->warn("JSME::\n".$target);
    
    my $dataContainer = decode_json($target);    
    for (my $i = 0; $i < @{$dataContainer->{ aaData } }; $i++){
	for my $j (0,5) {
	    my $name = $self->{ nameMutator }->mutateToRegular (key => $dataContainer->{ aaData }->[$i]->[$j]);
	    $logger->trace("Proposed correction[col $j] " . 
			   $dataContainer->{ aaData }->[$i]->[$j] .
			   " --> $name");
	    $dataContainer->{ aaData }->[$i]->[$j] = $name;
	}
    }
    $target = encode_json($dataContainer);

   
    return $target

}

sub _jsonNodeNameFixerOld {
    my $self = shift;
    my $p = common::arg_parser (@_);

    my $target = $p->{ jsonString };
    
    
    my $shortCutNodePool = {};
    foreach my $node (@{$self->{ nodeArray }}) {
	$shortCutNodePool->{ $node->{ name } } = $node;
	if ($node->{ aceAccessor } =~ /[\S]+/) {
	    $shortCutNodePool->{ $node->{ aceAccessor } } = $node;
	}
    }
    $logger->trace("shortCut node pool:\n" . Dumper($shortCutNodePool));
    
    $logger->trace("Trying to load json object");
    my $dataContainer = decode_json($target);
    $logger->trace(Dumper($dataContainer));
    $logger->trace("Loading ok attempting to fix deprecated biomolecule name");
    for (my $i = 0; $i < @{$dataContainer->{ aaData } }; $i++){
	for my $j (0,5) {
	    my $name = $dataContainer->{ aaData }->[$i]->[$j];
	    my $altName = $shortCutNodePool->{ $name }->{ name };
	    $logger->trace("Proposed correction[col $j] $name --> $altName");
	    $dataContainer->{ aaData }->[$i]->[$j] = defined ($altName) ? $altName : $name;
	}
    }
    
    $target = encode_json($dataContainer);

    return $target
}

# addTo inject network description in a json object

sub addTo {
    my $self = shift;
    my $p = common::arg_parser(@_);
    

    if ($p->{ format } eq 'JSON') {
	my $jsonData = $self->getJSON ();
	
	my $targetJsonString = $p->{ target };
	$targetJsonString =~ s/}[\n\s]*$/,\n"network" : $jsonData\n}\n/;


	if (common::listExist($p->{ options }), 'nodeNameFixer') {
	    $targetJsonString = $self->_jsonNodeNameFixer( jsonString => $targetJsonString );
	}
	
	return $targetJsonString;
    }
  
}


#	index => sub {
#	    my $node = shift;
#	    my $key = shift;
#	    ($node->{ $key } ne "") || return "";
#	    return "\"$key\" : $node->{ $key },";
#	},

sub summonLocalNodeWriter {
# nodes
    my $nodeWriter = {
	name => sub {
	    my $node = shift;
	    my $key = shift;
	    ($node->{ $key } ne "") || return "";
	    return "\"$key\" : \"$node->{ $key }\",";
	},
	id => sub {
	    my $node = shift;
	    my $key = shift;
	    ($node->{ $key } ne "") || return "";
	    return "\"$key\" : $node->{ $key },";
	},
	common => sub {
	    my $node = shift;
	    my $key = shift;
	    ($node->{ $key } ne "") || return "";
	    return "\"$key\" : \"$node->{ $key }\",";
	},
	biofunc => sub {
	    my $node = shift;
	    my $key = shift;
			($node->{ $key } ne "") || return "";
	    return "\"$key\" : \"$node->{ $key }\",";                            # Partially tested
	},
	tissue =>  sub {
	    my $node = shift;
	    my $key = shift;
	    (@{$node->{ $key }} > 0) || return "";	 
	    return "\"$key\" : [\"" .  join ('","', @{$node->{ $key }}) . "\"],";
	},
	uniprotKW => sub {
	    my $node = shift;
	    my $key = shift;
	    (@{$node->{ $key }} > 0) || return "";
	    return "\"$key\" : [\"" . join ('","', @{$node->{ $key }}) . "\"],";
	},
	pfam =>  sub {
	    my $node = shift;
	    my $key = shift;
	    (@{$node->{ $key }} > 0) || return "";
	    return "\"$key\" : [\"" . join ('","', @{$node->{ $key }}) . "\"],";
	},
	tpm => sub {
	    my $node = shift;
	    my $key = shift;
	    (@{$node->{ $key }} > 0) || return "";
	    return "\"$key\" : [\"" .  join ('","', @{$node->{ $key }}) . "\"],";
	},
	go => sub {
	    my $node = shift;
	    my $key = shift;
	    (@{$node->{ $key }} > 0) || return "";
	    my $string = encode_json ($node->{ $key });
	    return "\"$key\": $string,";
	},
	gene => sub {
	    my $node = shift;
	    my $key = shift;
	    my $string = "";
	    for my $kw (qw /geneName synonym uniGene/) {
		(@{$node->{ $key }->{ $kw }} > 0) || return "";
		$string .= "\"$kw\":[\"" . join ('","', @{$node->{ $key }->{ $kw }}) . "\"],"; 
	    }
	    ($string eq "") && return $string;
	    $string =~ s/,$//;
	    return "\"$key\" : { $string },";
	},
	specie => sub {
	    my $node = shift;
	    my $key = shift;
	    ($node->{ $key } ne "") || return "";
	    return "\"$key\" : \"$node->{ $key }\",";
	},
	type => sub {
	    my $node = shift;
	    my $key = shift;	    
	    ($node->{ $key } ne "") || return "";
	    return "\"$key\" : \"$node->{ $key }\",";	    
	},
	relationship => sub {
	    my $node = shift;
	    my $key = shift;
	    my $string = "";
	    for my $kw (qw /isFragmentOf hasFragment hasComponent isComponentOf boundTo/) {
		(@{$node->{ $key }->{ $kw }} > 0) || return "";
		$string .= "\"$kw\":[\"" .  join ('","', @{$node->{ $key }->{ $kw }}) . "\"],"; 
	    }
	    ($string eq "") && return $string;
	    $string =~ s/,$//;
	    return "\"$key\" : { $string },";
	}
    };
    return $nodeWriter;
}

sub getJSON {
    my $self = shift;

    my $nodeWriter;
    if ($self->{ nodeDataType } eq 'LOCAL') { 
        $nodeWriter = summonLocalNodeWriter ();
    }
    if (! defined ($self->{ UItag })) {
	$self->setUID();
    }
    
    my $jsonData = "\"id\" : \"" . $self->{ UItag } . "\",\"nodeData\" : [";
    foreach my $node (@{$self->{ nodeArray }}) {
	my $nodeAsString;
	foreach my $key (qw /name id common biofunc tissue uniprotKW pfam tpm go gene specie type relationship/) {
	    my $tmp .= $nodeWriter->{ $key }($node, $key);
	    $tmp eq "" && next;
	    $nodeAsString .= $tmp;
	}
	$nodeAsString =~ s/,$//;
	$jsonData .= "{$nodeAsString},\n";
    }
    $jsonData =~ s/,\n$/\n]\n/;
    if (@{$self->{ nodeArray }} == 0) {
	$jsonData = "\"nodeData\" : []\n";
    }
    # Add links
    if (@{$self->{ links }} > 0) {
	my $linkAsJSON = encode_json ($self->{ links });

	$linkAsJSON =~ s/("source":|"target":)"([\d]+)"/$1$2/g;


	$jsonData .= ",\"linksData\" : $linkAsJSON\n";	
    } else {
	$jsonData .= ",\"linksData\" : []\n";	
    }

    my @tmp;   
    foreach my $key (qw/upKeywordTree goKeywordTree/) {
	if (defined($self->{ networkData }->{ $key })) {
	    push @tmp, encode_json ($self->{ networkData }->{ $key }); 
	}	
    }
    $jsonData = @tmp > 0  ne "" ? "{$jsonData, \"networkData\" : [ ". join (",", @tmp) .  " ]}" : "{$jsonData, \"networkData\" : [] }";
    
    return $jsonData;
}

sub _extractInteractorName {
    my $self = shift;
    my $jsonObject = shift @_;

 #   open DBG, ">/tmp/jsonExtracter.dbg";
    my $dataContainer = decode_json($jsonObject);
  #  print DBG Dumper($dataContainer) . "\n";
 
   

  
    my @list;
    foreach my $assoc (@{$dataContainer->{ aaData }}) {
	push @list, $assoc->[0];
	push @list, $assoc->[5];
    }
    my $refArray = common::uniqList (\@list);
    
  #  print DBG Dumper($refArray);
  #  close DBG;
    return $refArray;
    #my @array = ($jsonObject)
}

# deleteLinks
#    All links will be deleted but for one specified as argument
sub deleteLinks {
    my $self = shift;
    my $p = common::arg_parser(@_);

    my @nLinkArray;
    my $partnerPairList = $p->{ forceAssociationKeep }->getInteractorPairedList();	

    foreach my $partnerArray (@{ $partnerPairList }) {
	my $link = $self->{ nameLinkTable }->{ $partnerArray->[0] }->{ $partnerArray->[1] };
	if (!defined ($link) ) {
	    $logger->error("$partnerArray->[0] $partnerArray->[1] association not found in table");
	    next;
	}
	push @nLinkArray, $link;	
    }

    $logger->trace("deleted links array holds " . scalar(@nLinkArray) . " elements");
    $self->{ links } = \@nLinkArray;
}


# pruneLinks
#    suppress link for which the source and / or the target node are not in the node list anymore    

sub pruneLinks {
    my $self = shift;
    
    my $newLinkList = [];


    $logger->trace(" ID ACCESSOR STATE:\n" . Dumper ($self->{ idNodeTable }));
    
    foreach my $pLink (@{ $self->{ links } }) {
	my $cnt = 0;
	foreach my $iKey (qw /source target/) {
	    my $nodeID = $pLink->{ $iKey };
	    $cnt = $self->{ idNodeTable }->{ $nodeID }->{ status } eq "active" ? $cnt + 1 : $cnt;
	}
	($cnt > 0) && push @{$newLinkList}, $pLink;
    }
    
    $logger->trace ("link pruning from " . scalar (@{ $self->{ links } }) . " to "
		    .  scalar (@{$newLinkList}) . " link elements");
    
    $self->{ links } = $newLinkList;    
}

# deleteNodes
#    suppress a subset of nodes
#    options can be specified to keep rest of the object intact
#    we do not alter IDaccessor key will stiull exist but value will be undef
sub deleteNodes {
    my $self = shift;
    my $p = common::arg_parser (@_);
    $logger->trace("TIMEprofile:(start)");     

    defined ($p->{ nodeNameList }) || die "missing parameters (node name list)";
    
    my @indexList;
    foreach my $name (@{ $p->{ nodeNameList }}) {
	my $i = $self->getNodeIndex (name => $name);
	if (!defined ($i)) {
	    $logger->error("deletable node named \"$name\" not found in current network!");
	    next;
	}
	push @indexList, $i; 
    }
    $logger->trace ("node index to delete [@indexList] (" .scalar (@indexList) . " elements)");
    my @descendingIndexList = sort { $b <=> $a } @indexList;
    
    $logger->trace("prior to deletion " . scalar (@{ $self->{ nodeArray }}));
    foreach my $index (@descendingIndexList) {
	$logger->trace("splicing at index $index ($self->{ nodeArray }->[$index]->{ name })");
	$self->{ nodeArray }->[$index]->{ status } = "removed";	    	
	splice (@{$self->{ nodeArray }}, $index, 1);	
    }
    $logger->trace("post deletion " . scalar (@{ $self->{ nodeArray }}));
    
    (common::listExist($p->{ options }, 'unTouchAll')) &&
	$logger->info("deleted " . scalar (@descendingIndexList) . " node and left the indexing intact");
    
    $logger->trace("TIMEprofile:(exit)");         
}

sub deleteAllNodes {
    my $self = shift;
#   for (my $index = 0; $index < @{ $self->{ nodeArray } }; $index++) {
#	$self->{ nodeArray }->[$index]->{ status } = "removed";	    	
#	splice (@{$self->{ nodeArray }}, $index, 1);	
#    }
    $self->{ nodeArray } = [];
    $logger->trace("post deletion " . scalar (@{ $self->{ nodeArray }}));
}



#    fill Go terms datastructure
sub getFreeID {
    my $self  = shift;

    my $i = 0;

    foreach my $node (@{$self->{ nodeArray }}) {
	if (!defined ($node->{ id })) {
	    $logger->error("current node does not have id attribute");	    
	    next;
	}
	$i = $i < $node->{ id } ? $node->{ id } + 1 : $i;
    }
    
    return $i;
}
# update method
#    inject and annotate the new nodes and link DEVEL HERE
sub update {
    my $self = shift;
    my $p = common::arg_parser(@_);
    $logger->trace("Starting update");
    $logger->trace (Dumper($p->{ mergedAssociationObject }));    
    my $newData = $p->{ mergedAssociationObject };
    
    my $nodeNameToAdd = [];
    my $offset = scalar (@{$self->{ nodeArray }});
    my $ID = $self->getFreeID();
    my $list = $self->getNodeNameList();
    $logger->trace("previous network name node list (Free $ID )\n".Dumper($list) );
    foreach my $name (@{ $newData->{ interactorList } }) {
	if (defined ($self->{ nameNodeTable }->{ $name })) {
	    $logger->error("$name is already part of the network");
	    next;
	}
	if (common::listExist ($p->{ delElements }, $name )) {
	    $logger->error("$name is part of deleted nodes");
	    next;
	}

	$logger->trace("Adding $name to network");
	push @{ $nodeNameToAdd }, $name; 
    }
    
#    $logger->trace("Following node names are to update in network:\n" . Dumper($nodeNameToAdd));
    $self->_fillingNodes (array => $nodeNameToAdd);

    $logger->trace("referencing nodes\n");
    # reference the new node
    for (my $iNode = $offset; $iNode < scalar (@{$self->{ nodeArray }}); $iNode++) {
	my $cNode = $self->{ nodeArray }->[$iNode];
	$self->{ idNodeTable }->{ $ID } = $cNode;
	$self->{ nameNodeTable }->{ $cNode->{ name } } = $cNode;
	$logger->trace("new node named $cNode->{ name } is assigned id $ID");
	$cNode->{ id } = $ID;
	$ID++;
    }
    
    $logger->trace("referencing links (" . scalar (@{ $newData->{ mergedAssociationList } }) . ")\n");    
    foreach my $nLink (@{ $newData->{ mergedAssociationList } }) {
	my $iName = $self->{ nameMutator }->mutateToRegular(key => $nLink->{ formedBy }->[0]);
	my $jName = $self->{ nameMutator }->mutateToRegular(key => $nLink->{ formedBy }->[1]);
	
	if ( common::listExist($p->{ delElements }, $iName) ||
	     common::listExist($p->{ delElements }, $jName)
	     ) {
	    $logger->warn("Association lays a deleted interactor\n". Dumper ($nLink));
	    next;
	}
	if ( $self->_isKnownLink(iName => $iName, jName => $jName)) {
	    $logger->warn("Association already part of the network:\n". Dumper ($nLink));
	    next;
	}
	my $iID = $self->{ nameNodeTable }->{ $iName }->{ id };
	my $jID = $self->{ nameNodeTable }->{ $jName }->{ id };
	$logger->trace("Trying to register $iName:\n" . Dumper($self->{ nameNodeTable }->{ $iName }));
	$logger->trace("Trying to register $jName:\n" . Dumper($self->{ nameNodeTable }->{ $jName }));
	
	$self->_pushLink($iName, $jName);
    }        
    $self->dumper("/tmp/priorToAsterAddition");
    defined ($p->{ asterCollection }) && $self->addAsters ($p->{ asterCollection });
    $self->dumper("/tmp/afterAsterAddition");

    return $self;
}

sub computeStatistics {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    if (common::listExist($p->{ options }, 'reset')) {
	$self->computeUpKeywordTree ();
	return;
    }
    
    if (defined ($self->{ networkData }->{ upKeywordTree } )) {
	$logger->info("Uniprot keywork tree found, updating it");
    } else {
	$self->computeUpKeywordTree ();
    }
    
}

sub computeUpKeywordTree {
    my $self = shift;
    
    # access uniprot classification mapper
    my $mapperRoot = $self->{ staticMappers }->{ UniprotKW };
    
    $self->{ networkData }->{ upKeywordTree } = {
	name => 'Uniprot Keyword category',
	children => []	
    };    
    
    foreach my $category (@{$mapperRoot->{ children }}) {
	my $node = {
	    name => $category->{ name },
	    children => [],
	    memberID => []}
	;
	my @tmp;
	foreach my $upKW (@{$category->{ children }}) {
	    $upKW->{ memberID } = [];
	    $upKW->{ memberRef } = [];
	    
	    foreach my $node (@{$self->{ nodeArray }}) {
		if (common::listExist ($node->{ uniprotKW }, $upKW->{ AC })) {
		    push @{$upKW->{ memberID }}, $node->{ id }; 
		    push @tmp, $node->{ id };
		}
	    }
	    (@{$upKW->{ memberID }} == 0) && next;
 	    push @{$node->{ children }}, $upKW;
	}	
	
	$node->{ memberID } = common::uniqList (\@tmp);
	push @{$self->{ networkData }->{ upKeywordTree }->{ children }}, $node;
    }

    $logger->trace("TIMEprofile:(exit)");     
    $logger->info("uniprot Keyword Tree Mapper Data structure\n" 
		  . Dumper($self->{ networkData }->{ upKeywordTree }));

}


#    return a datastructure sorting all uniprot keyword occurences
#    preprocessing for the client navigator
sub getUpKeywordTree {
    my $self = shift;
    defined ($self->{ networkData }->{ upKeywordTree }) && return $self->{ networkData }->{ upKeywordTree }; 

    $logger->error ("accessing network element for an uncomputed uniprot Keyword metadata");
    return;
}



# fill all biomolecule related fields
#    TODO : miscDataLayer fall back failure, handle/skip the data mapping
sub _fillingNodes {
    my $self = shift;
    my $p = common::arg_parser (@_);
    my $biomoleculeList = $p->{ array };
    my $sTime = common::getTime();
    $logger->trace("Starting the filling of " . scalar (@{$biomoleculeList}) . " nodes\n" . Dumper ($biomoleculeList));     
   
    
    my $cnt = 0;
    foreach my $biomoleculeName (@{$biomoleculeList}) {
	$cnt++;
	# the target container
	my $node = {
	    name => '',
	    aceAccessor => '', # for meta types
            common => "",                                  # Partially tested
            biofunc => "",
            tissue => [],
            uniprotKW => [],                               # now a list of {id:"", term:""}
	    pfam => [],
            tpm => [],
	    go => [],                                      # now a list of {id:"", term:""}
	    gene => {
		geneName => [],
		synonym => [],
		uniGene => []
	    }, 	    
	    specie => "",	    
            type => "",
            relationship => {
		isFragmentOf => [],
		hasFragment => [],
		hasComponent => [],
		isComponentOf => [],
		boundTo => [] 
	    },
	    id => ""
	};
	# Set the original object and summon its mapper
	my $mapper = summonLocalDataMapper();
	$logger->info("MOBY" . Dumper($mapper));
	$biomoleculeName = $self->{ nameMutator }->mutateToMatrixdb (key => $biomoleculeName);

	my @tmpAceObjects = $self->{ DB }->fetch (-query => "query find biomolecule $biomoleculeName");
	my $aceObject = scalar(@tmpAceObjects) > 0 ? shift @tmpAceObjects : undef;

	my $mapableObject;
	$logger->info("mapping data for node named $biomoleculeName");

	# We should not have to mutate molecule name to regular
	if (!defined ($aceObject)){
	    $logger->warn("no ace object fetched for NODE \"$biomoleculeName\" try to fall back to miscDataLayer");	  
	    my $dataLayer = miscDataLayer->new(name => $biomoleculeName);	    
	    defined ($dataLayer) 
		? $logger->warn ("successfully fetch Object named \"$biomoleculeName\" from miscDatalayer")
		: $logger->warn ("was unable to fetch Object named \"$biomoleculeName\" from miscDatalayer");
	    $mapper = $dataLayer->summonDataMapper(template => $node);
	    $mapableObject = $dataLayer->getCoreObject();
	} else {
	    $mapableObject = $aceObject;
	}
	
	$logger->trace("index num $cnt \"$biomoleculeName\"");

	$self->_setNodeIdentity(node => $node, string => $biomoleculeName, 
				dataObject => $mapableObject);
	
	# Fill the container
	foreach my $key (keys (%{$node}))  {
	    
	    ($key ne "common"    && $key ne "biofunc" &&
	     $key ne "uniprotKW" && $key ne "go"      && 
	     $key ne "tissue" ) && next; ## developement purpose
	    
	    ($key eq "name" || $key eq "aceAccessor" || $key eq "type" || 
	     $key eq "specie" || $key eq "tpm" || $key eq "tissue")  && next;
	    $logger->trace("$node->{ name } ". $key);
	    $node->{ $key } = $mapper->{ $key }($mapableObject);
	    
	    $logger->info("ATTEMPTING TO FILL " . $key);
	    
	}

	# Deal with the go and uniprot hash table
	my @goContainerList = ();
	foreach my $term (@{$node->{ 'go' }}) {
	    if ($term !~ /GO:[\d]+/) {
		$logger->warn ("Not at valid GO term \"$term\" involved data structure is \n" . Dumper($node));
		next;
	      }
	    my $goContainer = localSocket::runGoRequest(with => $self->{ socketMappers }->{ 'GO' }, 
							type => 'goNodeSelector', selectors => { id => $term });
	    defined $goContainer || next;
	    push @goContainerList, $goContainer;
	}
	$node-> { 'go' } = \@goContainerList;
	
	$logger->trace("node Lookup\n". Dumper ($node));

	# NOTE TYPE is a simple string  could evolve to encompass more data notably genuine or inferred character
	if ($node->{ name } =~ /^MULT/) {
	    $node->{ type } = 'multimer'; 
	} elsif ($node->{ name } =~ /^CAT/) {
	    $node->{ type } = 'cation'; 
	} elsif ($node->{ name } =~ /^PFRAG/) {
	    $node->{ type } = 'fragment'; 
	} elsif ($node->{ name } =~ /^LIP/) {
	    $node->{ type } = 'lipid'; 
	} elsif ($node->{ name } =~ /^GAG/) {
	    $node->{ type } = 'glycosaminoglycan'; 
	} else {
	    $node->{ type } = 'biomolecule'; 
	}	
	# Store the node
	$node->{ status } = 'active';
	push @{$self->{ nodeArray }}, $node;	
    }

    $logger->trace("filled node array content:\n" . Dumper ($self->{ nodeArray }));
    
    $logger->trace("subroutine time stamps:\n\tstart:$sTime\n\tstop:".common::getTime());
    
}

# LocalMapper(MATRIXDB STORAGE)
#    attribute must match canonical node attributes
    
sub summonLocalDataMapper {
    my $localMapper = {
	aceAccessor => sub {
	    my $aceObject = shift @_;
	    foreach my $string (qw/Molecule_Processing CheBI_identifier EBI_xref/) {
		my ($val) = $aceObject->get($string);
		(defined($val)) && return $val;
	    }
	    return '';
	},
	common => sub {
	    my $aceObject = shift @_;
	    my $map = "";
	    foreach my $string (qw/Multimer_Name Other_Multimer_Name FragmentName Other_Fragment_Name Common_Name Other_Name/) {
		my ($val) = $aceObject->get($string);
		if (defined($val)) {
		    $map .= "$val, ";
		}
	    }
	    $map =~ s/, $//;
	    return $map;
	},
	biofunc => sub {
	    my $aceObject = shift @_;
	    my $map = "";
	    foreach my $string (qw/Function/) {		
		my ($val) = $aceObject->get($string);
		if (defined($val)) {
		    $map .= "$val, ";
		}
	    }
	    $map =~ s/, $//;
	    return $map;
	},
	uniprotKW => sub {
	    my $aceObject = shift @_;
	    my @val = $aceObject->get('Keywrd');
	    $logger->info("UNIPROT KEYWORD " . $aceObject->name  . "\n" . Dumper(@val));
	    my @array;
	    foreach my $kw (@val) {
		push @array, $kw->name;
	    }
	    return \@array;
	},
	go => sub {
	    my $aceObject = shift @_;
	    return [];  # Debugging purpose
	    my @val = $aceObject->get('GO');
	    my @array;
	    foreach my $go (@val) {
		push @array, $go->name;
	    }
	    return \@array;	   
	},
	pfam => sub {
	    my $aceObject = shift @_;
	    my @val = $aceObject->get('Pfam');
	    my @array;
	    foreach my $dom (@val) {
		push @array, $dom->name;
	    }
	    return \@array;	    
	},
	relationship => sub {
	    my $aceObject = shift @_;

	    my $miniMap = { # aceDB key => network key
		Belongs_to => "isFragmentOf",
		ContainsFragment => "hasFragment",
		Component => "hasComponent",
		In_multimer => "isComponentOf",
		Bound_Coval_to => "boundTo" 		    
	    };
	    my $container = {
		isFragmentOf => [],
		hasFragment => [],
		hasComponent => [],
		isComponentOf => [],
		boundTo => [] 	
	    };
	    
	    my ($subTree) = $aceObject->at('Relationships');
	    while (defined ($subTree)) {
		my @col = $subTree->col(); 		
		foreach my $val (@col) {
		    push @{$container->{ $miniMap->{ $subTree->name } }}, $val->name;
		}		
		$subTree = $subTree->down();
	    }	    
	    return $container;
	},
	gene => sub {	  
	    my $aceObject = shift @_;
	    my $container = {
		geneName => [],
		synonym => [],
		uniGene => []
	    };
	    warn "geneseeker " . $aceObject->name;
	    foreach my $geneTag (keys (%{$container})) { #
		my $subTree = $aceObject->get($geneTag);
		(defined ($subTree)) || next;
		warn "$geneTag SubFound::" . $subTree->asAce();
		my @col = $subTree->col();		
		foreach my $val (@col) {
		    push @{$container->{ $geneTag }}, $val->name;
		}
	    }	    
	    return $container;
	}

    };
    
    return $localMapper;
}


sub getNodeIndex {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    (defined ($p->{ name })) || return;
    
    

    my $i = 0;
    my @buffer;
    foreach my $node (@{$self->{ nodeArray }}) {
#	$logger->trace("(" . $p->{ name } . ") iam looking at " . Dumper($node));
	push @buffer, $node->{ name };
	($p->{ name } eq $node->{ name } ) && return $i;
	$i++;
    }


    $logger->error("node index not found for $p->{ name }\nfaced node name list was:\n"
		  . Dumper(@buffer));
    
    return; 
}


sub addNodeAttributes {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    foreach my $option (@{ $p->{ attr } }) {
	if ($option eq "id") {
	    foreach my $node (@{$self->{ nodeArray }}) {
		$node->{ id } = $self->getNodeIndex (name => $node->{ name });
	    }	
	}
    }
    
}

sub getNodeNameList {
     my $self = shift;
    
     my $nameList = [];
     foreach my $node (@{$self->{ nodeArray }}) {
	 push @{$nameList},  $node->{ name };
     }
     
     return $nameList;
}

sub getLinkInteractorList {
    my $self = shift;
    
    my $nameList = [];
    foreach my $link (@{$self->{ links }}) {
	my $node = $self->getNodeAsID (id => $link->{ source });
	my $molA = $node->{ name };	
	$node = $self->getNodeAsID (id => $link->{ target });
	my $molB = $node->{ name };
	push @{$nameList}, [$molA, $molB];
    }
    
    return $nameList;
}


# getAsterDataByNode
#    get partner list and link list for a single node
sub getAsterDataByNode {
    my $self = shift;
    
    my $p = common::arg_parser(@_);
    my @linkList;
    
    $self->dumper("/tmp/networkDumper.txt");

    
    my $centerNodeName = $p->{ node }->{ name };   
    
    my @nodeList = ($p->{ node });    
    foreach my $partnerName (keys (%{ $self->{ nameLinkTable }->{ $centerNodeName } })) {
	$logger->trace("\"$centerNodeName\" nameLinkTable references $partnerName ,  writing following link:\n" . 
		       Dumper($self->{ nameLinkTable }->{ $centerNodeName }->{ $partnerName })	   
	    );
	push @linkList, $self->{ nameLinkTable }->{ $centerNodeName }->{ $partnerName };
	
	$partnerName eq $centerNodeName && next; # Self interaction case
	push @nodeList, $self->{ nameNodeTable }->{ $partnerName };
    }
    
    return { nodeArray => \@nodeList, links => \@linkList };
}

sub dumper {
    my $self = shift;
    my $file = shift;
    my @dumpAttr = qw (nameLinkTable idLinkTable nameNodeTable idNodeTable);
    my $string = "Network Data Dumper\n";
    foreach my $attribute (@dumpAttr) {
	$string .= "\n\nDumping $attribute\n";	
	if ($attribute =~ /LinkTable/) {
	    foreach my $key (keys (%{$self->{ $attribute }})) {
	
		foreach my $subKey (keys (%{$self->{ $attribute }->{ $key }})) {
		    my $link = $self->{ $attribute }->{ $key }->{ $subKey };
		    $string .= " $key $subKey -(link)-> " . Dumper($link);
		}
	    }
	}
	elsif ($attribute =~ /NodeTable/) {
	    foreach my $key (keys (%{$self->{ $attribute }})) {
		my $node = $self->{ $attribute }->{ $key };
		$string .= "$key -(node)-> " . Dumper ($self->{ $attribute }->{ $key });
	    }
	}	
    }
    $logger->trace("writingDump");
    open OUT, ">$file" or die $!;
    print OUT $string;
    close OUT;	

}

sub getNode {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    defined ( $p->{ id }) && return $self->{ idNodeTable }->{ $p->{ id } };
    defined ( $p->{ name }) && return $self->{ nameNodeTable }->{ $p->{ name } };

    return;
}


sub getNodeAsID {
    my $self = shift;
    my $p = common::arg_parser (@_);
    defined ($self->{ idNodeTable }->{ $p->{ id }}) &&
	return $self->{ idNodeTable }->{ $p->{ id }};
    
    $logger->warn("node ID $p->{ id } not found in IDaccessor table");
    foreach my $node (@{$self->{ nodeArray }}) {
	 ($node->{ id } == $p->{ id }) && return $node;	 
    }
    $logger->error ("No node found for id $p->{ id }");

    return;
}

# add link element to an preexisting network
#    first create link
#    then supplement data to edges
#    mergedAssociationObject argument must be provided
sub addLink {
    my $self = shift;
    my $p = common::arg_parser(@_);
    $logger->trace("add link routine");
    defined ($p->{ mergedAssociationObject }) || $logger->logdie("missing parameter");
#    $logger->trace("avant:\n" . Dumper ($self->{ nameLinkTable }) );
    $self->_createLinks (mergedAssociationObject => $p->{ mergedAssociationObject });
#    $logger->trace("apres:\n" . Dumper ($self->{ nameLinkTable }) );
    $self->addLinkData(template => "data/richLinkTemplate.json", 
		       singleDataObject => $p->{ mergedAssociationObject }, 
		       options => [{ prior => "matrixDB"}]);
}


# supplement biological data to egdes
#    by attaching to each link the proper data container 
#    coping with the specified format.
#    Two sources can be combined, local & psimi object list (presumably out of a psicquic query)
sub addLinkData {
    my $self = shift;
    my $p = common::arg_parser (@_);
    $logger->trace("TIMEprofile:(start)");     
    my $sTime = common::getTime();
    my $dataTemplate;
    open JSON ,"< " . $p->{ template };
    my @jsonStr = <JSON>; 
    close JSON;
    
    $dataTemplate = decode_json(join ('', @jsonStr));		
               
    # set providers priority
    my $matrixPrior  = 0;
    foreach my $opt (@{$p->{ options }}) {
	if (exists ($opt->{ prior })){
	    if ($opt->{ prior } eq "matrixDB") {
		$matrixPrior = 1;
	    }
	}
    }
  

#    In order to speed up the link filling we use precomputed psimi experiment reference through the
#    assocaition Object
#    we loop over network->links list and associationObject->interactionList using $cnt
#    both list MUST BE COHERENT
    my $cnt = 0;
   
    my $associationObject = $p->{ singleDataObject };
    $logger->trace ("Injecting link data using following data container". Dumper ($associationObject));
    

    foreach (my $cnt = 0; $cnt < @{$associationObject->{ mergedAssociationList }}; $cnt++) {
	my $names = $associationObject->getInteractorPairedList (perIndex => [$cnt]);
	
	my $link = $self->_getLink(iName => $names->[0]->[0], jName => $names->[0]->[1]);
	!defined($link) &&
	    $logger->logdie("Link { $names->[0]->[0], $names->[0]->[1] } not found in network:\n" . Dumper ($self->{ nameLinkTable }));
    
	if (exists ($link->{ details })){
	    $logger->trace("Link { $names->[0]->[0], $names->[0]->[1] } already knwon");
	    next;
	}
	$logger->trace("Adding Link data { $names->[0]->[0], $names->[0]->[1] }");
	
	my $node = $self->getNodeAsID (id => $link->{ source });
	my $molA = $node->{ name };	
	$node = $self->getNodeAsID (id => $link->{ target });
	my $molB = $node->{ name };	

	my ($linkObject, $linkObjectAlt);
	
	my $tmp = $associationObject->getPsimiNumber (perIndex => $cnt);
	
	if ($associationObject->isMatrixdbSeed(perIndex => $cnt)) {
	    $logger->trace("assocInfo: $cnt is matrixdb psq_ref_num " . scalar(@{$tmp}) );	    
	    $logger->info("Fetching link data $cnt / " . scalar (@{$self->{ links }}) );
	    $linkObject = matrixDB::interactionReport::fetchAssociation (
		DB => $self->{ DB },
		template => $dataTemplate, 
		molA => $self->{ nameMutator }->mutateToMatrixdb(key => $molA),
		molB => $self->{ nameMutator }->mutateToMatrixdb(key => $molB),
		socketCv => $self->{ socketMappers }->{ 'MI' }
		);
	}
	
	if ($associationObject->hasPsimiEvidences (perIndex => $cnt)) {
	    $logger->trace("assocInfo: $cnt is psicquic psq_ref_num " . scalar(@{$tmp}) );
	    # get from psimi object list
	    my $psimiObjectList = $associationObject->fetchPsimiRecord(perIndex => [$cnt]);
	    $linkObjectAlt = psimi::interactionReport::fetchAssociation (
		psimiObjectList => $psimiObjectList,
		template => $dataTemplate, 
		molA => $self->{ nameMutator }->mutateToRegular(key => $molA),
		molB => $self->{ nameMutator }->mutateToRegular(key => $molB),
		socketCv => $self->{ socketMappers }->{ 'MI' }
		);
	}

	defined ($linkObject) 
	    ? $logger->trace("{ $molA $molB } link data available [matrixDB]")		    
	    : $logger->trace("{ $molA $molB } NO link data available [matrixDB]");		    

	defined ($linkObjectAlt) 
	    ? $logger->trace ("{ $molA $molB } link data available [PSICQUIC]")
	    : $logger->trace ("{ $molA $molB } NO link data available [PSICQUIC]");		    
	
	if (!common::sloft($linkObject, $linkObjectAlt)) {	  
	    $logger->error ("no link data available for link " . Dumper ($link));
	    $link->{ details } = {};
	    $cnt++;
	    next;
	}
	defined ($linkObjectAlt) && $logger->trace("link data psicquic Object content:\n" .
						  Dumper ($linkObjectAlt) );	
	
	if (common::slid($linkObject, $linkObjectAlt)) {
	     $logger->info ("{$molA $molB} Mixing PSICQUIC and MATRIXDB link Data");	
	     $link->{ details } = miscAssociationLayer::mergeLink (psicquic => $linkObjectAlt, 
								 matrixdb => $linkObject
		 );	  
	     next;
	} else {	 
	    $link->{ details } = defined ($linkObject) 
		? $linkObject
		: $linkObjectAlt;
	}
	
	$logger->trace("Object Link w/ filled details reference and content $molA $molB :\n" . 
		       Dumper ($link->{ details }) );
	
    }
    
    $logger->info("Final link data set (" . scalar(@{$self->{ links }}) . "):");
    foreach my $obj (@{$self->{ links }}) {
	$logger->trace(Dumper ($obj) ) ;
    }

    $logger->trace("subroutine time stamps:\n\tstart:$sTime\n\tstop:".common::getTime());    
}

# read network cache for specified key
#    fill nodeArray and link attribute, avoiding the annotation process on elements 
#    of the previous graph iteration
sub cacheReader {
    my $self = shift;

    my $p = common::arg_parser(@_);

    $logger->trace("You specified a previous network Identifier \"$p->{ key }\", trying to read out of cache ...");
    my $cache = CHI->new(
	serializer => 'Data::Dumper',
	driver     => 'File',
	root_dir   => $CACHE_ADDRESS,
	cache_size => '500m'
	);
     
    my $dataContainer = $cache->get($p->{ key });
    if (!defined ($dataContainer)){
	my $cacheContent = $cache->dump_as_hash( );
	$logger->error("No key named \"$p->{ key }\" in current cache content\n" . Dumper($cacheContent));
	return;
    }
    
# populate object
    $self->{ nodeArray } = $dataContainer->{ nodes };
    $self->{ links } = $dataContainer->{ links };
    $self->{ UItag } = $p->{ key };
    $logger->trace("CACHING OUT:\n" . Dumper($dataContainer));

}
sub setUID {
    my $self = shift @_;
    my $ug  = new Data::UUID;
    my $uuid = $ug->create();
    $self->{ UItag } = $ug->to_string( $uuid );
}

sub cacheWriter {
    my $self = shift;
  #  my $p = common::arg_parser(@_);
    
    if (! defined ($self->{ UItag })) {
	$self->setUID();
    }
    my $serializedNetwork = {
	nodes => $self->{ nodeArray },
	links => $self->{ links },
	statistics => $self->{ networkData }
    };

    my $cache = CHI->new(
	serializer => 'Data::Dumper',
	driver     => 'File',
	root_dir   => $CACHE_ADDRESS,
	cache_size => '500m' 
	);
    
    $logger->trace("Data to store:\n" . Dumper($serializedNetwork));
   
    $cache->set($self->{ UItag }, $serializedNetwork, "8 hours");

    $logger->info("cache writing network tagged '" 
		  . $self->{ UItag } . "' at " . $CACHE_ADDRESS
 	);

    my $report = $cache->dump_as_hash( );
    $logger->trace("CHI content:\n" . Dumper($report));
    
}



# astersWriter
#    using the seeds List, we cut network into radial pieces ("asters") centered on each on the seed biomolecules
#    and serialize them with all nodes and links related data to SPEED UP further requests.
#    the generated key is of the form BIOMOLECULEID__PSICQUIC/LOCAL
sub astersWriter {
    my $self = shift;
    my $p = common::arg_parser (@_);

    my $asterStore = CHI->new(
	serializer => 'Data::Dumper',
	driver     => 'File',
	root_dir   => $ASTERS_ADDRESS,
	cache_size => '1000m'
	);
    
    my $sourceSubKey = scalar (@{$p->{ providerList }}) > 0 ? "_PSICQUIC" : "_LOCAL";
    my $interactorPairList = $self->getLinkInteractorList();
    foreach my $centerNodeName (@{$p->{ nodeNameSelection }}) {
	$centerNodeName = $self->{ nameMutator }->mutateToRegular (key => $centerNodeName);
	my $node = $self->{ nameNodeTable }->{ $centerNodeName };
	defined($node) || $logger->logdie("$centerNodeName has no referenced node");
	my $asterData = $self->getAsterDataByNode (node => $node);
	defined($asterData) || next;
	
	my $asterKey = $centerNodeName . $sourceSubKey;
	defined ($asterStore->get($asterKey)) && next;
	$logger->info("serializing following aster:\n" . Dumper ($asterData));
	$asterStore->set($asterKey, $asterData, "10 years");
    }
    
}

# setNodeIdentity
#    This method try to enforce the use of a common/regular node name
#    where node->{ name } are 
#    PRO features leads to ${UNIPROTID}-PRO_XXXXXXXX
#    CHEBI compound CHEBI:XXXX
#    MULTIMER 
sub _setNodeIdentity {
    my $self = shift;
    my $p = common::arg_parser (@_);
    my $node = $p->{ node };
    
    if ($self->{ nameMutator }->isMatrixdbRegistred(key => $p->{ string })) {
	$node->{ aceAcessor } = $p->{ string };
	$node->{ name } = $self->{ nameMutator }->mutateToRegular(key => $p->{ string });
	return;
    } elsif ($self->{ nameMutator }->isRegularRegistred(key => $p->{ string })) {
	$node->{ name } = $p->{ string };
	$node->{ aceAcessor } = $self->{ nameMutator }->mutateToMatrixdb(key $p->{ string });
	return;
    }
    $node->{ name } = $p->{ string };
    
    $logger->trace('returning' . Dumper($node));
    
    return ;
}

# Merge a collection of radial subnetwork with the current object
#    BEWARE reference access aster content is modified, shoud have to be reread from cache if to be reused in another context
sub addAsters {
    my $self = shift;
    my $asterCollection = shift;
    
    my $idMapperOtN = {}; #  old to new id
    
    my $list = $self->getNodeNameList();
    my $ID = $self->getFreeID();
    $logger->trace("adding Asters initial node name list (freeID is $ID):\n". Dumper($list));
    
    foreach my $key (keys(%{ $asterCollection })) {
	$logger->trace("adding \"$key\" aster to network");
	# First add all nodes from aster collection that are not part of network
	my $subNetwork = $asterCollection->{ $key };
	foreach my $node (@{$subNetwork->{ nodeArray }}) {
	    my $pNode = $self->getNode(name => $node->{ name });
	    if (defined ($pNode)) {
		$logger->trace("node  \"$node->{ name }\" found in network setting its link reference" . 
			       "id to \"$pNode->{ id }\" instead of \"$node->{ id }\"");
		$idMapperOtN->{ $node->{ id } } = $pNode->{ id };
		next;
	    }
	    $idMapperOtN->{ $node->{ id } } = $ID;
	    $logger->trace("node  \"$node->{ name }\" now has id \"$ID\" instead of \"$node->{ id }\"");
	    $node->{ id } = $ID;
	    push @{$self->{ nodeArray }}, $node;
	    $self->{ nameNodeTable }->{ $node->{ name } } = $node;
	    $self->{ idNodeTable }->{ $ID } = $node;
	    $ID++;	  	  
	}
	# Then append subnetwork links to network links list
	foreach my $nLink (@{ $subNetwork->{ links } }) {
	    my $iNode = $subNetwork->getNode (id => $nLink->{ source });
	    my $jNode = $subNetwork->getNode (id => $nLink->{ target });

	    if ($self->_isKnownLink (iName => $iNode->{ name }, jName => $jNode->{ name })) {
		$logger->warn ("Following aster link already part of network,\n" . Dumper( $nLink ));
		next;
	    }
	    $logger->trace("i would like to register following aster link:\n" . Dumper($nLink));
	    # then we add link and properly reference source/target id 
	    # BEWARE reference access aster content is modified	    
	    $nLink->{ source } = $idMapperOtN->{ $nLink->{ source } };
	    $nLink->{ target } = $idMapperOtN->{ $nLink->{ target } };	    
	    push @{ $self->{ links } }, $nLink;
	    $self->_registerLink (iID => $nLink->{ source }, jID => $nLink->{ target });
	}
    }# Aster collection loop

  
}   


#    register the edges which do not exist
sub _isKnownClosure {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    if (common::slid($p->{ iID }, $p->{ jID })) {
	defined ($self->{ idClosureTable }->{ $p->{ iID } }->{ $p->{ jID } }) && return 1;
    } elsif (common::slid($p->{ iName }, $p->{ jName })) {
	defined ($self->{ nameClosureTable }->{ $p->{ iName } }->{ $p->{ jName } }) && return 1;
    } elsif (common::slid($p->{ iNode }, $p->{ jNode }) ) {
	defined ($self->{ nameClosureTable }->{ $p->{ iNode }->{ name } }->{ $p->{ jNode }->{ name } }) && return 1;
    }
    
    return 0;
}


sub enumerateGhostEdges {
    my $self = shift;
    
    $logger->trace("Total known link is " . scalar(@{ $self->{ links } }));
    $logger->trace(Dumper($self->{ nameLinkTable }));
    
    my $potentialInteractorPairs = [];
    for (my $i = 0; $i < @{$self->{ nodeArray }}; $i++) {
	for (my $j = $i; $j < @{$self->{ nodeArray }}; $j++) {	
	    $self->_isKnownLink(iName => $self->{ nodeArray }->[$i]->{ name },
				jName => $self->{ nodeArray }->[$j]->{ name }) && next;
	    push @{$potentialInteractorPairs}, [$self->{ nodeArray }->[$i]->{ name }, 
						$self->{ nodeArray }->[$j]->{ name }];
	}
    }    
    
    return $potentialInteractorPairs;
}

1;
