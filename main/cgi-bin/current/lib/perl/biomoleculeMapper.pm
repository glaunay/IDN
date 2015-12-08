package biomoleculeMapper;
use strict;
use Data::Dumper;
use JSON;
use Log::Log4perl qw(get_logger);

our $logger = get_logger ("biomoleculeMapper");

# wraper to matrixdb others DB biomolecule data mapper
#
sub new {
    my $class = shift;
    my $p = common::arg_parser(@_);
    
    $logger->trace("$p->{ template }");
    #my $t = `ls`;
    #$logger->trace("$t");
    
    open JSON, "<$p->{ template }" || $logger->logdie( $! );
    my @string = <JSON>;
    close JSON;
    
    my $self = decode_json(join ('', @string));
    bless $self, $class;
    
    return $self;
}

=pod
 check if belongs to registered matrixdb mutable biomolecule
  single parameter,  key => $string
=cut
sub isMatrixdbRegistred {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    (exists ($self->{ dictionary }->{ $p->{ key } })) || return 0;
    $self->{ dictionary }->{ $p->{ key } }->{ isa } eq "matrixdbKey" && return 1;
    
    return 0;
}

sub isRegularRegistred {
    my $self = shift;
    my $p = common::arg_parser (@_);

    (exists ($self->{ dictionary }->{ $p->{ key } })) || return 0;
    $self->{ dictionary }->{ $p->{ key } }->{ isa } eq "matrixdbKey" && return 0;
    
    return 1;
}


=pod
    mutate any biomolecule key into its matrixdb equivalent if any
    otherwise return the single parameter "key" string
=cut
sub mutateToMatrixdb {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    if (exists ($self->{ dictionary }->{ $p->{ key } })) {
	my $node = $self->{ dictionary }->{ $p->{ key } };
	($node->{ isa } ne "matrixdbKey") && return $node->{ matrixdbKey };	
    }
    
    $logger->trace ("could not mutate to matrixdb \"$p->{ key }\"");
    return $p->{ key };
}

=pod
    mutate any biomolecule key into its outer equivalent if any
    otherwise return the single parameter "key" string
=cut
sub mutateToRegular {
    my $self = shift;
    my $p = common::arg_parser (@_);
    
    if (exists ($self->{ dictionary }->{ $p->{ key } })) {
	my $node = $self->{ dictionary }->{ $p->{ key } };
	if ($node->{ isa } eq "matrixdbKey"){
	    foreach my $allowedKeyType (@{$self->{ keyType }}) {
		(exists($node->{ $allowedKeyType })) &&
		return $node->{ $allowedKeyType };	
	    }	    
	}
    }
    
    $logger->trace ("could not mutate to regular \"$p->{ key }\"");
    return $p->{ key };
}

sub listMutate {
    my $self = shift;
    my @types = qw /toRegular toMatrixdb/;
    my $p = common::arg_parser(@_);
    
    (common::slid($p->{ type }, $p->{ input })) || $logger->logdie('unproper arguments');
    common::listExist(\@types, $p->{ type }) || $logger->logdie("$p->{ type } is not a recognized command");
    
    my @array;           
    foreach my $string (@{ $p->{ input }}){
	my $value;
	if ($p->{ type } eq 'toRegular') {
	    $value = $self->mutateToRegular(key => $string);	    
	} else {
	    $value = $self->mutateToMatrixdb(key => $string);	    
	}
	push @array, $value;
    }
    
    $logger->trace ("returning " . Dumper(@array));

    return \@array;
}


1;

