package newPort::biomolecule;

use strict;
use Data::Dumper;

use common;
use newPort::bindingSite;

use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::biomolecule");
=pod

=cut

sub get {
  my $p = shift;
  my $aceObject;
  if (defined ($p->{ name })) {
    $aceObject = $p->{ DB }->fetch(BioMolecule => $p->{ name });
    if ( !defined ($aceObject) ) { 
      $logger->error("$p->{ name } returned no ace Object");
      return {};
    }
  } elsif (defined ($p->{ aceObject })) {
    if (($p->{ aceObject }->class() ne "BioMolecule") ) {
      $logger->error("You provided an unexpected ace object");
      return {};
    }
    $aceObject = $p->{ aceObject }; # could follow here for safety
  } else {
    $logger->error("You provided no name nor ace biomolecule object");
    return {};
  }



  my $size = defined($p->{ size }) ? $p->{ size } : 'long';
  if ($size eq "veryShort") {
    return {
	    name => defined $p->{ name } ? $p->{ name } : $aceObject->name,
	    common => getCommonName($aceObject),
	    specie => getSpecie($aceObject),
	    moreInfo => undef,
	    stoichiometry => undef,
	    molecularWeight => undef,
	    biofunc => undef,
	    pfam => undef,
	    interpro => undef,
	    pdb => undef,
	    gene => undef,
	    type => undef,
	    relationship => undef,
	    location => undef,
	    bindingSite => undef,
	    interactions => undef,
	    comments => undef,
	    xref => undef,
	    aaNumber => undef,
	    uniprotKW => undef,
	    go => undef,
	    subType => undef
	   };
  }

  
  my $interactionTree = $size eq 'long' ? getInteractions($aceObject) : undef;
  my $bindingSiteTree = $size eq 'long' ? getBindingSite ($aceObject) : undef;

  #my $keywordSet = $size eq 'long' ? getUniprotKW($aceObject) : undef;

  my $keywordSet = $size eq 'long' ? getUniprotKW($aceObject) 
    : getSlimUniprotKW($aceObject);

  my $goSet = $size eq 'long' ? getGO($aceObject) : undef;
  return {
	  name => defined $p->{ name } ? $p->{ name } : $aceObject->name,
	  common => getCommonName($aceObject),
	  moreInfo => getMoreInfo($aceObject),
	  stoichiometry => getStochiometry($aceObject),
	  molecularWeight => getMolecularWeight($aceObject),		
	  biofunc => getBioFunc($aceObject),
	  pfam => getPfam($aceObject),
	  interpro => getInterpro($aceObject),
	  pdb => getPdb($aceObject),
	  gene => getGene($aceObject),
	  specie => getSpecie($aceObject),	    
	  type => getType($aceObject),
	  relationship => getRelationships($aceObject),
	  location => getLocation($aceObject),
	  bindingSite => $bindingSiteTree,
	  interactions => $interactionTree,
	  comments => getComments($aceObject),
	  xref => getXref($aceObject),
	  aaNumber => getAaNumber($aceObject),
	  uniprotKW => $keywordSet,
	  go => $goSet,
	  subType => getSubType($aceObject)
	 };
}

sub getSubType {
  my $aceObject = shift;
  my $subType = $aceObject->right(2);
  
  my @kTypes = ({ type => "Prot", value => "protein" },
		{ type => "Protein_Fragment", value => "protein fragment" },
		{ type => "Glycosaminoglycan", value => "glycosaminoglycan" },
		{ type => "Cation", value => "cation" },
		{ type => "Lipid", value => "lipid" },
		{ type => "Multimer", value => "multimeric complex" },
		{ type => "Inorganic", value => "inorganic compound" });
		
  foreach my $type (@kTypes) {
    ($subType->name eq $type->{ type }) && return $type->{ value };
  }
  
  return undef;
}

=pod # Deprecated use Xref instead
sub getUniprotFragmentID {
  my $aceObject = shift;
  my $aceBuffer = $aceObject->get('Molecule_Processing', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}
=cut

sub getAaNumber {
  my $aceObject = shift;
  my $aceBuffer = $aceObject->get('aa_number', 1);
  defined($aceBuffer) || return undef;
  
  return $aceBuffer->name;
}
sub getInterpro{
  my $aceObject = shift;
  my @values = $aceObject->follow("InterPro");
  @values == 0 && return undef;

  my @data;
  foreach my $iprAceObject (@values) {
    my $tmpData = {id => $iprAceObject->name, EntryName => undef};
    foreach my $key (keys (%{ $tmpData })) {
      my @val = $iprAceObject->get($key);
      (@val > 0) || next;
      $tmpData->{ $key } = $val[0]->name;
    }
    push @data, $tmpData;
  }
  @data == 0 && return undef;

  return { type => 'interproList', data => \@data };
}

sub getXref{
  my $aceObject = shift;
  my @tags = qw / CheBI_identifier KEGG_Compound EBI_xref LipidMaps Molecule_Processing /;
  my @xrefList;
  foreach my $tag (@tags) {
    my $aceNode = $aceObject->get($tag, 1);
    defined($aceNode) || next;
    push @xrefList, { $tag => $aceNode->name };
  }
  
  @xrefList == 0 && return undef;
  return \@xrefList;
}

sub getComments {
  my $aceObject = shift;
  
  my @tags = qw / GAG_Structure Other_informations Zone 
		  Category More Definition Spep_Comments 
		  More_Info /; # just added more info
  
  my @data;
  foreach my $tag (@tags) {
    my $aceBuffer = $aceObject->get($tag, 1);
    defined($aceBuffer) || next;
    push @data, $aceBuffer->name;
  }
  @data == 0 && return undef;
  
  return { type => 'comments', data => \@data };
}

sub getMoreInfo{
  my $aceObject = shift;
  my $aceBuffer = $aceObject->get('More_info', 1);
  defined($aceBuffer) || return undef;

  return $aceBuffer->name;
}
sub getStochiometry{
  my $aceObject = shift;
  my $aceBuffer = $aceObject->get('Stoichiometry', 1);
  defined($aceBuffer) || return undef;

  return $aceBuffer->name;
}

sub getCommonName {
  my $aceObject = shift;
  my $dataContainer = {};
  foreach my $tag (qw( 
		       Common_Name Other_Name FragmentName Other_Fragment_Name 
		       GAG_Name Other_GAG_Name Glycolipid_Name Phospholipid_Name Multimer_Name 
		       Other_Multimer_Name Inorganic_Name Other_Inorganic_Name Cation_Name 
		       Spep_Name Spep_ShortName )
		  ) {
    my @values = $aceObject->get($tag);

    (@values == 0) && next;
    $dataContainer->{ $tag } = [];
    foreach my $value (@values) {
      push @{ $dataContainer->{ $tag } }, $value->name;
    }
  }
  my @stack;
  foreach my $key (keys (%{ $dataContainer })) {
    foreach my $val (@{$dataContainer->{ $key }}) {
      push @stack, $val;
    }
  }
  $dataContainer->{ anyNames } = \@stack; 
  $logger->trace(Dumper($dataContainer));
  
  return $dataContainer;
}

sub getPdb {
  my $aceObject = shift;
  
  my @pdbObjList = $aceObject->follow("PDB");
  (@pdbObjList == 0) && return undef; 
  my @data;
  foreach my $pdbAceObj (@pdbObjList) {
    my @val = $pdbAceObj->get('Structure_determination_Method');
    push @data, {
		 id => $pdbAceObj->name,
		 determinationMethod =>  @val > 0 ? $val[0]->name : undef
		};
  }
 
  return { type => 'pdbList',
	   data => \@data
	 };
}

sub getBioFunc {
  my $aceObject = shift;
  my @value = $aceObject->get('Function');
  if (@value == 0) {
    return undef;
  }

  my $string = "";
  foreach my $val (@value) {
    $string .= $val->name;
  }
  return $string;
}

sub getSlimUniprotKW {
  my $aceObject = shift;
  
  my @keywordObjList = $aceObject->follow("Keywrd");
  my @data = map { $_->name } @keywordObjList;

  scalar(@data) == 0 && return undef;

  return \@data;
}


sub getUniprotKW {
  my $aceObject = shift;
  my @data;
  my @keywordObjList = $aceObject->follow("Keywrd");
  foreach my $keywordObject (@keywordObjList) {
    my $tmpData = {id => $keywordObject->name, definition => undef, term => undef};
    my $str = '';
    foreach my $def ($keywordObject->Definition) {
      $str .= $def;
    }
    $tmpData->{ definition } = $str ne '' ? $str : undef;

    $str = '';
    foreach my $def ($keywordObject->Identifier) {
      $str .= $def;
    }
    $tmpData->{ term } = $str ne '' ? $str : undef;

    push @data, $tmpData;
  }
  $logger->trace("returning " . Dumper(@data));
  
  @data == 0 && return undef;
  return \@data;
}


sub getPfam {
  my $aceObject = shift;
  my @values = $aceObject->follow("Pfam");
  @values == 0 && return undef;
  
  my @data;
  
  foreach my $pfamAceObject (@values) {
    my $tmpData = {id => $pfamAceObject->name, Desc => undef, EntryName => undef};
    foreach my $key (keys (%{ $tmpData })) {
      my @val = $pfamAceObject->get($key);
      (@val > 0) || next;
      $tmpData->{ $key } = $val[0]->name;
    }
    push @data, $tmpData;
  }
  @data == 0 && return undef;
  
  return { type => 'pfamList', data => \@data };
}

sub getGO {
  my $aceObject = shift;
  my @value = $aceObject->follow('GO');

  my @array;
  foreach my $val(@value) {
    my $term = $val->Term;
    $term = defined ($term) ? $term->name : undef;
    my $def = $val->Definition;
    $def = defined ($def) ? $def->name : undef;
    my $ontology =  $val->Ontology;
    $ontology = defined ($ontology) ? $ontology->name : undef;
    push @array, {term => $term, id => $val->name, definition => $def, ontology => $ontology};
  }
  
  @array  == 0 && return undef;
  return \@array;
}


sub getGene {
  my $aceObject = shift;
  
  my $data = {
	      GeneName => undef,
	      Synonym => undef,
	      OrderedLocusName => undef,
	      ORF_Name => undef
	     };

  my $bool = 0;
  foreach my $key (keys (%{$data})) {
    my @values = $aceObject->get($key);
    @values == 0 && next;
    $bool = 1;
    my @tmp;
    foreach my $val (@values) {
      push @tmp, $val->name;
    }
    $data->{ $key } .= join (',', @tmp);
  }
  $bool || return undef;

  return $data;
}

sub getSpecie {
  my $aceObject = shift;

  my @specie = $aceObject->follow('In_Species');
  @specie == 0 && return undef;

  my @names;
  foreach my $key (qw/Scientific_name English_name Synonym/) {
    my $val = $specie[0]->get($key, 1);
    defined($val) || next;
    push @names, $val->name;
  }
  return {type => "ncbitaxon", value => $specie[0]->name, names => \@names};
}

sub getType {
  my $aceObject = shift;
  my $test = $aceObject->right(2);
  defined ($test) || return undef;

  return $test->name;
}

sub getRelationships {
  my $aceObject = shift;
  
  my $tmp = {	    
	     Belongs_to => [],  # XREF ContainsFragment
	     ContainsFragment => [], # XREF Belongs_to //  fragments of the biomolecule
	     Component => [], # XREF In_multimer
	     In_multimer => [], # XREF Component
	     Bound_Coval_to => [] # XREF Bound_Coval_to
	    };
  my $bool = 0;
  foreach my $key (keys(%{ $tmp })) {
    my @values = $aceObject->get($key);
    foreach my $val (@values) {
      push @{ $tmp->{ $key } }, $val->name;
      $bool = 1;
    }
  }
  $bool || return undef;
  $logger->trace("returning dataContainer:\n" . Dumper($tmp));
  return $tmp;
}

sub getMolecularWeight {
  my $aceObject = shift;
  my @array;
  for my $tag (qw (Molecular_WeightPept_KDa Molecular_Weight )) {
    my $aceBuffer = $aceObject->get($tag, 1);
    (defined $aceBuffer) || next;
    my $string = $tag eq "Molecular_WeightPept_KDa" 
      ? $aceBuffer->name."000" : $aceBuffer->name;
    return $string
  }
  
  return undef;
}

sub getLocation {
  my $aceObject = shift;
  my $dataContainer = {
		       expressionLevels => {
					    name => undef,
					    title => undef,
					    gene => undef,
					    cytoband => undef,
					    geneId => undef,
					    locusLink => undef,
					    data => undef
					   },
		       tissue => undef,
		       comments => undef,
		       compartiment => undef
		      };
  #
  # Get General tissue comment from uniprot
  my $aceBuffer = $aceObject->get('Tissue_Specificity', 1);
  if (defined($aceBuffer)) {
    $dataContainer->{ comments } = $aceBuffer->name;
  }
 
  $aceBuffer = $aceObject->get('Subcellular_location', 1);
  if (defined($aceBuffer)) {
    $dataContainer->{ compartiment } = [];
  }
  while(defined($aceBuffer)) {
    my $compartimentString = defined($aceBuffer) ? $aceBuffer->name : undef;
    push @{$dataContainer->{ compartiment }}, $compartimentString;
    $aceBuffer = $aceBuffer->down();
  }
  # Put GAG location in compartiment
  $aceBuffer = $aceObject->get('Location', 1);
  while(defined($aceBuffer)) {
    my $compartimentString = defined($aceBuffer) ? $aceBuffer->name : undef;
    push @{$dataContainer->{ compartiment }}, $compartimentString;
    $aceBuffer = $aceBuffer->down();
  }
  # Put Personnal KW in compartiment
  $aceBuffer = $aceObject->get('Personal_Keyword', 1);
  while(defined($aceBuffer)) {
    my $compartimentString = defined($aceBuffer) ? $aceBuffer->name : undef;
    push @{$dataContainer->{ compartiment }}, $compartimentString;
    $aceBuffer = $aceBuffer->down();
  }
  
  $aceBuffer = $aceObject->get('Tissue_specificity', 1);
  $dataContainer->{ comments } = defined($aceBuffer) ? $aceBuffer->name : undef;
  
  my @aceObjects = $aceObject->follow('UniGene');
  if (@aceObjects == 0) {
    $dataContainer->{ expressionLevels } = undef;
    return $dataContainer;
  }
  my $aceUniGeneObject = shift @aceObjects;
  $dataContainer->{ expressionLevels }->{ name } = $aceUniGeneObject->name;
  foreach my $key (qw /title gene cytoband geneId locusLink/) {
    my $val = $aceUniGeneObject->get($key, 1);
    defined($val) || next;
    $dataContainer->{ expressionLevels }->{ $key } = $val->name;
  }
  
  $aceBuffer = $aceUniGeneObject->at('Data', 1);
#  defined($aceBuffer) || return $dataContainer;
  
  my $expressionData = {};
    while(defined($aceBuffer)) {
      $expressionData->{ $aceBuffer->name } = [];
      my @expressionAceObjList = $aceBuffer->tags();
      my @value = map {$_->name ne '' ? $_->name : '0';} @expressionAceObjList;
      for (my $i = 0; $i < @expressionAceObjList ; $i++) {
	my $aceCurrExpressionObject = $expressionAceObjList[$i];
	$aceCurrExpressionObject = $aceCurrExpressionObject->right(1);
	while(defined($aceCurrExpressionObject)) {
	  my @array = ($value[$i], $aceCurrExpressionObject->name);	
	  $aceCurrExpressionObject = $aceCurrExpressionObject->right(1);
	  
	  push @array, $aceCurrExpressionObject->name;
	  $array[2] =~ s/_/ /g;
	  push @{ $expressionData->{ $aceBuffer->name } }, \@array;
	  
	  $aceCurrExpressionObject = $aceCurrExpressionObject->down();
	  
	}
      }
      $aceBuffer = $aceBuffer->down(1);
    }
  
  $dataContainer->{ expressionLevels }->{ data } = %{ $expressionData } 
    ? $expressionData 
      : undef;
  
  
  $aceBuffer = $aceUniGeneObject->at('Express', 1);
  if (defined ($aceBuffer)) {
    $dataContainer->{ tissue } = [];
    while (defined($aceBuffer)) {
      push @{ $dataContainer->{ tissue } }, $aceBuffer->name;
      $aceBuffer = $aceBuffer->down();
    }
  }

  $logger->info(Dumper($dataContainer));
  return $dataContainer;
}

sub getBindingSite {
  my $biomAceObject = shift;

  my @data;

  # Flatten all experiments of current biomolecule
  my @assocAceObjList = $biomAceObject->follow("Association");
  my @experimentAceObjList;
  foreach my $assocAceObject (@assocAceObjList){
    my @tmpExperimentAceObjList = $assocAceObject->follow("Experiment", -filled => 1);
    foreach my $experimentAceObject (@tmpExperimentAceObjList){
      push @experimentAceObjList, $experimentAceObject;
    }
  }
  $logger->trace($biomAceObject->name . " experiment array length " . scalar(@experimentAceObjList));
  foreach my $experimentAceObject (@experimentAceObjList){
    $logger->info("Analyzing new experiment : " . $experimentAceObject->name);
    my $tmpData = newPort::bindingSite::get({aceObject => $experimentAceObject,
				   biomolecule => $biomAceObject->name});
    defined($tmpData) || next;
    push @data, $tmpData;
  }
  $logger->trace("returning dataContainer:\n" . Dumper(@data));
  return \@data;
}

sub getInteractions {
  my $biomAceObject = shift;
  my @array;
  my @assocAceObjList = $biomAceObject->follow("Association");

  foreach my $assocAceObj (@assocAceObjList) {
    $logger->info( $assocAceObj->name );
    
    my $taxon =  $biomAceObject->at("In_Species", 1);
    
    my $tmp = { 
	       id => $assocAceObj->name,
	       kind => undef,
	       supportingExperiments => [],
	       inferrenceExperiments => [],
	       partner =>  { 
			    id => $biomAceObject->name,
			    common => getCommonName($biomAceObject),
			    specie => getSpecie($biomAceObject)
			   }
	      };
    my @bufferInferred;
    my @bufferGenuine;
    my @topPartners = $assocAceObj->follow("biomolecule");
    if (@topPartners == 1) {
      push @topPartners, $topPartners[0];
    }
    foreach my $mol (@topPartners) {
      if ($biomAceObject->name ne $mol->name) {
	$tmp->{ partner }->{ id } = $mol->name;
	$tmp->{ partner }->{ common } = getCommonName($mol);
	$tmp->{ partner }->{ specie } = getSpecie($mol);
      }
    }
    # Store Genuine experiment
    my @aceTypes = $assocAceObj->at('Kind');
    foreach my $aceType (@aceTypes) {
      if ($aceType->name eq "Genuine") {
	my @expAceObjList = $aceType->get('Experiment');
	foreach my $expAceObj(@expAceObjList) {
	  my $data = fillExperimentRef($expAceObj);
	  push @{$tmp->{ supportingExperiments }}, $data;
	}
      } elsif ($aceType->name eq "Inferred") {
	my @assocTest = $aceType->get('InferredFrom');
	foreach my $assocRef (@assocTest) {
	  my $test = $assocRef->follow();
	  my @expAceObjList = $test->follow('Experiment');
	  foreach my $expAceObj(@expAceObjList) {
	    my $data = fillExperimentRef($expAceObj);
	    push @{$tmp->{ inferrenceExperiments }}, $data;
	  }
	}
      }
    }
    $tmp->{ kind } = @{ $tmp->{ supportingExperiments } } > 0 ? 'genuine' : 'inferred';
    push @array, $tmp;
  }
  return \@array;
}

sub fillExperimentRef {
  my $expAceObject = $_[0]->fetch();

  $logger->info(Dumper($expAceObject));
  

  my @partner = ($expAceObject->get('biomolecule'));

  $logger->info(Dumper(@partner));
  

  if (@partner == 1 ) {push @partner, $partner[0];}
  my $pmid = $expAceObject->get('PMID', 1);
  $pmid = defined($pmid) ? $pmid->name : undef;
  my $imexid = $expAceObject->get('IMEx_ID_Experiment', 1);
  $imexid = defined($imexid) ? $imexid->name : undef;
  return
    {
      name => $expAceObject->name,
      partner => [$partner[0]->name,
		  $partner[1]->name],
      pmid => $pmid,
      imexid => $imexid
     };
}

1;
