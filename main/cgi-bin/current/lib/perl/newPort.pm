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
use newPort::author;
use newPort::keyword;


use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort");

sub getData {
  my $p = shift;
  
  common::slid($p->{ type }, $p->{ value }, $p->{ DB }) || 
      $logger->logdie("type/value/DB parameter required :\n" . Dumper($p));

  my $dataContainer = {};  
  my $context = defined ($p->{ context }) ? $p->{ context } : 'contentReport';

  if ($p->{ type } eq "biomolecule") {
    my $size = $context eq "networkNode" ? 'veryShort' 
      : $context eq "networkNodeEnrichment" ? 'short ': 'long';
    $dataContainer = newPort::biomolecule::get({name => $p->{ value }, 
						DB => $p->{ DB }, size => $size});
    
    $dataContainer->{ type } = $p->{ type };
    if ($context eq 'networkNode' || $context eq 'networkNodeEnrichment') {
      if ($dataContainer->{ name } =~ /^MULT/) {
	$dataContainer->{ type } = 'multimer'; 
      } elsif ($dataContainer->{ name } =~ /^CAT/) {
	$dataContainer->{ type } = 'cation'; 
      } elsif ($dataContainer->{ name } =~ /^PFRAG/) {
	$dataContainer->{ type } = 'fragment'; 
      } elsif ($dataContainer->{ name } =~ /^LIP/) {
	$dataContainer->{ type } = 'lipid'; 
      } elsif ($dataContainer->{ name } =~ /^GAG/) {
	$dataContainer->{ type } = 'glycosaminoglycan'; 
      } elsif (common::isUniprotID(string => $dataContainer->{ name })) {
	$dataContainer->{ type } = 'protein'; 
      } else {	
	$dataContainer->{ type } = 'biomolecule'; 
      }
    }
  }

 if ($p->{ type } eq "experiment") {
     my $param = { name => $p->{ value }, DB => $p->{ DB } };
     if ($p->{ cvSocket }) {$param->{ cvSocket } = $p->{ cvSocket };}
    $dataContainer = newPort::experiment::get($param);
    $dataContainer->{ type } = $p->{ type };
  }

  if ($p->{ type } eq "association") {
    $dataContainer = newPort::association::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
    bindBiomoleculeData ({associationContainer => $dataContainer, DB => $p->{ DB }});
  }

  if ($p->{ type } eq "publication") {
    $dataContainer = newPort::publication::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
  }

  if ($p->{ type } eq "author") {
    $dataContainer = newPort::author::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
  }

  if ($p->{ type } eq "keywrd") {
    $dataContainer = newPort::keyword::get({name => $p->{ value }, DB => $p->{ DB }});
    $dataContainer->{ type } = $p->{ type };
  }

  $logger->trace("newPort interface returning:\n" . Dumper($dataContainer));  
  return $dataContainer;
}


sub bindBiomoleculeData {
  my $p = shift;
  $p->{ associationContainer }->{ partnerCommon } = {};
  foreach my $biomoleculeName (@{ $p->{ associationContainer }->{ partnerNames } }) {
    my $biomoleculeContainer =  newPort::biomolecule::get({name => $biomoleculeName, DB => $p->{ DB }, size => 'veryShort'});
    $p->{ associationContainer }->{ partnerCommon }->{ $biomoleculeName } = $biomoleculeContainer->{ common };
    $p->{ associationContainer }->{ partnerCommon }->{ $biomoleculeName }->{ specie } = $biomoleculeContainer->{ specie };
  }
}

sub getInteractomTemplate {
  return {
	  index => undef,
	  name => undef,
	  common => undef,                                  
	  biofunc => undef,
	  tissue => [],
	  uniprotKW => [],
	  pfam => [],
	  tpm => [],
	  go => [],
	  gene => {
		   geneName => [],
		   synonym => [],
		uniGene => []
	    }, 	    
	  specie => undef,	    
	  type => undef,
	  relationship => {
			   isFragmentOf => [],
			   hasFragment => [],
			   hasComponent => [],
			   isComponentOf => [],
			   boundTo => [] 
			  },
	  location => [],
	  id => undef
	 };
}
1;
