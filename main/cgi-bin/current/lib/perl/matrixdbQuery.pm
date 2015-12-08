package matrixdbQuery;
use strict;
use common;
use Log::Log4perl qw(get_logger :levels);
use psicquicQuery;
use base ("browserExporter");

my $logger = get_logger ("matrixdbQuery");
$logger->level($ERROR);


sub generateRegularBiomoleculeName {
    my $self = shift;
    
    my $p = common::arg_parser(@_);
    
    my $queryString = getMetaTypeAceAccessor ($p->{ string });
    my $name = $p->{ string };
    
    my @aceObjects = $self->{ DB }->fetch (-query=>"find Biomolecule $name");
    if (@aceObjects == 0 ) {
	$logger->trace("no trace of biomolecule $name in matrixdb");
	return $name;  
    }
    my $aceObject = shift @aceObjects;
    
    $logger->trace("generating regular name for $name");
    if ($name =~ /PFRAG/) {
	my @tmp = $aceObject->get('Molecule_Processing');
	my @tmp2 = $aceObject->get('Belongs_to');
	@tmp == 0 && $logger->error("No PRO feature for $name");
	@tmp2 == 0 && $logger->error("No Belongs to  for $name");
	$name = (@tmp > 0 && @tmp2 > 0) ? $tmp2[0]->name . "-" . $tmp[0]->name : $name;	
	$logger->trace("setting it to $name");
	return $name;
    }	
    elsif ($name =~ /MULT/) {
	my @tmp = $aceObject->get('EBI_xref');
	(@tmp == 0) && $logger->error("No EBI ref for $name");
	$name = scalar @tmp > 0 ? $tmp[0]->name : $name;	
	$logger->trace("setting it to $name");
	return $name;   
    }
    
    # try to get a CheBI_identifier
    my @chebiId = $aceObject->get('CheBI_identifier');
    if (@chebiId > 0) {
	$name = $chebiId[0]->name;
	$logger->trace("setting it to $name");
	return $name;   
    }        
    
    $logger->trace("setting it to $name");
    return $name;       
}

## Auxilliary functions, not object methods
=pod
    given a biomolecule name
    expand the ace query for "meta" biomolecule
    ie Fragment, chebi and EBI complex
=cut
sub getMetaTypeAceAccessor {
    my $biomolecule = shift;
    
    if ($biomolecule =~ /(PRO_[\d]+)/) {
	my $string = "Biomolecule where Molecule_Processing = $1";
	$logger->trace("Biomolecule $biomolecule ace expanded as $string");
	return $string;
    }
    if ($biomolecule =~ /(CHEBI:[\d]+)/) {
	my $string = "Biomolecule where CheBI_identifier = \"$1\"";
	$logger->trace("Biomolecule $biomolecule ace expanded as $string");
	return $string;
    }
    if ($biomolecule =~ /(EBI-[\d]+)/) {
	my $string =  "Biomolecule where EBI_xref = $1";	
	$logger->trace("Biomolecule $biomolecule ace expanded as $string");
	return $string;
    }
    
    return;
}

sub isMatrixdbQuery {
    my $query = shift @_;
    my $tagArray = getEligibleTags ($query);
  
    return  common::list_exist ($tagArray,  $query->param('searchType'));
}

=pod
    returns list of cgi parameters that triggers a matrixdbQuery construction
    adding PRO Features EBI complex reference

=cut
sub getEligibleTags {
    my @tags = qw /biomol_search pubmed_search imex_search/;

    return \@tags;
}

=pod
 Constructor & methods
=cut
sub new {
    my $class = shift @_;
    my $self = {};
    bless $self, $class;
    
    my $p = common::arg_parser (@_);
    my $logger = get_logger ("matrixdbQuery");
    $self->{ DB } = $p->{database};
    defined ($p->{ returnType }) || 
	     $logger->logdie("no return type specified to contructor");

    if (! defined ($p->{ inputContent })) {
	$logger->warn("empty inputContent");
	$self->{ status } = "empty inputContent";
	return $self;
    }
   
    $self->{ status } = "setSearch";
    $self->{ queryString } = "query find ";
    
# Handle local acedb search
    if ($p->{ returnType } eq "Association") {	
	$self->declareAssociationData ();
	if ($p->{ inputType } eq "biomol_search") {

	    my $tmpString = getMetaTypeAceAccessor ($p->{ inputContent });
	    my $subString = defined($tmpString) ? $tmpString : "Biomolecule $p->{ inputContent }";
=pod
	    if ($p->{ inputContent } =~ /PRO_[\d]+/) {
		$subString = "Biomolecule where Molecule_Processing = $p->{ inputContent }";
	    }
	    elsif ($p->{ inputContent } =~ /CHEBI:/) {
		$subString = "Biomolecule where CheBI_identifier = \"$p->{ inputContent }\"";
	    } elsif ($p->{ inputContent } =~ /EBI-/) {
		$subString = "Biomolecule where EBI_xref = $p->{ inputContent }";	
	    }
=cut
	    $self->{ queryString } .= "$subString;follow Association"; 
	}
	elsif ($p->{ inputType } eq "pubmed_search") {
	    $self->{ queryString } .= "Association  where PMID=$p->{ inputContent }";
	}
	elsif ($p->{ inputType } eq "imex_search") {
	    $self->{ queryString } .= "Publication where IMEx_ID=$p->{ inputContent }; follow Association";
	}
    }
    
    $self->{ counts } =  $self->{ DB }->fetch (-query=>"$self->{ queryString }");    
    my @aceObjects =  $self->{ DB }->fetch (-query=>"$self->{ queryString }");
    $self->{ aceObjects } = \@aceObjects;
    $logger->info ("QueryString:\"$self->{ queryString }\" --> nhits $self->{ counts }");
    
    $self->setAssociationData();


    return $self;
}

=pod nData
    return the size of dataTable
=cut
sub nData {
    my $self = shift;
    if (defined ( $self->{ dataTable })) {
	return scalar @{$self->{ dataTable }};
    }
    
     return 0;
}

# Create the dataTable attribute
sub setAssociationData {
    my $self = shift @_;
    my $logger = get_logger ("matrixdbQuery");
    my @dataTable;
      
    # we have a list of Association    
    foreach my $assocObject (@{$self->{ aceObjects }}) {
	my @experimentsArray = $assocObject->follow ('Experiment');

	warn "Current Experiment Array size: " . scalar (@experimentsArray);
	
	my $assocLevel = { id => $assocObject->name };
	initHash (hash => $assocLevel, type => "Association");
	$self->fillHash (hash => $assocLevel, dataSource => $assocObject);
#	print_hash ($assocLevel);
	
# populate the experiments array
	$logger->warn (">> Populating " . $assocObject->name . " associated Experimental array <<");	
	@{$assocLevel->{ experimentArray }} = ();
	foreach my $experimentObject (@experimentsArray) {
	    my $h = { id => $experimentObject->name };
	    initHash (hash => $h, type => "Experiment");	    
	    $self->fillHash (hash => $h, dataSource => $experimentObject);
	#    print_hash ($h);
	    push @{$assocLevel->{ experimentArray }}, $h;	    
	}	
	push @dataTable, $assocLevel;
    }   

    $self->{ dataTable } = \@dataTable;
}

sub getDataTable {
    my $self = shift;
    
    (defined ($self->{ dataTable })) && return $self->{ dataTable };

    $self->setAssociationData ();
    return $self->{ dataTable };

}

sub initHash {
   # MAPPER json header : acedb tag
    my $exp_map = { 
	'Detection Method' => 'Interaction_Detection_Method',
	'Pmid' => 'PMID',
	'A Experimental Role' => 'ExpRole',
	'B Experimental Role ' => 'ExpRole',
	'A identification' => 'Detect_Meth',
	'B identification' => 'Detect_Meth',	
    };
    my $assoc_map = {       
	"A Interactor" => 'name',
	"A Common name" => 'Common_Name',
	"A Gene name" => 'GeneName',
	"A Biological Role" => 'Function',
	"A TaxID" => 'In_Species',
	"B Interactor"  => 'name',
	"B Common name" => 'Common_Name',
	"B Gene name" => 'GeneName',
	"B Biological Role" => 'Function',
	"B TaxID" => 'In_Species',      
    };
    
    my $p = common::arg_parser (@_);
    my $map;
    if ($p->{ type } eq "Association") {
	$map = $assoc_map;
    } elsif ($p->{ type } eq "Experiment") {
	$map = $exp_map;
    }
    foreach my $k (keys %{$map}) {
	$p->{ hash }->{ $k } = "Nothing";
    }

    $p->{ hash }->{ map } = $map;
    $p->{ hash }->{ type } = $p->{ type };
}

# fillHash (hash => $h,  dataSource => $experimentObject,  biomolecules => \@biomoleculesArray);
sub fillHash {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
    my $logger = get_logger ("matrixdbQuery");
    
    my @biomoleculeArray = $p->{ dataSource }->follow ('BioMolecule');
    if ($p->{ hash }->{ type } eq "Association") {
	$self->associationSubTreeParser (from => $p->{ dataSource }, to => $p->{ hash });
    }
    
}
# low level ace object browser routine
sub associationSubTreeParser {
    my $self = shift @_;
    my $p = common::arg_parser (@_);
    my $logger = get_logger ("matrixdbQuery");
    my $subTree; # buffer ace object sub tree
    $p->{ to }->{ 'Interaction identifier(s)' } = $p->{ from }->name;    
    warn $p->{ from }->asString;
    # Extract data from partner subtree
    my $partnerSubTree = $p->{ from }->at('Partner');
    $subTree = $partnerSubTree->right()->right();
    
    ($p->{ to }->{ 'A Interactor' }) = ($subTree->asString =~ /^(.+)$/);    
    warn "primary partner: " . $p->{ to }->{ 'A Interactor' };

    $subTree = $subTree->down();
    if (defined ($subTree)) {
	($p->{ to }->{ 'B Interactor' }) = ($subTree->asString =~ /^(.+)$/);    
	warn "second partner found: " . $p->{ to }->{ 'B Interactor' };
    } else {
	$p->{ to }->{ 'B Interactor' } = $p->{ to }->{ 'A Interactor' };
    }
    $p->{ to }->{ 'Source database' } = 'matrixdb';
   
# fetch Biomolecule entry and fill the rest
    foreach my $chainid (qw /A B/) {
	my $biomoleculeHeader = $chainid . " Interactor";
#	warn "Association fields extraction:" . $p->{ to }->{ $biomoleculeHeader };    
	
	my $aceBiomolecule = $self->{ DB }->fetch (
	    BioMolecule => $p->{ to }->{ $biomoleculeHeader });
#	warn "FROM -->" . $aceBiomolecule->asString;	
	
	foreach my $key (keys (%{$p->{ to }})) {	    
	    next if ($key !~ /^$chainid /);
	    next if ($key =~ /$chainid Interactor$/);	  
	    ($key eq "id") && next;
	    ($key eq "type") && next;	
	    ($key eq "map") && next;	   	   
	    
	   # warn "\'$key\'";
	    my $tag = $p->{ to }->{ map }->{ $key };
	    #die "OUPSS \'$key\'"  if (!defined $tag);
	    my $value = $aceBiomolecule->get ($tag, 1);
	    if (!defined $value) {
		warn  "FAIL: from \'$key\' to \'$tag\' no referenced value";
		warn "aceObject responsible is:\n";
		warn $aceBiomolecule->asString;
	    } else {
		#warn "OK: from \'$key\' to \'$tag\' to \'$value\'";
		$p->{ to }->{ $key } = $value;
	    }
	}
    }
}


sub mapToValue {
    my $h = shift @_;
    my $value = shift @_;
    
    foreach my $key (%{$h}) {
	($h->{ $key } == $value ) && return $key;
    }

    return;
}

sub print_hash {
    my $h = shift;
    my $logger = get_logger ("matrixdbQuery");

    warn "HASH CONTENT $h->{ type } $h->{ id }";
    foreach my $k (keys ( %{ $h } ) ) {
	next if ($k eq "map");
	next if ($k eq "type");
	next if ($k eq "id");	
	$logger->warn ($k . " : " .  $h->{ $k } . "||");
    }
}




1;
