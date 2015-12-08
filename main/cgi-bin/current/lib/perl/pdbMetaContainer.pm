package pdbMetaContainer;
use strict;
use Log::Log4perl qw(get_logger :levels);

use common;
my $logger = get_logger("pdbMetaContainer");
$logger->level($ERROR);

sub new {
    my $self = {};
    my $class = shift @_;
    bless $self, $class;    
    # Optionnal constructor arguments
    my ($no_core_def, $cons_sse_blocks,$pdd_dir); 
    my $parameters = common::arg_parser (@_);    
    # Defines Core name and data location
    unless (defined ($parameters->{ CoreName })) {
       $logger->error ("No core name specifed");
        return;
    }
    $self->{ name } = $parameters->{ CoreName };
    
    if (defined ($parameters->{ CoreFolder })) {
        $self->{ location } = $parameters->{ CoreFolder };
    } elsif (defined ($parameters->{ PddDir })) {        
        $self->{ location } = $self->set_pdd_data_dir ($parameters->{ PddDir });
    } else {
        $logger->error ("unable to guess data folder location");
    }

# KAKSI Generator core or absnece of core def file
# will leave all attreriburtes untouched
# otherwise they will be resized ON THE FLY
    unless (defined ($parameters->{ CoreDef })) {
        $logger->error("No CoreDef rule specifed");
        return;
    }
    if ($parameters->{ CoreDef } ne "NONE") {
        $self->{ core_def_file } = "$parameters->{ PddDir }/cores_def/$self->{ name }.def";
        unless (-e $self->{ core_def_file }) {
             $logger->error("no such core_def file \"$self->{ core_def_file }\"");
            return;
        }
        return unless ($self->read_core_def ());
	     $logger->trace("core def successfully read from \"$self->{ core_def_file }\"");
    } #else {       
      #  print "core::new : core def read skipped for $self->{ name }\n";
    #} 
    unless (-d $self->{ location }) {
        $logger->error("no such data folder \"$self->{ location }\"");
        return;
    }
    
    $logger->trace("reading input files from " . $self->{ location });
    # Parse and read pdbnum sequence
    $self->{ pdbnum_file } = "$self->{ location }/$self->{ name }.pdbnum";
    unless (-e $self->{ pdbnum_file }) {
	$logger->error("$self->{ name } missing pdbnum file"); 
	return; 
    }    
    $self->{ pdbnum } = $self->read_words_seq ($self->{ pdbnum_file });
    unless (defined ($self->{ pdbnum })) {
	$logger->error("read_pdbnum_seq error \"$self->{ pdbnum_file }\"");
	return;
    }
        
    # Parse and read aa sequence
    $self->{ fasta_file } = "$self->{ location }/$self->{ name }.fasta";
    unless (-e $self->{ fasta_file }) {
	$logger->error("$self->{ name } missing fasta file"); 
	return; 
    }    
    $self->{ aa } = $self->read_core_fasta ( $self->{ fasta_file });
    unless (defined ($self->{ aa })) {
	$logger->error("reading fasta seq \"$self->{ fasta_file }\"");
	return;
    }
    # Parse and read sse sequence, back up on kaksi output file possible
    $self->{ sse_file } = "$self->{ location }/$self->{ name }.sse";
    unless (-e $self->{ sse_file }) {
	$logger->warn("$self->{ name } missing sse file, trying \'sse_kaksi\'");
        $self->{ sse_file } = "$self->{ location }/$self->{ name }.sse_kaksi";
        unless (-e $self->{ sse_file }) {
            $logger->error("$self->{ name }, missing sse_kaksi file too, giving up!!");
            return; 
        }
    }  
    $self->{ sse } = $self->read_core_fasta ($self->{ sse_file });
    unless (defined ($self->{ sse })) {
	$logger->error("read sse seq error \"$self->{ sse_file }\"");
	return;
    }
    # Parse and read Ca distances matrix
    $self->{ cadist_file } = "$self->{ location }/$self->{ name }.cadist";
    if (! -e $self->{ cadist_file }) {
        $logger->warn("$self->{ name } missing cadist file"); 
	# return; 
    } else {
	if (! $self->read_cc_map ($self->{ cadist_file })){
	    $logger->error("read_ca_map error \"$self->{ cadist_file }\"");
	    return;
	}
    }

# Kaksi does not provide mali blocks or states files   
    # Parse and read mali
    $self->{ mali_file } = "$self->{ location }/$self->{ name }.ali";
    unless (-e $self->{ mali_file }) {
        $logger->warn("$self->{ name } missing ali file"); 
        #return;
    } elsif ( ! $self->read_mali ($self->{ mali_file })){
        $logger->warn("new read_mali error \"$self->{ mali_file }\"");
        return;
    }        
    # Parse and read blocks sequence according to option
    my $ext = "blocks";
    $ext = "cons_sse" if (defined ($parameters->{ cons_sse_blocks }));
    $self->{ blocks_file } = "$self->{ location }/$self->{ name }.$ext";
    unless (-e $self->{ blocks_file }) {
    	$logger->warn("$self->{ name } missing blocks file"); 
    	#return; 
    } else {
        $self->{ blocks } = $self->read_words_seq ($self->{ blocks_file });
        unless (defined ($self->{ blocks })) {
            $logger->error("reading blocks seq \"$self->{ blocks_file }\"");        	
            return;
        }
    }
    # Parse and read structural states
    for my $state ( qw(S1 S3 S6 S9 S18)) {
        my $f_states = "$self->{ location }/$self->{ name }.$state";
        unless (-e $f_states) {
	    $logger->warn("\'$self->{ name }\' state \'$state\' file missing");
               #return;
        } else {
           $self->{ $state } = $self->read_words_seq ($f_states);
           unless (defined ($self->{ $state })) {
               $logger->error("reading structural state \'$state\' file");
               return;
           }
        }
    }
# All other attributes were eventuallus strip off elements outside core_def
# Only pdnbum remains to be strip   
   if (defined ($self->{ core_def_file })) {
        $self->{ pdbnum } = $self->read_words_seq ($self->{ pdbnum_file });
        unless (defined ($self->{ pdbnum })) {
            $logger->error("read_pdbnum_seq (for resize) error at $self->{ pdbnum }");
            return;
        }
    }
    
    
    
    return $self;
}
sub read_core_def {
    my $self = shift @_;
    
    #<sub_sequence>29:342</sub_sequence>
    
    open COREDEF, "<$self->{ core_def_file }" or return;
    $self->{ sub_seq_start } = ();
    $self->{ sub_seq_stop } = ();
    while (my $l = <COREDEF>) {
        if ($l =~ /<sub_sequence>(.*)<\/sub_sequence>/){
            my @subseq_array = split /,/, $1;
            foreach my $subseq (@subseq_array) {
                my ($start, $stop) = split /:/, $subseq;
                push @{$self->{ sub_seq_start }}, $start;
                push @{$self->{ sub_seq_stop }}, $stop;                
            } 
        } elsif ($l =~ /<pdb_code>(.+)<\/pdb_code>/) {
            $self->{ pdb_code } = $1;
        } elsif ($l =~ /<pdb_chain>(.+)<\/pdb_chain>/) {
            $self->{ pdb_chain } = $1;
        }
    }
    close COREDEF;
    if (@{$self->{ sub_seq_start }} > 0 && @{$self->{ sub_seq_stop }} > 0 &&
        defined ($self->{ pdb_code }) && defined ($self->{ pdb_chain })) {
        return 1;
    }
    
    $logger->error("error while parsing!");
    return;   
}

sub set_pdd_data_dir {
    my $self = shift @_;
    my $root_dir = shift @_;
    unless (defined ($root_dir)){
	$logger->error("No root directory specified!");
        return;
    }
    
    my ($sub_dir) = ($self->{ name } =~ /^.(..)./); 
    
    return $root_dir . "/" . $sub_dir . "/" . $self->{ name };
}

# core fasta is spliced on the fly according to subseq
sub read_core_fasta {
    my $self = shift @_;
    my $file = shift @_;    
    open FASTA, "<$file" or return;
    my %hash;
    my $sequence;
    $hash{'header'} = "";
    
    while (my $l = <FASTA>) {
	if ($l =~ /^>\s*(\S{1}.*)\s*$/) {	    
	    $hash{'header'} = $1;
	} elsif ($l =~ /^\s*\S+/) {
	    chomp $l;
	    $sequence .= $l;
	}
    }
    close FASTA;
        
    my @array_old = split //, $sequence;
    $hash{'sequence'} = \@array_old;

# optionnal sequence resizing if any core_def was previously loaded
    if (defined ($self->{ core_def_file })) {
        my @pdbnum_ref = @{${$self->{ pdbnum }}{'sequence'}};
        my @array_new;
        my $bool = 0;
        for (my $iseq = 0; $iseq < @{$self->{ sub_seq_start }}; $iseq++) {
            for (my $i = 0; $i < @array_old; $i++) {
                $bool = 1 if ($pdbnum_ref[$i] eq ${$self->{ sub_seq_start}}[$iseq]);
                push @array_new, $array_old[$i] if ($bool);
                $bool = 0 if ($pdbnum_ref[$i] eq ${$self->{ sub_seq_stop}}[$iseq]);            
            }
        }
        $hash{'sequence'} = \@array_new;
    }
        
    my $hash_ref = \%hash;
}

sub is_core_def {
    my $self = shift @_;
    my $ask_pdbnum = shift @_;
    
    unless (defined ($self->{ core_def_file })) {
        return 1;
    }   
# undefined coordinates return 0
    if ($ask_pdbnum =~ /[^[:print:]]+/) {
        return 0;
    }
    
    my $current_def = 0;
    my $current_status = 0;
    my @pdbnum_ref = @{${$self->{ pdbnum }}{'sequence'}};
    foreach my $pdbnum (@pdbnum_ref) {
        if ($current_def == @{$self->{ sub_seq_start }}) {
            $logger->warn("Problem with pdbnum \'$pdbnum\'");
        }
        if ($pdbnum eq $self->{ sub_seq_start }[$current_def]) {
            $current_status = 1;
        }
        return $current_status if ($pdbnum eq $ask_pdbnum);
        if ($pdbnum eq $self->{ sub_seq_stop }[$current_def]) {
            $current_status = 0;
            $current_def++;
        }
    }
    if (defined ($ENV{VERBOSE_LVL})) {
        $logger->error("no such pdbnum named \'$ask_pdbnum \' in current core sequence !");
    }
    return 0;
}

sub read_mali {
    my $self = shift @_;
    my $fmali = shift @_;
    
    @{$self->{ mali_info }} = ();
    @{$self->{ mali }} = ();
    
    my @pdbnum_ref = @{${$self->{ pdbnum }}{'sequence'}};
    my @is_coredef_array;
    for (my $n = 0; $n < @pdbnum_ref; $n++) {
        my $m = $self->is_core_def ($pdbnum_ref[$n]);
        return unless (defined ($m));
        push @is_coredef_array, $m;
    } 
    
    open MALI, "<$fmali" or return;
    my @buffer;
    while (my $l = <MALI>) {
        if ($l =~ /^>/) {
            push @{$self->{ mali_info }}, $l;
        } elsif ($l !~ /^[\s]*$/) {
            chomp $l;
            @buffer = split //, $l;
            my @sequence;
            for (my $i = 0; $i < @buffer; $i++) {
                push @sequence, $buffer[$i] if ($is_coredef_array[$i]);
            }
            push @{$self->{ mali }}, [[@sequence]];
        }
    }
    if (defined ( $ENV{'VERBOSE_LVL'})) {
        $logger->trace($self->{ name } . " msa loaded (". @{$self->{ mali }} . ")");
    }
    return 1;
}
# splice only if pdbnum is already defined
sub read_cc_map {
    my $self = shift;
    my $fca_dist = shift;
    
    my @pdbnum_ref = @{${$self->{ pdbnum }}{'sequence'}};
    
    @{$self->{ cc_map }} = ();
    my $current_absresnum = 0;

# Create a temp array on core_def status
    my @is_coredef_array;
    for (my $n = 0; $n < @pdbnum_ref; $n++) {
        my $m = $self->is_core_def ($pdbnum_ref[$n]);
        return unless (defined ($m));
        push @is_coredef_array, $m;
    }

    open CADIST, "<$fca_dist" or return;
    while (my $l = <CADIST>) {
        $l =~ s/^[\s]+//;
        my @array_old = split /[\s]+/, $l;
        if ( ! defined ($self->{ core_def_file })) {
            push @{$self->{ cc_map }}, [[@array_old]];
        } else {
            if ($is_coredef_array[$current_absresnum]) {
                my @array_new;
                for (my $i = 0; $i < @array_old; $i++) {
                    push @array_new, $array_old[$i] if ($is_coredef_array[$i]);
                }
                push @{$self->{ cc_map }}, [[@array_new]];
            }
        }
        $current_absresnum++;
    }
    return 1;
}

# splice only if pdbnum is already defined
sub read_words_seq {
    my $self = shift;
    my $file = shift;
    my %hash;
    my @sequence;
    $hash{'header'} = "";
    
    open FFILE, "<$file" or return;
    while (my $l = <FFILE>) {
	if ($l =~ /^>\s*(\S{1}.*)\s*$/) {	    
	    $hash{'header'} = $1;
	} elsif ( $l =~ /^[\s]*[\S]+/) {		
	    $l =~ s/^[\s]*([\S]+.*[\S]+)[\s]*$/$1/;
	    my @tmp = split /[\s]+/, $l;		
	    # ==>		s/[^[:print:]]/ /g;
	    foreach my $char (@tmp) {		    
		push @sequence, $char;
	    }
	}
    }
    close FFILE;

# Optionnal sequence resizing if any core_def was previously loaded
    if (defined ($self->{ core_def_file })) {    
    # splice only if pdbnum is already defined
        my @new_sequence;
        my $bool;
        if (defined ($self->{ pdbnum })) {
            my @pdbnum_ref = @{${$self->{ pdbnum }}{'sequence'}};
            for (my $iseq = 0; $iseq < @{$self->{ sub_seq_start }}; $iseq++) {
                for (my $i = 0; $i < @sequence; $i++) {
                    $bool = 1 if ($pdbnum_ref[$i] eq ${$self->{ sub_seq_start}}[$iseq]);
                    push @new_sequence, $sequence[$i] if ($bool);
                    $bool = 0 if ($pdbnum_ref[$i] eq ${$self->{ sub_seq_stop}}[$iseq]);            
                }
            }
            @sequence = @new_sequence;
        }
    }
    $hash{'sequence'} = \@sequence;
    
    my $hash_ref = \%hash;
}

## ACCESS METHODS
sub get_name {
    my $self = shift @_;
    
    if (defined ($self->{ name })) {
	return $self->{ name };
    }
    return;
}

sub get_pdbcode () {
    my $self = shift @_;
    
    if (defined ($self->{ pdb_code })) {
        return $self->{ pdb_code };
    }
        
    $logger->trace("Empty pdbname field, no coredef loaded?");
    return;
}

sub get_pdbchain () {
    my $self = shift @_;
    
    if (defined ($self->{ pdb_chain })) {
        return $self->{ pdb_chain };
    }
        
    $logger->trace("Empty pdbchain field, no coredef loaded?\n");
    return;
}


sub get_struct_state_array {
    my $self = shift;
    my $state = shift;
    if (defined ($self->{ $state })) {
        my @array;
        my %hash = %{$self->{ $state }};
	foreach my $value (@{$hash{'sequence'}}) {
	    push @array, $value;
	}        
	return \@array;
    }
    
    return;
}

sub get_pdbnum_array {
    my $self = shift;
    my @array;
    if (defined ($self->{ pdbnum })) {
	my %hash = %{$self->{ pdbnum }};
	foreach my $value (@{$hash{'sequence'}}) {
	    push @array, $value;
	}        
	return \@array;
    }
    
    return;
}

sub aa_subseq {
     my $self = shift @_;
     my $start = shift @_;
     my $stop = shift @_;
     
     my $array = [];
     
     if (defined ($self->{ aa })){
	my %hash = %{$self->{ aa }};
	my @sequence = @{$hash{'sequence'}};
        # Managment of optional start/end arguments
        $start = 1 unless (defined ($start));
        $stop = @sequence unless (defined ($stop));

	if ($start < 1 || $stop > @sequence) {
            $logger->warn("Asked sub_seq is beyond sequence limits");
            return; 
	}
	$start--;
	$stop--;
	my $subseq;
	for (my $i = 0; $i < @sequence; $i++) {
	    if ($i >= $start && $i <= $stop) {
		$subseq .= $sequence[$i];
		push @{$array}, $sequence[$i];
	    }
	}

	return {string => $subseq, array => $array};
     }
     
     $logger->error("accessing an empty sequence array ref");
     return;    
}

sub print_core_aa {
    my $self = shift;
    if (defined ($self->{ aa })) {
	my %hash = %{$self->{ aa }};
	print ">" . $hash{'header'} . "\n";
	my @array = @{$hash{'sequence'}};
	for (my $i = 0; $i < @array; $i++) {
	    print $array[$i];
	    if ((($i + 1) == @array) || 
		(($i + 1) % 20 == 0)) {
		print "\n";
	    } else {
		print  " ";
	    }
	}
    } 
}

sub print_core_sse {
    my $self = shift;
    if (defined ($self->{ sse })) {
	my %hash = %{$self->{ sse }};
	print ">" . $hash{'header'} . "\n";
	my @array = @{$hash{'sequence'}};
	for (my $i = 0; $i < @array; $i++) {
	    print $array[$i];
	    if ((($i + 1) == @array) || 
		(($i + 1) % 20 == 0)) {
		print "\n";
	    } else {
		print  " ";
	    }
	}
    }    
}

sub sse_subseq {
     my $self = shift @_;
     my $start = shift @_;
     my $stop = shift @_;
     my $array = [];
    if (defined ($self->{ sse })){
	my %hash = %{$self->{ sse }};
	my @sequence = @{$hash{'sequence'}};
        
    # Managment of optional start/end arguments
        $start = 1 unless (defined ($start));
        $stop = @sequence unless (defined ($stop));
	if ($start < 1 || $stop > @sequence) {
	    $logger->warn("asked sub_seq is beyond sequence limits [start = $start ," .
			  " stop = $stop] (MAX = " . @sequence . ")");
	    return; 
	}
	$start--;
	$stop--;
	my $subseq;
	for (my $i = 0; $i < @sequence; $i++) {
	    if ($i >= $start && $i <= $stop) {
		$subseq .= $sequence[$i];
		push @{$array}, $sequence[$i];
	    }
	}
	return { string => $subseq, array => $array};
     }
     
     $logger->error("accessing an empty sequence array ref");
     return;    
}


sub print_core_pdbnum {
    my $self = shift;
    if (defined ($self->{ pdbnum })) {
	my %hash = %{$self->{ pdbnum }};
	print ">" . $hash{'header'} . "\n";
	my @array = @{$hash{'sequence'}};
	for (my $i = 0; $i < @array; $i++) {
	   printf "%4s", $array[$i];
	    if ((($i + 1) == @array) || 
		(($i + 1) % 20 == 0)) {
		print "\n";
	    } else {
		print  " ";
	    }
	}
    }    
}

sub pdbnum_2_abspos {
    my $self = shift @_;
    my $asked_pdbnum = shift @_;
    
    if (defined ($self->{ pdbnum })){
        my %hash = %{$self->{ pdbnum }};
	my @sequence = @{$hash{'sequence'}};
    for (my $i = 0; $i < @sequence; $i++) {
        if ($sequence[$i] eq $asked_pdbnum) {
            return ($i + 1);
        }
    }
	$logger->warn("No such pdbnum string ( " .
		      $asked_pdbnum . " ) in current core");
    return; 
    }
    $logger->error("accessing an empty sequence array ref");
    
    return; 
}

sub abspos_2_pdbnum {
    my $self = shift @_;
    my $asked_abspos = shift @_;
    
   if (defined ($self->{ pdbnum })){
        my %hash = %{$self->{ pdbnum }};
        my @sequence = @{$hash{'sequence'}};
        if ($sequence[($asked_abspos-1)] =~ /[^[:print:]]/) {
            if (defined ($ENV{'VERBOSE_LVL'})) {
                $logger->trace("converting absolute position " .
			       "($asked_abspos)into a non defined pdb number");
            }
            return;
        } else {
            return $sequence[($asked_abspos-1)];
        }
    }
    $logger->error("accessing an empty sequence array ref");
    
    return; 
}

sub pdbnum_subseq {
     my $self = shift @_;
     my $start = shift @_;
     my $stop = shift @_;

    if (defined ($self->{ pdbnum })){
	my %hash = %{$self->{ pdbnum }};
	my @sequence = @{$hash{'sequence'}};
        
    # Managment of optional start/end arguments
        $start = 1 unless (defined ($start));
        $stop = @sequence unless (defined ($stop));
	if ($start < 1 || $stop > @sequence) {
	    $logger->warn("asked sub_seq is beyond sequence limits");
	   return; 
	}
	$start--;
	$stop--;
	my $subseq;
	for (my $i = 0; $i < @sequence; $i++) {
	    if ($i >= $start && $i <= $stop) {
		$subseq .= $sequence[$i];
                $subseq .= " " unless (($i+1) > $stop);
	    }
	}
	return $subseq;
     }
     
     $logger->error("accessing an empty sequence array ref");
     return;    
}

sub print_core_blocks {
    my $self = shift;
    if (defined ($self->{ blocks })) {
	my %hash = %{$self->{ blocks }};
	print ">" . $hash{'header'} . "\n";
	my @array = @{$hash{'sequence'}};
	for (my $i = 0; $i < @array; $i++) {
	    print $array[$i];
	    if ((($i + 1) == @array) || 
		(($i + 1) % 20 == 0)) {
		print "\n";
	    } else {
		print  " ";
	    }
	}
    }    
}

sub blocks_subseq {
     my $self = shift @_;
     my $start = shift @_;
     my $stop = shift @_;

    if (defined ($self->{ blocks })){
	my %hash = %{$self->{ blocks }};
	my @sequence = @{$hash{'sequence'}};
        
    # Managment of optional start/end arguments
        $start = 1 unless (defined ($start));
        $stop = @sequence unless (defined ($stop));
	if ($start < 1 || $stop > @sequence) {
	    $logger->warn("asked sub_seq is beyond sequence limits");
	   return; 
	}
	$start--;
	$stop--;
	my $subseq;
	for (my $i = 0; $i < @sequence; $i++) {
	    if ($i >= $start && $i <= $stop) {
		$subseq .= $sequence[$i];
                $subseq .= " " unless (($i+1) > $stop);
	    }
	}
	return $subseq;
     }
     
     $logger->error("accessing an empty sequence array ref");
     return;    
}

sub ascii_blocks_subseq {
     my $self = shift @_;
     my $start = shift @_;
     my $stop = shift @_;

    if (defined ($self->{ blocks })){
	my %hash = %{$self->{ blocks }};
	my @sequence = @{$hash{'sequence'}};
        
    # Managment of optional start/end arguments
        $start = 1 unless (defined ($start));
        $stop = @sequence unless (defined ($stop));
	if ($start < 1 || $stop > @sequence) {
	    $logger->warn("Asked sub_seq is beyond sequence limits");
	   return; 
	}
	$start--;
	$stop--;
	my $subseq;
	for (my $i = 0; $i < @sequence; $i++) {
	    if ($i >= $start && $i <= $stop) {
                if ($sequence[$i] ne "0.0") {
                    $subseq .= "+";
                } else {
                    $subseq .= "-";
                }
                #$subseq .= " " unless (($i+1) > $stop);
	    }
	}
	return $subseq;
    }
     $logger->error("accessing an empty sequence array ref");
    
    return;    
}

# check for the validity or atom coordinates of a given residue by num (1->N)
sub residue_is_valid {
        my $self = shift @_;
        my $resnum = shift @_;

        my $pdbnum = $self->pdbnum_subseq ($resnum, $resnum);
        if ($pdbnum =~ /[^[:print:]]/) { # Non valid
            return 0;
        } else {
            return 1;
        }
}
sub is_pos_inblock {
    my $self = shift @_;
    my $ask_pos = shift @_;

    if (defined ($self->{ blocks })){
	my %hash = %{$self->{ blocks }};
	my @sequence = @{$hash{'sequence'}};
        $ask_pos--;
        if ($sequence[$ask_pos] ne "0.0") {
            return 1;
        }
    } else {
	$logger->error("accessing an empty sequence array ref");
    }
    
    return;    
}

1;

