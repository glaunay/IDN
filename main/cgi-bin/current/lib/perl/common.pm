package common;
use strict;
#use Execute;
use Cwd;
use Log::Log4perl qw(get_logger);
use Data::Dumper;

=pod All around utility librairy for perl projects
    This is the first release of this collection of utility function
    Current collection:
sub isUniprotID {
sub newMatrix {
sub listUnionSize {
sub dualMatch {
sub matrixToVector {
sub booleanMaskMatrix {
sub sumMatrixRows {
sub sumMatrixColumns {
sub grepList {
sub readDirContent {
sub readListInFile {
sub frame_translate {
sub codon_sw {
sub get_list_min {
sub load_env_sh {
sub param_norm_list {
sub get_mean {
sub arg_parser {
sub PirPos {
sub ReadPir {
sub slid {
sub sge_cloud {
sub setTagFixedSerif {
sub uniqList {
sub del_element {
sub deleteMatrixColumns {
sub strings_id {
sub strings_id_nogaps {
sub read_blastp_param {
sub set_pdb_path {
sub system_call {
sub writeListToFile {
sub write_list_to_file {
sub euclidean {
sub sw_aa_code {
sub getMaximumIndex {
sub min {
sub max {
sub blosum62 {
sub set_abs_path ($) {
sub get_delim_starts {
sub read_delim_file {
sub arrayOccurence {
sub array_sum {
sub read_pdx {
sub is_same_list {
sub find_index {
sub list_exist {
sub basename {
sub arrayToSlicedStrings {
sub print_array_slice  {
=cut

use base 'Exporter';
our @EXPORT = qw /COMMON_VERSION/;
our $COMMON_VERSION="1.0";

=pod 
    Check if string matches canonical uniprot identifers
    described in http://www.uniprot.org/manual/accession_numbers
=cut
sub isUniprotID {
    my $p = arg_parser (@_);
    
    my $sType;
    my $proExt;
    my $isoExt;
    
    if (defined ($p->{ options })) {
	$sType = common::listExist($p->{ options }, "sloppySearch") ? "sloppy" : "strict";
	$proExt = common::listExist($p->{ options }, "enablePRO") ? 1 : 0;	
	$isoExt = common::listExist($p->{ options }, "enableIsoform") ? 1 : 0;	
    } else {
	$sType = "strict";
	$proExt = 0;
	$isoExt = 0;
    }
    
    common::slid($p->{ string }) || die "string parameter required";
    
    my @regExpList = ( '[A-N,R-Z][0-9][A-Z][A-Z,0-9][A-Z,0-9][0-9]',
		   '[O,P,Q][0-9][A-Z,0-9][A-Z,0-9][A-Z,0-9][0-9]',
		   '[A-N,R-Z][0-9][A-Z][A-Z,0-9][A-Z,0-9][0-9][A-Z][A-Z,0-9][A-Z,0-9][0-9]'
	);
    
    foreach my $regExp (@regExpList) {
#1st isoform
	$regExp = $isoExt ? "$regExp".'(-[\d]+){0,}' : $regExp;
#then pro	
	$regExp = $proExt ? "$regExp".'(-PRO_[\d]+){0,}' : $regExp;

	($p->{ string } =~ /^($regExp)$/) && return 1;
	$sType eq "strict" && next;
	($p->{ string } =~ /($regExp)/) && return 1;		
    } 
    
    return 0;
}

sub grepUniprotID {
    my $p = arg_parser (@_);
    
    my $sType;
    my $proExt;
    my $isoExt;
    
    if (defined ($p->{ options })) {
	$sType = common::listExist($p->{ options }, "sloppySearch") ? "sloppy" : "strict";
	$proExt = common::listExist($p->{ options }, "enablePRO") ? 1 : 0;	
	$isoExt = common::listExist($p->{ options }, "enableIsoform") ? 1 : 0;	
    } else {
	$sType = "strict";
	$proExt = 0;
	$isoExt = 0;
    }
    
    common::slid($p->{ string }) || die "string parameter required";
    
    my @regExpList = ( '[A-N,R-Z][0-9][A-Z][A-Z,0-9][A-Z,0-9][0-9]',
		   '[O,P,Q][0-9][A-Z,0-9][A-Z,0-9][A-Z,0-9][0-9]'
	);
    
    foreach my $regExp (@regExpList) {
#1st isoform
	$regExp = $isoExt ? "$regExp".'(-[\d]+){0,}' : $regExp;
#then pro	
	$regExp = $proExt ? "$regExp".'(-PRO_[\d]+){0,}' : $regExp;

	($p->{ string } =~ /^($regExp)$/) && return $1;
	$sType eq "strict" && next;
	($p->{ string } =~ /($regExp)/) && return $1;		
    } 
    
    return;
}



=pod check the validity of the argument supplied on command line, it requires the argument list, 
    a test function returning O/1
    and a help function
    Both functions are defined in the calling program and passed as reference to the manager
    Any inconsistencies leads to usage print and main exit 
    common::argumentManager (
    argumentArray => \@ARGV, 
    usage => \&usage(),     # the help function
    ruler => \&checkArguments ());  # the test function to apply to argument list
=cut
sub argumentManager {
    my $p = common::arg_parser (@_);   
    slid ($p->{ argumentArray }, $p->{ usage }, $p->{ ruler }) || die "missing argument manager specifications";
    
    # empty arguments list
    if (scalar (@{$p->{ argumentArray }} == 0)) {
	&{$p->{ usage }};
	exit;	
    }
    my $mainParameters = common::arg_parser (@{$p->{ argumentArray }});
    # apply the ruler to the arguments list
    if (! &{$p->{ ruler }}($mainParameters)) {
	&{$p->{ usage }};
	exit;	
    }

    return $mainParameters;
}

sub getTime {
    my @months = qw(Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec);
    my @weekDays = qw(Sun Mon Tue Wed Thu Fri Sat Sun);
    my ($second, $minute, $hour, $dayOfMonth, $month, $yearOffset, $dayOfWeek, $dayOfYear, $daylightSavings) = localtime();
    my $year = 1900 + $yearOffset;
    my $theTime = "$hour:$minute:$second, $weekDays[$dayOfWeek] $months[$month] $dayOfMonth, $year";
    
    return $theTime; 
}


=pod
    browse a list of has and return the reference of the 1st one matching a given "key, value" pair
=cut
sub getHashFromListByKeyValue {
    my $p = common::arg_parser (@_);

    my $listRef = $p->{ list };
    my $key = $p->{ keyValue }->[0];
    my $value = $p->{ keyValue }->[1];


    foreach my $hRef (@{$listRef}) {
	($hRef->{ $key } eq $value) && return $hRef;
    }
}



sub newMatrix {
    my $p = common::arg_parser (@_);
    
    (common::slid ($p->{ nRow }, $p->{ nCol })) || 
	die " You must specify matrix Size (nRow x nCol)";


    my @matrix;

    for (my $i = 0; $i < $p->{ nRow }; $i++) {
	my @row = (0) x $p->{ nCol };
	push @matrix, \@row;
    }
    
    return \@matrix;
}

sub listUnionSize {
    my ($array1, $array2) = @_;
    
    my (@list1, @list2);
    if (scalar (@${array1}) <= scalar (@{$array2})) {
	@list1 = @{$array1};
	@list2 = @{$array2};
    } else {
	@list2 = @{$array1};
	@list1 = @{$array2};
    }
    
    my $cnt = 0;
    foreach my $elem (@list1) {
	for (my $i = 0; $i < scalar (@list2); $i++) {
	    if ($elem eq $list2[$i]) {
		$cnt++;
		splice (@list2, $i,1);
	    }
	}
    }
    
    return $cnt;
}

sub isHashRef {
    my $scalar = shift;
    ($scalar =~ /^HASH/) && return 1;
    
    return 0;	    
}
sub isArrayRef {
    my $scalar = shift;
    ($scalar =~ /^ARRAY/) && return 1;
    
    return 0;	    
}


=pod PairListNonIntersect
    Given two list returns
    the missing element present in one and missing in the other
    as a simple datastructure:
    {
	missInListOne => [],  # list of elements present in second argument list not found in the first argument one
	missInListTwo => []   # list of elements present in first argument list not found in the second argument one
    }

=cut
sub PairListNonIntersect {
    my ($array1, $array2) = @_;

    my $h = {
	missInListOne => [],
	missInListTwo => [],
	missInListOneLength => 0,
	missInListTwoLength => 0
    };
    
    foreach my $a (@{$array2}) {
	list_exist ($array1, $a) && next;
	push @{$h->{ missInListOne }}, $a;	
    }
    foreach my $a (@{$array1}) {
	list_exist ($array2, $a) && next;
	push @{$h->{ missInListTwo }}, $a;	
    }
   # print Dumper($h);
    $h->{ missInListOneLength } = scalar (@{$h->{ missInListOne }});
    $h->{ missInListTwoLength } = scalar (@{$h->{ missInListTwo }});
    
    return $h;
}



sub dualMatch {
    my $p = common::arg_parser (@_);
    
    ($p->{ pairOne }->[0] eq $p->{ pairTwo }->[0] && $p->{ pairOne }->[1] eq $p->{ pairTwo }->[1]) && return 1;
    ($p->{ pairOne }->[0] eq $p->{ pairTwo }->[1] && $p->{ pairOne }->[1] eq $p->{ pairTwo }->[0]) && return 1;
    
    return 0;
}

sub matrixToVector {
    my $matrix = shift;
    
    my @vector;
    for (my $i = 0; $i < @{$matrix}; $i++) {
        for (my $j = 0; $j < @{$matrix->[$i]}; $j++) {
            push @vector, $matrix->[$i][$j];
        }
    }
    
    return \@vector;
}

sub booleanMaskMatrix {
    my $p = common::arg_parser (@_);
    
    my $matrix = $p->{ Matrix };
    my $treshold = $p->{ Treshold };
    for (my $i = 0; $i < @{$matrix}; $i++) {
        for (my $j = 0; $j < @{$matrix->[$i]}; $j++) {
         #  print "is $matrix->[$i][$j] < $treshold ?\n";
            if ($matrix->[$i][$j] < $treshold) {
                $matrix->[$i][$j] = 1; 
            }else {
                $matrix->[$i][$j] = 0;
            }           
        }
    }

}


sub sumMatrixRows {
    my $p = common::arg_parser (@_);
    
    my $matrix = $p->{ Matrix };
    my $nrow = @{$matrix};
    my $ncol = @{$matrix->[0]};
    #warn "mm $nrow * $ncol\n";
    my @vector = (0) x $nrow;
    #warn "@vector\n";
    for (my $i = 0; $i < $nrow; $i++) {
        for (my $j = 0; $j < $ncol; $j++) {
            #warn "[$i][$j] $matrix->[$i][$j]    --> $i sum $vector[$i]";
            $vector[$i] += $matrix->[$i][$j];
        }
    }
    
    return \@vector;
    
}

sub sumMatrixColumns {
    my $p = common::arg_parser (@_);
    
    my $matrix = $p->{ Matrix };
    my $nrow = @{$matrix};
    my $ncol = @{$matrix->[0]};
    
    my @vector = (0) x $ncol;
    for (my $j = 0; $j < $ncol; $j++) {
        for (my $i = 0; $i < $nrow; $i++) {
            unless (defined ($matrix->[$i][$j])) {
                die "matrix->[$i][$j] not defined";
            }
            $vector[$j] += $matrix->[$i][$j];
        }
    }
    
    return \@vector;
}

sub grepList {
    my $p = common::arg_parser (@_);
  
    ($p->{ List }) || die "grepList no argument List";
    
    my @output;
    foreach my $string (@{$p->{ List }}) {
        if ($string =~ /$p->{ regExp }/) {
            push @output, $string;
        }
    }

    return @output;
}

sub readDirContent {
    my $dir = shift;
    
    my @list;
    opendir(my $dh, $dir) || die "Cant open directory $dir";
    while (my $l = readdir $dh) {
        chomp $l;
        push @list, $l;
    }
    closedir $dh;
    
    return \@list;
}

sub readFileNameToString {
  my $file = shift;
  my $list = readListInFile($file);
  
  return join ('', @{ $list });
}

sub readListInFile {
    my $file = shift;
    ($file) || die "readListInFile: no arguments!";
    my @array;
    open IN, "<$file" or die $!;
    while (<IN>) {
        chomp;
        push @array, $_;
    }   
    close IN;
    return \@array;
}



sub frame_translate {
    my $parameters = arg_parser(@_);
    my @array = split //, $parameters->{ Sequence };
    if (@array % 3 != 0) {
        print STDERR "common::frame_translate: Error, nucleotides number in codon sequence is not a multiple of 3!\n";
    }
    
    my $prot_seq;
    for (my $i = 0; $i < @array; $i += 3) {
        my $s = codon_sw ("$array[$i]$array[$i+1]$array[$i+2]");        
        if ($s eq "!") {
            last;
        }
        $prot_seq .= $s;
    }
    
    return $prot_seq;
}

sub codon_sw {
    my $codon = $_[0];
    $codon =~ s/U/T/g;
    $codon = uc($codon);
    my %code = (
    'TTT' => 'F', 'TCT' => 'S', 'TAT' => 'Y', 'TGT' => 'C',
    'TTC' => 'F', 'TCC'	=> 'S', 'TAC' => 'Y', 'TGC' => 'C',
    'TTA' => 'L', 'TCA'	=> 'S', 'TAA' => '!', 'TGA' => '!',
    'TTG' => 'L', 'TCG'	=> 'S', 'TAG' => '!', 'TGG' => 'W',
    'CTT' => 'L', 'CCT'	=> 'P', 'CAT' => 'H', 'CGT' => 'R',
    'CTC' => 'L', 'CCC'	=> 'P', 'CAC' => 'H', 'CGC' => 'R',
    'CTA' => 'L', 'CCA'	=> 'P', 'CAA' => 'Q', 'CGA' => 'R',
    'CTG' => 'L', 'CCG'	=> 'P', 'CAG' => 'Q', 'CGG' => 'R',
    'ATT' => 'I', 'ACT'	=> 'T', 'AAT' => 'N', 'AGT' => 'S',
    'ATC' => 'I', 'ACC'	=> 'T', 'AAC' => 'N', 'AGC' => 'S',
    'ATA' => 'I', 'ACA'	=> 'T', 'AAA' => 'K', 'AGA' => 'R',
    'ATG' => 'M', 'ACG' => 'T', 'AAG' => 'K', 'AGG' => 'R', # 'ATG' => 'Ms'
    'GTT' => 'V', 'GCT'	=> 'A', 'GAT' => 'D', 'GGT' => 'G',
    'GTC' => 'V', 'GCC'	=> 'A', 'GAC' => 'D', 'GGC' => 'G',
    'GTA' => 'V', 'GCA'	=> 'A', 'GAA' => 'E', 'GGA' => 'G',
    'GTG' => 'V', 'GCG'	=> 'A', 'GAG' => 'E', 'GGG' => 'G' 
    );
   
   if (exists $code{$codon}) {
    return $code{$codon};
   }
   
   print STDERR "common:codon_sw: Error  unknown codon \"$codon\"\n";
}

sub get_list_min {
    my $arrayref = shift @_;
    my $min;
    foreach my $elem (@{$arrayref}) {
        $min = $elem unless (defined ($min));
        $min = $elem if ($elem < $min);
    }
    
    return $min;
}

sub load_env_sh {
    my $f = shift @_;
    open VARS, $f or die $!;
    while (my $l = <VARS> ) {

	if ($l =~ /^[\s]*export[\s]+([\S^=]+)=([\S]+)/) {
	    my $var = $1;
	    my $val = $2;
	    
	    if ($val =~ /^(.*)\$([^\/]+)(.*)$/) {
		my $subval = $2;
		my $prefix = $1;
		my $suffix = $3;
		$subval =~ s/[\{\}]//g;
                unless (defined ($ENV{$subval})) {
                    die "LoadEnvSh Error:\$ENV{$subval} not defined !";        
                }
		$val = $prefix . $ENV{$subval} . $suffix;
	    }
	    $ENV{$var} = $val;	  
	}
    }
    close VARS; 
}

sub param_norm_list {
    my $array = shift @_;
    
    my $mean = get_mean ($array);
    return unless (defined ($mean));
    my $sigma = 0;
    
    foreach my $v (@{$array}) {
        $sigma += ($v - $mean) * ($v - $mean);                
    }
    $sigma = sqrt ($sigma / @{$array});
    
    return ($mean, $sigma);
}

sub get_mean {
    my $array = shift @_;
    
    if (@{$array} == 0) {
        print STDERR "common::averaging a list of zero elements ...\n";
        return;
    }
    my $m = 0;
    foreach my $v (@{$array}) {
        $m += $v
    }
    $m /= @{$array};
    
    return $m;
}


sub arg_parser {
    (@_) || die "empty arguments array provided to parser\n";
    my %hash;
    my @noarg;
    for (my $i = 0; $i < @_; $i++) {
        if (!defined($_[$i])){
	    print STDERR "[@_] -> undefined argument \"" . $_[$i - 1] . "\" provided to parser\n";
	    die;
	}
        if ($_[$i] =~ /^--/) {
            push @noarg, $i;
        }
    }
    my $off = 0;
    foreach my $i (@noarg) {
        $hash{$_[$i - $off]} = 1;
        my @del = splice @_, $i - $off, 1;
    #    print "deleting @del\n";
        $off++;
    }
    
    #print "-->@_\n";
    
    for (my $i = 0; $i < @_ ; $i += 2) {
     #   print "i == $i, loading $_[$i]\n";
        $hash{$_[$i]} = $_[$i + 1];
    }
    
    return \%hash;
}



#$parameters->{ StructurePosition }
#$parameters->{ SequencePosition }
sub PirPos {
    my $parameters = arg_parser (@_);
    my $h_pir = $parameters->{ HashPir };
    my (@resSeq_input, @resName_input);
    my (@resSeq_return, @resName_return); 
    my $asked_pos;
    
   # foreach my $key (keys %{$h_pir}) {
   #     print "$key @{$h_pir->{$key}}\n";
   # }
        
    if (defined ($parameters->{ SequencePosition })) {
        $asked_pos = $parameters->{ SequencePosition };
        @resSeq_input = @{$h_pir->{ SeqResSeq }};
        @resName_input = @{$h_pir->{ SeqResName }};
        @resSeq_return = @{$h_pir->{ StrResSeq }};
        @resName_return = @{$h_pir->{ StrResName }};
    } elsif (defined ($parameters->{ StructurePosition })) {
        $asked_pos = $parameters->{ StructurePosition };
        @resSeq_input = @{$h_pir->{ StrResSeq }};
        @resName_input = @{$h_pir->{ StrResName }};
        @resSeq_return = @{$h_pir->{ SeqResSeq }};
        @resName_return = @{$h_pir->{ SeqResName }};
    } else {
        die "Input position must be \"StructurePosition\" or \"SequencePosition\"\n";
    }
  
  #  print  "@resSeq_input\n@resName_input\n";
  #  print  "@resSeq_return\n@resName_return\n";
  #  print "\n\n\n";
    my ($i_resSeq, $i_resName);
    for (my $i = 0; $i < @resSeq_input; $i++) {
        if ($resName_input[$i] ne "-") {
            $i_resSeq++;
        }
        if ($i_resSeq == $asked_pos) {
            if ($resName_return[$i] eq "-") {
                return;
            }
            print "PirPos:Match Found : $resName_input[$i]$resSeq_input[$i] ";
            print " --> $resName_return[$i]$resSeq_return[$i]\n";
            return "$resName_return[$i]$resSeq_return[$i]";            
        }                        
    }
    
 #StrResName =>
 #                StrResSeq => 
 #                SeqResName => 
 #                SeqResSeq =>
}

sub ReadPir {
    my $file = shift @_;
    open PIR, "$file" or die $!;
    my $bool = 0;
    my (@tmp_str, @tmp_seq);
    while (<PIR>) {
        if ($_=~ /^structureX/) {
            $bool = 1;
        } elsif ($bool == 1) {
            if ($_ =~ /^(.*)\*$/) {
                @tmp_str = split //, $1;
                $bool = 0;
            }
        } elsif ($_=~ /^sequence/) {
             $bool = 2;
        } elsif ($bool == 2) {
            if ($_ =~ /^(.*)\*$/) {
                @tmp_seq = split //, $1;
                $bool = 0;
            }        
        }        
    }
    close PIR;
    
    if (@tmp_seq != @tmp_str) {
        print STDERR "ReadPir:: Error missmatch sequences size\n";
        return;
    }
    
    my ($i_str, $i_seq);
    my (@arr1, @arr2, @arr3,@arr4);
    for (my $i = 0 ; $i < @tmp_seq ; $i++) {
        my $c_str = '-';
        my $n_str = 0;
        if ($tmp_str[$i] ne '-') {
            $i_str++;
            $n_str = $i_str;
            $c_str = common::sw_aa_code ($tmp_str[$i]);
        }
        my $c_seq = '-';
        my $n_seq = 0;
        if ($tmp_seq[$i] ne '-') {
            $i_seq++;
            $n_seq = $i_seq;
            $c_seq = common::sw_aa_code ($tmp_seq[$i]);
        }        
        push @arr1, $c_str;
        push @arr2, $n_str;
        push @arr3, $c_seq;
        push @arr4, $n_seq;            
    }

    my %hash = ( StrResName => \@arr1,
                 StrResSeq => \@arr2,
                 SeqResName => \@arr3,
                 SeqResSeq => \@arr4        
    );

    return \%hash;    
}



# slid ("scalars list is defined")
# returns true if all argument are defined variables
# warning array
sub slid {
    return 0 unless (scalar(@_) > 0);
    #print ">@_<\n";
#    print ">".scalar(@_)."<\n";
#    print ">>" . @_ . "<<\n";
    foreach my $arg (@_) {
        return 0 unless (defined ($arg));
    }
    return 1;
}

=pod sloft
    returns true if at least one of the supplied argument is defined    
=cut
sub sloft {
    foreach my $arg (@_) {
	defined ($arg) && return 1;
    }

    return 0;
}


=pod
# A function that send a job to the sge grid default parameters can be overruled by options
sub sge_cloud {
    my $parameters = arg_parser (@_);

    unless (slid ($parameters->{ Program }, $parameters->{ Arguments })) {
        print "common::sge_cloud: No program nor arguments specified!\n";
        return;
    }
    
    my $cluster_options = "-V -m eas ";
    my $queue = "-q short.q";
    if (defined ($parameters->{ Queue }) ){
        if ($parameters->{ Queue } eq "long") {
            $queue = "-q long.q";
        }
    }
    $cluster_options .= " $queue";
    if (defined ($parameters->{ NcpuHard })) {
        $cluster_options .= " -pe thread $parameters->{ NcpuHard } -R y "
    }
    if (defined ($parameters->{ NodeSelect })) {
        $cluster_options .= " -l hostname=$parameters->{ NodeSelect }";        
    }    
    
    print "SgeProgram:\"$parameters->{ Program }\"\n";
    print "SgeArguments:\"$parameters->{ Arguments }\"\n";    
    print "SgeParameters:\"$cluster_options\"\n";
    
    my @job_id;                 
    Execute::drmaa_initiation;    
    my %launcher=(
          job_name        => "$parameters->{ Program }_cloud",
          workspace       => getcwd,
          program         => $parameters->{ Program },
          arguments       => $parameters->{ Arguments },
          execution       => 'drmaa',
          cluster_options => $cluster_options,
          environment     => '',
          output_cluster  => "$parameters->{ Program }.log",
          error_cluster   => "$parameters->{ Program }.err",
          email           => "guillaume.launay\@jouy.inra.fr"
        );
    
    print "common::sge_cloud : Running $parameters->{ Program } on sge ...\n";
    push @job_id, Execute::execution_factory(\%launcher);
    Execute::drmaa_synchronization(\@job_id);

    return 1;
}
=cut 

sub setTagFixedSerif {
    my $p = arg_parser (@_);
    
    my $foot = length ($p->{ number });
    my $filler = $p->{ serif } - $foot;

    my $tag =  (0) x $filler;
    $tag .= $p->{ number };
    
    return $tag; 
}
sub uniqList {
    my $array = shift;
    my @uniqList;
    
    foreach my $element (@{$array}) {
        (common::list_exist (\@uniqList, $element)) && next;
        push @uniqList, $element;
    }
    
    return \@uniqList;
}

# delete set of elements from list specify by their position
sub del_element {
    my ($arr_data, $arr_index) = @_;
    my $logger = get_logger ("common");
    
    # first sort index by inverse numeic
    my @index = sort {$b <=> $a} @{$arr_index};
    if ($index[0] > @{$arr_data}) {
        $logger->fatal ("Last position to delete $index[0] is beyond list "   .
                        "range " . scalar @{$arr_data} . "\nList content:\n"  .
                        "@{$arr_data}\n");
        
    }
   # delete, passed list is effectively shorten !
    warn "INDEX: @index";
    warn "ARRAY SIZE " . scalar(@{$arr_data});
    foreach my $i (@index) {
        splice (@{$arr_data}, $i, 1);
    }
}

sub deleteMatrixColumns {
    my $matrix = shift;
    my $columnsToDelete = shift;
    my $logger = get_logger ("common");
    
    
    #my @index = sort {$b <=> $a} @{$columnsToDelete};
    my $nrow = scalar (@{$matrix});
    my $ncol = scalar (@{$matrix->[0]});
    $logger->debug ("matrix size $nrow * $ncol");
    $logger->debug ("columns to del @{$columnsToDelete}");
    
    # in tmp matrix columns becomes row and vice versa
    my @tmpMatrix;
    my $nrowTmp = $ncol;
    my $ncolTmp = $nrow;
    for (my $i = 0; $i < $nrowTmp; $i++) {
        my @vector = (0) x $ncolTmp;
        push @tmpMatrix, [@vector];
    }
    for (my $i = 0; $i < $nrow; $i++) {
        for (my $j = 0; $j < $ncol; $j++) {
            $tmpMatrix[$j][$i] = $matrix->[$i][$j];
        }
    }
  # delete the referenced columns which are now tmp row
    my @tmp2Matrix;
    my $finalColumnsNumber = 0;
    for (my $i = 0; $i < $nrowTmp; $i++) {        
        (common::list_exist ($columnsToDelete, $i)) && next;
        push @tmp2Matrix, [@{$tmpMatrix[$i]}];
        $finalColumnsNumber++;
    }
    $logger->debug("final number of columns $finalColumnsNumber");
  # restore the original row/column order
    my @finalMatrix;
    for (my $i = 0; $i < $nrow; $i++) {
        my @vector = (0) x $finalColumnsNumber;
        push @finalMatrix, [@vector];
    }
   
    my $string = "Final matrix ($nrow * $finalColumnsNumber)\n";
    for (my $i = 0; $i < $nrow; $i++) {
        for (my $j = 0; $j < $finalColumnsNumber; $j++) {
            $finalMatrix[$i][$j] = $tmp2Matrix[$j][$i];
            $string .= " $finalMatrix[$i][$j] ";
        }
        $string .= "\n";
    }
    $logger->debug($string);
   
    return \@finalMatrix;
}


sub strings_id {
    my ($str1, $str2) = @_;
    if (length ($str1) != length ($str2)) {
        print "common::strings_id : strings do not have the same length\n";
        print " ". length($str1) . " vs " . length ($str2) . " =>\'$str1\' vs \'$str2\'\n";
        return;
    }
    return 0 if (length ($str1) == 0);
    
    my $same = 0;
    my @array_1 = split //, $str1;    
    my @array_2 = split //, $str2;
    for (my $i = 0; $i < @array_1; $i++) {
        $same++ if ($array_1[$i] eq $array_2[$i]);
    }
    
    return ($same / length ($str1));
}

sub strings_id_nogaps {
    my ($str1, $str2) = @_;
    if (length ($str1) != length ($str2)) {
        print "common::strings_id_nogaps : strings do not have the same length\n";
        print " ". length($str1) . " vs " . length ($str2) . " =>\'$str1\' vs \'$str2\'\n";
        return;
    }
 #   print "STRING_COMP:: \'$str1\' vs \'$str2\'\n";
    return 0 if (length ($str1) == 0);
    my $max = 0;
    my $same = 0;
    my @array_1 = split //, $str1;    
    my @array_2 = split //, $str2;
    for (my $i = 0; $i < @array_1; $i++) {
        if ($array_1[$i] =~ /[\w]/ || $array_2[$i] =~ /[\w]/) {
            $max++;
            if ($array_1[$i] eq $array_2[$i]) {
                $same++;
            }    
        }
    }
    
    return ($same / $max);    
}


# parse ~/blastpgp.param file
sub read_blastp_param {
    my $file = shift @_;
    my $arguments = " ";
    #$ENV{'BLASTDB'}
    #$ENV{'BLASTMAT'}
    unless (defined ($file)) {
        $file = "/home/mig/gulaunay/blastpgp.param";
    }
    unless (open PARAM, "<$file") {
        print "common::read_blastp.param: Error reading \"$file\"\n";
        return;
    }
    while (my $l = <PARAM>) { 
        if ($l =~ /<(.*)>(.+)<\/.*>.*$/) {
            if ($1 eq "Expectation value") {
                $arguments .= " -e $2";
            } elsif ($1 eq "Evalue Treshold MultiPass") {
                $arguments .= " -h $2";
            } elsif ($1 eq "DataBase") {
                $arguments .= " -d $2";
            } elsif ($1 eq "Output Format") {
                $arguments .= " -m $2";
            } elsif ($1 eq "Output MaxSeq") {
                $arguments .= " -b $2";   
            } elsif ($1 eq "IterationNumber") {
                $arguments .= " -j $2";    
            } elsif ($1 eq  "OutPut MaxDescriptors") {
                $arguments .= " -v $2";
            } elsif ($1 eq  "Cpu Number") {
                $arguments .= " -a $2";
            } else {
                print "common::read_blastp_param : unknow parameter balise \'$1\'\n";
                return;
            }
        }
    }
    close PARAM;
    return $arguments;
}
sub set_pdb_path {
    my ($pdbcode, $pdbfolder);
    while (my $arg = shift @_) {
        if ($arg eq "PdbCode =>") {
            $pdbcode = shift @_;
        } elsif ($arg eq "PdbFolder =>") {
            $pdbfolder = shift @_;
        } else {
            print "common::set_pdb_path: unknown argument \'$arg\'\n";
            return;
        }
    }
    
    unless (defined ($pdbfolder && defined ($pdbcode))) {
        print "common::set_pdb_path: missing pdbcode or pdbfolder\n";
        return;
    }
    
    if (-e $pdbfolder."/".$pdbcode.".pdb") {
        return $pdbfolder."/".$pdbcode.".pdb";
    } elsif (-e $pdbfolder."/".$pdbcode.".ent") {
        return $pdbfolder."/".$pdbcode.".ent";
    } elsif (-e $pdbfolder."/pdb".$pdbcode.".ent") {
        return $pdbfolder."/pdb".$pdbcode.".ent";
    }
    my ($sub_dir) = ($pdbcode =~ /^.(..)/);
    print ">>>". $pdbfolder."/" . $sub_dir . "/" . $pdbcode . "\n";
    if (-e $pdbfolder."/" . $sub_dir . "/" . $pdbcode . ".pdb") {
        return $pdbfolder."/" . $sub_dir . "/" . $pdbcode . ".pdb";
    } elsif (-e $pdbfolder."/" . $sub_dir . "/pdb" . $pdbcode.".ent") {
        return $pdbfolder."/" . $sub_dir . "/pdb" . $pdbcode.".ent";
    #} elsif (-e $pdbfolder."/" . $sub_dir . "/" . $pdbcode.".ent") {
    #    return $pdbfolder."/" . $sub_dir . "/" . $pdbcode.".ent";
    }    

    return;
}


sub system_call {
    my $command = shift @_;
    my $t =  system ($command);
# VALUE checks
    unless ($t == 0) {
        print "\ncommon::system_call : ERROR , Bad command  execution of following command\n";
        print "$command\n";
        return;
    }

    return 1;

#
    if ($? == 11 ) {
        print "system_call : segmentation fault of following command\n";
        print "$command\n";
        return;
    } elsif ( $? == -1 ) {
      print "system_call : following command execution failed\n";
      print  print "$command\n";
      return;
    }
    
}

=pod
    file writer key/value options can be specified
=cut
sub fileWriter {
    my $p = common::arg_parser (@_);
    
    common::slid ($p->{ fileOut }, $p->{ data }) || die "invalid arguments";
    my $mode = "w";
    foreach my $option ($p->{ options }) {
	if ($option->{ mode } eq "appendTo") {
	    $mode = "a";
	}
    }
    
    if ($mode eq "w") {
	open OUT, ">$p->{ fileOut }" or die $!;
    }
    if ($mode eq "a") {
	open OUT, ">>$p->{ fileOut }" or die $!;
    }
    print OUT $p->{ data };
    close OUT;

}

sub writeListToFile {
    my $p = common::arg_parser (@_);
    my $logger = get_logger ("common");
    my $sliceLength = 1;
    
    ($p->{ ToFile } && $p->{ Array }) ||
    $logger->logdie ("Tofile and Array are mandatory arguments");
    
    if ($p->{ Slice }){
        $sliceLength = $p->{ Slice };
    }
    
    open OUT, ">$p->{ ToFile }" || $logger->logdie ("Cant open $p->{ ToFile }");    
    for (my $i = 0; $i < @{$p->{ Array }}; $i++) {
        print OUT $p->{ Array }->[$i];
        if ((($i+1) % $sliceLength) == 0) {
            print OUT "\n"; 
        } else {
            print OUT " ";
            print OUT "\n" if (($i+1) == @{$p->{ Array }});
        }
    }
    close OUT;
}

sub write_list_to_file {
    my ($file, $array_ref) = @_;
 
    open FOUT, ">$file" or return;
    foreach my $data (@{$array_ref}) {
        print FOUT $data . "\n";
    }
    close FOUT;
    
    return 1;
}
sub euclidean {
    
    my ($x1, $y1, $z1, $x2, $y2, $z2) = @_;
    
    unless (defined ($x1) && defined ($y1) && defined ($z1)) {
        print "common:: euclidean : undefined 1st point coordinates\n";
        return;
    }
    unless (defined ($x2) && defined ($y2) && defined ($z2)) {
        print "common:: euclidean : undefined 2nd point coordinates\n";
        return;
    }
    $x1 =~ s/[\s]//g;
    $y1 =~ s/[\s]//g;
    $z1 =~ s/[\s]//g;
    $x2 =~ s/[\s]//g;
    $y2 =~ s/[\s]//g;
    $z2 =~ s/[\s]//g;
    
    unless ($x1 =~ /^[-\d\.]+$/ && $y1 =~ /^[-\d\.]+$/ && $z1 =~ /^[-\d\.]+$/) {
        print "common:: euclidean : error malformed 1st point coordinates\n";
        print "{" . $x1 . ", " . $y1 . ", " . $z1 . "}\n";
        return;
    }
    unless ($x2 =~ /^[-\d\.]+$/ && $y2 =~ /^[-\d\.]+$/ && $z2 =~ /^[-\d\.]+$/) {
        print "common:: euclidean : error malformed 2nd point coordinates";
        print "{" . $x2 . ", " . $y2 . ", " . $z2 . "}\n";
        return;
    }
    
    my $distance = 0;
    $distance += ( $x1 - $x2 ) * ( $x1 - $x2 );
    $distance += ( $y1 - $y2 ) * ( $y1 - $y2 );
    $distance += ( $z1 - $z2 ) * ( $z1 - $z2 );
    $distance = sqrt ($distance);
    
    return $distance;
}

sub sw_aa_code {
    my $ask = shift @_;
    my %code;
    my $logger = get_logger("common");

    $code{'A'} = "ALA";
    $code{'C'} = "CYS";
    $code{'D'} = "ASP";
    $code{'E'} = "GLU";
    $code{'F'} = "PHE";
    $code{'G'} = "GLY";
    $code{'H'} = "HIS";
    $code{'I'} = "ILE";
    $code{'K'} = "LYS";
    $code{'L'} = "LEU";
    $code{'M'} = "MET";
    $code{'N'} = "ASN";
    $code{'P'} = "PRO";
    $code{'Q'} = "GLN";
    $code{'R'} = "ARG";
    $code{'S'} = "SER";
    $code{'T'} = "THR";
    $code{'V'} = "VAL";
    $code{'W'} = "TRP";
    $code{'Y'} = "TYR";
    
    foreach my $key (keys (%code)) {
        if ($key eq $ask) {
            return $code{$key};
        } elsif ($code{$key} eq $ask) {
            return $key;
        }
    }
    
    # Non regular 
    return "M" if ($ask eq "MSE");
    
    $logger->debug ("Warning, demanded aa code unknown :" .
                    " \'$ask\' returning \'X\'\n");
    
    return 'X';
}

sub getMaximumIndex {
    my $array_ref = shift;
    if (@{$array_ref} == 0) {
        return;       
    }
    
    my $max = $array_ref->[0];
    my $best = 0;

    for (my $i = 1; $i < @{$array_ref}; $i++) {
        if ($array_ref->[$i] > $max) {
            $max = $array_ref->[$i];
            $best = $i;
        }
    }
    
    return $best;
}

sub min {
    my $min = shift @_;
    foreach my $n (@_) {
	$min = $n if ($n < $min);
    }
      
    return $min;
}
    

sub max {
    my $max = shift @_;
    foreach my $n (@_) {
	if ($n > $max) {
	    $max = $n;
	}
    }
    
    return $max;
}

 sub similarity_bl62 {
     my ($a, $b) = @_;

     unless (common::slid ($a,$b)) {
	 die "common::similarity_bl62: Undefined input sequence";
     }
     if (length $a != length $b) {
	 die "common::similarity_bl62: missmatch in seq length\n";	 
     }
     my @arr1 = split //, $a;
     my @arr2 = split //, $b;
     if (@arr1 == 0 || @arr2 == 0) {
	 die "similarity_bl62 error empty sequence \"$a\" \"$b\"\n";
     }
     my $id_cnt = 0;
     my $max_sim = 0;
     my $curr_sim = 0;
     my $sim_cnt = 0;
     for (my $i = 0; $i < @arr1; $i++) {
	 if ( !defined (sw_aa_code ($arr2[$i])) || 
	      !defined (sw_aa_code ($arr1[$i])) 
	      ) {
	     if (
		 ( !defined (sw_aa_code ($arr2[$i])) && $arr2[$i] ne "-") ||
		 ( !defined (sw_aa_code ($arr1[$i])) && $arr1[$i] ne "-") 
		 ) {		 
		 die "similarity_bl62 error \"$arr1[$i]\" \"$arr2[$i]\"\n";
	     }
	     next;           	    
	 }
	 $id_cnt++ if ($arr1[$i] eq $arr2[$i]);
	
	 my $sub1 = blosum62 ($arr1[$i], $arr1[$i]);
	 my $sub2 = blosum62 ($arr2[$i], $arr2[$i]);
	 my $sub_ = blosum62 ($arr1[$i], $arr2[$i]);
	 unless (common::slid($sub1,$sub2, $sub_)) {
	     die "blosum62 access error \"$arr1[$i]\" \"$arr2[$i]\"\n";
	 }
	 $max_sim += max ($sub1, $sub2);	 
	 $curr_sim += $sub_;
	 $sim_cnt++ if ($sub_ > 0);
     }
     
     my $similarity = 0;
     if ($max_sim != 0) {
	 $similarity = $curr_sim / $max_sim;
     }
     return ( $similarity, $id_cnt / scalar(@arr1), $sim_cnt / scalar (@arr1) );
     
 }
sub blosum62 {
    my ($aa1, $aa2) = @_;
    
    if ($aa1 =~ /^[\S]{3}$/) {
        $aa1 = sw_aa_code ($aa1);
    } elsif ($aa1 !~  /^[\S]{1}$/) {
        print "common:: blosum62 : Error malformed 1st residue name at \'$aa1\'\n";
        return;
    }
    if ($aa2 =~ /^[\S]{3}$/) {
        $aa2 = sw_aa_code ($aa2);
    } elsif ($aa2 !~  /^[\S]{1}$/) {
        print "common:: blosum62 : Error malformed 2nd residue name at \'$aa2\'\n";
        return;
    }
    
    my @table = qw (A  R  N  D  C  Q  E  G  H  I  L  K  M  F  P  S  T  W  Y  V  B  J  Z  X  *);
    my @bl62 = qw(
    4 -1 -2 -2  0 -1 -1  0 -2 -1 -1 -1 -1 -2 -1  1  0 -3 -2  0 -2 -1 -1 -1 -4
    -1  5  0 -2 -3  1  0 -2  0 -3 -2  2 -1 -3 -2 -1 -1 -3 -2 -3 -1 -2  0 -1 -4
    -2  0  6  1 -3  0  0  0  1 -3 -3  0 -2 -3 -2  1  0 -4 -2 -3  4 -3  0 -1 -4
    -2 -2  1  6 -3  0  2 -1 -1 -3 -4 -1 -3 -3 -1  0 -1 -4 -3 -3  4 -3  1 -1 -4
    0 -3 -3 -3  9 -3 -4 -3 -3 -1 -1 -3 -1 -2 -3 -1 -1 -2 -2 -1 -3 -1 -3 -1 -4
    -1  1  0  0 -3  5  2 -2  0 -3 -2  1  0 -3 -1  0 -1 -2 -1 -2  0 -2  4 -1 -4
    -1  0  0  2 -4  2  5 -2  0 -3 -3  1 -2 -3 -1  0 -1 -3 -2 -2  1 -3  4 -1 -4
    0 -2  0 -1 -3 -2 -2  6 -2 -4 -4 -2 -3 -3 -2  0 -2 -2 -3 -3 -1 -4 -2 -1 -4
    -2  0  1 -1 -3  0  0 -2  8 -3 -3 -1 -2 -1 -2 -1 -2 -2  2 -3  0 -3  0 -1 -4
    -1 -3 -3 -3 -1 -3 -3 -4 -3  4  2 -3  1  0 -3 -2 -1 -3 -1  3 -3  3 -3 -1 -4
    -1 -2 -3 -4 -1 -2 -3 -4 -3  2  4 -2  2  0 -3 -2 -1 -2 -1  1 -4  3 -3 -1 -4
    -1  2  0 -1 -3  1  1 -2 -1 -3 -2  5 -1 -3 -1  0 -1 -3 -2 -2  0 -3  1 -1 -4
    -1 -1 -2 -3 -1  0 -2 -3 -2  1  2 -1  5  0 -2 -1 -1 -1 -1  1 -3  2 -1 -1 -4
    -2 -3 -3 -3 -2 -3 -3 -3 -1  0  0 -3  0  6 -4 -2 -2  1  3 -1 -3  0 -3 -1 -4
    -1 -2 -2 -1 -3 -1 -1 -2 -2 -3 -3 -1 -2 -4  7 -1 -1 -4 -3 -2 -2 -3 -1 -1 -4
    1 -1  1  0 -1  0  0  0 -1 -2 -2  0 -1 -2 -1  4  1 -3 -2 -2  0 -2  0 -1 -4
    0 -1  0 -1 -1 -1 -1 -2 -2 -1 -1 -1 -1 -2 -1  1  5 -2 -2  0 -1 -1 -1 -1 -4
    -3 -3 -4 -4 -2 -2 -3 -2 -2 -3 -2 -3 -1  1 -4 -3 -2 11  2 -3 -4 -2 -2 -1 -4
    -2 -2 -2 -3 -2 -1 -2 -3  2 -1 -1 -2 -1  3 -3 -2 -2  2  7 -1 -3 -1 -2 -1 -4
    0 -3 -3 -3 -1 -2 -2 -3 -3  3  1 -2  1 -1 -2 -2  0 -3 -1  4 -3  2 -2 -1 -4
    -2 -1  4  4 -3  0  1 -1  0 -3 -4  0 -3 -3 -2  0 -1 -4 -3 -3  4 -3  0 -1 -4
    -1 -2 -3 -3 -1 -2 -3 -4 -3  3  3 -3  2  0 -3 -2 -1 -2 -1  2 -3  3 -3 -1 -4
    -1  0  0  1 -3  4  4 -2  0 -3 -3  1 -1 -3 -1  0 -1 -2 -2 -2  0 -3  4 -1 -4
    -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -4
    -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4  1
    );
    my ($aa_i, $aa_j);  
    for (my $i = 0; $i < @table; $i++) {
        $aa_i = $i if ($table[$i] eq $aa1);    
        $aa_j = $i if ($table[$i] eq $aa2);
    }
    return unless (defined ($aa_i) && defined ($aa_j));
 
    return $bl62[($aa_i * @table + $aa_j)];   
}

sub set_abs_path ($) {
   my $path = shift @_;
    unless (defined ($path)) {
        die "common::set_abs_path: Empty String on input\n";
    }

   if ($path !~ /^\//) {
        my $local_dir = `pwd`;
        chomp ($local_dir);
        my @abs_location = split /\//, $local_dir;
        my @relat_location = split /\//, $path;
    
        for my $dir (@relat_location) { 
            if ($dir eq '..'){
                pop @abs_location;
            } else {
                push @abs_location, $dir; 
            }
        }
    $path = join ('/', @abs_location);
    #$path = "/" . $path;
    }
   
    return $path;
}

sub get_delim_starts {
    my ($hash_ref) = @_;
    my @array;
    my $blocks_list = ${$hash_ref}{'blocks_list'};
    foreach my $block (@{$blocks_list}) {
        push @array, ${$block}{'block_start'};
    }
    
    return @array;
}

sub read_delim_file {
    my $ffile = shift @_;
    
    (-e $ffile) ||
        die "common::read_delim_file : specified blocks delimiters file (" .
            "\'$ffile\' not found\n";
    
    my @array;
    my $hash = {};
    my $bool = 0;
    open DELIM, "<$ffile" or return;
    while (my $l = <DELIM>) {
	if ($l =~ /<structure>(.*)<\/structure>/) {
	    $hash->{ structure } = $1;	  
	} elsif ($l =~ /<blocks>/) {
	    $bool = 1;
	} elsif ($l =~ /<\/blocks>/) {
	    $bool = 0;
	} elsif ($bool == 1) {
	
	    if ($l =~ /<(.*)>([^,]+),([^,]+)<(.*)>/) {
		my %h;
		$h{'block_name'} = $1;
		$h{'block_start'} = $2;
		$h{'block_stop'} = $3;
		push @array, \%h;
	    }	    
	}	
    }
    close DELIM;


        ($hash->{ structure }) ||
            die "No structure name in \'$ffile\'\n";
	
    (@array > 0) ||
	die "No blocks delimiters found in \'$ffile\'\n";

    $hash->{ blocks_list } = \@array;
    
    return $hash;
}

sub arrayOccurence {
    my $array = shift @_;
    my $value = shift @_;
    my $cnt = 0;
    foreach my $elem (@{$array}) {
	$cnt ++ if ($elem eq $value);
    }

    return $cnt;
}

sub array_sum {
    my $array = shift @_;
    
    my $t;
    foreach my $i (@{$array}) {
        $t += $i;
    }
    
    return $t;
}

sub read_pdx {
    my $ffile = shift @_;
    
    unless (-e $ffile) {
	print "common::read_pdx : specified blocks delimiters file (";
	print $ffile . ") not found\n";
	return;
    }
    
    my @array;
    my %hash;
    my $bool = 0;
    open DELIM, "<$ffile" or return;
    while (my $l = <DELIM>) {
	if ($l =~ /<structure>(.*)<\/structure>/) {
	    $hash{'structure'} = $1;	  
	} elsif ($l =~ /<pocket_boundaries>/) {
	    $bool = 1;
	} elsif ($l =~ /<\/pocket_boundaries>/) {
	    $bool = 0;
	} elsif ($bool == 1) {	
	    if ($l =~ /<(.*)>(.+)<.+>/) {
		my %h;
		$h{'plane_name'} = $1;
		my @tmp = split (/,/, $2);
                $h{'plane_residues'} = [@tmp];
                push @array, \%h;
	    }	    
	}	
    }
    close DELIM;

    unless (defined ($hash{'structure'})) {
	print "No structure name in " . $ffile . "\n";
	return;
    }
    unless (@array){
	print "No resiudes for plane definition found in " . $ffile . "\n";
	return;
    }

    $hash{'planes_list'} = \@array;
    return \%hash;
}


# True if two provided lists are identical
sub is_same_list {
    my ($arr_1, $arr_2) = @_;
    if (@{$arr_1} != @{$arr_2}) {
        return 0;
    }
    for (my $i = 0; $i < @{$arr_1}; $i++) {
        if (${$arr_1}[$i] ne ${$arr_2}[$i]) {
            return 0;
        }
    }
    
    return 1;    
}


sub FindIndex {
    my $i = common::find_index ($_[0], $_[1]);
    
    return $i;
}

sub find_index {
    my $arrayref = shift @_;
    my $value = shift @_;
    for (my $i = 0; $i < @{$arrayref}; $i++) {
        return $i if (${$arrayref}[$i] eq $value);
    }
    
    return;
}

# return 1 if specified list contains at list one occurence
# of specified value
sub listExist {
    my $value = common::list_exist ($_[0], $_[1]);

    return $value;
}

sub list_exist {
    my $arrayref = shift @_;
    my $value = shift @_;
    
    foreach my $elem (@{$arrayref}) {
        if ($elem eq $value) {
            return 1;
        }
    }
    
    return 0;
}

# unix-like basename function
sub basename {
    my $file_path = shift @_;
    my @array = split /\//, $file_path;
    
    my $basename = $array[$#array];
    
}

sub arrayToSlicedStrings {
 #   warn "uu: @_\n";
    my $array_ref = shift @_;
    my $slice_len = shift @_;
    my $slice_num = shift @_;
 #   warn @{$array_ref};
 #   warn "->$slice_len\n";
    my $string = "";

    unless (defined ($slice_len)) {
        $slice_len = 1;
    }

    for (my $i = 0; $i < @{$array_ref}; $i++) {
        if (defined ($slice_num)) {
            if ($i == $slice_num) {
                $string .= "\n";
                return 1;
            }
        }
        $string .= ${$array_ref}[$i];
        if (($i + 1) % $slice_len == 0 && $i < @{$array_ref} - 1) {
            $string .= "\n";
        } else {
            $string .= " ";
        }
    }
    $string .= "\n";
    
    return $string;
}


sub print_array_slice  {
 #   warn "uu: @_\n";
    my $array_ref = shift @_;
    my $slice_len = shift @_;
    my $slice_num = shift @_;
 #   warn @{$array_ref};
 #   warn "->$slice_len\n";
    unless (common::slid ($array_ref)) {
        die "common::print_array_ref: Error must provide a valid array reference \n";
    }
    unless (defined ($slice_len)) {
        $slice_len = 1;
    }

    for (my $i = 0; $i < @{$array_ref}; $i++) {
        if (defined ($slice_num)) {
            if ($i == $slice_num) {
                print "\n";
                return 1;
            }
        }
        print ${$array_ref}[$i];
        if (($i + 1) % $slice_len == 0 && $i < @{$array_ref} - 1) {
            print "\n";
        } else {
            print " ";
        }
    }
    print "\n";
}


sub fileStringify {
    my $p = common::arg_parser(@_);
    my $logger = get_logger ("common");   
    (defined($p->{ fileLoc })) || die "missing argument fileLoc";
    if (! open FIN, "<$p->{ fileLoc }") {
	$logger->error("Could not open $p->{ fileLoc }");
	return;
    }    
    my $string = '';    
    while(<FIN>) {
	$string .= $_;
    }
    
    return $string;
}

1;

