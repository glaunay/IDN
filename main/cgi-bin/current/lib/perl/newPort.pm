package newPort;
=pod
Interface to multiple ace object type json converter
=cut
use strict;
use common;
use Data::Dumper;

use newPort::biomolecule;
use newPort::experiment;
use newPort::association;
use newPort::publication;


use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort");

sub getData {
  my $p = shift;
  
  common::slid($p->{ type }, $p->{ value }, $p->{ DB }) || 
      $logger->logdie("type/value/DB parameter required :\n" . Dumper($p));

  my $dataContainer = {};
  if ($p->{ type } eq "biomolecule") {
    $dataContainer = newPort::biomolecule::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
  }

 if ($p->{ type } eq "experiment") {
    $dataContainer = newPort::experiment::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
  }
  
  if ($p->{ type } eq "association") {
    $dataContainer = newPort::association::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
  }
  
  if ($p->{ type } eq "publication") {
    $dataContainer = newPort::publication::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
  }
  

  $logger->info("newPort interface returning:\n" . Dumper($dataContainer));  
  return $dataContainer;
}
