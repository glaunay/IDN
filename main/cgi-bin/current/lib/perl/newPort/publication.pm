package newPort::publication;

use strict;
use warnings;
use Data::Dumper;

use newPort::biomolecule;

use common;

use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::publication");

# when called from a publication, experiment context use the argument 
# size === 'short' to avoid circular reference

sub get {
  my $p = shift;

  my $aceObject;
  if (defined ($p->{ name })) {
    $aceObject = $p->{ DB }->fetch(Publication => $p->{ name });
    if ( !defined ($aceObject) ) {
      $logger->error("$p->{ name } returned no ace Object");
      return {};
    }
  } elsif(defined ($p->{ aceObject })) {
    if (($p->{ aceObject }->class() ne "Publication") ) {
      $logger->error("You provided an unexpected ace object");
      return {};
    }
    $aceObject = $p->{ aceObject }->follow(); # could follow here for safety
  } else {
    $logger->error("You provided no name");
    return {};
  }
  
  my $size = defined($p->{ size }) ? $p->{ size } : 'long';
  if ($size eq "short") {
    return {
	    name => $aceObject->name,
	    imexId => getImexId($aceObject)
	   }; 
  }

  return {
	  name => $aceObject->name,
	  title => getTitle($aceObject),
	  journal => getJournal($aceObject),
	  date => getDate($aceObject),
	  Abstract => getAbstract($aceObject),
	  biomolecule => getBiomolecule($aceObject),
	  association => getAssociation($aceObject),
	  imexId => getImexId($aceObject),
	  copyright => getCopyright($aceObject),
	  firstAuthor => getFirstAuthor($aceObject),
	  authorList => getAuthorList($aceObject),
	  contactEmail => getContactEmail($aceObject),
	  availability => getAvailabilty($aceObject)
	 };
}

sub getTitle {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Title', 1);
  defined ($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getJournal {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Journal', 1);
  defined ($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getAbstract {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Abstract', 1);
  defined ($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}
# deference biomolecule throuh association and 
# fill the biolmolecule datastructure
sub getBiomolecule {
  my $aceObject = shift;
  my $biomoleculeSet = {};

  my $aceBuffer = $aceObject->at('Association', 1);
  defined ($aceBuffer) || return undef;
  while (defined($aceBuffer)) {
    my $aceSubBuffer = $aceBuffer->follow();
  #  $logger->trace("WTTM:\n" . Dumper($aceSubBuffer));
    my @biomoleculeList = $aceSubBuffer->get('Biomolecule');
    
  #  $logger->trace("WTTM:\n" . Dumper(@biomoleculeList));
    
    foreach my $biomolecule (@biomoleculeList) {
      defined ($biomoleculeSet->{ $biomolecule->name }) && next;
      my $aceTmpBuffer = $biomolecule->follow();
      $biomoleculeSet->{ $biomolecule->name } = newPort::biomolecule::get({ aceObject => $aceTmpBuffer, size => 'veryShort' });
      $logger->trace("Current Biomolecule structure:\n" . Dumper($biomoleculeSet->{ $biomolecule->name }));
    }
    $aceBuffer = $aceBuffer->down();
  }
  
  return $biomoleculeSet;
}

sub getDate {
  my $aceObject = shift;
  
  my $aceBuffer = $aceObject->at('Date', 1);
  defined ($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getAssociation {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Association', 1);
  defined ($aceBuffer) || return undef;
  my @data;

  while (defined($aceBuffer)) {
    push @data, getRefExperiment({ 
				  association => $aceBuffer,
				  pmid => $aceObject->name
				 });
    $aceBuffer = $aceBuffer->down();
  }
  return \@data;
}
# get through an association object and return only 
# the experiments described in current pmid
sub getRefExperiment {
  my $p = shift;
  my $aceObject = $p->{ association }->follow();
  my @biomolecule = $aceObject->get('Biomolecule');
  my @partners = map { $_->name } @biomolecule;
  if (@partners == 1) { push @partners, $partners[0]; }
  
  my $data = {
	      partners => \@partners,
	      association => $p->{ association }->name,
	      supportingExperiment => []
	     };
  
  my @expAceObjList = $aceObject->get('Experiment');
  foreach my $expAceObj (@expAceObjList) {
    ($expAceObj->name !~ /_$p->{pmid}_/ ) && next;
    push @{ $data->{ supportingExperiment } }, $expAceObj->name;
  }
  return $data;
}

sub getImexId {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('IMEx_ID', 1);
  defined ($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getCopyright {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Copyright', 1);
  defined ($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getFirstAuthor {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('First_Author', 1);
  defined ($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}

sub getAuthorList {
  my $aceObject = shift;

  my $aceBuffer = $aceObject->at('Author', 1);
  defined($aceBuffer) || return undef;

  my @data;
  while (defined($aceBuffer)) {
    push @data, $aceBuffer->name;
    $aceBuffer = $aceBuffer->down();
  }
  
  return \@data
}

sub getContactEmail {
  my $aceObject = shift;
  return undef;
}

sub getAvailabilty {
  my $aceObject = shift;
  return undef;
}



=pod
Title ?Text
             Author ?Author XREF Published
             Journal ?Text
             Date Text
             Abstract ?Text
             FilledPubmed // if present, fields above have been filled by querying pubmed
             BioMolecule ?BioMolecule XREF Biblio  // from swissprot
             Association ?Association XREF PMID  // from HPRD and our curation
             IMEx_ID UNIQUE Text // Unique IMEx Id of the publication
             Copyright Text //IMEx request
             First_Author Text // from MINT, IntAct
             AuthorList Text // from IntAct
             Contact_email Text // from IntAct
             Availability Text // website ?
=cut

1;
