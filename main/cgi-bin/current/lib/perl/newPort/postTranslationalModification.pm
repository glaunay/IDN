package newPort::postTranslationalModification;

use strict;
use warnings;
use Data::Dumper;

use common;
use newPort::featureSingleton;

use Log::Log4perl qw(get_logger :levels);
my $logger = get_logger ("newPort::postTranslationalModification");
$logger->level($ERROR);

=pod
    similar to bindingSite, except that several instance can be found
=cut



our $DATA_TYPE = "Post_Translation_Modification"; # may be able to reuse for mutation and postTradMod

# receive experiment Object Ace
sub get {
  my $p = shift;

  my @eligibleNodes = qw /BioMolecule Experiment/; # Biomolecule assumed a partnerDetails tag

  if (!defined($p->{ aceObject })) {
    $logger->error("No aceObject specified");
    return undef;
  } 
  my $class = $p->{ aceObject }->class();
  
  if (!common::listExist(\@eligibleNodes, $class)) {
    $logger->error("supplied ace object class \"$class\" is no eligible node");
    return undef,
  }
  
  if ($class eq "Experiment" && !defined ($p->{ biomolecule })) {
    $logger->error("You provided an Experiment node but no biomolecule name to look for, " .
		   " dont know which partner ptm to extract");
    return undef;
  }

  my $nAceObject = $class eq "Experiment" 
    ? $p->{ aceObject }->at('Partner.BioMolecule.' . $p->{ biomolecule }) # move to partnerDetails node
    : $p->{ aceObject }; # partnerDetails node was provided

  if (!defined($nAceObject)) {
    $logger->error("No Partner details for $p->{ biomolecule } in " . $p->{ aceObject }->name);
    return undef;
  }
  my $featureTree = $nAceObject->at('Feature', 1);
  if (!defined($featureTree)) {
    $logger->trace($p->{ aceObject }->name . ' has no Features');
    return undef;
  }
  
  my @data;
  my $cnt = 0;
  while (defined (my $currAceObject = $featureTree->down($cnt)) ){
    $cnt++;
    $currAceObject = $currAceObject->right(2);
    if (!defined ($currAceObject)) {
      $logger->error("unexpected empty Feature value at Experiment tag");
      next;
    }
    $logger->trace("browsing partnerDetails at (" .  $currAceObject->name .
		   "):\n" . $currAceObject->asString);
    
    ($currAceObject->{ name } ne $DATA_TYPE) && next;
    my $tmpData = {
		   ptmChoice => undef,
		   ptmType => undef,
		   ptmData => undef,
		  };
    my @values = $currAceObject->at('Post_Translation_Modification_Choice');
    $tmpData->{ 'ptmChoice' } = @values > 0
      ? $values[0]->name : undef;
    @values = $currAceObject->at('Post_Translation_Modification_Type');
    $tmpData->{ ptmType } = @values > 0
      ? $values[0]->name : undef;
    my $tmpObj = $currAceObject->at('Post_Translation_Modification_Data');
    $tmpData->{ ptmData } = newPort::featureSingleton::get($tmpObj);
    push @data, $tmpData;
  }
  (@data == 0) && return undef;
  $logger->trace("Returning PTM Data " . Dumper(@data));

  return {
	  type => 'postTranslationalModificationData',
	  supportingExperiment => $class eq "Experiment" ? $p->{ aceObject }->name : undef,
	  data => \@data
	 };
}

1;
