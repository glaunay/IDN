package localSocket;
use strict;
use common;
use JSON;
use Sereal qw (encode_sereal decode_sereal);
use Data::Dumper;
use Scalar::Util qw(blessed dualvar isweak readonly refaddr reftype tainted
                        weaken isvstring looks_like_number set_prototype);
use Log::Log4perl qw (get_logger);
our $logger = get_logger("localSocket");




=pod Local Socket DIALOG MANAGER
    Provide a soft interface
    -> wrap socket request 
    -> answers can be delivered as suitable datacontainer to call application

    use Sereal to increase dialog speed

    isSonOf => { selectors(ex : id => 'MI:0000') };
=cut

sub runCvRequest {
    my $p = common::arg_parser (@_);
        
    (common::slid($p->{ with }, $p->{ from }, $p->{ selectors })) ||
	die "Missing arguments to runCvRequest " . Dumper ($p);
    
    (common::sloft ($p->{ askFor }, $p->{ isSonOf })) 
	|| die "Missing arguments to runCvRequest " . Dumper ($p);

    my %selectors = %{$p->{ selectors }};

# clean the selector multiple parenthesis embeded cause server side regexp to fail
    foreach my $key (keys(%selectors)) {
	$selectors{$key} =~ s/^([^\(]+).*$/$1/;
    }

    
    if ($p->{ from } eq "matrixDB") {
	# selector is a ace object we convert its attr to strings
	foreach my $k (keys(%selectors)) {
	    my $class = blessed $selectors{ $k };
	    if (defined ($class)) {
		($class eq "Ace::Object") || die "unknown object class \"$class\"";
		$selectors{ $k } = $selectors{ $k }->name;
		$logger->info ("blessed as $class extracting scalar \"$selectors{ $k }\"");
	    }
	    $selectors{ $k } =~ s/_/ /g;
	}


    } elsif ($p->{ from } eq "psicquic") {
	# nothing to do here
	
    }
    
    my $request = {
	type => 'cvRequest',
	content => {	   
	    selectors => \%selectors,
	    content => {}
	}
    };

    if (defined ($p->{ askFor })) {
		$request->{ content }->{ askFor } = $p->{ askFor };
    }
    if (defined ($p->{ isSonOf })) {
		$request->{ content }->{ isSonOf } = $p->{ isSonOf };
    }
    
    my $jsonRequest = encode_sereal ($request);
    my $socketIO = $p->{ with };
    $logger->trace("socket request content:$jsonRequest\n####\n");
    print $socketIO $jsonRequest . "\n";
    $logger->trace(Dumper($socketIO));
    my $answer;
    while (my $line = <$socketIO>) {
	  $logger->trace("buffer:$line");
	#  chomp $line;
	$answer .= $line;
	if ($answer =~ /<EOMSG>/) {
	    $answer =~ s/<EOMSG>//;last;
	}
    }

    
    $logger->trace("About to decode\n##\n$answer\n##\n");
    my $response = decode_sereal ($answer);
    
    if ($response->{ status } eq "processed") {
	if (exists ($response->{ content }->{ dataValue })) {
	    my $dataValue = $response->{ content }->{ dataValue }->[0];			
	    return $dataValue;
	}
    }	    	    

}

=pod
interface to get a go node datacontainer OR get slim representant

=cut
sub runGoRequest {
      my $p = common::arg_parser (@_);
      

      my $validRequestList = ['goSlimSelector', 'goNodeSelector'];

      (common::slid($p->{ type }, $p->{ with }, $p->{ selectors })) ||
	  die "Missing arguments to runGoRequest " . Dumper ($p);
      common::listExist ($validRequestList, $p->{ type }) ||
	  $logger->logdie(" $p->{ type } is not a registred request (@{$validRequestList})");
      
      my $socketIO = $p->{ with };
      $logger->info("running goRequest \"$p->{ type }\" selectors set is :\n" . Dumper ($p->{ selectors }));
      
      my $request = {
	  type => 'goRequest',
	  content => {
	      $p->{ type } => $p->{ selectors }
	  }
      };
      # GO request
      my $string  = encode_sereal ($request);
      $logger->trace("socket request content:$string\n####\n");      
      print $socketIO $string . "<EOMSG>\n";
      my $answer;
      while (my $line = <$socketIO>) {
	#  $logger->trace("buffer:$line");
	  #  chomp $line;
	  $answer .= $line;
	  if ($answer =~ /<EOMSG>/) {
	      $answer =~ s/<EOMSG>//;last;
	  }
      }
#      chomp $answer;
      $logger->trace("socket buffer conten for DECODING:\n$answer\n####\n");
      
      my $response = decode_sereal ($answer);
      
      if ($response->{ status } eq "processed") {
	  if (exists ($response->{ content }->{ dataValue })) {
	      if ($p->{ type } eq 'goNodeSelector') {
		  my $dataValue = $response->{ content }->{ dataValue };			
		  return $dataValue;
	      }
	  }
      }	
      
}

1;


