package newPort::partnerDetails;

use strict;
use Data::Dumper;

use common;
use newPort::bindingSite;
use newPort::pointMutation;
use newPort::postTranslationalModification;
use newPort::miscellaneousFeatures;
use localSocket;
use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::partnerDetails");

=pod
?PartnerDetails BioRole #B_Role_CV // PSIMI CV
                ExpRole #E_Role_CV // PSIMI CV
                Detect_Meth #Partner_Id_Method_CV // PSIMI CV Text
                Isoform Text //new 080110 //AC of isoform used in experiment
                Author_assigned_name Text //new 080110 //alias given by the author
                Stoichiometry Text //new 080110 stoichiometry if the molecules in the interaction
                Feature Int #Features //features : see below
                Expression_level #E_level_CV //new 080110 //modification of expression level of the molecule in the experiment
                See_also ?Biomolecule //new 080110 // another protein that could be referenced for the interaction (when a peptide is used only)
                Strain Text //new 080110 // if no protein is available for the precise strain, precise strain indicated here
                //organisation a revoir : Feature
=cut

sub get {
  my $aceExperimentObject = shift;
  my $cvSocket = shift;
  if ($aceExperimentObject->class() ne "Experiment") {
    $logger->error("supplied object is not of Ace Experiment class" . Dumper($aceExperimentObject));
    return undef;
  }

  my $template = {
		  name => undef,
		  specie => undef,
		  pdb => undef,
		  biologicalRole => undef,
		  experimentalRole => undef,
		  detectionMethod => undef,
		  isoform => undef,
		  authorMoleculeName => undef,
		  stoichiometry => undef,
		  feature => undef,
		  expressionLevel => undef,
		  strainDetails => undef,
		  commonName => undef
		 };

  my @data = ();

  #$logger->info(Dumper($aceExperimentObject));
  foreach my $acePartnerObject ($aceExperimentObject->BioMolecule) {
    $logger->info($acePartnerObject->asString);
    my %spawn = %{$template};
    my $datum = \%spawn;
    $datum->{ name } = $acePartnerObject->name;
    $datum->{ commonName } = getCommonName($aceExperimentObject, $acePartnerObject),
    $datum->{ biologicalRole } = getBiologicalRole($acePartnerObject);
    $datum->{ experimentalRole } = getExperimentalRole($acePartnerObject);
    $datum->{ detectionMethod } = getDetectionMethod($acePartnerObject);
    $datum->{ authorMoleculeName } = getAuthorMoleculeName($acePartnerObject);
    $datum->{ stoichiometry } = getStoichiometry($acePartnerObject);
    $datum->{ expressionLevel } = getExpressionLevel($acePartnerObject);
    $datum->{ strainDetails } = getStrainDetails($acePartnerObject);
    $datum->{ pdb } = getPdb($aceExperimentObject, $acePartnerObject);
    $datum->{ specie } = getSpecie($aceExperimentObject, $acePartnerObject);
    $datum->{ feature } = getFeature($acePartnerObject);
    $datum->{ isoform } = getIsoform($acePartnerObject);
    
    defined ($cvSocket) && cvRefit($datum, $cvSocket);
     


    $logger->info("Pushing partnerDetail of " .  $datum->{ name });
    push @data, $datum;
  }

  $logger->info($aceExperimentObject->name . " :returning following data container:\n" . Dumper(@data));
  return \@data;
}

sub cvRefit {
    my ($datum, $cvSocket) = @_;

    foreach my $tag (qw/detectionMethod experimentalRole/) {
	defined($datum->{ $tag }) || next;
	my $cvTerm = localSocket::runCvRequest (with => $cvSocket, from => 'matrixDB',
						askFor => 'id', selectors => { name => $datum->{ $tag } });
#	$logger->error("REFITING $tag " . $datum->{ $tag } . " to " . $cvTerm);
	defined($cvTerm) || next;
	$datum->{ $tag } .= "[$cvTerm]";
    }
}

sub getCommonName {
  my $aceExperimentObj = shift;
  my $aceObject = shift;
  my @nameAliases = qw / Common_Name FragmentName GAG_Name Cation_Name 
			 Phospholipid_Name Multimer_Name Inorganic_Name/;

  my @aceBufferList = $aceExperimentObj->follow('biomolecule');

  foreach my $aceBuffer (@aceBufferList) {
    ($aceBuffer->name ne $aceObject->name) && next;
    foreach my $alias (@nameAliases) {
      my $aceNode = $aceBuffer->get($alias, 1);
      defined ($aceNode) || next;
      return $aceNode->name;
    }
  }
  return undef;
}

sub getSpecie {
   my $aceExperimentObj = shift;
   my $aceObject = shift;
  
   my @aceBufferList = $aceExperimentObj->follow('biomolecule');
   foreach my $aceBuffer (@aceBufferList) {
     ($aceBuffer->name ne $aceObject->name) && next;
     $aceBuffer = $aceBuffer->at('In_Species', 1);
     return defined ($aceBuffer) ? $aceBuffer->name : undef;
   }
   return undef;
 }

sub getPdb {
  my $aceExperimentObj = shift;
  my $aceObject = shift;
  
  my @pdbList = ();
  #  $logger->info("TEST " . $aceObject->name);
  my @aceBufferList = $aceExperimentObj->follow('biomolecule');
  foreach my $aceBuffer (@aceBufferList) {
    ($aceBuffer->name ne $aceObject->name) && next;
    $aceBuffer = $aceBuffer->at('PDB', 1);
    while (defined($aceBuffer)) {
      push @pdbList, $aceBuffer->name;
      $aceBuffer = $aceBuffer->down();
    }
  }
  
  @pdbList == 0 && return undef;

  $logger->info(Dumper(@pdbList));
  return \@pdbList;
}


sub getIsoform {
  my $aceObject = shift;
  my $bufferAceObject = $aceObject->at('Isoform', 1);
  defined($bufferAceObject) || return undef;

  return $bufferAceObject->name;
}

sub getFeature {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Feature', 1);
  defined($aceBuffer) || return undef;
  
  my $dataContainer = {
		       bindingSite => newPort::bindingSite::get({aceObject => $aceObject}),
		       pointMutation => newPort::pointMutation::get({aceObject => $aceObject}),
		       ptm => newPort::postTranslationalModification::get({aceObject => $aceObject}),
		       miscellaneous => newPort::miscellaneousFeatures::get({aceObject => $aceObject}),
		 };

  return $dataContainer;
}

sub getBiologicalRole {
  my $aceObject = shift;

  my $bufferAceObject = $aceObject->at('BioRole', 1);
  defined($bufferAceObject) || return undef;
  my $name = $bufferAceObject->name;

  return $name;
}

sub getExperimentalRole {
  my $aceObject = shift;

  my $bufferAceObject = $aceObject->at('ExpRole', 1);
  defined($bufferAceObject) || return undef;
  my $name = $bufferAceObject->name;

  return $name;
}

sub getDetectionMethod {
  my $aceObject = shift;

  my $bufferAceObject = $aceObject->at('Detect_Meth', 1);
  defined($bufferAceObject) || return undef;
  my $name = $bufferAceObject->name;

  return $name;
}

sub getAuthorMoleculeName {
  my $aceObject = shift;

  my $bufferAceObject = $aceObject->at('Author_assigned_name', 1);
  my @array = ();
  while (defined($bufferAceObject)) {
    push @array, $bufferAceObject->name;
    $bufferAceObject = $bufferAceObject->down();
  }

  @array == 0 && return undef;
  $logger->info(Dumper(@array));
  return \@array;
}

sub getStoichiometry {
  my $aceObject = shift;

  my $bufferAceObject = $aceObject->at('Stoichiometry', 1);
  defined($bufferAceObject) || return undef;
  my $name = $bufferAceObject->name;

  return $name;
}

sub getExpressionLevel {
  my $aceObject = shift;

  my $bufferAceObject = $aceObject->at('Expression_level', 1);
  defined($bufferAceObject) || return undef;
  my $name = $bufferAceObject->name;

  return $name;
}

sub getStrainDetails {
  my $aceObject = shift;

  my $bufferAceObject = $aceObject->at('Strain', 1);
  defined($bufferAceObject) || return undef;
  my $name = $bufferAceObject->name;

  return $name;
}



1;
