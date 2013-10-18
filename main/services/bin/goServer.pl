#!/usr/bin/perl

use lib qw (../lib/perl);

=pod Local socket Server implementation of go ontology
    
    Using Sereal for socket Data exchange;
    sudo -u apache nohup ./goServer.pl -socket /tmp/goSocket
=cut


use strict;
use common;
use Data::Dumper;
use JSON;  # for tree definition
use Sereal qw (encode_sereal decode_sereal); # for data exchange
use CV::go; 
use FileHandle;
use IO::Socket::UNIX qw( SOCK_STREAM SOMAXCONN );

our $socket;
$| = 1; # Flush after every write

my $p = common::argumentManager (argumentArray => \@ARGV, usage => \&usage, ruler => \&checkArguments);
my $socket_path = $p->{ '-socket' };
unlink($socket_path);
my $logFile = "${socket_path}.log";


our $fhLOG = FileHandle->new("> $logFile");

$fhLOG->autoflush;
$fhLOG->print("Server Loading...\n");
#my $goObject = go->new (seed => '/var/www/matrixdb_2/main/data/go.json', subset => { namespace => 'cellular_component'});
my $goObject = go->new (seed => $p->{ '-data' }, options => ['NoWire'], logFile => $fhLOG);
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

my $buffer = "";
while (1) {
    $socket = $listner->accept()
	or die("Can't accept connection: $!\n");
#    select((select($socket), $|=1)[0]);
    while ( my $line = <$socket> ) {
	#chomp $line;
        $buffer .= $line;
	($line =~ /<EOMSG>/) || next;
	$buffer =~ s/<EOMSG>//;
	$time = common::getTime();
	$fhLOG->print ($time . "Client rawInput: \"$buffer\"\n");
    	my $requestObject = decode_sereal ($buffer);
	$fhLOG->print ("data structure :\n". Dumper($requestObject));
	_requestHandler ($requestObject) ||
	    _answerError();
	$buffer = "";
	
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
    
    if ($requestContainer->{ type } eq "goRequest") {	
	if (!exists ($requestContainer->{ content })) {
	    $responseContainer->{ status } = "no content provided for goRequest type";	   
	} else {
	    my $container = $goObject->request($requestContainer->{ content });
	    if (!defined ($container)) {
		$responseContainer->{ status } = "server error";
	    } else {
		$responseContainer->{ status } = "processed";
		$responseContainer->{ content } = $container;	
	    }
	}
	_sendContainer ($responseContainer);
	return 1;
    }
    
    return 0;
}


sub _sendContainer {
    my $container = shift;
    
    $fhLOG->print("Packing container:\n" . Dumper($container)."\n");
    my $string = encode_sereal ($container);
    
    $fhLOG->print("rawstring is \"$string\"<EOMSG>\n");
    print $socket $string . "<EOMSG>\n";
    
}


sub usage {
    print STDERR "Usage:\tgoServer.pl -data [ONTOLOGY DESCTIPTION JSON FILE] -socket [SOCKET_FILE]\n" . 
	"Please note that a  SOCKET_FILE.log log file will be created\n" . 
	"\texample:\n sudo -u apache nohup ./goServer.pl -socket /tmp/goSocket -data /var/www/matrixdb2/main/services/data/go.json\n";
}
sub checkArguments {
    my $p = shift;

    common::slid($p->{ '-socket' }, $p->{ '-data' }) || return 0;
	
    return 1;
}
