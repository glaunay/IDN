package psimi::interactionReport;
use strict;
use common;

use Log::Log4perl qw(get_logger :levels);
use Data::Dumper;
use JSON;
use Scalar::Util qw(blessed dualvar isweak readonly refaddr reftype tainted
                        weaken isvstring looks_like_number set_prototype);

our $CV_SOCKET;

my $logger = get_logger("psimi::interactionReport"); 
$logger->level($ERROR);

=pod fetchAssociation
    search in a list of psimiobject
    for a interactor pair.
    Once get retrieve all data to populate a RETURNED linkObject, that is specified through the template argument

    TO DO : implement dummyList-like managment to deal with multiple values filed (aka '|' seaparator in mitab format)
=cut
sub fetchAssociation {
    my $p = common::arg_parser (@_);

    (common::slid($p->{ molA }, $p->{ molB } || $p->{ psimiIndexList })) || die "unable to guess molecule name from supplied arguments";
    if (! defined($p->{ socketCv } )){
	$logger->warn("Undefined socket provided as argument");
    } else {
	$CV_SOCKET = $p->{ socketCv } ;	   
    }
    
    $logger->trace("psicquic association reporting { $p->{ molA } , $p->{ molB } }");
    my $psimiObjectList;
    if (common::slid($p->{ molA }, $p->{ molB })) {
	$psimiObjectList = psimi::getObjects (psimiObjectList => $p->{ psimiObjectList }, 
					      selectors => {
						  interactors => [$p->{ molA }, $p->{ molB }] 
					      });
	if (scalar (@{$psimiObjectList}) > 0) {
	    $logger->trace("Found " . scalar(@{$psimiObjectList}) . " psimi objects for interactant pair " . 
			  "$p->{ molA }, $p->{ molB } :\n" . Dumper ($psimiObjectList) );
	} else {
	    $logger->error("NOT Found $p->{ molA }, $p->{ molB } a single psimi Object:\n");		
	    return;
	}    
    } else {
	foreach my $index ($p->{ psimiIndexList }) {
	    push @{$psimiObjectList}, $p->{ psimiIndexList }->[$index];
	}	
    }

    my $mapper = getMapper ($p->{ template });    
    my $container = $mapper->{ associationDescriptor } ($mapper, $p->{ template }, $p->{ molA }, $p->{ molB }, $psimiObjectList);
    
    return $container;
}

=pod getMapper returns a collection of anonymous function associated to each template object attribute
    similar in its principles to matrixdb::interactionReport::getMapper
    psimi object is supplied as additional argument to account for version/different level of information in the mitab 

=cut
sub getMapper {
    my $template = shift;
   
#    (defined ($template->{ version })) || die "No version found in mapper template";
   
    if ($template->{ version } eq "richLink_1.0") {
	
#	my $version = $psimiObject->guessMitabVersion();
	$logger->info("getting mapper for mitab to richLink_1.0");
	
	return {
	    associationDescriptor => sub {
		$logger->trace ("psicquic mapper association ARG[@_]");
		my ( $mapper, $template, $molA, $molB, $psimiObjectList ) = @_;

		# move to template level
		my $nodeTemplate = $template->{ associationDescriptor };
		# spawn a copy of the datastructure to be filled
		my %hash = %{$nodeTemplate};    
		my $container = \%hash;
		
		$container->{ name } = "${molA}_${molB}_PSICQUIC";
		$logger->info("setting Association $container->{ name } subtree [" 
			      . scalar (@{$psimiObjectList}) . " experiments ]");		
		foreach my $key (keys (%{$nodeTemplate})) {
		    ($key eq "name") && next;
		    if ($key eq "knowledge") {
			$container->{ $key } = "Genuine";
		    }
		    if ($nodeTemplate->{ $key } =~ /^listType_(.+)$/) {		
			my $dataType = $1;
			$container->{ $key } = [];

			if ($dataType eq "experimentDescriptor") {			    
			    my $cnt = 0;
			    foreach my $psimiObject (@{$psimiObjectList}) {
				$cnt++;
				my $p1 = $psimiObject->get(
				    key => 'Unique identifier for interactor A', options => ['noPrefix', 'asSingle']);
				my $p2 = $psimiObject->get(
				    key => 'Unique identifier for interactor B', options => ['noPrefix', 'asSingle']);		
				my $experimentContainer = 
				    $mapper->{ experimentDescriptor }($mapper, $template, $psimiObject, "${p1}_${p2}_PSQ$cnt");
				if (!defined ($experimentContainer)) {
				    $logger->warn ("failed to map psicquic experiment for following psimi object\n" .
						   Dumper ($psimiObject));
				    next;
				}
				push @{$container->{ $key }}, $experimentContainer;
			    }
			}


		    }		    
		}

		return $container;		
	    },
	    experimentDescriptor => sub {
		$logger->info("PSICQUIC mapping of experiment");
		my ($mapper, $template, $psimiObject, $name) = @_;

		my $nodeTemplate = $template->{ experimentDescriptor };
		# spawn a copy of the datastructure to be filled
		my %hash = %{$nodeTemplate};    
		my $container = \%hash;
		
		$container->{ type } = "experiment";
		$container->{ name } = $name;
		$logger->info("mapping experiment $name from following object:\n" . Dumper($psimiObject));


		foreach my $key (keys (%{$nodeTemplate})) {
		    ($key eq "name") && next;
		    if ($key eq "knowledgeSupport") {
			$container->{ $key } = "actual";
			next;
		    }
#		    ($key eq "Figure") && next; # not provided in mitab
		    if ($nodeTemplate->{ $key } =~ /^dummy/) {
			my $value;
			if ($key eq "Interaction_Detection_Method") {
			     $value = $psimiObject->get(
				key => 'Interaction detection methods', options => ['asSingle']);
			} elsif ($key eq "Experiment_modification") {
			    
			} elsif ($key eq "Host_System") {
			    $value = $psimiObject->get(
				key => 'NCBI Taxonomy identifier for the host organism', options => ['asSingle']);
			} elsif ($key eq "Interaction_Type") {
			    $value = $psimiObject->get(
				key => 'Interaction types', options => ['asSingle']);
			    #$logger->info("Host Organism test" . Dumper($value));
			} elsif ($key eq "sourceDatabase") {
			    $value = $psimiObject->get(
				key => 'Source databases', options => ['asSingle']);
			}
		
			$container->{ $key } = defined($value) ? $value : 'N/A';
			$container->{ $key } = $container->{ $key } eq "-" ? 'N/A' : $container->{ $key };

			if ($nodeTemplate->{ $key } =~ /^dummyCV/) {
			    if (defined ($value)) {
				my $cvTerm = localSocket::runCvRequest (with => $CV_SOCKET, from => 'psicquic',
									askFor => 'id', selectors => { name => $value }
				    );				
				$value .= "[$cvTerm]";
			    }	
			}
			
			$logger->info("$key value set to $container->{ $key }") ;

		    } elsif ($nodeTemplate->{ $key } =~ /^([^_]+)Descriptor$/) {		
			if ($1 eq "kinetics") {
			    $container->{ $key } = $mapper->{ kineticsDescriptor } ($mapper, $template, $psimiObject);
			}
			
		    } elsif ($nodeTemplate->{ $key } =~ /^listType_(.+)$/) {		
			my $dataType = $1;
			$container->{ $key } = [];
			if ($dataType eq "publicationDescriptor") {
			    $container->{ $key } =  $mapper->{ publicationDescriptor } ($mapper, $template, $psimiObject);
			} elsif ($dataType eq "partnerDescriptor") {
			    foreach my $partnerID (qw/A B/) {
				my $subContainer = $mapper->{ partnerDescriptor } ($mapper, $template, $psimiObject, $partnerID);
				if (!defined ($subContainer)) {				
				    $logger->error ("Failed to map partnerDescriptor data from:\n" . Dumper ($psimiObject) );
				    next;
				}
				push @{$container->{ $key }}, $subContainer;
			    }			
			}
		    }
		}
		return $container;
	    },
	    kineticsDescriptor => sub {
		$logger->info("PSICQUIC mapping of kinetics");
		my ($mapper, $template, $psimiObject) = @_;
		my $nodeTemplate = $template->{ kineticsDescriptor };
		# spawn a copy of the datastructure to be filled
		my %hash = %{$nodeTemplate};    
		my $container = \%hash;

		my $dataContainer = $psimiObject->getKineticsData (options => ['postfixDB', 'asSingle']);
		
		foreach my $key (keys(%{$nodeTemplate})) {
		    $logger->info("KINETICkey is $key");
		    $container->{ $key } = $dataContainer->{ $key };
		}
		
		return $container;
	    },
	    publicationDescriptor => sub {
		$logger->info("PSICQUIC mapping of publication");
		my ($mapper, $template, $psimiObject) = @_;
		my $nodeTemplate = $template->{ publicationDescriptor };
		# spawn a copy of the datastructure to be filled
		my %hash = %{$nodeTemplate};    
		my $container = \%hash;

		my $dataContainer = $psimiObject->getPublicationData (options => ['postfixDB', 'asSingle']);			
		
		foreach my $key (keys(%{$nodeTemplate})) {
		    $logger->info("PUBkey is $key");
		    $container->{ $key } = $dataContainer->{ $key };
		}
		
		return [$container];
	    },
	    partnerDescriptor => sub {
		$logger->info("PSICQUIC mapping of partner Details");
		my ($mapper, $template, $psimiObject, $id) = @_;
	
		my $nodeTemplate = $template->{ partnerDescriptor };
		# spawn a copy of the datastructure to be filled
		my %hash = %{$nodeTemplate};    
		my $container = \%hash;
		# set partner name && llinks
		my $partnerPair = $psimiObject->getSimpleInteractorPair(); 
		$container->{ name } = $id eq "A" ? $partnerPair->[0] : $partnerPair->[1];
		$container->{ type } = "partner";
		
		my $featureContainer = $psimiObject->getInteractorFeatures(id => $id);		

		foreach my $key (keys (%{$nodeTemplate})) {
		    ($key eq "name") && next;
		   
		    if ($nodeTemplate->{ $key } =~ /^dummy/) {
			my $buffer;
			if ($key eq "BioRole") {
			    $buffer = $psimiObject->get(
				key => 'Biological role ' . $id, options => ['asList']);
			    $logger->trace('Biological role data array: ' . "@{$buffer}");
			} elsif ($key eq "ExpRole") {
			    $buffer = $psimiObject->get(
				key => 'Experimental role ' . $id, options => ['asList']);
			} elsif ($key eq "Detect_Meth") {
			    $buffer = $psimiObject->get(
			    	key => 'Participant identification method for interactor ' . $id, options => ['asList']);
			} elsif ($key eq "Species") {
			    $container->{ $key } = $psimiObject->get(
				key => 'NCBI Taxonomy identifier for interactor ' . $id, options => ['asSingle']);
			    next;
			} elsif ($key eq "Isoform" || "Accession_Number") {
			    $container->{ $key } = 'NA';
			    next;			    
			} 

			if (!defined($buffer)) {
			    $logger->error("undefined psimi method return for key \"$key\"");
			    $container->{ $key } = 'NA';
			    next;
			}

			$logger->trace("psimi partner Data dummy \"$key\"\n" . Dumper ($buffer));

			my $string = join (' ', @{$buffer});
			$container->{ $key } = @{$buffer} > 0 ? $string  : 'NA';
		    } else {
			if ($key eq "Features") {
			    # use $featureContainer Here
			    my %subHash = %{$container->{ $key }};
			    my $subContainer = \%subHash;
			    my $subNodeTemplate = $nodeTemplate->{ $key };	
			    foreach my $subKey (keys(%{$subNodeTemplate})) {
				if ($subNodeTemplate->{ $subKey } =~ /^listType_(.+)$/){
				    my $dataType = $1;
				    $subContainer->{ $subKey } = [];
				    $subContainer->{ $subKey } = $mapper->{ $dataType }($mapper,
											$template,
											$featureContainer);
				} 
			    }			
			    $container->{ $key } = $subContainer;
			    next;			    
			}			
			$logger->trace("need to implement psimi data non dummy \"$key\"\n");
		    }
		}
		return $container;
		
	    },
	    # returns a reference list of such elements
	    knownExperimentalFeatureDescriptor => sub {
		my ($mapper, $template, $featureContainer) = @_;
		#$container->{ type } = "knownExperimentalFeature";			    
		#return \@containerList;
		return [];
	    },
	    # returns a list of such datatype
	    rangeData => sub {
		return [];
	    },
	    # returns a reference list of such elements
	    bindingSiteDataDescriptor => sub {		
		my ($mapper, $template, $featureContainer) = @_;
		#$container->{ type } = "bindingSiteData"; 		
		return [];	
	    },
	    ptmDescriptor => sub {
		my ($mapper, $template, $featureContainer) = @_;
		#$container->{ type } = "ptm";
		return [];	
	    },
	    pointMutationDescriptor => sub {
		my ($mapper, $template, $featureContainer) = @_;
                #$container->{ type } = "pointMutation";
		return [];
	    }
	};      
    }
    $logger->logdie ("Summoning mapper of unknown format \"$template->{ version }\"");


}

1;
 
