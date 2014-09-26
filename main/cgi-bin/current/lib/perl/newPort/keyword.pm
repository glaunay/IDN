package newPort::keyword;

use strict;
use Data::Dumper;

use common;
use newPort::biomolecule;

use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::keyword");


sub get {
  my $p = shift;
  my $aceObject;
  if (defined ($p->{ name })) {
    $aceObject = $p->{ DB }->fetch(Keywrd => $p->{ name });
    if ( !defined ($aceObject) ) {
      $logger->error("$p->{ name } returned no ace Object");
      return {};
    }
  } else {
    $logger->error("You provided no name");
    return {};
  }
  
  return {
	  name => $aceObject->name,
	  identifier   => getIdentifier($aceObject),
	  definition   => getDefinition($aceObject),
	  synonym      => getSynonym($aceObject),
	  category   => getCategory($aceObject),
	  biomolecules => getBiomolecules($aceObject, $p->{ DB }),
	  biomoleculeNumber => cntBiomolecule ($aceObject, $p->{ DB })
	 };
} 

sub getIdentifier {
  my $aceObject = shift;

  my @value = $aceObject->at('Identifier');
  @value == 0 && return undef;
  
  my $string = "";
  foreach my $val (@value) {
    $string .= $val->name;
  }  return $string;
}

sub getDefinition {
  my $aceObject = shift;

  my @value = $aceObject->at('Definition');
  @value == 0 && return undef;
  
  my $string = "";
  foreach my $val (@value) {
    $string .= $val->name;
  }
  
  return $string;
}

sub getSynonym {

  my $aceObject = shift;
  my @value = $aceObject->at('Synonym');
  @value == 0 && return undef;
  
  my $string = "";
  foreach my $val (@value) {
    $string .= $val->name;
  }
  
  return $string;
}

sub getCategory {
  my $aceObject = shift;
  my @value = $aceObject->at('Category');
  @value == 0 && return undef;
  
  my $string = "";
  foreach my $val (@value) {
    $string .= $val->name;
  }
  
  return $string;
}

sub cntBiomolecule {
    my $aceObject = shift;
    my $DB = shift;
    my @biomoleculeObjectList = $aceObject->follow('BioMolecule');
 
    return scalar(@biomoleculeObjectList);
}


# GL -- 2014/09/26 , setting nb biomolecule hard limit to 100 elements
sub getBiomolecules {
    my $aceObject = shift;
    my $DB = shift;
    
    my $hardLimit = 100;
    
    my @biomoleculeObjectList;
    my $aceBuffer = $aceObject->at('BioMolecule');
    defined($aceBuffer) || return undef;
    $aceBuffer = $aceBuffer->right();
    while (defined $aceBuffer) {
	@biomoleculeObjectList == $hardLimit && last;
	
	my $biomolecule = newPort::biomolecule::get({name => $aceBuffer->name, DB => $DB, size => "veryShort"});
      if ( !defined($biomolecule) ){
	$logger->error($aceBuffer->name . " returned no biomolecule data container");
	next;
      }
      $logger->trace(Dumper($biomolecule));
      push @biomoleculeObjectList, $biomolecule;
      $aceBuffer = $aceBuffer->down();
    }
    
    return \@biomoleculeObjectList;
}
