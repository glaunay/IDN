package newPort::biomolecule;

use strict;
use Data::Dumper;

use common;
use newPort::bindingSite;

use Log::Log4perl qw(get_logger);
our $logger = get_logger ("newPort::biomolecule");


sub get {
  my $p = shift;
  
  my $aceObject;
  if (defined ($p->{ name })) {
    $aceObject = $p->{ DB }->fetch(BioMolecule => $p->{ name });
    if ( !defined ($aceObject) ) { 
      $logger->error("$p->{ name } returned no ace Object");
      return {};
    }
  } else {
    $logger->error("You provided no name");
    return {};
  }

  return {
	  name => $p->{ name },
	  common => getCommonName($aceObject),
	  molecularWeight => getMolecularWeight($aceObject),		
	  biofunc => getBioFunc($aceObject),
	  tissue => getTissue($aceObject),
	  uniprotKW => getUniprotKW($aceObject),
	  pfam => getPfam($aceObject),
	  pdb => getPdb($aceObject),
	  tpm => getTPM($aceObject),
	  go => getGO($aceObject),
	  gene => getGene($aceObject),
	  specie => getSpecie($aceObject),	    
	  type => getType($aceObject),
	  relationship => getRelationships($aceObject),
	  location => getLocation($aceObject),
	  bindingSite => getBindingSite ($aceObject),
	  interactions => getInteractions($aceObject)
	 };
}

sub getCommonName {
  my $aceObject = shift;
  my @array;
  foreach my $tag (qw( 
		       Common_Name Other_Name FragmentName Other_Fragment_Name 
		       GAG_Name Other_GAG_Name Glycolipid_Name Phospholipid_Name Multimer_Name 
		       Other_Multimer_Name Inorganic_Name Other_Inorganic_Name)
		  ) {
    my @values = $aceObject->get($tag);
   
    (@values == 0) && next;
    my $tmp = {$tag => []};
    foreach my $value (@values) {
      push @{$tmp->{ $tag }}, $value->name;
    }
    push @array, $tmp;
  }
  $logger->trace(Dumper(@array));
  return \@array;
}

sub getExternalRef {
 # my $aceObject = shift;
  return {};
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

# Tiisue Free tesxt + UniGene
sub getTissue {
 # my $aceObject = shift;
  return {};
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


sub getTPM {
 # my $aceObject = shift;
  return {};
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
    push @array, {term => $term, id => $val->name, definition => $def};
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
    my @value = $aceObject->get($tag);
    (@value == 0) && next;
    foreach my $val (@value) {
      $val = $tag eq "Molecular_WeightPept_KDa" ? $val->name."000" : $val->name;
      push @array, {$tag => $val};
    }
  }
  return \@array;
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
		       compartiment => undef
		      };
  
  my $aceBuffer = $aceObject->get('Subcellular_location', 1);
  if (defined($aceBuffer)) {
    $dataContainer->{ compartiment } = [];
  }
  while(defined($aceBuffer)) {
    my $compartimentString = defined($aceBuffer) ? $aceBuffer->name : undef;
    push @{$dataContainer->{ compartiment }}, $compartimentString;
    $aceBuffer = $aceBuffer->down();
  }

  $aceBuffer = $aceObject->get('Tissue_specificity', 1);
  $dataContainer->{ tissue } = defined($aceBuffer) ? $aceBuffer->name : undef;
  
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
  defined($aceBuffer) || return $dataContainer;
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
  $dataContainer->{ expressionLevels }->{ data } = $expressionData;
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
    my $tmp = { 
	       kind => undef,
	       supportingExperiments => [],
	       partner =>  $biomAceObject->name
	      };
    
    my @topPartners = $assocAceObj->follow("biomolecule");
    if (@topPartners == 1) {
      push @topPartners, $topPartners[0];
    }
    foreach my $mol (@topPartners) {
      if ($biomAceObject->name ne $mol->name) {
	$tmp->{ partner } = $mol->name;
      }
    }
    my @values = $assocAceObj->get('InferredFrom');

    my @expAceObjList;
    if (@values == 0) {
      $tmp->{ kind } = "genuine";
      @expAceObjList = $assocAceObj->follow('Experiment');
    } else {
      $tmp->{ kind } = "inferred";
      my @tmp = $assocAceObj->follow('InferredFrom');
      foreach my $realAssocAceObj (@tmp) {
	my @realExpAceObj = $realAssocAceObj->follow('Experiment');
	foreach my $exp (@realExpAceObj) {
	  push @expAceObjList, $exp;
	}
      }      
    }
    
    foreach my $expAceObject (@expAceObjList) {
      my @partner = ($expAceObject->get('biomolecule'));
      if(@partner == 1) {push @partner, $partner[0];}
      my $pmid = $expAceObject->get('PMID', 1);
      $pmid = defined($pmid) ? $pmid->name : undef;
      my $imexid = $expAceObject->get('IMEx_ID_Experiment', 1);
      $imexid = defined($imexid) ? $imexid->name : undef;
      
      push @{$tmp->{ supportingExperiments }}, {
						name => $expAceObject->name,
						partner => [$partner[0]->name,
							    $partner[1]->name],
						pmid => $pmid,
						imexid => $imexid
					       };
      }   
    push @array, $tmp;
  }
  
  return \@array;
}

1;
