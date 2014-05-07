package newPort::featureSingleton;
use strict;
use warnings;

use Data::Dumper;

use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::featureSingleton");

#Wrap reange in larger datacontrainer 
# replace all range call in all uper package

# returns a collection of range data



sub get {
  my $aceObject = shift;
  defined ($aceObject) || return {};
  
  my @eligibleNode = qw /Binding_Site_Data Point_Mutation_Data Post_Translation_Modification_Data Polyprotein_Fragment_Data 
			Unknown_Biological_Feature_Data Known_Experimental_Feature_Data Unknown_Experimental_Feature_Data/;
  my $nodeType = $aceObject->name;
  if (!common::listExist(\@eligibleNode, $nodeType)) {
    $logger->error("\"$nodeType\" is not a valid tag for featureData extraction");
    return {};
  }
  my $dataContainer = {
		       rangeData => [],
		       name => undef,
		       otherData => undef,
		       detectionMethod => undef,
		      };
  my $aceBuffer = $aceObject->at('name', 1);
  $dataContainer->{ name } = defined($aceBuffer) ? $aceBuffer->name : undef;
  $aceBuffer = $aceObject->at('Other_data', 1);
  $dataContainer->{ otherData } = defined($aceBuffer) ? $aceBuffer->name : undef;
  $aceBuffer = $aceObject->at('Detection_Method', 1);
  $dataContainer->{ detectionMethod } = defined($aceBuffer) ? $aceBuffer->name : undef;
  
  my @ranges = $aceObject->at('Range');
  foreach my $r (@ranges) {
    $logger->trace("Stripping Range: " . $r->asString);
    my $tmpRangeData = {
			Position_start => undef,
			Status_start => undef,
			Position_end => undef,
			Status_end => undef
		       };
    foreach my $rKey (keys(%{$tmpRangeData})) {
      my $tVar = $r->at($rKey);
      if (defined($tVar)) {
	$tVar = $tVar->right();
	$tmpRangeData->{ $rKey } = defined($tVar) ? $tVar->name : undef;
      }
    }
    push @{ $dataContainer->{ rangeData } }, $tmpRangeData;
  }

  (@{$dataContainer->{ rangeData }} == 0 
   && !common::slid($dataContainer->{ name }, $dataContainer->{ otherData }, $dataContainer->{ detectionMethod })
  ) && return undef;
  
  return $dataContainer;
}
