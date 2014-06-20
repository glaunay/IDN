package mitabDumper;
use Moose;
use Data::Dumper;
use namespace::autoclean;

my $logger = Log::Log4perl::get_logger("mitabDumper");

has 'DB' => (is => 'ro', isa => 'Object');
has 'header'=> (is => 'ro', isa => 'ArrayRef', required => 1,
		default => sub {[
		       'ID(s) interactor A','ID(s) interactor B',
		       'Alt. ID(s) interactor A','Alt. ID(s) interactor B',
		       'Alias(es) interactor A','Alias(es) interactor B',
		       'Interaction detection method(s)','Publication 1st author(s)','Publication Identifier(s)',
		       'Taxid interactor A','Taxid interactor B',
		       'Interaction type(s)','Source database(s)','Interaction identifier(s)',
		       'Confidence value(s)','Experimental role(s) interactor A','Experimental role(s) interactor B',
		       'Biological role(s) interactor A','Biological role(s) interactor B',
		       'Properties interactor A','Properties interactor B',
		       'Type(s) interactor A','Type(s) interactor B',
		       'HostOrganism(s)',
		       'Expansion method(s)',
		       'Dataset name(s)',
		       'Annotation(s) interactor A','Annotation(s) interactor B',
		       'Parameter(s) interactor A','Parameter(s) interactor B',
		       'Parameter(s) interaction',
		       'Creation date','Update date',
		       'Checksum for interactor A','Checksum for interactor B','Checksum for interaction',
		       'negative', 'Feature(s) for interactor A', 'Feature(s) for interactor B',
		       'Stoichiometry for interactor A', 'Stoichiometry for interactor B',
		       'Participant identification method for interactor A',
		       'Participant identification method for interactor B'
		      ]},
		traits => ['Array'],
		handles => {
			    getHeader => 'join'
			   });
has cvMapper => (is => 'rw', isa => 'HashRef', predicate => 'has_mapper', traits => ['Hash'],
		 handles => {
			     setCvTerm => 'set',
			     getCvTerm => 'get'
			    });
sub readMapper {
  my $self = shift;
  my $p = shift;
  
  open(XREF, $p->{ file }) || $logger->logdie("cannot open psimi x matrixdb mapper file at "
					      ."\"$p->{ file }\"");
  while(my $line = <XREF>) { 
    chomp $line ;
    if ($line =~ /^(\w.+)\|\|(MI:\d\d\d\d)$/) {
      $self->setCvTerm($1 => $2);
    }
  }
  close(XREF) ;
}


sub setSource {
	       my $self = shift;
	       my ($data, $aceBuffer) = @_;
	       $data->[13] = "matrixdb:" . $aceBuffer->name;
	       if (my $imexidexp = $aceBuffer->IMEx_ID_Experiment)
	       {
		 $data->[13] .= "|imex:".$imexidexp;
	       }
	       $data->[12]="psi-mi:\"MI:0917\"(matrixdb)";
	       
	       return 1;
	      }

sub setParameters {
		   my $self = shift;
		   my ($data, $aceBuffer) = @_;
		   #  Parameters of the interaction
		   #    kd:7.5x10^-6 ~0.5(molar)
		   my @kinetics;
		   if($aceBuffer->KD1_nM) {
		     my $str = "kd:" . $aceBuffer->KD1_nM;
		     if ($aceBuffer->Range_nM) {
		       if ($aceBuffer->Range_nM =~ /^[\s]*([\d\.]+)[\s]*$/){
			 #    if (1){
			 $str .= " ~" . $1;
		       }
		     }
		     $str .= " (nanomolar)";
		     push @kinetics, $str;
		   }
		   if ($aceBuffer->AssociationRate1) {
		     my $str = 'kon:' . $aceBuffer->AssociationRate1 . ' (M-1.s-1)';
		     push @kinetics, $str;
		   }
		   if ($aceBuffer->DissociationRate1) {
		     my $str = 'koff:' . $aceBuffer->DissociationRate1 . ' (s-1)';
		     push @kinetics, $str;
		   }
		   $data->[29] = @kinetics > 0 ? join("|", @kinetics) : '-';
		   
		   return 1;
		     
		  }
sub setPublication {
		    my $self = shift;
		    my ($data, $aceBuffer) = @_;
		    
		    
		    my $biblio = $aceBuffer->PMID;
		    if ( !defined($biblio) ) {
		      $logger->error("$aceBuffer\tNo biblio\n");
		      return 0;
		    }
		    
		    $data->[8]="pubmed:".$biblio;
		    if (my $imexid=$biblio->IMEx_ID)
		    {
		      #pour si toutes les experiences ne sont pas échangées dans un papier
		      if ($aceBuffer->IMEx_ID_Experiment)
			{
			  $data->[8] .= "|imex:$imexid";
			}
		    }

		    if ($biblio->Author)#List)
		    {
		      my $tmp = $biblio->Author;#List ;
		      $tmp=~/^([^\,]+)\,?/;
		      my $res = $1;
		      if ($res)
			{
			  $data->[7] = $res." et al.";
			}
		      else
			{
			  $logger->error("Experiment $aceBuffer skip : $biblio\tpas d'auteur \"$tmp\"");
			  return 0;
			}
		    }
  
		    return 1;
		   }

sub setHost {
	     my $self = shift;
	     my ($data, $aceBuffer) = @_;

	     my $host = $aceBuffer->Host_System;
	     if (!$host) {
	       $logger->error("Experiment $aceBuffer skip : no host for $aceBuffer exp");
	       return 0;
	     }

	     my $shorttemp = "";
	     $shorttemp=$host->English_name;
	     if ($host == -1)
	     {
	       $data->[23] = "taxid:" . $host;
	     }
	     elsif ($shorttemp)
	     {
	       $data->[23] = "taxid:" . $host . "($shorttemp)";
	     }
	     else
	     {
	       $data->[23] = $host;
	     }

	     return 1;
	    }
sub setInteractionDetectionMethod {
				   my $self = shift;
				   my ($data, $aceBuffer) = @_;
				   my $litcur = $aceBuffer->MatrixDB;
				   $litcur =~ s/_/ /g;
				   $litcur = lc $litcur;
				   $litcur =~ s/fluorescence activated cell sorting/fluorescence-activated cell sorting/;
				   $litcur =~ s/x ray crystallography/x-ray crystallography/;
				   $litcur =~ s/protein cross linking with a bifunctional reagent/protein cross-linking with a bifunctional reagent/;
				   my $ref = $self->getCvTerm($litcur);
				   if (defined ($ref)) {
				     $data->[6] = "psi-mi:\"" . $ref . "\"(" . $litcur . ")";##corr samuel
				   }
				   else
				   {
				     $logger->error("Experiment $aceBuffer skip : pas de corresp MI pour $litcur");
				     return 0;
				   }
				   
				   return 1;
				  }

sub setProteinInfo {
		    my $self = shift;
		    my ($data, $partnerDetail, $aceBiomolecule, $c) = @_;
		    
		    
		    $data->[21 + $c]="psi-mi:\"MI:0326\"(protein)";##corr samuel
		    
		    if (my $isoform = $partnerDetail->at("Isoform", 1)) {
		      $data->[$c] = "uniprotkb:" . $isoform;
		    } else {
		      $data->[$c] = "uniprotkb:" . $aceBiomolecule->name;
		    }
		    
		    if (my $gene = $aceBiomolecule->GeneName) {
		      $data->[4 + $c]="uniprotkb:" . $gene . "(gene name)";
		    }
		    else
		    {
		      $logger->info("no gene for $aceBiomolecule");
		    }
		    #warn $aceBiomolecule->asString();
		    
		    my $entryname = lc ($aceBiomolecule->EntryName);
		    #$entryname = ~/(\w+)_\w+/;
		    my $commonName = $aceBiomolecule->Common_Name;
		    if (!$commonName) {
		      $logger->error("Experiment $aceBiomolecule skip : No Common name for protein " 
				     . $aceBiomolecule->name);
		      return 0;
		    }
		    
		   
		    #$data[$c] = "matrixdb:" . $biom;
		    $data->[2 + $c] = "matrixdb:" . $entryname . "(short label)";
		    return 1;
}

sub setFragmentInfo {
		     my $self = shift;
		     my ($data, $aceBiomolecule, $c) = @_;

		     $data->[21 + $c] = "psi-mi:\"MI:0326\"(protein)"; ##corr samuel
		     
		     my $uni = $aceBiomolecule->Molecule_Processing;
		     my $parent = $aceBiomolecule->Belongs_to;
		     my $gene = $parent->GeneName;
	    
		     if (defined($gene)){
		       $data->[4 + $c] = "uniprotkb:$gene(gene name)"; # moved from index 2 to index 3
		     }  
	    
		     if (($uni)&&($parent)) {
		       $data->[$c]="uniprotkb:${parent}-$uni";
		     } else {
		       $data->[$c]="matrixdb:$aceBiomolecule";
		     }
		     
		     my $name = lcfirst $aceBiomolecule->FragmentName;
		     $data->[2 + $c] = "matrixdb:$aceBiomolecule|matrixdb:$name(short label)";
		     return 1;
		    }
sub setMultimerInfo {
		     my $self = shift;
		     my ($data, $aceBiomolecule, $c) = @_;
		     $data->[21 + $c]="psi-mi:\"MI:0315\"(protein complex)\"";##corr samuel
		     my $ebi = defined ($aceBiomolecule->EBI_xref) ? $aceBiomolecule->EBI_xref: "-";
		     my $name = $aceBiomolecule->name;
		     if ($ebi ne '-') {
		       $data->[$c] = "ebi:" . $ebi;
		     } else {
		       $data->[$c]="matrixdb:" . $name;
		     }
		     my $altName = lcfirst $aceBiomolecule->Multimer_Name;
		     $data->[2 + $c] = "matrixdb:" . $aceBiomolecule->name 
		     . "|matrixdb:" . $altName . "(short label)";
		   
		     return 1;
		    }

  sub setChebiMoleculeInfo {
			    my $self = shift;
			    my ($data, $aceBiomolecule, $c) = @_;
			    my $tagData = { GAG_Name => 'psi-mi:"MI:0904"(polysaccharide)',
					    Inorganic_Name => 'psi-mi:"MI:0328"(small molecule)',
					    Glycolipid_Name => 'psi-mi:"MI:0329"(unknown participant)',
					    Phospholipid_Name => 'psi-mi:"MI:0329"(unknown participant)',
					    Cation_Name => 'psi-mi:"MI:0328"(small molecule)'
					  };
			    my $name;
			    my $type;
			    foreach my $tag (keys (%{ $tagData })) {
			      my @names = $aceBiomolecule->get($tag, 1);
			      if (@names > 0) {
				$name = $names[0];
				$type = $tag;
				last;
			      }
			    }
			    defined ($name) || return 0;
			    $data->[21 + $c] = $tagData->{ $type };
			    my $chebi = $aceBiomolecule->CheBI_identifier;
			    $data->[$c] = defined($chebi) 
			    ? "chebi:\"$chebi\"" :
			    "matrixdb:" . $aceBiomolecule->name;
			    $name = lcfirst $name;
			    $data->[2 + $c] = "matrixdb:" . $aceBiomolecule->name
			    . "|matrixdb:" . $name ."(short label)";

			    return 1;
			   }

sub setBiomoleculeData {
			my $self = shift;
			my ($data, $partnerDetail, $c) = @_;
			
			my $aceBiomolecule = $self->{ DB }->fetch(BioMolecule => $partnerDetail->name);
			defined($aceBiomolecule) || 
			$logger->logdie("no such biomolecule \"" . $partnerDetail->name . "\"");
			
			$logger->trace(Dumper($partnerDetail));
			my $determinationMethod = $partnerDetail->at("Detect_Meth", 1);
			if ( defined($determinationMethod) ) {
			  if (my $cvTerm = $self->getCvTerm ($determinationMethod->name)) {
			    $data->[40 + $c] = "psi-mi:\"$cvTerm\"(" . $determinationMethod->name . ")";
			  }
			}

			$self->setRoles($data, $partnerDetail,$c) || return 0;
			my $specie = defined ($aceBiomolecule->In_Species) 
			? $aceBiomolecule->In_Species : "-";
			if ($specie ne "-")
			{	
			  my $short = $specie->English_name;
			  (! $short) && $specie->Scientific_name;
			  if ($short)
			    {
			      $data->[9 + $c] = "taxid:" . $specie . "(" . $short . ")";
			    }
			  else
			    {	
			      $logger->error("Partner \"$aceBiomolecule\": pas d'espece reconnue pour $specie");
			      return 0;
			    }
			}
			if ($aceBiomolecule->Prot) {
			  $self->setProteinInfo($data, $partnerDetail, $aceBiomolecule, $c) || return 0;
			  return 1;
			} elsif ($aceBiomolecule->Protein_Fragment) {
			  $self->setFragmentInfo($data, $aceBiomolecule, $c) || return 0;
			  return 1;
			} elsif ($aceBiomolecule->Multimer_Name) {
			  $self->setMultimerInfo($data, $aceBiomolecule, $c) || return 0;
			  return 1;
			} else {
			  $self->setChebiMoleculeInfo($data, $aceBiomolecule, $c) || return 0;
			  return 1;
			}

			$logger->error("Experiment skip : no type for biomolecule $aceBiomolecule ...");
			return 0;
		       }
		   

  sub setRoles {
		my $self = shift;
		my ($data, $partnerDetail, $c) = @_;
		
		my $biorole="";
		my $exprole="";
		my @pdm="";
		

		my @details = $partnerDetail->col;
		foreach my $detail (@details)
		{
		  if ($detail eq "BioRole")
		    {
		      $biorole = $detail->right;
		    }
		  elsif ($detail eq "ExpRole")
		    {
		      $exprole = $detail->right;
		    }
		}
		
		$biorole = lc $biorole;
		$biorole=~s/_/ /g;
		my $refbr="";
		if ($self->getCvTerm ($biorole))
		{
		  $refbr = $self->getCvTerm ($biorole);
		}
		else
		{
		  $logger->warn("BiologicalRole $refbr $biorole assigning unspecified");
		  $biorole="unspecified_role";
		  $refbr="0499";
		  # next EXP;
		}
		$data->[16 + $c]="psi-mi:\"".$refbr."\"(".$biorole.")";
		$exprole=~s/_/ /g;
		my $refer="";
		if ($self->getCvTerm ($exprole))
		{
		  $refer = $self->getCvTerm ($exprole);
		}
		else
		{
		  $logger->warn("Experimental Role $refer $exprole assigning unspecidied");
		  $exprole="unspecified_role";
		  $refer="0499";
		  #	  next EXP;
		}
		$data->[18 + $c] = "psi-mi:\"".$refer."\"(".$exprole.")";
	       
		return 1;
	       }

sub setInteractionType {
			my $self = shift;
			my ($data, $aceBuffer) = @_;
			my $refit="";
			my $inttype="";
			if ($aceBuffer->Interaction_Type)
			{
			  $inttype = $aceBuffer->Interaction_Type;
			}
			else 
			{
			  #$inttype="direct_interaction"
			  $logger->error("Experiment $aceBuffer skip : no interaction type for $aceBuffer");
			  return 0;
			}
			$inttype =~ s/_/ /g;
			$inttype = lc $inttype;
			if ($self->getCvTerm ($inttype))
			{
			  $refit = $self->getCvTerm ($inttype);
			}
			else
			{
			  $logger->error("Experiment $aceBuffer skip : no interaction type correspondence for $inttype");
			  return 0;
			}
			$data->[11] = "psi-mi:\"" . $refit . "\"(" . $inttype . ")"; ## corr samuel

			return 1;
}

sub aceExperimentDump {
  my $self = shift;
  my $aceBuffer = shift;
  
  my @data = ('-') x 42; 
  ($aceBuffer->name !~ /^\S+__\S+$/) && $logger->logdie("found bad exp name: \"$aceBuffer\"");
  
  $self->setSource(\@data, $aceBuffer) || return undef;
  $self->setPublication(\@data, $aceBuffer) || return undef;
  $self->setParameters(\@data, $aceBuffer) || return undef;
  $self->setHost(\@data, $aceBuffer) || return undef;
  $self->setInteractionDetectionMethod(\@data, $aceBuffer) || return undef;
  $self->setInteractionType(\@data, $aceBuffer) || return undef;

  my @partners = $aceBuffer->BioMolecule;
  if (@partners == 0)
    {
      $logger->error("Experiment $aceBuffer skip : no biom in $aceBuffer exp");
      return undef;
    }
  @partners = @partners == 1 ?($partners[0], $partners[0]) : @partners;
  $self->setBiomoleculeData(\@data, $partners[0], 0) || return undef;
  $self->setBiomoleculeData(\@data, $partners[1], 1) || return undef;

  return \@data;
  #print join("\t", @data) . "\n";
}

1;
