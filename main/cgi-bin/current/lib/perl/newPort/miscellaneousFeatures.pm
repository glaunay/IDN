package newPort::miscellaneousFeatures;

use strict;
use Data::Dumper;

use common;
use newPort::featureSingleton;

use Log::Log4perl qw(get_logger :levels);
my $logger = get_logger ("newPort::miscellaneousFeatures");
$logger->level($ERROR);

=pod
    similar to bindingSite, except that several instance scan be found 
     + 2 data types (Known/Unknwon ExperimentalFeature) wrapped in single package
=cut

our @DATA_TYPES = qw /Known_Experimental_Feature Unknown_Experimental_Feature/;

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
    
    (!common::listExist(\@DATA_TYPES, $currAceObject->{ name })) && next;
    $logger->warn("subtype : " . $currAceObject->{ name });
    my $tmpData = $currAceObject->{ name } eq "Known_Experimental_Feature" ?
      { type => undef, data => undef, domain => undef }:
      { type => undef, data => undef };
    my $prefix = $currAceObject->{ name } eq "Known_Experimental_Feature" ?
      "Known_" : "Unknown_";
    
    my @values = $currAceObject->at($prefix . 'Experimental_Feature_Type');
    $tmpData->{ 'featureType' } = @values > 0
      ? $values[0]->name : undef;
    my $tmpObj = $currAceObject->at($prefix . 'Experimental_Feature_Data');
    $tmpData->{ data } = newPort::featureSingleton::get($tmpObj);
    push @data, $tmpData;
  }
  (@data == 0) && return undef;
  $logger->trace("Returning Miscellaneous Data " . Dumper(@data));
  
  return {
	  type => 'miscellaneousFeatures',
	  supportingExperiment => $class eq "Experiment" ? $p->{ aceObject }->name : undef,
	  data => \@data
	 };
}

1;
