package newPort::association;
use strict;
use Data::Dumper;

use common;
use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::association");

=pod
  Kind    Genuine     PMID    20138147
                      Experiment      Q61508__Q9R0G6_20138147_MatrixDB_1
                                      Q61508__Q9R0G6_20138147_MatrixDB_2
                                      Q61508__Q9R0G6_20138147_MatrixDB_3
                                      Q61508__Q9R0G6_20138147_MatrixDB_4
                                      Q61508__Q9R0G6_20138147_MatrixDB_5
                                      Q61508__Q9R0G6_20138147_MatrixDB_6
                                      Q61508__Q9R0G6_20138147_MatrixDB_7
          Inferred    Supports    P49747__Q16610
  Partner     BioMolecule     Q61508
                              Q9R0G6
  Source      MatrixDB

=cut


=pod
Association PFRAG_4_human__Q14112
  Kind    Inferred    InferredFrom    PFRAG_4_mouse__Q14112
  Partner     BioMolecule     PFRAG_4_human
                              Q14112

=cut


sub get {
  my $p = shift;

  my $aceObject;
  if (defined ($p->{ name })) {
    $aceObject = $p->{ DB }->fetch(Association => $p->{ name });
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
	  type => getStatus($aceObject),
	  publication => getPublication($aceObject),
	  supportByAssociation => getInferrence($aceObject),
	  supportToAssociation => getSupportTo($aceObject),
	  directExperiments => getExperiments($aceObject),
	  sourceDatabases => getSourceDatabase ($aceObject),
	  partnerNames => getPartnerNames ($aceObject)
	 };
}

sub getPartnerNames {
  my $aceObject = shift;
  
  my @aceBuffers = $aceObject->follow('BioMolecule');
  
  my @names = map {$_->name;} @aceBuffers;

  @names == 0 && return undef;
  return \@names;
}

sub getStatus {
  my $aceObject = shift;
  
  return defined ($aceObject->at('Genuine')) ? "Genuine" : "Inferred";
}

sub getPublication {
  my $aceObject = shift;

  my @data;
  foreach my $aceBuffer ($aceObject->follow('PMID')) {
    push @data, $aceBuffer->name;
  }
  (@data == 0) && return undef;
  
  return \@data;
}

sub getInferrence {
  my $aceObject = shift;

  my @data;
  foreach my $aceBuffer ($aceObject->follow('InferredFrom')) {
    push @data, $aceBuffer->name;
  }

  (@data == 0) && return undef;
  return \@data;
}

sub getSupportTo {
  my $aceObject = shift;
  
  my @data;
  foreach my $aceBuffer ($aceObject->follow('Supports')) {
    push @data, $aceBuffer->name;
  }
  
  (@data == 0) && return undef;
  return \@data;
}

sub getExperiments {
  my $aceObject = shift;
  my @data;
  foreach my $aceBuffer ($aceObject->follow('Experiment')) {
    push @data, $aceBuffer->name();
  }
  (@data == 0) && return undef;
  
  return \@data;
}

sub getSourceDatabase {
  my $aceObject = shift;
  my $aceBuffer = $aceObject->at('Source', 1);
  defined($aceBuffer) || return undef;
  my @data;
  while (defined($aceBuffer)) {
    push @data, $aceBuffer->name;
    $aceBuffer = $aceBuffer->down();
  }
  
  return \@data;
}


1;



