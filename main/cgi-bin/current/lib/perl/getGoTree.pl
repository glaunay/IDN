#!/usr/bin/perl

use strict;
use warnings;
use IO::Socket::UNIX qw( SOCK_STREAM );
use Log::Log4perl qw(get_logger);
use JSON;
use Dumper::Data;
use localSocket;

=pod
    130622 OBJ: reduce idle time for navigator user, getGraphData runtime must be reduced.
    -> delegate the feeding of filter component to ajax.

    This script handle ajax call for the sorting of the go terms present at a given moment among the node of 
    a network.

    - The main input parameter is the list of all nodes out of d3.data.
    - The nodes must be fully annotated whether from ariane or from jsdas.
    - The script performs a set of LocalSocket::GoTermRequest;


=cut


 my $socket = IO::Socket::UNIX->new(
     Type => SOCK_STREAM,
     Peer => '/tmp/goServer',
    )
    or $logger->logdie("Can't connect to server: $!");

# see howclassifiacation is achieved in network statitics

#localSocket::runGoRequest(with => $self->{ socketMappers }->{ 'GO' }

