package newPort::author;

use strict;
use Data::Dumper;

use common;
use newPort::publication;

use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::author");


sub get {
  my $p = shift;
  my $aceObject;
  if (defined ($p->{ name })) {
    $aceObject = $p->{ DB }->fetch(Author => $p->{ name });
    if ( !defined ($aceObject) ) {
      $logger->error("$p->{ name } returned no ace Object");
      return {};
    }
  } else {
    $logger->error("You provided no name");
    return {};
  }
  
  my $aceBuffer = $aceObject->at('Published', 1);
  my @list;
  while (defined($aceBuffer)) {
    my $publicationContainer = newPort::publication::get({ name => $aceBuffer->name, DB => $p->{ DB } });
    push @list, $publicationContainer;
    $aceBuffer = $aceBuffer->down();
  }
  
  return {
	  name => $aceObject->name,
	  publications => \@list
	 };
}

1;
