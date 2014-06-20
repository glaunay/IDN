#!/usr/bin/perl

use lib qw (../lib/perl);


use strict;
use common;

use FileHandle;
use Data::Dumper;
use CV::mi;
use JSON; # for tree definition
use Sereal qw (encode_sereal decode_sereal); # for socket data exchange
use IO::Handle;
use IO::Socket::UNIX qw( SOCK_STREAM SOMAXCONN );
use Log::Log4perl qw(get_logger :levels);

our $socket;
$| = 1;
=pod Local socket Server implementation of mi cv ontology
=cut

Log::Log4perl->init("../conf/miServerDevel.conf");
my $logger = get_logger();


my $p = common::argumentManager (argumentArray => \@ARGV, usage => \&usage, ruler => \&checkArguments);
my $socket_path = $p->{ '-socket' };
unlink($socket_path);
my $logFile = "${socket_path}.log";

our $fhLOG = FileHandle->new("> $logFile");


$fhLOG->autoflush;
$fhLOG->print("Server Loading...\n");

my $cvObject = mi->new (seed => $p->{ '-data' }, logFile => $fhLOG);
$fhLOG->print ("Server running...\n");


my $listner = IO::Socket::UNIX->new(
   Type   => SOCK_STREAM,
   Local  => $socket_path,
   Listen => SOMAXCONN,
)
    or die("Can't create server socket: $!\n");

our $responseTemplate = {
    status => '',
    content => {}
};

my $time = common::getTime();
$fhLOG->print ("#$time\n#Opening new server connection\n");


while (1) {
    $socket = $listner->accept()
	or die("Can't accept connection: $!\n");
    
    while ( my $line = <$socket> ) {
	chomp $line;
	$time = common::getTime();
	$fhLOG->print ($time . "Client rawInput: \"$line\"\n");
    	my $requestObject = decode_sereal ($line);
	_requestHandler ($requestObject) ||
	    _answerError();
    
    }
}
$time = common::getTime();
$fhLOG->print ("#$time\n#Closing server connection\n\n\n");
$fhLOG->close;


##### SUB ROUTINES ########

sub answerError {
    my %hash = %{$responseTemplate};
    my $ans = \%hash;
    $ans->{ status } = 'Server error';
    _sendContainer ($ans);
}

sub _requestHandler {
    my $requestContainer = shift;
    
    my %template = %{$responseTemplate}; 
    my $responseContainer = \%template;
    my $string;

    if (!defined ($requestContainer->{ type })) {
	$responseContainer->{ status } = "no provided type";	
	_sendContainer ($responseContainer);
	return 1;
    }
    
    if ($requestContainer->{ type } eq "cvRequest") {	
	if (!exists ($requestContainer->{ content })) {
	    $responseContainer->{ status } = "no content provided for cvRequest type";	   
	} else {
	    my $container = $cvObject->request($requestContainer->{ content });
	    $responseContainer->{ status } = "processed";
	    $responseContainer->{ content } = $container;	
	}
	_sendContainer ($responseContainer);
	return 1;
    }
    
    return 0;
}


sub _sendContainer {
    my $container = shift;
    my $string = encode_sereal ($container);
    
    print $socket $string . "<EOMSG>\n";   
}

sub usage {
    print STDERR "Usage:\tmiServer.pl -data [ONTOLOGY DESCTIPTION JSON FILE] -socket [SOCKET_FILE]\n" .
	"Please note that a  SOCKET_FILE.log log file will be created\n" .
	"\texample:\n sudo -u apache nohup ./miServer.pl -socket /tmp/miSocket -data /var/www/matrixdb2/main/services/data/psimi_obo.json\n";
}
sub checkArguments {
    my $p = shift;

    common::slid($p->{ '-socket' }, $p->{ '-data' }) || return 0;

    return 1;
}


