package newPort::experiment;

use strict;
use Data::Dumper;

use common;
use newPort::partnerDetails;
use localSocket;
use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::experiment");


#140306 GL
#Some Accessors are not yet implemented because, as of today, no such data are stored in matrixdb 2.0.
#(see below).
#I guess they were/will be required for intact(XML) or mitab imported data
#

sub get {
  my $p = shift;

  my $aceObject;
  if (defined ($p->{ name })) {
    $aceObject = $p->{ DB }->fetch(Experiment => $p->{ name });
    if ( !defined ($aceObject) ) {
      $logger->error("$p->{ name } returned no ace Object");
      return {};
    }
  } else {
    $logger->error("You provided no name");
    return {};
  }

 my $datum = {
	  name => $p->{ name },	   
	  partnerDetails => getPartnerDetails($aceObject, $p->{ cvSocket }),
	  association => getAssociation($aceObject),
	  interactionDetectionMethod => getInteractionDetectionMethod($aceObject),
	  experimentModification => getExperimentModification($aceObject),
	  positiveControl => isPositiveControl($aceObject),
	  xrefList => getXref($aceObject),
	  bindingSiteComment => getBindingSiteComment($aceObject),
	  affinityKinetic => getKinetics($aceObject),
	  host => getHost($aceObject),
	  tissue => getTissue($aceObject),
	  cellLine => getCellLine($aceObject),
	  compartment => getCompartment($aceObject),
	  confidence => getConfidenceScore($aceObject),
	  cautionComment => getCaution($aceObject),
	  generalComment => getComment($aceObject),
	  interactionType => getInteractionType($aceObject),
	  figure => getFigure($aceObject),
	  table => getTable($aceObject),
	  file => getFile($aceObject),
	  publication => getPublication($aceObject),
	  imexExperimentId => getImexID($aceObject),
	  creationDate => getCreationDate($aceObject),
	  updateDate => getUpdateDate($aceObject),
	  database => getSourceDatabase($aceObject)
	 };

  defined ($p->{ cvSocket }) && cvRefit ($datum, $p->{ cvSocket });
  return $datum;
}


sub cvRefit {
    my ($datum, $cvSocket) = @_;

    foreach my $tag (qw/interactionDetectionMethod interactionType/) {
	defined($datum->{ $tag }) || next;
	my $cvTerm = localSocket::runCvRequest (with => $cvSocket, from => 'matrixDB',
						askFor => 'id', selectors => { name => $datum->{ $tag } });
#	$logger->error("REFITING $tag " . $datum->{ $tag } . " to " . $cvTerm);
	defined($cvTerm) || next;
	$datum->{ $tag } .= "[$cvTerm]";
    }
}



sub getPartnerDetails {
  my $aceObject = shift;
  my $cvSocket = shift;
  if (defined($cvSocket)) {$logger->error("i have something here");
		       }
  my $data = newPort::partnerDetails::get($aceObject, $cvSocket);

  return $data;
}

# account for homology, return a list
sub getAssociation {
  my $aceObject = shift;
  
  my @aceBuffer = $aceObject->follow('Association');
  defined(@aceBuffer > 0) || return undef;

  return [$aceBuffer[0]->name];
}

sub getPublication {
  my $aceObject = shift;
  
  my $aceBuffer = $aceObject->at('PMID', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getSourceDatabase {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Interaction_Detection_Method', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getInteractionDetectionMethod {
  my $aceObject = shift;
  
  my $aceBuffer = $aceObject->at('Interaction_Detection_Method', 2);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getHost {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Host', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getInteractionType {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Interaction_Type', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getImexID {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('IMEx_ID_Experiment', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}


sub getFigure {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Figure', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getTable {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Table', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getExperimentModification {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Experiment_modification', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub isPositiveControl {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Positive_control');
  defined($aceBuffer) || return undef;
  
  return 1;
}

sub getXref {
  my $aceObject = shift;
  my @xrefTags = qw / HPRD_xref DIP_xref IntAct_xref MINT_xref BioGrid_xref InnateDB_xref /;
  my @data;
  foreach my $xrefTag (@xrefTags) {
    my $aceBuffer = $aceObject->at($xrefTag, 1);
    defined($aceBuffer) || next;  
    
    while (defined($aceBuffer)) {
      push @data, { provider => $xrefTag, value =>  $aceBuffer->name };
      $aceBuffer = $aceBuffer->down();
    }
  }

  @data == 0 && return undef;
  return \@data;
}

sub getBindingSiteComment{
  my $aceObject = shift;
  
  my $aceBuffer = $aceObject->at('Binding_Site', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getKinetics {
  my $aceObject = shift;
  
  my $aceBuffer = $aceObject->at('AffinityKinetics', 1);
  
  $logger->warn("TOTOO" . $aceObject->asString);
  
  my $dataContainer = {
      KD1_nM => undef,
      KD2_nM => undef,
      Range_nM => undef,
      AssociationRate1 => undef,
      AssociationRate2_MS => undef,
      AssociationRate2_S => undef,
      DissociationRate1 => undef,
      DissociationRate2 => undef,
      Kinetics_Comments => undef,
      Interaction_Model => undef
      };
  my $bool = 0;
  while (defined($aceBuffer)) {
    my $key = $aceBuffer->name;
    $logger->warn("TESTING " . $key);
    my $aceBufferSub = $aceBuffer->right();
    my $value = $aceBufferSub->name;
    $dataContainer->{ $key } = $value;
    $bool = 1;
    $aceBuffer = $aceBuffer->down();
  }
  $bool || return undef;

  return $dataContainer;
}

sub getTissue { # 1 experiment lays this info ... not sure abount the inner loop
  my $aceObject = shift;
  
  my $aceBuffer = $aceObject->at('Tissue', 1);
  defined($aceBuffer) || return undef;
  my $bool = 1;
  my $dataContainer;
  while (defined($aceBuffer)) {
    my $key = $aceBuffer->name;
    my $aceBufferSub = $aceBuffer->right();
    my $value = $aceBufferSub->name;
    $dataContainer->{ $key } = $value;
    $bool = 1;
    $aceBuffer = $aceBuffer->down();
  }
  $bool || return;

  return $dataContainer;
}

sub getCellLine {
  my $aceObject = shift;
  
  my $aceBuffer = $aceObject->at('Cell_lines', 1);
  defined($aceBuffer) || return undef;
  my $bool = 1;
  my $dataContainer;
  while (defined($aceBuffer)) {
    my $key = $aceBuffer->name;
    my $aceBufferSub = $aceBuffer->right();
    my $value = $aceBufferSub->name;
    $dataContainer->{ $key } = $value;
    $bool = 1;
    $aceBuffer = $aceBuffer->down();
  }
  $bool || return;
  
  return undef;
}

sub getComment {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Comments', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getFile {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('File', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

=pod
Following accessors are waiting for mitab/intact (from xml?) import
=cut
sub getCompartment { # not implemented no case in matrixdb
  my $aceObject = shift;
  return undef;
}

sub getConfidenceScore { # not implemented no case in matrixdb
  my $aceObject = shift;
  return undef;
}

sub getCaution { # not implemented no case in matrixdb
  my $aceObject = shift;
  return undef;
}

sub getCreationDate {
  my $aceObject = shift;
  return undef;
}

sub getUpdateDate {
  my $aceObject = shift;
  return undef;
}



=pod
?Experiment Partner BioMolecule ?BioMolecule #PartnerDetails
                    WholeOrganism ?Organism #PartnerDetails
            Not_all_human //pour copie uniquement, marque les interactions a trier
            Association ?Association XREF Experiment
            Interaction_Detection_Method UNIQUE HPRD #HPRD_exp //
                                                DIP #Determination_Method_CV
                                                IntAct #Determination_Method_CV
                                                MINT #Determination_Method_CV
                                                BioGrid #Determination_Method_CV
                                                MatrixDB #Determination_Method_CV
            Experiment_modification Text //new 080110 // modification to the classical Determination_Method
            Positive_control //new 080110 //used as a positive control in the paper
            HPRD_xref ?BioMolecule ?Text
            DIP_xref ?Text
            IntAct_xref ?Text
            MINT_xref ?Text
            BioGrid_xref ?BioMolecule ?Text
            PMID ?Publication
            Binding_Site Text
            AffinityKinetics KD1_nM Float
                             KD2_nM Float  // seems to be for 2-site models
                             Range_nM Text // usually a range for the KDs, but can also hold comments
                             AssociationRate1 Float // expressed in M-1s-1
                             AssociationRate2 Float // also M-1s-1, perhaps for two-state reactions
                             DissociationRate1 Float // expressed in s-1
                             DissociationRate2 Float // also in s-1
                             Kinetics_Comments ?Text
                             Interaction_Model ?Text
//                           ResidenceTime1 == 1/DissociationRate1, in s, ignoring; idem ResidenceTime2
            Host_System ?Species
//new 080110 //tissue where the experiment is realized
            Tissue Brenda Text // identifier Brenda -> prefered by IMEx
                   UniProt Text // identifier UniProt
                   Tissue_Name Text
//new 080110 //cell used in the experiment
            Cell_lines Cabri Text //identifier Cabri-> prefered by IMEx
                       Cell_PMID Text //if no identifier
                       Cell_Name Text
//new 080110 // compartment where the experiment is realized
            Compartment GO_xref ?GO//new 080110 GO term
                        Compartment_Name Text
//new 080110 // confidence of the author in the experiment/interaction
            Confidence Calcul Text //new 080110
                       Value Text //new 080110
                       Unit Text //new 080110
//new 080110 // caution of the curator on the experiment/interaction
            Caution Text //new 080110
            Comments Text
            Interaction_Type #Int_Type_CV
            Figure Text
            Table Text
            File Text
            IMEx_ID_Experiment UNIQUE ?Text //IMEx ID of the experiment
            Creation_Date DateType
            Last_Modification_Date DateType

=cut
1;
