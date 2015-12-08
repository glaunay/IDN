package browserReport;

use CGI 2.42 qw/:standard :html3 escape/;
use Log::Log4perl qw(get_logger);

my $logger = get_logger("psimi"); 

=pod
    Separate package for Emilie biomolecule report html printer
    tagging modification with "GL_dvl"
    GL 20130611 : trying to reuse as many Emilie data crawling as possible
                  erasing psicquic cart interactome html elements
                  rename print_report to printBiomoleculeReport

=cut

sub printBiomoleculeReport {
    my $BioMolecule = shift;
    
    print h2($BioMolecule);
    if ($BioMolecule->Association)
    {

=pod GL_dvl : DONT WANT interactome construction cart functionality
=cut
	my $bouton = 0;    
	if ($bouton)
	{
	    print table({-width=>"100%"},
			TR({-valign=>"top"},
			   th({-align=>'left',-class=>'construct',-width=>"50%"},"<a href=\"http://matrixdb.ibcp.fr/cgi-bin/interactome/default?name=".$BioMolecule."&amp;class=BioMolecule#molecule\" target=\"_blank\">Construct the interaction network of this molecule</a>"),
			   td({-width=>"50%",-align=>"right"}, b({-style=>'color:red;'},"Biomolecule added to the interaction network"),br,
			      "<a href=\"../../cart\">Access biomolecule list</a>")
			)
		);
	    
	    my $panier="../cytoscape/cart_files/".remote_addr().".txt";
	    my $dejavu=0;
	    if(-e $panier)
	    {
		my @list2=();
		open (PANIER,"<$panier")|| die "no cart for the moment";
		flock(PANIER, LOCK_EX) ;
		while(my $line = <PANIER>) ##lit ligne par ligne, jusqu'a trouver la ligne d'interet a modifier 
            {
                chomp $line ;
                while ($line =~ s/^([^;]+);//)
                {
                    push(@list2,$1);
                }
            }
            foreach my $test(@list2)
            {
                if ($test eq $BioMolecule)
                {
                    $dejavu=1;
                }
            }
            flock(PANIER, LOCK_UN) ;
            close(PANIER);
        }
        if ($dejavu==0)
        {
            open(PANIER, ">>$panier") || die "problem with cart file $panier." ;
            flock(PANIER, LOCK_EX) ;
            print PANIER $BioMolecule,";";
            flock(PANIER, LOCK_UN) ;
            close(PANIER);
        }
        else
        {
            #already in the cart
        }
    }
    else
    {
        CGI::autoEscape(0);
          print start_form(-name=>'SimpleForm',-action=>Url(url(-relative=>1))),
          hidden(class=>'BioMolecule'),
          hidden(name=>'$BioMolecule'),
          table({-width=>"100%"},
                TR({-valign=>"top"},
                   th({-align=>'left',-class=>'construct',-width=>"50%"},"<a href=\"http://matrixdb.ibcp.fr/cgi-bin/interactome/default?name=".$BioMolecule."&amp;class=BioMolecule#molecule\" target=\"_blank\">Construct the interaction network of this molecule</a>"),
                   td({-width=>"50%",-align=>"right"}, submit(-name=>'bouton',-value=>'Add this molecule to the list',-onclick=>''),br,
                       "<a href=\"../../cart\">Access biomolecule list</a>"),
                   )
                );
          print end_form();
          CGI::autoEscape(1);
    }
  }
  else
  {
      print table({-width=>"100%"},
                    TR({-valign=>"top"},
                       td({-width=>"50%",-align=>"right"}, b({-style=>'color:grey;'},"No known interactions"),br,
                       "<a href=\"../../cart\">Access biomolecule list</a>")
                       )
                    );
  }
## end of skipped block

if ($BioMolecule->Association)
{
   my @count=$BioMolecule->Association;
   my $countexp=0;
   foreach my $exp (@count)
   {
      if (my @exp=$exp->Experiment)
      {
         $countexp+= scalar @exp;
      }
   }
   my $countass=scalar @count;
   print "This molecule is involved in <a href=\"#interactions\"><b style=\"color:green;\">$countass</b> interaction(s)</a> shown by <b style=\"color:green;\">$countexp</b> experiment(s)";
}

################ lent ... devrait etre fait en arriere plan
  ##PSICQUIC SEARCH SERVICE
  ##list active psicquic services


=pod GL_dvl
my $actif=param('actif');
=cut
my $actif = 0;

if ($BioMolecule->Type eq "Prot") #a changer par la suite en interrogeant avec Chebi ou EBI XREF
{
  if ($actif)
  {
    my $url="http://www.ebi.ac.uk/Tools/webservices/psicquic/registry/registry?action=ACTIVE&format=txt";
    my $active_list=get $url;
    print "Inactive service" unless defined $active_list;;
    my @active=split(/\n/,$active_list);
    my @service;
    my @serviceUrl;
    foreach my $active (@active)
    {
      my @flds=split(/=/,$active);
      my ($serviceName, $serviceUrl)=@flds;
      push (@service,$serviceName);
      push (@serviceUrl,$serviceUrl);
    }
    #print "@service active",br;

    my $num=0;
    my $totalcount=0;
    foreach my $serviceUrl (@serviceUrl)
    {
      $serviceUrl=~s/psicquic$//;
      ##query a specific db
      my $content="";
      ## 
      if (($service[$num] eq "ChEMBL")||($service[$num] eq "InnateDB")||($service[$num] eq "MPIDB"))
      {
          my $queryurl=$serviceUrl."current/search/query/id:".$BioMolecule." OR alias:".$BioMolecule."?format=count";
          $content=get $queryurl;
          #print $content." :: ".$queryurl."\n";         
      }
      #print "Couldn't get $queryurl\n" unless defined $content;
      my @lines=split(/\n/,$content);
      foreach my $line (@lines)
      {
          #print $line." from ".$service[$num],br;
          $totalcount+=$line;
      }
      $num++;
    }
    my $length=@service;
    #print "<b><a href=\"http://www.ebi.ac.uk/intact/imex/main.xhtml?query=".$BioMolecule."&amp;conversationContext=1\" style=\"color: green;\">IMEx</a></b>";
    #print br;
    print p("This molecule is also involved in interactions shown by <a href=\"http://www.ebi.ac.uk/Tools/webservices/psicquic/view/main.xhtml?query=".$BioMolecule."&amp;conversationContext=1\"><b style=\"color:green;\">$totalcount</b> experiment(s)</a> in <a href=\"http://www.innatedb.ca\"><b>InnateDB</b></a>, <a href=\"http://jcvi.org/mpidb/\"><b>MPIDB</b></a> and <a href=\"http://www.ebi.ac.uk/chembldb/\"><b>ChEMBL</b></a> databases");
  }
  else
  {
      print start_form(-name=>'PsicquicSearch',-action=>""),
      hidden(class=>'BioMolecule'),
      hidden(name=>'$BioMolecule'),
      table({-width=>"100%"},
                TR({-valign=>"top"},
                   td({-width=>"50%",-align=>"left"}, submit(-name=>'actif',-value=>'Query other databases not included in MatrixDB using PSICQUIC search service',-onclick=>''),br,
             )));
      print end_form();
  }
}
else
{
    print br;
}
  ################
################

#for Proteins and for some info of other BioMolecules
  if (($BioMolecule eq "MULT_3_human")||($BioMolecule eq "P02452")||($BioMolecule eq "P08123"))
  {
      print "<br/><b style=\"color: green;\"><a href=\"http://www.pubmedcentral.nih.gov/articlerender.fcgi?artid=2475701&amp;rendertype=figure&amp;id=fig2\" style=\"color: green;\">Show interactions on the map of the human type I collagen fibril</a></b>";
      print " ";
      print "<a href=\"http://www.jbc.org/cgi/content/abstract/283/30/21187\" style=\"color: green;\">[Sweeney  <i style=\"color:green;\">et al.</i> J. Biol. Chem. 2008 283:21187-21197]</a>";
      print br;
      print "<b style=\"color: green;\"><a href=\"http://oiprogram.nichd.nih.gov/consortium.html\" style=\"color: green;\">Osteogenesis Imperfecta Mutation Consortium Review </a></b>";
      print " ";
      print "<a href=\"http://www3.interscience.wiley.com/journal/113447984/abstract\" style=\"color: green;\">[Marini  <i style=\"color:green;\">et al.</i> Hum. Mutat. 2007 28:209-221]</a>";
      print br;
      print "<b style=\"color: green;\"><a href=\"http://www.le.ac.uk/ge/collagen/\" style=\"color: green;\">Osteogenesis imperfecta &amp; Ehlers-Danlos syndrome variant databases </a></b>";
      print " ";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/25/1/181?view=long&amp;pmid=9016532\" style=\"color: green;\">[Dalgleish Nucleic Acids Res. 1997 25:181-187, </a>";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/26/1/253?view=long&amp;pmid=9399846\" style=\"color: green;\"> 1998 26:253-255] </a>";
      print br;
      print "<b style=\"color: green;\"><a href=\"http://collagendb.stanford.edu/CollagenDatabase/index.html\" style=\"color: green;\">COLdb, a database linking genetic data to molecular function in fibrillar collagens</a></b>";
      print " ";
      print "<a href=\"http://www3.interscience.wiley.com/journal/121645079/abstract\" style=\"color: green;\">[Bodian and Klein Hum Mutat. 2009 30:946-591] </a>";
      print br;

  }
  if (($BioMolecule eq "MULT_10_human")||($BioMolecule eq "P02461"))
  {
      print "<b style=\"color: green;\"><a href=\"http://www.le.ac.uk/ge/collagen/\" style=\"color: green;\">Osteogenesis imperfecta &amp; Ehlers-Danlos syndrome variant databases </a></b>";
      print " ";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/25/1/181?view=long&amp;pmid=9016532\" style=\"color: green;\">[Dalgleish Nucleic Acids Res. 1997 25:181-187, </a>";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/26/1/253?view=long&amp;pmid=9399846\" style=\"color: green;\"> 1998 26:253-255] </a>";
      print br;
      print "<b style=\"color: green;\"><a href=\"http://collagendb.stanford.edu/CollagenDatabase/index.html\" style=\"color: green;\">COLdb, a database linking genetic data to molecular function in fibrillar collagens</a></b>";
      print " ";
      print "<a href=\"http://www3.interscience.wiley.com/journal/121645079/abstract\" style=\"color: green;\">[Bodian and Klein Hum Mutat. 2009 30:946-591] </a>";
      print br;
  }
  if (($BioMolecule eq "MULT_9_human")||($BioMolecule eq "P02458"))
  {
      print "<b style=\"color: green;\"><a href=\"http://collagendb.stanford.edu/CollagenDatabase/index.html\" style=\"color: green;\">COLdb, a database linking genetic data to molecular function in fibrillar collagens</a></b>";
      print " ";
      print "<a href=\"http://www3.interscience.wiley.com/journal/121645079/abstract\" style=\"color: green;\">[Bodian and Klein Hum Mutat. 2009 30:946-591] </a>";
      print br;
  }
  if (($BioMolecule eq "MULT_5_VAR1_human")||($BioMolecule eq "MULT_5_VAR2_human")||($BioMolecule eq "MULT_5_VAR3_human")||($BioMolecule eq "P20908")||($BioMolecule eq "P05997"))
  {
      print "<b style=\"color: green;\"><a href=\"http://www.le.ac.uk/ge/collagen/\" style=\"color: green;\">Osteogenesis imperfecta &amp; Ehlers-Danlos syndrome variant databases </a></b>";
      print " ";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/25/1/181?view=long&amp;pmid=9016532\" style=\"color: green;\">[Dalgleish Nucleic Acids Res. 1997 25:181-187, </a>";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/26/1/253?view=long&amp;pmid=9399846\" style=\"color: green;\"> 1998 26:253-255] </a>";
      print br;
  }
  if (($BioMolecule eq "O75718")||($BioMolecule eq "Q96AY3")||($BioMolecule eq "Q32P28")||($BioMolecule eq "P23284")||($BioMolecule eq "P50454"))
  {
      print "<b style=\"color: green;\"><a href=\"http://www.le.ac.uk/ge/collagen/\" style=\"color: green;\">Osteogenesis imperfecta &amp; Ehlers-Danlos syndrome variant databases </a></b>";
      print " ";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/25/1/181?view=long&amp;pmid=9016532\" style=\"color: green;\">[Dalgleish Nucleic Acids Res. 1997 25:181-187, </a>";
      print "<a href=\"http://nar.oxfordjournals.org/cgi/content/full/26/1/253?view=long&amp;pmid=9399846\" style=\"color: green;\"> 1998 26:253-255] </a>";
      print br;
  }
  print br;
  if (my @infos = $BioMolecule->EntryName)
  { 
      my $www="<a href=\"http://www.uniprot.org/uniprot/".$BioMolecule."\" target=\"_blank\">Link to UniProtKB/Swiss-Prot Website</a>";
      print table(
		  TR({-align=>'left'},
		     th('Entry Name from UniProtKB/Swiss-Prot: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     td((blockquote(address(join(br,$www))))),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Common_Name)
  {
      
      print table(
		  TR({-align=>'left'},
		     th('Common Name: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Other_Name)
  {
      print table(
		  TR({-align=>'left'},
		     th('Other name(s) or identifier(s): <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(blockquote(address(join(br,@infos)))),
		     )
		  )
      } 
  if (my @infos = $BioMolecule->GeneName)
  {
      print table(
		  TR({-align=>'left'},
		     th('Gene Name: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      } 
  if (my @infos = $BioMolecule->RefSeq)
  {
      my @refseq=();
      my $i=0;
      for (my $ic=0;$ic<=$#infos;$ic++)
      {
          $refseq[$i] = "<a href=\"http://www.ncbi.nlm.nih.gov/sites/entrez?Db=protein&amp;Cmd=DetailsSearch&amp;Term=srcdb_refseq%5Bprop%5D".$infos[$i]."\" target=\"_blank\">".$infos[$i]."</a>";
          $i++;
      }
      print table(
                  TR({-align=>'left'},
                     th('Link(s) to RefSeq data: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(join "; ",@refseq),
                     )
                  )
      }
  if (my @infos = $BioMolecule->KEGG)
  {
      my @refseq=();
      my $i=0;
      for (my $ic=0;$ic<=$#infos;$ic++)
      {
          $refseq[$i] = "<a href=\"http://www.genome.jp/dbget-bin/www_bget?".$infos[$i]."\" target=\"_blank\">".$infos[$i]."</a>";
          $i++;
      }
      print table(
                  TR({-align=>'left'},
                     th('Link(s) to KEGG data: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(join "; ",@refseq),
                     )
                  )
      }
  
  if (my @infos = $BioMolecule->Molecular_Weight)
  {
     print table(
		 TR({-align=>'left'},
		    th('Molecular Weight: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		    td(@infos),
		    )
		 )
     } 
  if (my @infos = $BioMolecule->Length_aa)
  {
      print table(
		  TR({-align=>'left'},
		     th('Number of amino acids: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      } 
#for Protein fragment

  if (my @infos = $BioMolecule->FragmentName)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Name of the fragment: <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Other_Fragment_Name)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Other name of the fragment: <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Belongs_to)
  { 
      my @list1=();
      foreach my $lig (@infos)
      {
	  my $list1="";
	  if ($lig->Common_Name)
	  {
	      $list1 = $lig->Common_Name;
	  }
	  elsif ($lig->FragmentName)
	  {
	      $list1 = $lig->FragmentName;
	  }
	  elsif ($lig->GAG_Name)
	  {
	      $list1 = $lig->GAG_Name;
	  }
	  elsif ($lig->Cation_Name)
	  {
	      $list1 = $lig->Cation_Name;
	  }
	  elsif ($lig->Glycolipid_Name)
	  {
	      $list1 = $lig->Glycolipid_Name;
	  }
	  elsif ($lig->Multimer_Name)
	  {
	      $list1 = $lig->Multimer_Name;
	  }
	  else
	  {
	      $list1 = $lig;
	  }
	  push (@list1,$list1);
      } 
      print table(
		  TR({-align=>'left'},
		     th('Parent Biomolecule(s): <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule)}@infos)))),
		     td(blockquote(address(join(br,@list1)))),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Zone)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Description of the fragment: <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Molecular_WeightPept_KDa)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Molecular Weight: <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos," KDa"),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Other_informations)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Other informations: <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Tissue_specificity)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Tissue: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(blockquote(address(join(br,@infos)))),
		     )
		  ) 
      }
  if (my @infos = $BioMolecule->Aa_number)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Number of amino acids: <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Molecule_processing)
  {
      my $www="<a href=\"http://www.uniprot.org/uniprot/".$BioMolecule->Belongs_to."#section_features\" target=\"_blank\">UniProtKB/Swiss-Prot feature data</a>";
      print table(
                  TR({-align=>'left'},
                     th('UniProtKB Feature Identifier: <a href="../../Tutorial/#PFragData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(@infos),
                     td(blockquote($www)),
                     )
                  )

  } 
#Glycosaminoglycan
  
  if (my @infos = $BioMolecule->GAG_Name)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Name of the glycosaminoglycan: <a href="../../Tutorial/#GAGData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Other_GAG_Name)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Other Name: <a href="../../Tutorial/#GAGData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->GAG_Structure)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Chemical structure: <a href="../../Tutorial/#GAGData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Molar_MassGAG)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Molar mass: <a href="../../Tutorial/#GAGData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Location)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Tissue(s): <a href="../../Tutorial/#GAGData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }

#Cation
  
  if (my @infos = $BioMolecule->Cation_Name)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Name of the Cation: <a href="../../Tutorial/#CatData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }

#Lipid

  if (my @infos = $BioMolecule->Glycolipid_Name)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Name of the Lipid: <a href="../../Tutorial/#LipData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Category)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Category: <a href="../../Tutorial/#LipData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
  if (my @infos = $BioMolecule->Phospholipid_Name)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Name of the Lipid: <a href="../../Tutorial/#LipData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
#inorganic
  if (my @infos = $BioMolecule->Inorganic_Name)
  {
      print table(
                  TR({-align=>'left'},
                     th('Name of the compound: <a href="../../Tutorial/#InorgData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(@infos),
                     )
                  )
      }
  if (my @infos = $BioMolecule->Other_Inorganic_Name)
  {
      print table(
                  TR({-align=>'left'},
                     th('Synonym: <a href="../../Tutorial/#InorgData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(@infos),
                     )
                  )
      }
  if (my @infos = $BioMolecule->Definition)
  {
      print table(
                  TR({-align=>'left'},
                     th('Definition: <a href="../../Tutorial/#InorgData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(@infos),
                     )
                  )
      }
#pour tous
  if (my $infos = $BioMolecule->CheBI_identifier)
  {
      my $www="<a href=\"http://www.ebi.ac.uk/chebi/searchId.do?chebiId=".$infos."\" target=\"_blank\">Link to ChEBI</a>";
      print table(
                  TR({-align=>'left'},
                     th('ChEBI identifier: <a href="../../Tutorial/#BioMData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td($infos),
                     td((blockquote(address(join(br,$www))))),
                     )
                  )
      }
  if (my $infos = $BioMolecule->KEGG_Compound)
  { 
      my $www="<a href=\"http://www.genome.jp/dbget-bin/www_bget?cpd:".$infos."\" target=\"_blank\">Link to KEGG Compound</a>";
      print table(
		  TR({-align=>'left'},
		     th('KEGG compound identifier: <a href="../../Tutorial/#GAGData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td($infos),
		     td((blockquote(address(join(br,$www))))),
		     )
		  )
      }
  if (my $infos = $BioMolecule->LipidMaps)
  { 
      my $www="<a href=\"http://www.lipidmaps.org/data/get_lm_lipids_dbgif.php?LM_ID=".$infos."\" target=\"_blank\">Link to Lipid Maps</a>";
      print table(
		  TR({-align=>'left'},
		     th('Lipid Maps identifier: <a href="../../Tutorial/#GAGData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td($infos),
		     td((blockquote(address(join(br,$www))))),
		     )
		  )
      }
#Multimer
  if (my @infos = $BioMolecule->Multimer_Name)
  { 
      print table(
		  TR({-align=>'left'},
		     th('Name of the Multimer: <a href="../../Tutorial/#MultData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }  
  if (my @infos = $BioMolecule->Other_Multimer_Name)
  {
      print table(
                  TR({-align=>'left'},
                     th('Synonym: <a href="../../Tutorial/#MultData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(blockquote(address(join(br,@infos)))),
                     )
                  )
      }
  if (my $infos = $BioMolecule->In_Species)
  {
      print table(
                  TR({-align=>'left'},
                     th('Species: <a href="../../Tutorial/#BioMData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(blockquote(address(map {ObjectLink($_,$_->In_Species)}$infos))),
                     td($infos->Scientific_name,' (',$infos->English_name,')'),
                    )
                  )
      }
  if (my @infos = $BioMolecule->Component)
  { 
      my @list1=();
      foreach my $lig (@infos)
      {
	  my $list1="";
	  if ($lig->Common_Name)
	  {
	      $list1 = $lig->Common_Name;
	  }
	  elsif ($lig->FragmentName)
	  {
	      $list1 = $lig->FragmentName;
	  }
	  elsif ($lig->GAG_Name)
	  {
	      $list1 = $lig->GAG_Name;
	  }
	  elsif ($lig->Cation_Name)
	  {
	      $list1 = $lig->Cation_Name;
	  }
	  elsif ($lig->Glycolipid_Name)
	  {
	      $list1 = $lig->Glycolipid_Name;
	  }
	  elsif ($lig->Multimer_Name)
	  {
	      $list1 = $lig->Multimer_Name;
	  }
	  else
	  {
	      $list1 = $lig;
	  }
	  push (@list1,$list1);
      } 
      print table(
		  TR({-align=>'left'},
		     th('Participant(s): <a href="../../Tutorial/#MultData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule)}@infos))))),
		     td((blockquote(address(join(br,@list1))))),
		     )
		  )
      }
    if (my $infos = $BioMolecule->EBI_xref)
    {
        my $www="<a href=\"http://www.ebi.ac.uk/intact/pages/interactions/interactions.xhtml?query=".$infos."\" target=\"_blank\">".$infos."</a>";
        print table(
                    TR({-align=>'left'},
                       th('EBI complex identifier: <a href="../../Tutorial/#MultData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td((blockquote(address(join(br,$www))))),
                       )
                    )
        } 
  if (my @infos = $BioMolecule->More_info)
  { 
      print table(
		  TR({-align=>'left'},
		     th('More information: <a href="../../Tutorial/#MultData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td(@infos),
		     )
		  )
      }
#other info
  if (my @infos = $BioMolecule->Bound_Coval_to)
  {
      my @list1=();
      foreach my $lig (@infos)
      {
	  my $list1="";
	  if ($lig->Common_Name)
	  {
	      $list1 = $lig->Common_Name;
	  }
	  elsif ($lig->FragmentName)
	  {
	      $list1 = $lig->FragmentName;
	  }
	  elsif ($lig->GAG_Name)
	  {
	      $list1 = $lig->GAG_Name;
	  }
	  elsif ($lig->Cation_Name)
	  {
	      $list1 = $lig->Cation_Name;
	  }
	  elsif ($lig->Glycolipid_Name)
	  {
	      $list1 = $lig->Glycolipid_Name;
	  }
	  elsif ($lig->Multimer_Name)
	  {
	      $list1 = $lig->Multimer_Name;
	  }
	  else
	  {
	      $list1 = $lig;
	  }
	  push (@list1,$list1);
      } 
      print table(
		  TR({-align=>'left'},
		     th('Bound covalently to: <a href="../../Tutorial/#BioMData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule)}@infos))))),
		     td((blockquote(address(join(br,@list1))))),
		     )
		  )
      }
  if (my @infos = $BioMolecule->ContainsFragment)
  {
      my @list1=();
      foreach my $lig (@infos)
      {
	  my $list1="";
	  if ($lig->Common_Name)
	  {
	      $list1 = $lig->Common_Name;
	  }
	  elsif ($lig->FragmentName)
	  {
	      $list1 = $lig->FragmentName;
	  }
	  elsif ($lig->GAG_Name)
	  {
	      $list1 = $lig->GAG_Name;
	  }
	  elsif ($lig->Cation_Name)
	  {
	      $list1 = $lig->Cation_Name;
	  }
	  elsif ($lig->Glycolipid_Name)
	  {
	      $list1 = $lig->Glycolipid_Name;
	  }
	  elsif ($lig->Multimer_Name)
	  {
	      $list1 = $lig->Multimer_Name;
	  }
	  else
	  {
	      $list1 = $lig;
	  }
	  push (@list1,$list1);
      } 
      print table(
		  TR({-align=>'left'},
		     th('Protein fragment(s): <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } @infos))))),
		     td((blockquote(address(join(br,@list1))))),
		     )
		  )
      } 
  if (my @infos = $BioMolecule->In_multimer)
  {
      my @list1=();
      foreach my $lig (@infos)
      {
	  my $list1="";
	  if ($lig->Common_Name)
	  {
	      $list1 = $lig->Common_Name;
	  }
	  elsif ($lig->FragmentName)
	  {
	      $list1 = $lig->FragmentName;
	  }
	  elsif ($lig->GAG_Name)
	  {
	      $list1 = $lig->GAG_Name;
	  }
	  elsif ($lig->Cation_Name)
	  {
	      $list1 = $lig->Cation_Name;
	  }
	  elsif ($lig->Glycolipid_Name)
	  {
	      $list1 = $lig->Glycolipid_Name;
	  }
	  elsif ($lig->Multimer_Name)
	  {
	      $list1 = $lig->Multimer_Name;
	  }
	  else
	  {
	      $list1 = $lig;
	  }
	  push (@list1,$list1);
      } 
      print table(
		  TR({-align=>'left'},
		     th('Multimer: <a href="../../Tutorial/#BioMData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } @infos))))),
		     td((blockquote(address(join(br,@list1))))),
		     )
		  )
      }    
  if (my @infos2 = $BioMolecule->Association) 
  {
      my @infos=();
      my @cplxe=();
      foreach my $verif (@infos2)
      {
	  my $typ=$verif->IsType;
	  if ($typ eq 'IsInteraction')
	  {
	      push (@infos,$verif);
	  }
	  elsif ($typ eq 'IsComplex')
	  {
	      push (@cplxe,$verif);
	  }
      }
      my @lig=();
      my @list1=();
      #my @list2=();
      my @in=@infos;
      foreach my $int (@infos)
      {
	  my @ligds=$int->BioMolecule;
	  if (@ligds != 2)
	  {
	      #push(@ligds,$ligds[0]);
              push(@lig,$ligds[0]);  
	  }
	  foreach my $lg (sort @ligds)
	  {
              if ($lg ne $BioMolecule ) ###ne garde que l'interactant
              {
	          push(@lig,$lg);
              }
 	  }
      }
      my $i=0;
      for (my $ic=0;$ic<=$#infos;$ic++)
      {
	  #if ($lig[$i+1]->Common_Name)
	  #{
	  #    $list1[$ic] = $lig[$i+1]->Common_Name;
	  #}
	  #elsif ($lig[$i+1]->FragmentName)
	  #{
	  #    $list1[$ic] = $lig[$i+1]->FragmentName;
	  #}   
	  #elsif ($lig[$i+1]->GAG_Name)
	  #{
	  #    $list1[$ic] = $lig[$i+1]->GAG_Name;
	  #}  
	  #elsif ($lig[$i+1]->Cation_Name)
	  #{
	  #    $list1[$ic] = $lig[$i+1]->Cation_Name;
	  #} 
	  #elsif ($lig[$i+1]->Glycolipid_Name)
	  #{
	  #    $list1[$ic] = $lig[$i+1]->Glycolipid_Name;
	  #} 
	  #elsif ($lig[$i+1]->Phospholipid_Name)
	  #{
	  #    $list1[$ic] = $lig[$i+1]->Phospholipid_Name;
	  #} 
	  #elsif ($lig[$i+1]->Multimer_Name)
	  #{
	  #    $list1[$ic] = $lig[$i+1]->Multimer_Name;
	  #} 
	  #else 
	  #{
	  #    $list1[$ic] = $lig[$i+1];
	  #}
	  if ($lig[$i]->Common_Name)
	  {
	      $list1[$ic] = $lig[$i]->Common_Name;
	  }
	  elsif ($lig[$i]->FragmentName)
	  {
	      $list1[$ic] = $lig[$i]->FragmentName;
	  }   
	  elsif ($lig[$i]->GAG_Name)
	  {
	      $list1[$ic] = $lig[$i]->GAG_Name;
	  }  
	  elsif ($lig[$i]->Cation_Name)
	  {
	      $list1[$ic] = $lig[$i]->Cation_Name;
	  } 
	  elsif ($lig[$i]->Glycolipid_Name)
	  {
	      $list1[$ic] = $lig[$i]->Glycolipid_Name;
	  } 
	  elsif ($lig[$i]->Phospholipid_Name)
	  {
	      $list1[$ic] = $lig[$i]->Phospholipid_Name;
	  } 
	  elsif ($lig[$i]->Multimer_Name)
	  {
	      $list1[$ic] = $lig[$i]->Multimer_Name;
	  }
          elsif ($lig[$i]->Inorganic_Name)
          {
              $list1[$ic] = $lig[$i]->Inorganic_Name;
          }
	  else 
	  {
	      $list1[$ic] = $lig[$i];
	  }
	  $i=$i+1;
      }
      my @list1modif=();
      #my @list2modif=();

      foreach my $list1 (@list1)
      {
	  if (length($list1)<=50)
	  {
	      push (@list1modif,$list1);
	  }
	  else
	  {
	      my $temp = substr($list1, 0, 50);
	      my $temp2=$temp."...";
	      push (@list1modif,$temp2);
	  }
      }
      #foreach my $list2 (@list2)
      #{
#	  if (length($list2)<=50)
#	  {
#	      push (@list2modif,$list2);
#	  }
#	  else
#	  {
#	      my $temp = substr($list2, 0, 50);
#	      my $temp2=$temp."...";
#	      push (@list2modif,$temp2);
#	  }
#      }
      my @tot=();
      foreach my $in (@in)
      {
          my @exp=$in->Experiment;
          my $tot="<b>";
          $tot.=@exp;
          $tot.="</b> description(s)";
          push(@tot,$tot);
      } 
      if (@in)
      {
        print "<a name=\"interactions\"></a>";
      	print table(
	  TR({-align=>'left'},
	     th({-style=>"background-color:#c2f2c2;"},'Interaction(s): <a href="../../Tutorial/#BioMData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
	     td((blockquote(address(join(br,map { ObjectLink($_) }@in))))),
	     td((blockquote(address(join(br,@list1modif))))),
             td((blockquote(address(join(br,@tot))))),
	     #th('&lt;-&gt;'),
	     #td(address(join(br,@list1modif))),
	     )
	)
      }
      my @listok=();
      foreach my $clpx (@cplxe)
      {
	  my @ligds=$clpx->BioMolecule;
	  my @list1="";
      	  foreach my $lig (@ligds)
	  {
	      my $list1="";
	      if ($lig->Common_Name)
	      {
		  $list1 = $lig->Common_Name;
	      }
	      elsif ($lig->FragmentName)
	      {
		  $list1 = $lig->FragmentName;
	      }
	      elsif ($lig->GAG_Name)
	      {
		  $list1 = $lig->GAG_Name;
	      }
	      elsif ($lig->Cation_Name)
	      {
		  $list1 = $lig->Cation_Name;
	      }
	      elsif ($lig->Glycolipid_Name)
	      {
		  $list1 = $lig->Glycolipid_Name;
	      }
	      elsif ($lig->Multimer_Name)
	      {
		  $list1 = $lig->Multimer_Name;
	      }
              elsif ($lig->Inorganic_Name)
              {
                  $list1 = $lig->Inorganic_Name;
              }
	      else
	      {
		  $list1 = $lig;
	      }
	      push (@list1,$list1);
	  } 
	  my @list1modif=();
	  foreach my $list1 (@list1)
	  {
	      if (length($list1)<=30)
	      {
		  push (@list1modif,$list1);
	      }
	      else
	      {
		  my $temp = substr($list1, 0, 30);
		  my $temp2=$temp."...";
		  push (@list1modif,$temp2);
	      }
	  }
	  my $listtemp="";
	  foreach my $list1m (@list1modif)
	  {

	      if ($listtemp ne "")
	      {
		  my $temp=$listtemp;
		  $listtemp=$temp." + ".$list1m;
	      }
	      else
	      {
		  $listtemp=$list1m;
	      }
	  }
	  if (length($listtemp)>80)
	  {
	      $listtemp = substr($listtemp, 0, 80)."...";
	  }
	  push (@listok,$listtemp);
      }
      if (@cplxe)
      {
	  print table(
		      TR({-align=>'left'},
			 th("Complex(es): <a href='../../Tutorial/#BioMData'><span style=\"background-color:\#6666ff;color: \#ffffff;\">?</span></a>"),
			 td((blockquote(address(join(br,map { ObjectLink($_) }@cplxe))))),
			 td((blockquote(address(join(br,@listok))))),
			 )
		      );
      }
  }
  if (my @infos = $BioMolecule->Keywrd)
  {
      my @def=();
      my $i=0;
      for (my $ic=0;$ic<=$#infos;$ic++)
      {
          $def[$i] = $infos[$i]->Identifier;
          $i++;
      }

      print table(
                  TR({-align=>'left'},
                     th('Keywords: <a href="../../Tutorial/#ProteinData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(blockquote(address(join(br,map { ObjectLink($_)}@infos)))),
                     td(blockquote(address(join(br,@def)))),
                     )
                  )
      }
  if (my @infos = $BioMolecule->Personal_Keyword)
  {
      print table(
                  TR({-align=>'left'},
                     th('MatrixDB Keywords: <a href="../../Tutorial/#BioMData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                     td(blockquote(join(br,@infos))),
                     )
                 )
      }
  if (my @infos = $BioMolecule->UniGene)
  {
        my @www=();
        my $i=0;
        for (my $ic=0;$ic<=$#infos;$ic++)
        {
            $www[$i] = "<a href=\"http://www.ncbi.nlm.nih.gov/UniGene/ESTProfileViewer.cgi?uglist=$infos[$i]\" target=\"_blank\">UniGene Website</a>";
            $i++;
        }
        print table(
                    TR({-align=>'left'},
                       th({-style=>"background-color:#c2f2c2;"},"UniGene expression profile(s): <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
                       td((blockquote(address(join(br,map { ObjectLink($_,$_->UniGene) } @infos))))),
                       td(address(join(br,@www))),
                       )
                    )
  }
  if (my @infos = $BioMolecule->HPA)
  {
        my @www=();
        my $i=0;
        for (my $ic=0;$ic<=$#infos;$ic++)
        {
            $www[$i] = "<a href=\"http://www.proteinatlas.org/gene_info.php?antibody_id=$infos[$i]\" target=\"_blank\" title=\"Click on the link to access Human Protein Atlas Website\"\>".$infos[$i]."</a>";
            $i++;
        }
        print table(
                    TR({-align=>'left'},
                       th({-style=>"background-color:#c2f2c2;"},"Human Protein Atlas: <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
                       td(blockquote(address(join(br,@www)))),
                       )
                    )
  }
  if (my @infos = $BioMolecule->OMIM)
  {
        my @www=();
        my @phenot=();
        my $i=0;
        for (my $ic=0;$ic<=$#infos;$ic++)
        {
            $phenot[$i] = $infos[$i]->Phenotype;
            $www[$i] = "<a href=\"http://www.ncbi.nlm.nih.gov/omim/$infos[$i]\" target=\"_blank\">OMIM Website</a>";
            $i++;
        }
        ## en attente d'omim
        #print table(
        #            TR({-align=>'left'},
        #               th({-style=>"background-color:#c2f2c2;"},"OMIM disease(s): <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
        #               td((blockquote(address(join(br,map { ObjectLink($_,$_->OMIM) } @infos))))),
        #               td(blockquote(address(join(br,@phenot)))),
        #               td(address(join(br,@www))),
        #               )
        #            )
        print table(
                    TR({-align=>'left'},
                       th({-style=>"background-color:#c2f2c2;"},"OMIM disorder(s): <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
                       td((blockquote(address(join(br, @infos))))),
                       #td(blockquote(address(join(br,@phenot)))),
                       td(address(join(br,@www))),
                       )
                    );


  }
    if (my @infos = $BioMolecule->KeggGlycanBindingProteins)
    {
        my @group=();
        my @type=();
        my @www=();
        my @www2=();
        foreach my $kegg (@infos)
        {
            if ($kegg->Group)
            {
                push(@group,$kegg->Group);
            }
            else
            {
                push(@group,"-");
            }
            push(@type,$kegg->Type);
        }
        my $i=0;
        for (my $ic=0;$ic<=$#infos;$ic++)
        {
            $www[$i] = "<a href=\"http://www.genome.jp/kegg-bin/get_htext?query=$infos[$i]&amp;htext=ko04091.keg&amp;filedir=%2Ffiles&amp;uploadfile=&amp;format=&amp;wrap=\" target=\"_blank\">KEGG Glycan Binding Protein Website</a>";
            $www2[$i] = "<a href=\"http://www.genome.jp/dbget-bin/www_bget?ko+$infos[$i]\" target=\"_blank\">KEGG orthology Website</a>";
            $i++;
        }
        print table(
                    TR({-align=>'left'},
                       th("KEGG Glycan Binding Protein: <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
                       td((blockquote(address(join(br,map { ObjectLink($_,$_->KeggGlycanBindingProteins) } @infos))))),
                       td(address(join(br,@group))),
                       td((blockquote(address(join(br,@type))))),
                       td(address(join(br,@www))),
                       td(blockquote(address(join(br,@www2)))),
                       )
                    )
    }

  if (my @infos = $BioMolecule->GO)
  {
      my @gol=();
      my @ev=();
      my @typ=();
      my @db=();
      foreach my $go(@infos)
      {
	  push(@gol,$go->Ontology);
	  push(@ev,$go->Term);
          if ($go->right)
          {
	  my $type=$go->right;
	  if ($type eq "IC")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#ic\" target=\"_blank\" title=\"Inferred by Curator\">IC</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "IDA")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#ida\" target=\"_blank\" title=\"Inferred from Direct Assay\">IDA</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "IEA")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#iea\" target=\"_blank\" title=\"Inferred from Electronic Annotation\">IEA</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "IEP")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#iep\" target=\"_blank\" title=\"Inferred from Expression Pattern\">IEP</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "IGC")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#igc\" target=\"_blank\" title=\"Inferred from Genomic Context\">IGC</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "IGI")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#igi\" target=\"_blank\" title=\"Inferred from Genetic Interaction\">IGI</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "IMP")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#imp\" target=\"_blank\" title=\"Inferred from Mutant Phenotype\">IMP</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "IPI")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#ipi\" target=\"_blank\" title=\"Inferred from Physical Interaction\">IPI</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "ISS")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#iss\" target=\"_blank\" title=\"Inferred from Seq. or Struct. Similarity\">ISS</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "NAS")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#nas\" target=\"_blank\" title=\"Non-traceable Author Statement\">NAS</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "ND")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#nd\" target=\"_blank\" title=\"No biological Data available\">ND</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "RCA")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#rca\" target=\"_blank\" title=\"Inferred from Reviewed Computational Analysis\">RCA</a>";
	      push(@typ,$name);
	  }
	  elsif ($type eq "TAS")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#tas\" target=\"_blank\" title=\"Traceable Author Statement\">TAS</a>";
	      push(@typ,$name);
	  }
          elsif ($type eq "EXP")
          {
              my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#exp\" target=\"_blank\" title=\"Inferred from Experiment\">EXP</a>";
              push(@typ,$name);
          }
	  elsif ($type eq "NR")
	  {
	      my $name="<a href=\"http://www.geneontology.org/GO.evidence.shtml\#nr\" target=\"_blank\" title=\"Not Recorded\">NR</a>";
	      push(@typ,$name);
	  }
          else
          {
              my $name=$type;
              push(@typ,$name);
          }
          my $db=$go->right->right;
          push(@db,$db);
          }
      }
      my $ic=0;
      my $i=0;
      my @www=();

      my @evmodif=();
      foreach my $list1 (@ev)
      {
        if (length($list1)<=50)
          {
              push (@evmodif,$list1);
          }
          else
          {
              my $temp = substr($list1, 0, 50);
              my $temp2=$temp."...";
              push (@evmodif,$temp2);
          }
      }
      


      for ($ic=0;$ic<=$#gol;$ic++)
      {
	  $evmodif[$i] = $evmodif[$i]." "."\(".$gol[$i]."\)";
	  $www[$i] = "<a href=\"http://www.godatabase.org/cgi-bin/amigo/go.cgi?action=query&amp;view=query&amp;query=".$infos[$i]."&amp;search_constraint=terms\" target=\"_blank\"> GO Website</a>";
	  $i++;
      }
      print table(
		  TR({-align=>'left'},
		     th("Gene Ontology: <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->GO) } @infos))))),
		     td(address(join(br,@evmodif))),
		     td((blockquote(address(join(br,@typ))))),
                     td((blockquote(address(join(br,@db))))),
		     td(address(join(br,@www))),
		     )
		  );
      }    
  if (my @infos = $BioMolecule->PDB)
  {
      my $ic=0;
      my $i=0;
      my @www=();
      for ($ic=0;$ic<=$#infos;$ic++)
      {
	  $www[$i] = "<a href=\"http://www.rcsb.org/pdb/explore/explore.do?structureId=$infos[$i]\" target=\"_blank\">Link to PDB structures</a>";
	  $i++;

      }
      print table(
		  TR({-align=>'left'},
		     th("Protein Data Bank: <a href='../../Tutorial/#BioMData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->PDB) } @infos))))),
		     td((blockquote(address(join(br,@www))))),
		     )
		  )
      } 
  if (my @infos = $BioMolecule->InterPro)
  {
      my @entryname=();
      foreach my $en(@infos)
      {
	  push(@entryname,$en->EntryName);
      }
      my $ic=0;
      my $i=0;
      my @www=();
      for ($ic=0;$ic<=$#infos;$ic++)
      {
	  $www[$i] = "<a href=\"http://www.ebi.ac.uk/interpro/ISearch?query=".$infos[$i]."&amp;mode=ipr\" target=\"_blank\">Link to InterPro Website</a>";
	  $i++;
      }
      print table(
		  TR({-align=>'left'},
		     th("InterPro: <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->InterPro) } @infos))))),
		     td(address(join(br,@entryname))),
		     td((blockquote(address(join(br,@www))))),
		     )
		  )
      } 
if (my @infos = $BioMolecule->Pfam)
  {
      my @entryname=();
      foreach my $en(@infos)
      {
	  push(@entryname,$en->EntryName);
      }
      my @num=();
      foreach my $nume(@infos)
      {
	  push(@num,$nume->right);
      }
      my $ic=0;
      my $i=0;
      my @www=();
      for ($ic=0;$ic<=$#infos;$ic++)
      {
	  $www[$i] = "<a href=\"http://pfam.sanger.ac.uk/family?acc=".$infos[$i]."\" target=\"_blank\">Link to Pfam Website</a>";
	  $i++;
      }
      print table(
		  TR({-align=>'left'},
		     th("Pfam: <a href='../../Tutorial/#ProteinData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->Pfam) } @infos))))),
		     td(address(join(br,@entryname))),
		     td((blockquote(address(join(br,@num))))),
		     td((blockquote(address(join(br,@www))))),
		     )
		  )
      } 
  if (my @infos = $BioMolecule->Biblio)
  { 
      my $ic=0;
      my $i=0;
      my $j=0;
      my @www=();
      my @ref=();
      for ($ic=0;$ic<=$#infos;$ic++)
      {
	  $www[$i] = "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/".$infos[$i]."\" target=\"_blank\">Link to PubMed Abstract</a>";
	  $i++;
          if (($infos[$j]->Author)&&($infos[$j]->Journal)&&($infos[$j]->Date))
	  {
	      my @list=$infos[$j]->Author;
	      $list[0]=~/^([^\,]+)\,?/;
	      my $res=$1;
	      if ($res)
	      {
		  my $tmp2=$res."<i> et al.</i> ".$infos[$j]->Journal." (".$infos[$j]->Date.")";    
		  $ref[$j] = $tmp2;
	      }
	      else
	      {
		  my $tmp2= "\"".$infos[$j]->Title;
		  $ref[$j] = $tmp2
	      }
	      $j++;
	  }
	  elsif (($infos[$j]->Journal)&&($infos[$j]->Date))
	  {
	      my $tmp3=$infos[$j]->Journal." (".$infos[$j]->Date.")";  
	      $ref[$j] = $tmp3;
	      $j++;
	  }
	  else
	  {
	      $ref[$j]="-";
	      $j++;
	  }
      }
      print table(
		  TR({-align=>'left'},
		     th("Bibliography: <a href='../../Tutorial/#BioMData'><span style=\"background-color:#6666ff;color: #ffffff;\">?</span></a>"),
		     td((blockquote(address(join(br,map { ObjectLink($_,$_->Biblio) } @infos))))),
		     td((blockquote(address(join(br,@ref))))),
                     td((blockquote(address(join(br,@www))))),
		     )
		  )
      }  
} # printBiomoleculeReport ends here

sub print_report2 {
    my $Interaction = shift;
    print h2($Interaction);
    my %num;
    my @pmidnu2=();

#for some info of BioMolecules which interact
    
    if (my @infos = $Interaction->BioMolecule)
    { 
	my @list=();
	my $i=0;
	foreach my $biom (@infos)
	{
	    if ($biom->Common_Name)
	    {
		$list[$i] = $biom->Common_Name;
	    }
	    elsif ($biom->FragmentName)
	    {
		$list[$i] = $biom->FragmentName;
	    }   
	    elsif ($biom->GAG_Name)
	    {
		$list[$i] = $biom->GAG_Name;
	    }  
	    elsif ($biom->Cation_Name)
	    {
		$list[$i] = $biom->Cation_Name;
	    } 
	    elsif ($biom->Glycolipid_Name)
	    {
		$list[$i] = $biom->Glycolipid_Name;
	    } 
	    elsif ($biom->Phospholipid_Name)
	    {
		$list[$i] = $biom->Phospholipid_Name;
	    } 
	    elsif ($biom->Multimer_Name)
	    {
		$list[$i] = $biom->Multimer_Name;
	    }
            elsif ($biom->Inorganic_Name)
            {
                $list[$i] = $biom->Inorganic_Name;
            }
	    else 
	    {
		$list[$i] = $biom;
	    }
	    $i=$i+1;
	}
	print table(
		    TR({-align=>'left'},
		       th('Participant(s): <a href="../../Tutorial/#intcplxeData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td((blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } @infos))))),
		       td((blockquote(address(join(br,@list))))),
		       )
		    )
	    
	}
    if (my @infos = $Interaction->Source)
    { 
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Interaction/Complex from : <a href="../../Tutorial/#intcplxeData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,@list)))),
		       )
		    )
	}
    if (my @infos = $Interaction->Experiment)
    { 
	my @list=@infos;
	my @datatype=();
	my @dataexp=();
	foreach my $exp (@list)
	{
	    my $type=$exp->Interaction_Detection_Method;
	    my $exp=$type->right;
	    push (@datatype,$type);
	    push (@dataexp,$exp);
	}
	print table(
		    TR({-align=>'left'},
		       th({-style=>"background-color:#c2f2c2;"},'Experiment(s) : <a href="../../Tutorial/#intcplxeData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,map { ObjectLink($_,$_->Experiment) }@list)))),
		       td(blockquote((address(join(br,@datatype))))),
		       td(blockquote((address(join(br,@dataexp))))),
		       )
		    )
	}
    
    if (my @infos = $Interaction->PMID)
    { 
	my $ic=0;
	my $i=0;
	my @www=();
        my $jc=0;
        my $j=0;
        my @ref=();
	for ($ic=0;$ic<=$#infos;$ic++)
	{
	    $www[$i] = "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/".$infos[$i]."\" target=\"_blank\">Link to PubMed Abstract</a>";
	    $i++;
	}
        for ($jc=0;$jc<=$#infos;$jc++)
        {
            if (($infos[$j]->First_Author)&&($infos[$j]->Title))
            {
                my $tmp=$infos[$j]->First_Author."<i> et al.</i>: \"".$infos[$j]->Title;
                $ref[$j] =  substr($tmp, 0, 90)."....\"";
                $j++;
            }
            elsif (($infos[$j]->AuthorList)&&($infos[$j]->Title))
            {
                my $tmp=$infos[$j]->AuthorList ;
                $tmp=~/^([^\,]+)\,?/;
                my $res=$1;
                if ($res)
                {
                    my $tmp2=$res."<i> et al.</i>: \"".$infos[$j]->Title;
                    $ref[$j] = substr($tmp2, 0, 90)."....\"";
                }
                else
                {
                    my $tmp2= "\"".$infos[$j]->Title;
                    $ref[$j] = substr($tmp2, 0, 90)."....\"";
                }
                $j++;
            }
            elsif ($infos[$j]->Title)
            {
                my $tmp="\"".$infos[$j]->Title;
                $ref[$j] =  substr($tmp, 0, 90)."....\"";
                $j++;
            }
            else
            {
                $ref[$j]="-";
                $j++;
            }
        }

	print table(
		    TR({-align=>'left'},
		       th('Bibliography :<a href="../../Tutorial/#intcplxeData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td((blockquote(address(join(br,map { ObjectLink($_,$_->Biblio) } @infos))))),
		       #td((blockquote(address(join(br,map { ObjectLink($_,$_->Publication) } @infos))))),
                       td((blockquote(address(join(br,@ref))))),
		       td((blockquote(address(join(br,@www))))),
		       )
		    )
	} 
}
sub print_report4 {
    my $Interaction = shift;
    print h2($Interaction);
    my %num={};
    my @pmidnu2=();

#for some experiment info of BioMolecules which interact
 
    if (my @infos = $Interaction->Association)
    { 
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Interaction : <a href="../../Tutorial/#ComExpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,map { ObjectLink($_,$_->Association) }@list)))),
		       )
		    )
	}
    if (my @infos = $Interaction->col)
    {
        foreach my $infos(@infos)
        {
            if ($infos eq "Positive_control")
            {
                print table(
                        TR({-align=>'left'},
                           td("This experiment is a positive control"),
                           )
                            );
            }
        }
    }
    if (my @infos = $Interaction->Host_System)
    { 
	my @list=@infos;
	my @host=();
	my @list2=();
	foreach my $host(@infos)
	{
	    
	    push(@host,map {ObjectLink($_)}$host);
	    my $host2=$host->English_name;
	    push(@list2,$host2);
	}
	print table(
		    TR({-align=>'left'},
		       th('Host(s) organism(s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,@host)))),
		       td(blockquote(address(join(br,@list2)))),
		       )
		    );
    }
    if (my @infos = $Interaction->Tissue)
    {
        my @db=();
        my @tissue=();
        my @www=();
        foreach my $type (@infos)
        {
            if ($type eq "Brenda")
            {
                my @Brenda=$Interaction->Brenda;
                foreach my $Brenda (@Brenda)
                {
                    push (@db,"<b>Brenda</b>");
                    push (@tissue,"<a href=\"http://www.ebi.ac.uk/ontology-lookup/browse.do?ontName=BTO&termId=".$Brenda."\" target=\"_blank\">".$Brenda."</a>");
                }
            }
            if ($type eq "UniProt")
            {
                my @UniProt=$Interaction->UniProt;
                foreach my $UniProt (@UniProt)
                {
                    push (@db,"<b>UniProt tissue list</b>");
                    push (@tissue,"<a href=\"http://www.uniprot.org/docs/tisslist\" target=\"_blank\">".$UniProt);
                }
            }
            if ($type eq "Tissue_Name")
            {
                my @Tissue_Name=$Interaction->Tissue_Name;
                foreach my $Tissue_Name (@Tissue_Name)
                {
                    push (@db,"<b>Tissue's name</b>");
                    push (@tissue,$Tissue_Name);
                }
            }
        }
        print table(
                    TR({-align=>'left'},
                       th('Tissues (s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote(address(join(br,@db)))),
                       td(blockquote(address(join(br,@tissue)))),
                       td(blockquote(address(join(br,@www)))),
                       )
                    );
    }
    if (my @infos = $Interaction->Cell_lines)
    {
        my @db=();
        my @cell=();
        my @www=();
        foreach my $type (@infos)
        {
            if ($type eq "Cabri")
            {
                my @Cabri=$Interaction->Cabri;
                foreach my $Cabri (@Cabri)
                {
                    push (@db,"<b>Cabri</b>");
                    if ($Cabri=~/^ACC/)
                    {
                        push (@cell,"<a href=\"http://www.cabri.org/CABRI/srs-bin/wgetz?-newId+-e+-page+qResult+[DSMZ_MUTZ-id:\'".$Cabri."\']\" target=\"_blank\">".$Cabri."</a>");
                    }
                    elsif ($Cabri=~/^ICLC/)
                    {
                        push (@cell,"<a href=\"http://www.cabri.org/CABRI/srs-bin/wgetz?-newId+-e+-page+qResult+[ICLC-id:\'".$Cabri."\']\" target=\"_blank\">".$Cabri."</a>");
                    }
                }
            }
            if ($type eq "Cell_PMID")
            {
                my @Cell_PMID=$Interaction->Cell_PMID;
                foreach my $Cell_PMID (@Cell_PMID)
                {
                    push (@db,"<b>Cell bibliographic reference</b>");
                    push (@cell,"<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/".$Cell_PMID."\" target=\"_blank\">".$Cell_PMID);
                }
            }
            if ($type eq "Cell_Name")
            {
                my @Cell_Name=$Interaction->Cell_Name;
                foreach my $Cell_Name (@Cell_Name)
                {
                    push (@db,"<b>Cell name</b>");
                    push (@cell,$Cell_Name);
                }
            }
        }
        print table(
                    TR({-align=>'left'},
                       th('Cell(s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote(address(join(br,@db)))),
                       td(blockquote(address(join(br,@cell)))),
                       td(blockquote(address(join(br,@www)))),
                       )
                    );
    }
    if (my @infos = $Interaction->Compartment)
    {
        my @db=();
        my @comp=();
        foreach my $type (@infos)
        {
            if ($type eq "GO_xref")
            {
                my @GO_xref=$Interaction->GO_xref;
                foreach my $GO_xref (@GO_xref)
                {
                    push (@db,"<b>Gene Ontogy term</b>");
                    push (@comp,"<a href=\"".$GO_xref."\" target=\"_blank\">".$GO_xref."</a>");
                }
            }
            if ($type eq "Compartment_Name")
            {
                my @Compartment_Name=$Interaction->Compartment_Name;
                foreach my $Compartment_Name (@Compartment_Name)
                {
                    push (@db,"<b>Compartment Name</b>");
                    push (@comp,$Compartment_Name);
                }
            }
        }
        print table(
                    TR({-align=>'left'},
                       th('Compartment(s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote(address(join(br,@db)))),
                       td(blockquote(address(join(br,@comp)))),
                       )
                    );
    }
    if (my @infos = $Interaction->Confidence)
    {
        my @db=();
        my @conf=();
        foreach my $type (@infos)
        {
            if ($type eq "Calcul")
            {
                my @Calcul=$Interaction->Calcul;
                foreach my $Calcul (@Calcul)
                {
                    push (@db,"<b>Calcul</b>");
                    push (@conf,$Calcul);
                }
            }
            if ($type eq "Value")
            {
                my @Value=$Interaction->Value;
                foreach my $Value (@Value)
                {
                    push (@db,"<b>Value</b>");
                    push (@conf,$Value);
                }
            }
            if ($type eq "Unit")
            {
                my @Unit=$Interaction->Unit;
                foreach my $Unit (@Unit)
                {
                    push (@db,"<b>Unit</b>");
                    push (@conf,$Unit);
                }
            }
        }
        print table(
                    TR({-align=>'left'},
                       th('Confidence(s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote(address(join(br,@db)))),
                       td(blockquote(address(join(br,@conf)))),
                       )
                    );
    }
    if (my @infos = $Interaction->HPRD)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('HPRD Association determined by: <a href="../../Tutorial/#HPRDexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }
   if (my @infos = $Interaction->MINT)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('MINT Association determined by: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }
   if (my @infos = $Interaction->IntAct)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('IntAct Association determined by: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }
    if (my @infos = $Interaction->DIP)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('DIP Association determined by: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }
    if (my @infos = $Interaction->BioGrid)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('BioGrid association determined by method: <a href="../../Tutorial/#BioGRIDexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }

   if (my @infos = $Interaction->MatrixDB)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('MatrixDB literature curation, determined by: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }
   if (my @infos = $Interaction->MatrixDB_SPR_arrays)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('MatrixDB Interaction determined by : <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }
   if (my @infos = $Interaction->IMEx_ID_Experiment)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('IMEx ID of the experiment : <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    )
        }
    if (my @infos = $Interaction->BioMolecule)
    { 
	my @list=();
	my $i=0;
	foreach my $biom (@infos)
	{
	    if ($biom->Common_Name)
	    {
		$list[$i] = $biom->Common_Name;
	    }
	    elsif ($biom->FragmentName)
	    {
		$list[$i] = $biom->FragmentName;
	    }   
	    elsif ($biom->GAG_Name)
	    {
		$list[$i] = $biom->GAG_Name;
	    }  
	    elsif ($biom->Cation_Name)
	    {
		$list[$i] = $biom->Cation_Name;
	    } 
	    elsif ($biom->Glycolipid_Name)
	    {
		$list[$i] = $biom->Glycolipid_Name;
	    } 
	    elsif ($biom->Phospholipid_Name)
	    {
		$list[$i] = $biom->Phospholipid_Name;
	    } 
	    elsif ($biom->Multimer_Name)
	    {
		$list[$i] = $biom->Multimer_Name;
	    }
            elsif ($biom->Inorganic_Name)
            {
                $list[$i] = $biom->Inorganic_Name;
            }
	    else 
	    {
		$list[$i] = $biom;
	    }
	    $i=$i+1;
	}
	#print table(
	#	    TR({-align=>'left'},
	#	       th('Biomolecules involved: <a href="../../Tutorial/#ComExpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
	#	       td((blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } @infos))))),
	#	       td((blockquote(address(join(br,@list))))),
	#	       )
	#	    );
	###temporaire !:::doit trouver une autre solutionpour les complexes
	my $biom1=$infos[0];
	my $biom2=$infos[1];
	my $biom3=$infos[2];

	my @brole=("-");
	my @erole=("-");
	my @pdmrole=("-");
	my @spe=("-");
	my @idreel=("-");
	my @listhost=();

        my @iso=();
        my @isoac=();
        my @assign=();
        my @stoech=();
        my @exp=();
        my @also=();
        my @stra =();

        my @Feature=();
        my @cat=();
        my @sscat=();
        my @data=();

        my @kefda=();
        my @ukefda=();
        my @bsda=();
        my @pmda=();
        my @ptmda=();
        my @pfda=();
        my @ukbfda=();
        my @Domain=();
        my @Choice=();
        my @Type=();

        my @name=();
        my @Range=();
        my @Rangenum=();

        my @Position_start=();
        my @Status_start=();
        my @Position_end=();
        my @Status_end =();
        my @isLinked=();

        my @Other_data=();
        my @Detection_Method=();

	my @brole1=("-");
	my @erole1=("-");
	my @pdmrole1=("-");
	my @spe1=("-");
	my @idreel1=("-");
	my @listhost1=();

	my @brole2=("-");
	my @erole2=("-");
	my @pdmrole2=("-");
	my @spe2=("-");
	my @idreel2=("-");
	my @listhost2=();
	my @assign2=();

        my @iso1=();
        my @isoac1=();
        my @assign1=();
        my @stoech1=();
        my @exp1=();
        my @also1=();
        my @stra1 =();

        my @Feature1=();
        my @cat1=();
        my @sscat1=();
        my @data1=();
        my @kefda1=();
        my @ukefda1=();
        my @bsda1=();
        my @pmda1=();
        my @ptmda1=();
        my @pfda1=();
        my @ukbfda1=();

        my @Type1=();
        my @Choice1=();
        my @Domain1=();

        my @name1=();
        my @Range1=();
        my @Rangenum1=();
        my @Position_start1=();
        my @Status_start1=();
        my @Position_end1=();
        my @Status_end1 =();
        my @isLinked1=();

        my @Other_data1=();
        my @Detection_Method1=();


        if ($biom1)
	{
	    
	    my @avoir=$biom1->col;
	    #print @avoir;
		
	    foreach my $avoir (@avoir)
	    { 
		if ($avoir eq "BioRole")
		{
		    @brole=$avoir->col;
		}
		elsif($avoir eq "ExpRole")
		{
		    @erole=$avoir->col;
		}
		elsif($avoir eq "Detect_Meth")
		{
		    @pdmrole=$avoir->col;
		}
		elsif ($avoir eq "Species")
		{
		    @spe=$avoir->col;
		    foreach my $spe (@spe)
		    {
			my $host2=$spe->English_name;
			push(@listhost,$host2);
		    }
		}
                elsif ($avoir eq "Accession_Number")
                {
                    @idreel= $avoir->col;
                }
                elsif ($avoir eq "Isoform")
                {
                    @iso= $avoir->col;
                }
                elsif ($avoir eq "Isoformm_Accession_Number")
                {
                    @isoac= $avoir->col;
                }
                elsif ($avoir eq "Author_assigned_name")
                {
                    @assign= $avoir->col;
                }
                elsif ($avoir eq "Stoichiometry")
                {
                    @stoech = $avoir->col;
                }
                elsif ($avoir eq "Expression_level")
                {
                    @exp = $avoir->col;
                }
                elsif ($avoir eq "See_also")
                {
                    @also = $avoir->col;
                }
                elsif ($avoir eq "Strain")
                {
                    @stra = $avoir->col;
                }
            }
	}
	if ($biom2)
	{
	    
	    my @avoir=$biom2->col;
	    #print @avoir;
		
	    foreach my $avoir (@avoir)
	    { 
		if ($avoir eq "BioRole")
		{
		    @brole1=$avoir->col;
		}
		elsif($avoir eq "ExpRole")
		{
		    @erole1=$avoir->col;
		}
		elsif($avoir eq "Detect_Meth")
		{
		    @pdmrole1=$avoir->col;
		}
		elsif ($avoir eq "Species")
		{
		    @spe1=$avoir->col;
		    foreach my $spe (@spe1)
		    {
			my $host2=$spe->English_name;
			push(@listhost1,$host2);
		    }
		}
		elsif ($avoir eq "Accession_Number")
		{
		    @idreel1= $avoir->col;
		}
                elsif ($avoir eq "Isoform")
                {
                    @iso1= $avoir->col;
                }
                elsif ($avoir eq "Isoform_Accession_Number")
                {
                    @isoac1= $avoir->col;
                }
                elsif ($avoir eq "Author_assigned_name")
                {
                    @assign1= $avoir->col;
                }
                elsif ($avoir eq "Stoichiometry")
                {
                    @stoech1 = $avoir->col;
                }
                elsif ($avoir eq "Expression_level")
                {
                    @exp1 = $avoir->col;
                }
                elsif ($avoir eq "See_also")
                {
                    @also1 = $avoir->col;
                }
                elsif ($avoir eq "Strain")
                {
                    @stra1 = $avoir->col;
                }

	    }
	}
###temporaire !:::doit trouver une autre solutionpour les complexes
	if ($biom3)
	{
	    
	    my @avoir=$biom3->col;
	    #print @avoir;
		
	    foreach my $avoir (@avoir)
	    { 
		if ($avoir eq "BioRole")
		{
		    @brole2=$avoir->col;
		}
		elsif($avoir eq "ExpRole")
		{
		    @erole2=$avoir->col;
		}
		elsif($avoir eq "Detect_Meth")
		{
		    @pdmrole2=$avoir->col;
		}
		elsif ($avoir eq "Species")
		{
		    @spe2=$avoir->col;
		    foreach my $spe (@spe1)
		    {
			my $host3=$spe->English_name;
			push(@listhost2,$host3);
		    }
		}
		elsif ($avoir eq "Accession_Number")
		{
		    @idreel2= $avoir->col;
		}
		elsif ($avoir eq "Author_assigned_name")
		{
		    @assign2= $avoir->col;
		}
	    }
	}	

        my @assign_tot=();
        if (@assign)
        {
            my $assign_tmp="";
            foreach my $assign (@assign)
            {
                if ($assign_tmp)
                {
                    $assign_tmp.=", ".$assign;
                }
                else
                {
                    $assign_tmp=$assign;
                }
            }
            push (@assign_tot, $assign_tmp);
        }
        if (@assign1)
        {
            my $assign1_tmp="";
            foreach my $assign1 (@assign1)
            {
                if ($assign1_tmp)
                {
                    $assign1_tmp.=", ".$assign1;
                }
                else
                {
                    $assign1_tmp=$assign1;
                }
            }
            push (@assign_tot, $assign1_tmp);
        }
	if (@assign2)
	{
	    my $assign2_tmp="";
	    foreach my $assign2 (@assign2)
	    {
		if ($assign2_tmp)
		{
		    $assign2_tmp.=", ".$assign2;
		}
		else
		{
		    $assign2_tmp=$assign2;
		}
	    }
	    push (@assign_tot, $assign2_tmp);
	}


        print table(
                    TR({-align=>'left'},
                       th('Participant(s): <a href="../../Tutorial/#ComExpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td((blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } @infos))))),
                       td((blockquote(address(join(br,@list))))),
                       td((blockquote(address(join(br,@assign_tot))))),
                       )
                    );
        @assign_tot=();
        
	if (! $Interaction->HPRD)
	{
	    print table(TR({-align=>'left'},
			   th('Partner details : <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),			));
            if ($biom3) ##temporaire pour le seul complexe de MatrixDB
            {
	        print table(TR({-align=>'left'},
				td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Biological role</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Experimental role</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Partner Detection Method</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;", colspan=>"2"},blockquote("<b>Experimental species</b>")),
                           	td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Experimental molecule</b>")),
			   	),
			    TR({-align=>'left'},
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
			   	td({-style=>"text-align:center;"},blockquote(@brole)),
			   	td({-style=>"text-align:center;"},blockquote(@erole)),
			   	td({-style=>"text-align:center;"},(@pdmrole)),
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->In_Species) }@spe)))),
                           	td({-style=>"text-align:left;"},@listhost),
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_) }@idreel)))),
			   ),
			    TR({-align=>'left'},
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2)))),
			   	td({-style=>"text-align:center;"},blockquote(@brole1)),
			   	td({-style=>"text-align:center;"},blockquote(@erole1)),
			  	td({-style=>"text-align:center;"},(@pdmrole1)),
                           	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->In_Species) }@spe1)))),
                           	td({-style=>"text-align:left;"},@listhost1),
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_) }@idreel1)))),
			       ),
                            TR({-align=>'left'},
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom3)))),
			   	td({-style=>"text-align:center;"},blockquote(@brole2)),
			   	td({-style=>"text-align:center;"},blockquote(@erole2)),
			  	td({-style=>"text-align:center;"},(@pdmrole2)),
                           	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->In_Species) }@spe2)))),
                           	td({-style=>"text-align:left;"},@listhost2),
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_) }@idreel2)))),
			       ));
            }
	    elsif ($biom2)
	    {
	        print table(TR({-align=>'left'},
				td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Biological role</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Experimental role</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Partner Detection Method</b>")),
			   	td({-style=>"background-color:#c2f2c2;text-align:center;", colspan=>"2"},blockquote("<b>Experimental species</b>")),
                           	td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Experimental molecule</b>")),
			   	),
			    TR({-align=>'left'},
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
			   	td({-style=>"text-align:center;"},blockquote(@brole)),
			   	td({-style=>"text-align:center;"},blockquote(@erole)),
			   	td({-style=>"text-align:center;"},(@pdmrole)),
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->In_Species) }@spe)))),
                           	td({-style=>"text-align:left;"},@listhost),
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_) }@idreel)))),
			   ),
			    TR({-align=>'left'},
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2)))),
			   	td({-style=>"text-align:center;"},blockquote(@brole1)),
			   	td({-style=>"text-align:center;"},blockquote(@erole1)),
			  	td({-style=>"text-align:center;"},(@pdmrole1)),
                           	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->In_Species) }@spe1)))),
                           	td({-style=>"text-align:left;"},@listhost1),
			   	td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_) }@idreel1)))),
			       )
			    );
                if ((@iso)||(@iso1))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Isoform</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Isoform experimental species</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},blockquote(@iso)),
                                   td({-style=>"text-align:center;"},blockquote(@isoac))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2)))),
                                   td({-style=>"text-align:center;"},blockquote(@iso1)),
                                   td({-style=>"text-align:center;"},blockquote(@isoac1)),
                                   ));
                }
                if ((@stoech)||(@stoech1))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"}, ("<b>Stoichiometry</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},@stoech)),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2)))),
                                   td({-style=>"text-align:center;"},@stoech1),
                                   ));
                }
                if ((@exp)||(@exp1))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"}, ("<b>Expression level</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},@exp)),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2)))),
                                   td({-style=>"text-align:center;"},@exp1)),
                                );
                }
                if((@also)||(@also1))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"}, blockquote("<b>See also</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->BioMolecule) }@also))))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2)))),
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->BioMolecule) }@also1)))),
                                   ));
                }
                if((@stra)||(@stra1))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Strain</b>")),
                                   ),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},@stra),
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1))))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},@stra1),
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2))))),
                                );
                }

            }
	    else
	    {
               print table(TR({-align=>'left'},
                                td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Biological role</b>")),
                                td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Experimental role</b>")),
                                td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Partner Detection Method</b>")),
                                td({-style=>"background-color:#c2f2c2;text-align:center;", colspan=>"2"},blockquote("<b>Experimental species</b>")),
                                td({-style=>"background-color:#c2f2c2;text-align:center;"},blockquote("<b>Experimental molecule</b>")),
                                ),
                            TR({-align=>'left'},
                                td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                td({-style=>"text-align:center;"},blockquote(@brole)),
                                td({-style=>"text-align:center;"},blockquote(@erole)),
                                td({-style=>"text-align:center;"},(@pdmrole)),
                                td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->In_Species) }@spe)))),
                                td({-style=>"text-align:left;"},@listhost),
                                td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_) }@idreel)))),
                           ));
                if ((@iso))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Isoform</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Isoform experimental species</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},blockquote(@iso)),
                                   td({-style=>"text-align:center;"},blockquote(@isoac)))
                                );
                }
                if ((@stoech))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"}, ("<b>Stoichiometry</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},@stoech))
                                   );
                }
                if ((@exp))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"}, ("<b>Expression level</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},@exp))
                                );
                }
                if((@also))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"}, blockquote("<b>See also</b>"))),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map{ObjectLink($_,$_->BioMolecule) }@also)))))
                                );
                }
                if((@stra))
                {
                    print table(TR({-align=>'left'},
                                   td({-style=>"background-color:#bfdeff;text-align:center;"},blockquote("<b>Biomolecule</b>")),
                                   td({-style=>"background-color:#c2f2c2;text-align:center;"},("<b>Strain</b>")),
                                   ),
                                TR({-align=>'left'},
                                   td({-style=>"text-align:center;"},@stra),
                                   td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1))))),
                                );
                }
           }

            ################"Features

            if ($biom1)
            {
                my @avoir=$biom1->col;
                #print @avoir;
                foreach my $avoir (@avoir)
                {
                    if ($avoir eq "Feature")
                    {
                        print table(TR({-align=>'left'},
                                       th({-style=>'background-color:#c889e9;'},'Feature(s) : <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                                       td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom1)))),
                                       td({-style=>"text-align:left;"},$list[0]),
                                       ));
                        @Feature = $avoir->col;
                        foreach my $num (@Feature)
                        {
                            @cat=$num->col;
                            foreach my $cat (@cat)
                            {
                                @sscat=$cat->col;
                                foreach my $sscat (@sscat)
                                {
                                    @data=$sscat->col;
                                    my $feat_type="";
                                    foreach my $data(@data)
                                    {
                                        if ($sscat eq "Binding_Site")
                                        {
                                            $feat_type="Binding Site";
                                            if ($data eq "Binding_Site_Data")
                                            {
                                                @bsda=$data->col;
                                                foreach my $bsda(@bsda)
                                                {
                                                    if ($bsda eq "Name")
                                                    {
                                                        @name=$bsda->col;
                                                    }
                                                    elsif ($bsda eq "Other_data")
                                                    {
                                                        @Other_data=$bsda->col;
                                                    }
                                                    elsif ($bsda eq "Range")
                                                    {
                                                        @Range=$bsda->col;
                                                        foreach my $Range(@Range)
                                                        {
                                                            @Rangenum=$Range->col;
                                                            foreach my $Rangenum(@Rangenum)
                                                            {
                                                                if ($Rangenum eq "Position_start")
                                                                {
                                                                    push(@Position_start,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_start")
                                                                {
                                                                    push(@Status_start,$Rangenum->col);
                                                                }
                                                                if ($Rangenum eq "Position_end")
                                                                {
                                                                    push(@Position_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_end")
                                                                {
                                                                    push(@Status_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "isLinked")
                                                                {
                                                                    push(@isLinked,$Rangenum->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($bsda eq "Detection_Method")
                                                    {
                                                        @Detection_Method=$bsda->col;
                                                    }
                                                }
                                            }
                                            elsif ($data eq "Binding_Site_Type")
                                            {
                                                @Type=$data->col;
                                            }
                                            elsif ($data eq "Binding_Site_Domain")
                                            {
                                                @Domain=$data->col;
                                            }
                                        }
                                        elsif ($sscat eq "Point_Mutation")
                                        {
                                            $feat_type="Point Mutation";
                                            if ($data eq "Point_Mutation_Data")
                                            {
                                                @pmda=$data->col;
                                                foreach my $pmda(@pmda)
                                                {
                                                    if ($pmda eq "Name")
                                                    {
                                                        @name=$pmda->col;
                                                    }
                                                    elsif ($pmda eq "Other_data")
                                                    {
                                                        @Other_data=$pmda->col;
                                                    }
                                                    elsif ($pmda eq "Range")
                                                    {
                                                        @Range=$pmda->col;
                                                        foreach my $Range(@Range)
                                                        {
                                                            @Rangenum=$Range->col;
                                                            foreach my $Rangenum(@Rangenum)
                                                            {
                                                                if ($Rangenum eq "Position_start")
                                                                {
                                                                    push(@Position_start,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_start")
                                                                {
                                                                    push(@Status_start,$Rangenum->col);
                                                                }
                                                                if ($Rangenum eq "Position_end")
                                                                {
                                                                    push(@Position_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_end")
                                                                {
                                                                    push(@Status_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "isLinked")
                                                                {
                                                                    push(@isLinked,$Rangenum->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($pmda eq "Detection_Method")
                                                    {
                                                        @Detection_Method=$pmda->col;
                                                    }
                                                }
                                            }
                                            elsif ($data eq "Point_Mutation_Type")
                                            {
                                                @Type=$data->col;
                                            }
                                        }
                                        elsif ($sscat eq "Post_Translation_Modification")
                                        {
                                            $feat_type="Post Translation Modification";
                                            if ($data eq "Post_Translation_Modification_Data")
                                            {
                                                @ptmda=$data->col;
                                                foreach my $ptmda(@ptmda)
                                                {
                                                    if ($ptmda eq "Name")
                                                    {
                                                        @name=$ptmda->col;
                                                    }
                                                    elsif ($ptmda eq "Other_data")
                                                    {
                                                        @Other_data=$ptmda->col;
                                                    }
                                                    elsif ($ptmda eq "Range")
                                                    {
                                                        @Range=$ptmda->col;
                                                        foreach my $Range(@Range)
                                                        {
                                                            @Rangenum=$Range->col;
                                                            foreach my $Rangenum(@Rangenum)
                                                            {
                                                                if ($Rangenum eq "Position_start")
                                                                {
                                                                    push(@Position_start,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_start")
                                                                {
                                                                    push(@Status_start,$Rangenum->col);
                                                                }
                                                                if ($Rangenum eq "Position_end")
                                                                {
                                                                    push(@Position_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_end")
                                                                {
                                                                    push(@Status_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "isLinked")
                                                                {
                                                                    push(@isLinked,$Rangenum->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($ptmda eq "Detection_Method")
                                                    {
                                                        @Detection_Method=$ptmda->col;
                                                    }
                                                }
                                            }
                                            elsif ($data eq "Post_Translation_Modification_Type")
                                            {
                                                @Type=$data->col;
                                            }
                                            elsif ($data eq "Post_Translation_Modification_Choice")
                                            {
                                               @Choice=$data->col;
                                            }
                                        }
                                        elsif ($sscat eq "Polyprotein_Fragment")
                                        {
                                            $feat_type="Polyprotein Fragment";
                                            if ($data eq "Polyprotein_Fragment_Data")
                                            {
                                                @pfda=$data->col;
                                                foreach my $pfda(@pfda)
                                                {
                                                    if ($pfda eq "Name")
                                                    {
                                                        @name=$pfda->col;
                                                    }
                                                    elsif ($pfda eq "Other_data")
                                                    {
                                                        @Other_data=$pfda->col;
                                                    }
                                                    elsif ($pfda eq "Range")
                                                    {
                                                        @Range=$pfda->col;
                                                        foreach my $Range(@Range)
                                                        {
                                                            @Rangenum=$Range->col;
                                                            foreach my $Rangenum(@Rangenum)
                                                            {
                                                                if ($Rangenum eq "Position_start")
                                                                {
                                                                    push(@Position_start,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_start")
                                                                {
                                                                    push(@Status_start,$Rangenum->col);
                                                                }
                                                                if ($Rangenum eq "Position_end")
                                                                {
                                                                    push(@Position_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_end")
                                                                {
                                                                    push(@Status_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "isLinked")
                                                                {
                                                                    push(@isLinked,$Rangenum->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($pfda eq "Detection_Method")
                                                    {
                                                        @Detection_Method=$pfda->col;
                                                    }
                                                }
                                            }
                                            elsif ($data eq "Polyprotein_Fragment_Type")
                                            {
                                                @Type=$data->col;
                                            }
                                            elsif ($data eq "Polyprotein_Fragment_Domain")
                                            {
                                                @Domain=$data->col;
                                            }
                                        }
                                        elsif ($sscat eq "Unknown_Biological_Feature")
                                        {
                                            $feat_type="Biological Feature";
                                            if ($data eq "Unknown_Biological_Feature_Data")
                                            {
                                                @ukbfda=$data->col;
                                                foreach my $ukbfda(@ukbfda)
                                                {
                                                    if ($ukbfda eq "Name")
                                                    {
                                                        @name=$ukbfda->col;
                                                    }
                                                    elsif ($ukbfda eq "Other_data")
                                                    {
                                                        @Other_data=$ukbfda->col;
                                                    }
                                                    elsif ($ukbfda eq "Range")
                                                    {
                                                        @Range=$ukbfda->col;
                                                        foreach my $Range(@Range)
                                                        {
                                                            @Rangenum=$Range->col;
                                                            foreach my $Rangenum(@Rangenum)
                                                            {
                                                                if ($Rangenum eq "Position_start")
                                                                {
                                                                    push(@Position_start,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_start")
                                                                {
                                                                    push(@Status_start,$Rangenum->col);
                                                                }
                                                                if ($Rangenum eq "Position_end")
                                                                {
                                                                    push(@Position_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_end")
                                                                {
                                                                    push(@Status_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "isLinked")
                                                                {
                                                                    push(@isLinked,$Rangenum->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($ukbfda eq "Detection_Method")
                                                    {
                                                        @Detection_Method=$ukbfda->col;
                                                    }
                                                }
                                            }
                                            elsif ($data eq "Unknown_Experimental_Feature_Type")
                                            {
                                                @Type=$data->col;
                                            }
                                        }
                                        elsif ($sscat eq "Known_Experimental_Feature")
                                        {
                                            $feat_type="Experimental Feature";
                                            if ($data eq "Known_Experimental_Feature_Data")
                                            {
                                                @kefda=$data->col;
                                                foreach my $kefda(@kefda)
                                                {
                                                    if ($kefda eq "Name")
                                                    {
                                                        @name=$kefda->col;
                                                    }
                                                    elsif ($kefda eq "Other_data")
                                                    {
                                                        @Other_data=$kefda->col;
                                                    }
                                                    elsif ($kefda eq "Range")
                                                    {
                                                        @Range=$kefda->col;
                                                        foreach my $Range(@Range)
                                                        {
                                                            @Rangenum=$Range->col;
                                                            foreach my $Rangenum(@Rangenum)
                                                            {
                                                                if ($Rangenum eq "Position_start")
                                                                {
                                                                    push(@Position_start,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_start")
                                                                {
                                                                    push(@Status_start,$Rangenum->col);
                                                                }
                                                                if ($Rangenum eq "Position_end")
                                                                {
                                                                    push(@Position_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_end")
                                                                {
                                                                    push(@Status_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "isLinked")
                                                                {
                                                                    push(@isLinked,$Rangenum->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($kefda eq "Detection_Method")
                                                    {
                                                        @Detection_Method=$kefda->col;
                                                    }
                                                }
                                            }
                                            elsif ($data eq "Known_Experimental_Feature_Type")
                                            {
                                                @Type=$data->col;
                                            }
                                            elsif ($data eq "Known_Experimental_Feature_Domain")
                                            {
                                                @Choice=$data->col;
                                            }
                                        }
                                        elsif ($sscat eq "Unknown_Experimental_Feature")
                                        {
                                            $feat_type="Experimental Feature";
                                            if ($data eq "Unknown_Experimental_Feature_Data")
                                            {
                                                @ukefda=$data->col;
                                                foreach my $ukefda(@ukefda)
                                                {
                                                    if ($ukefda eq "Name")
                                                    {
                                                        @name=$ukefda->col;
                                                    }
                                                    elsif ($ukefda eq "Other_data")
                                                    {
                                                        @Other_data=$ukefda->col;
                                                    }
                                                    elsif ($ukefda eq "Range")
                                                    {
                                                        @Range=$ukefda->col;
                                                        foreach my $Range(@Range)
                                                        {
                                                            @Rangenum=$Range->col;
                                                            foreach my $Rangenum(@Rangenum)
                                                            {
                                                                if ($Rangenum eq "Position_start")
                                                                {
                                                                    push(@Position_start,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_start")
                                                                {
                                                                    push(@Status_start,$Rangenum->col);
                                                                }
                                                                if ($Rangenum eq "Position_end")
                                                                {
                                                                    push(@Position_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "Status_end")
                                                                {
                                                                    push(@Status_end,$Rangenum->col);
                                                                }
                                                                elsif ($Rangenum eq "isLinked")
                                                                {
                                                                    push(@isLinked,$Rangenum->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($ukefda eq "Detection_Method")
                                                    {
                                                        @Detection_Method=$ukefda->col;
                                                    }
                                                }
                                            }
                                            elsif ($data eq "Unknown_Experimental_Feature_Type")
                                            {
                                                @Type=$data->col;
                                            }
                                        }
                                    }
                                    my @position=();
                                    ##print @Status_start, @Status_end;##
                                    if ((@Status_start)&&(@Status_end))
                                    {
                                        my $pos=0;
                                        foreach my $Status_start(@Status_start)
                                        {
                                            $Status_start=~s/_/ /g;
                                            $Status_start[$pos]=$Status_start;
                                            if (($Status_start)&&(! $Position_start[$pos]))
                                            {
                                                $Position_start[$pos]="-";
                                            }
                                            if (($Status_start)&&(! $isLinked[$pos]))
                                            {
                                                $isLinked[$pos]="-";
                                            }
                                            my $Status_end=$Status_end[$pos];
                                            $Status_end=~s/_/ /g;
                                            $Status_end[$pos]=$Status_end;
                                            if (($Status_end)&&(! $Position_end[$pos]))
                                            {
                                                $Position_end[$pos]="-";
                                            }
                                            $position[$pos]=$Position_start[$pos]."&lt;-&gt;".$Position_end[$pos];
                                            $position[$pos].=" (".$Status_start[$pos]."-".$Status_end[$pos].")";
                                            $pos++;
                                        }
                                    }
                                    if (@Type)
                                    {
                                        my $pos=0;
                                        foreach my $Type(@Type)
                                        {
                                            $Type=~s/_/ /g;
                                            $Type[$pos]=$Type;
                                            $pos++;
                                        }
                                    }
                                    print table(TR({-align=>'left'},
                                                   td({-style=>"background-color:#e0bbf4;text-align:left;"},'<b>'.$feat_type.'</b>'),
                                                   td({-style=>"text-align:left;"},@name),
                                                   ),
                                                TR({-align=>'left'},
                                                   td({-style=>"background-color:#f0e1f8;text-align:left;"},"Type"),
                                                   td({-style=>"text-align:left;"},@Type),
                                                   ),
                                                TR({-align=>'left'},
                                                   td({-style=>"background-color:#f0e1f8;text-align:left;"},"Start and end position (status)"),
                                                   td({-style=>"text-align:left;"},join(br,@position))),
                                                TR({-align=>'left'},
                                                   td({-style=>"background-color:#f0e1f8;text-align:left;"},"Features linked ?"),
                                                   td({-style=>"text-align:left;"},join(br,@isLinked)),
                                                   ),
                                                );

                                    if (@Choice)
                                    {
                                        print table(TR({-align=>'left'},
                                                       td({-style=>"background-color:#f0e1f8;text-align:left;"},"Choice"),
                                                       td({-style=>"text-align:left;"},@Choice),
                                                       ),
                                                    );
                                    }
                                    if (@Domain)
                                    {
                                        my @www;
                                        my @entry;
                                        foreach my $Domain (@Domain)
                                        {
                                            push (@www,"<a href=\"http://www.ebi.ac.uk/interpro/ISearch?query=".$Domain."&amp;mode=ipr\" >InterPro Website</a>");

                                            #push (@entry,$Domain);
                                        }
                                        print table(TR({-align=>'left'},
                                                       td({-style=>"background-color:#f0e1f8;text-align:left;"},"Domain"),
                                                       td({-style=>"text-align:left;"},blockquote(@Domain)),
                                                       #td({-style=>"text-align:left;"},blockquote(@entry)),
                                                       td({-style=>"text-align:left;"},@www),
                                                       ),
                                                    );
                                    }
                                    if (@Other_data)
                                    {
                                        print table(TR({-align=>'left'},
                                                       td({-style=>"background-color:#f0e1f8;text-align:left;"},"Other data"),
                                                       td({-style=>"text-align:left;"},@Other_data),
                                                       ),
                                                    );
                                    }
                                    @data=();
                                    @kefda=();
                                    @ukefda=();
                                    @bsda=();
                                    @pmda=();
                                    @ptmda=();
                                    @pfda=();
                                    @ukbfda=();
                                    @Domain=();
                                    @Choice=();
                                    @Type=();
                                    @name=();
                                    @Range=();
                                    @Rangenum=();

                                    @Position_start=();
                                    @Status_start=();
                                    @Position_end=();
                                    @Status_end =();
                                    @isLinked=();
                                    @Other_data=();
                                    @Detection_Method=();

                                }
                                @sscat=();
                            }
                            @cat=();
                        }
                        @Feature=();
                    }
                }
            }

            if ($biom2)
            {

                my @avoir=$biom2->col;
                #print @avoir;

                foreach my $avoir (@avoir)
                {
                    if ($avoir eq "Feature")
                    {
                        print table(TR({-align=>'left'},
                                       th({-style=>'background-color:#c889e9;'},'Feature(s) : <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                                       td({-style=>"text-align:center;"},blockquote(address(join(br,map { ObjectLink($_,$_->BioMolecule) } $biom2)))),
                                       td({-style=>"text-align:left;"},$list[1]),
                                       ));
                        @Feature1 = $avoir->col;

                        foreach my $num1 (@Feature1)
                        {
                            @cat1=$num1->col;

                            foreach my $cat1 (@cat1)
                            {
                                @sscat1=$cat1->col;
                                foreach my $sscat1 (@sscat1)
                                {
                                    my $feat_type1="";
                                    @data1=$sscat1->col;

                                    foreach my $data1(@data1)
                                    {
                                        if ($sscat1 eq "Binding_Site")
                                        {
                                            $feat_type1="Binding Site";
                                            if ($data1 eq "Binding_Site_Data")
                                            {
                                                @bsda1=$data1->col;
                                                foreach my $bsda1(@bsda1)
                                                {
                                                    if ($bsda1 eq "Name")
                                                    {
                                                        @name1=$bsda1->col;
                                                    }
                                                    elsif ($bsda1 eq "Other_data")
                                                    {
                                                        @Other_data1=$bsda1->col;
                                                    }
                                                    elsif ($bsda1 eq "Range")
                                                    {
                                                        @Range1=$bsda1->col;
                                                        foreach my $Range1(@Range1)
                                                        {
                                                            @Rangenum1=$Range1->col;
                                                            foreach my $Rangenum1(@Rangenum1)
                                                            {
                                                                if ($Rangenum1 eq "Position_start")
                                                                {
                                                                    push(@Position_start1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_start")
                                                                {
                                                                    push(@Status_start1,$Rangenum1->col);
                                                                }
                                                                if ($Rangenum1 eq "Position_end")
                                                                {
                                                                    push(@Position_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_end")
                                                                {
                                                                    push(@Status_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "isLinked")
                                                                {
                                                                    push(@isLinked1,$Rangenum1->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($bsda1 eq "Detection_Method")
                                                    {
                                                        @Detection_Method1=$bsda1->col;
                                                    }
                                                }
                                            }

                                            elsif ($data1 eq "Binding_Site_Type")
                                            {
                                                @Type1=$data1->col;
                                            }
                                            elsif ($data1 eq "Binding_Site_Domain")
                                            {
                                                @Domain1=$data1->col;
                                            }
                                        }
                                        elsif ($sscat1 eq "Point_Mutation")
                                        {
                                            $feat_type1="Point Mutation";
                                            if ($data1 eq "Point_Mutation_Data")
                                            {
                                                @pmda1=$data1->col;
                                                foreach my $pmda1(@ptmda1)
                                                {
                                                    if ($pmda1 eq "Name")
                                                {
                                                    @name1=$pmda1->col;
                                                }
                                                    elsif ($pmda1 eq "Other_data")
                                                    {
                                                        @Other_data1=$pmda1->col;
                                                    }
                                                    elsif ($pmda1 eq "Range")
                                                    {
                                                        @Range1=$pmda1->col;
                                                        foreach my $Range1(@Range1)
                                                        {
                                                            @Rangenum1=$Range1->col;
                                                            foreach my $Rangenum1(@Rangenum1)
                                                            {
                                                                if ($Rangenum1 eq "Position_start")
                                                                {
                                                                    push(@Position_start1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_start")
                                                                {
                                                                    push(@Status_start1,$Rangenum1->col);
                                                                }
                                                                if ($Rangenum1 eq "Position_end")
                                                                {
                                                                    push(@Position_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_end")
                                                                {
                                                                    push(@Status_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "isLinked")
                                                                {
                                                                    push(@isLinked1,$Rangenum1->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($pmda1 eq "Detection_Method")
                                                    {
                                                        @Detection_Method1=$pmda1->col;
                                                    }
                                                }
                                            }
                                            elsif ($data1 eq "Point_Mutation_Type")
                                            {
                                                @Type1=$data1->col;
                                            }
                                        }
                                        elsif ($sscat1 eq "Post_Translation_Modification")
                                        {
                                            $feat_type1="Post Translation Modification";
                                            if ($data1 eq "Post_Translation_Modification_Data")
                                            {
                                                @ptmda1=$data1->col;
                                                foreach my $ptmda1(@ptmda1)
                                                {
                                                    if ($ptmda1 eq "Name")
                                                    {
                                                        @name1=$ptmda1->col;
                                                    }
                                                    elsif ($ptmda1 eq "Other_data")
                                                    {
                                                        @Other_data1=$ptmda1->col;
                                                    }
                                                    elsif ($ptmda1 eq "Range")
                                                    {
                                                        @Range1=$ptmda1->col;
                                                        foreach my $Range1(@Range1)
                                                        {
                                                            @Rangenum1=$Range1->col;
                                                            foreach my $Rangenum1(@Rangenum1)
                                                            {
                                                                if ($Rangenum1 eq "Position_start")
                                                                {
                                                                    push(@Position_start1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_start")
                                                                {
                                                                    push(@Status_start1,$Rangenum1->col);
                                                                }
                                                                if ($Rangenum1 eq "Position_end")
                                                                {
                                                                    push(@Position_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_end")
                                                                {
                                                                    push(@Status_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "isLinked")
                                                                {
                                                                    push(@isLinked1,$Rangenum1->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($ptmda1 eq "Detection_Method")
                                                    {
                                                        @Detection_Method1=$ptmda1->col;
                                                    }
                                                }
                                            }
                                            elsif ($data1 eq "Post_Translation_Modification_Type")
                                            {
                                                @Type1=$data1->col;
                                            }
                                            elsif ($data1 eq "Post_Translation_Modification_Choice")
                                            {
                                                @Choice1=$data1->col;
                                            }
                                        }
                                        elsif ($sscat1 eq "Polyprotein_Fragment")
                                        {
                                            $feat_type1="Polyprotein Fragment";
                                            if ($data1 eq "Polyprotein_Fragment_Data")
                                            {
                                                @pfda1=$data1->col;
                                                foreach my $pfda1(@pfda1)
                                                {
                                                    if ($pfda1 eq "Name")
                                                    {
                                                        @name1=$pfda1->col;
                                                    }
                                                    elsif ($pfda1 eq "Other_data")
                                                    {
                                                        @Other_data1=$pfda1->col;
                                                    }
                                                    elsif ($pfda1 eq "Range")
                                                    {
                                                        @Range1=$pfda1->col;
                                                        foreach my $Range1(@Range1)
                                                        {
                                                            @Rangenum1=$Range1->col;
                                                            foreach my $Rangenum1(@Rangenum1)
                                                            {
                                                                if ($Rangenum1 eq "Position_start")
                                                                {
                                                                    push(@Position_start1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_start")
                                                                {
                                                                    push(@Status_start1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Position_end")
                                                                {
                                                                    push(@Position_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_end")
                                                                {
                                                                    push(@Status_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "isLinked")
                                                                {
                                                                    push(@isLinked1,$Rangenum1->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($pfda1 eq "Detection_Method")
                                                    {
                                                        @Detection_Method1=$pfda1->col;
                                                    }
                                                }
                                            }
                                            elsif ($data1 eq "Polyprotein_Fragment_Type")
                                            {
                                                @Type1=$data1->col;
                                            }
                                            elsif ($data1 eq "Polyprotein_Fragment_Domain")
                                            {
                                                @Domain1=$data1->col;
                                            }
                            
                                        }
                                        elsif ($sscat1 eq "Unknown_Biological_Feature")
                                        {
                                            $feat_type1="Biological Feature";
                                            if ($data1 eq "Unknown_Biological_Feature_Data")
                                            {
                                                @ukbfda1=$data1->col;
                                                foreach my $ukbfda1(@ukefda1)
                                                {
                                                    if ($ukbfda1 eq "Name")
                                                    {
                                                        @name1=$ukbfda1->col;
                                                    }
                                                    elsif ($ukbfda1 eq "Other_data")
                                                    {
                                                        @Other_data1=$ukbfda1->col;
                                                    }
                                                    elsif ($ukbfda1 eq "Range")
                                                    {
                                                        @Range1=$ukbfda1->col;
                                                        foreach my $Range1(@Range1)
                                                        {
                                                            @Rangenum1=$Range1->col;
                                                            foreach my $Rangenum1(@Rangenum1)
                                                            {
                                                                if ($Rangenum1 eq "Position_start")
                                                                {
                                                                    push(@Position_start1,@Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_start")
                                                                {
                                                                    push(@Status_start1,$Rangenum1->col);
                                                                }
                                                                if ($Rangenum1 eq "Position_end")
                                                                {
                                                                    push(@Position_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_end")
                                                                {
                                                                    push(@Status_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "isLinked")
                                                                {
                                                                    push(@isLinked1,$Rangenum1->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($ukbfda1 eq "Detection_Method")
                                                    {
                                                        @Detection_Method1=$ukbfda1->col;
                                                    }
                                                }
                                            }
                                            elsif ($data1 eq "Unknown_Experimental_Feature_Type")
                                            {
                                                @Type1=$data1->col;
                                            }
                                        }
                                        elsif ($sscat1 eq "Known_Experimental_Feature")
                                        {
                                            $feat_type1="Experimental Feature";
                                            if ($data1 eq "Known_Experimental_Feature_Data")
                                            {
                                                @kefda1=$data1->col;
                                                foreach my $kefda1(@kefda1)
                                                {
                                                    if ($kefda1 eq "Name")
                                                    {
                                                        @name1=$kefda1->col;
                                                    }
                                                    elsif ($kefda1 eq "Other_data")
                                                    {
                                                        @Other_data1=$kefda1->col;
                                                    }
                                                    elsif ($kefda1 eq "Range")
                                                    {
                                                        @Range1=$kefda1->col;
                                                        foreach my $Range1(@Range1)
                                                        {
                                                            @Rangenum1=$Range1->col;
                                                            foreach my $Rangenum1(@Rangenum1)
                                                            {
                                                                if ($Rangenum1 eq "Position_start")
                                                                {
                                                                    push(@Position_start1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_start")
                                                                {
                                                                    push(@Status_start1,$Rangenum1->col);
                                                                }
                                                                if ($Rangenum1 eq "Position_end")
                                                                {
                                                                    push(@Position_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_end")
                                                                {
                                                                    push(@Status_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "isLinked")
                                                                {
                                                                    push(@isLinked1,$Rangenum1->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($kefda1 eq "Detection_Method")
                                                    {
                                                        @Detection_Method1=$kefda1->col;
                                                    }
                                                }
                                            }
                                            elsif ($data1 eq "Known_Experimental_Feature_Type")
                                            {
                                                @Type1=$data1->col;
                                            }
                                            elsif ($data1 eq "Known_Experimental_Feature_Domain")
                                            {
                                                @Domain1=$data1->col;
                                            }
                                        }
                                        elsif ($sscat1 eq "Unknown_Experimental_Feature")
                                        {
                                            $feat_type1="Experimental Feature";
                                            if ($data1 eq "Unknown_Experimental_Feature_Data")
                                            {
                                                @ukefda1=$data1->col;
                                                foreach my $ukefda1(@ukefda1)
                                                {
                                                    if ($ukefda1 eq "Name")
                                                    {
                                                        @name1=$ukefda1->col;
                                                    }
                                                    elsif ($ukefda1 eq "Other_data")
                                                    {
                                                        @Other_data1=$ukefda1->col;
                                                    }
                                                    elsif ($ukefda1 eq "Range")
                                                    {
                                                        @Range1=$ukefda1->col;                    
                                                        foreach my $Range1(@Range1)
                                                        {
                                                            @Rangenum1=$Range1->col;
                                                            foreach my $Rangenum1(@Rangenum1)
                                                            {
                                                                if ($Rangenum1 eq "Position_start")
                                                                {
                                                                    push(@Position_start1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_start")
                                                                {
                                                                    push(@Status_start1,$Rangenum1->col);
                                                                }
                                                                if ($Rangenum1 eq "Position_end")
                                                                {
                                                                    push(@Position_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "Status_end")
                                                                {
                                                                    push(@Status_end1,$Rangenum1->col);
                                                                }
                                                                elsif ($Rangenum1 eq "isLinked")
                                                                {
                                                                    push(@isLinked1,$Rangenum1->col);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    elsif ($ukefda1 eq "Detection_Method")
                                                    {
                                                        @Detection_Method1=$ukefda1->col;
                                                    }
                                                }
                                            }
                                            elsif ($data1 eq "Unknown_Experimental_Feature_Type")
                                            {
                                                @Type1=$data1->col;
                                            }
                                        }
                                    }
                                    my @position1=();

                                    if ((@Status_start1)&&(@Status_end1))
                                    {
                                        my $pos=0;
                                        foreach my $Status_start1(@Status_start1)
                                        {
                                            $Status_start1=~s/_/ /g;
                                            $Status_start1[$pos]=$Status_start1;
                                            if (($Status_start1)&&(! $Position_start1[$pos]))
                                            {
                                                $Position_start1[$pos]="-";
                                            }
                                            if (($Status_start1)&&(! $isLinked1[$pos]))
                                            {
                                                $isLinked1[$pos]="-";
                                            }
                                            my $Status_end1=$Status_end1[$pos];
                                            $Status_end1=~s/_/ /g;
                                            $Status_end1[$pos]=$Status_end1;
                                            if (($Status_end1)&&(! $Position_end1[$pos]))
                                            {
                                                $Position_end1[$pos]="-";
                                            }
                                            $position1[$pos]=$Position_start1[$pos]."&lt;-&gt;".$Position_end1[$pos];
                                            $position1[$pos].=" (".$Status_start1[$pos]."-".$Status_end1[$pos].")";
                                            $pos++;
                                        }

                                    }
                                    ##print @Status_start1, @Status_end1;##

                                    if (@Type1)
                                    {
                                        my $pos=0;
                                        foreach my $Type1(@Type1)
                                        {
                                            $Type1=~s/_/ /g;
                                            $Type1[$pos]=$Type1;
                                            $pos++;
                                        }
                                    }


                                    print table(TR({-align=>'left'},
                                                   td({-style=>"background-color:#e0bbf4;text-align:left;"},'<b>'.$feat_type1.'</b>'),
                                                   td({-style=>"text-align:left;"},@name1),
                                                   ),
                                                TR({-align=>'left'},
                                                   td({-style=>"background-color:#f0e1f8;text-align:left;"},"Type"),
                                                   td({-style=>"text-align:left;"},@Type1),
                                                   ),
                                                TR({-align=>'left'},
                                                   td({-style=>"background-color:#f0e1f8;text-align:left;"},"Start and end position (status)"),
                                                   td({-style=>"text-align:left;"},join(br,@position1))),
                                                TR({-align=>'left'},
                                                   td({-style=>"background-color:#f0e1f8;text-align:left;"},"Features linked ?"),
                                                   td({-style=>"text-align:left;"},join(br,@isLinked1)),
                                                   ),
                                                );

                                    if (@Choice1)
                                    {
                                        print table(TR({-align=>'left'},
                                                       td({-style=>"background-color:#f0e1f8;text-align:left;"},"Choice"),
                                                       td({-style=>"text-align:left;"},@Choice1),
                                                       ),
                                                    );
                                    }
                                    if (@Domain1)
                                    {
                                        print table(TR({-align=>'left'},
                                                       td({-style=>"background-color:#f0e1f8;text-align:left;"},"Domain"),
                                                       td({-style=>"text-align:left;"},@Domain1),
                                                       ),
                                                    );
                                    }
                                    if (@Other_data1)
                                    {
                                        print table(TR({-align=>'left'},
                                                       td({-style=>"background-color:#f0e1f8;text-align:left;"},"Other data"),
                                                       td({-style=>"text-align:left;"},@Other_data1),
                                                       ),
                                                    );
                                    }
                                    @data1=();
                                    @kefda1=();
                                    @ukefda1=();
                                    @bsda1=();
                                    @pmda1=();
                                    @ptmda1=();
                                    @pfda1=();
                                    @ukbfda1=();
                                    @Domain1=();
                                    @Choice1=();
                                    @Type1=();
                                    @name1=();
                                    @Range1=();
                                    @Rangenum1=();

                                    @Position_start1=();
                                    @Status_start1=();
                                    @Position_end1=();
                                    @Status_end1 =();
                                    @isLinked1=();
                                    @Other_data1=();
                                    @Detection_Method1=();

                                }
                                @sscat1=();
                            }
                            @cat1=();
                        }
                        @Feature1=();
                    }
                }
            }
        }
   }    

   if (my @infos = $Interaction->HPRD_xref)
    { 
	my @hprd=();
	my @www=();
	foreach my $biom (@infos)
	{
	    my $hprd=$biom->right;
	    push (@hprd,$hprd);
	}	
	my $ic=0;
	for ($ic=0;$ic<=$#hprd;$ic++)
	{
	    $www[$ic] = "<a href=\"http://www.hprd.org/interactions?hprd_id=".$hprd[$ic]."&amp;isoform_id=".$hprd[$ic]."_1&amp;isoform_name=Isoform_1\" target=\"_blank\">Link to HPRD interaction data</a>";
	}

	print table(
		    TR({-align=>'left'},
		       th('HPRD cross-reference: <a href="../../Tutorial/#HPRDexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,map{ObjectLink($_,$_->BioMolecule)}(@infos))))),
		       td(blockquote(address(join(br,(@www))))),
		       )
		    )
	}
   if (my @infos = $Interaction->DIP_xref)
    { 
	my @www=();
	my $ic=0;
	for ($ic=0;$ic<=$#infos;$ic++)
	{
	    $www[$ic] = "<a href=\"http://dip.doe-mbi.ucla.edu/dip/DIPview.cgi?IK=".$infos[$ic]."\" target=\"_blank\">Link to DIP interaction data</a>"; 
	}
	
	print table(
		    TR({-align=>'left'},
		       th('DIP cross-reference: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,(@infos))))),
		       td(blockquote(address(join(br,(@www))))),
		       )
		    )
	}
   if (my @infos = $Interaction->MINT_xref)
    { 
	my @www=();
	my $ic=0;
	for ($ic=0;$ic<=$#infos;$ic++)
	{
	    $www[$ic] = "<a href=\"http://mint.bio.uniroma2.it/mint/search/inFrameInteraction.do?interactionAc=".$infos[$ic]."\" target=\"_blank\">Link to MINT interaction data</a>"; 
	}
	
	print table(
		    TR({-align=>'left'},
		       th('MINT cross-reference: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,(@infos))))),
		       td(blockquote(address(join(br,(@www))))),
		       )
		    )
	}
    if (my @infos = $Interaction->IntAct_xref)
	{ 
	my @www=();
	my $ic=0;
	for ($ic=0;$ic<=$#infos;$ic++)
	{
	    $www[$ic] = "<a href=\"http://www.ebi.ac.uk/intact/search/do/search?searchString=".$infos[$ic]."\" target=\"_blank\">Link to IntAct interaction data</a>"; 
	}
	
	print table(
		    TR({-align=>'left'},
		       th('IntAct cross-reference: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,(@infos))))),
		       td(blockquote(address(join(br,(@www))))),
		       )
		    )
	}
    if (my @infos = $Interaction->BioGrid_xref)
    {
        my @biogrid=();
        my @www=();
        foreach my $biom (@infos)
        {
            my $biogrid=$biom->right;
            push (@biogrid,$biogrid);
        }
        my $ic=0;
        for ($ic=0;$ic<=$#biogrid;$ic++)
        {
            $www[$ic] = "<a href=\"http://www.thebiogrid.org/SearchResults/summary/".$biogrid[$ic]."\" target=\"_blank\">Link to BioGRID interaction data</a>";
        }

        print table(
                    TR({-align=>'left'},
                       th('BioGrid cross-reference: <a href="../../Tutorial/#BioGRIDexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,map{ObjectLink($_,$_->BioMolecule)}(@infos))))),
                       td(blockquote(address(join(br,(@www))))),
                       )
                    )
        }
    
    if (my @infos = $Interaction->Interaction_Type)
    {
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Interaction type: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,(@list))))),
		       )
		    );
    	}	
    if (my @infos = $Interaction->Experiment_modification)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('Experiment modification: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,(@list))))),
                       )
                    );
        }
    if (my @infos = $Interaction->Binding_Site)
    { 
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Binding site(s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,(@list))))),
		       )
		    )
	}
    if (my $infos = $Interaction->Kd)
    { 
	my $list=$infos;
	if ($list ne "-")
	{	
		print table(
			    TR({-align=>'left'},
		       		th('Affinity (KD): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       		td(blockquote(address(join(br,$list)))),
		       		)
		    	)
		}
	}
    if (my $infos = $Interaction->Kinetics)
    { 
	my $list=$infos;
	if ($list ne "-")
	{
		print table(
			    TR({-align=>'left'},
			       th('Kinetics (ka, kd): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
			       td(blockquote(address(join(br,$list)))),
		    	  	 )
		    	)
		}		
	}

    if (my @infos = $Interaction->Comments)
    { 
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Complementary information: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,@list)))),
		       )
		    )
	}
    if (my @infos = $Interaction->Caution)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('Caution: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                       td(blockquote(address(join(br,@list)))),
                       )
                    )
        }

    if (my @infos = $Interaction->Figure)
    { 
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Figure(s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,@list)))),
		       )
		    )
	}
    if (my @infos = $Interaction->Table)
    { 
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Table(s): <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td(blockquote(address(join(br,@list)))),
		       )
		    )
	}
    if (my @infos = $Interaction->PMID)
    { 
	my $ic=0;
	my $i=0;
	my @www=();
	for ($ic=0;$ic<=$#infos;$ic++)
	{
	    $www[$i] = "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/".$infos[$i]."\" target=\"_blank\">Link to PubMed Abstract</a>";
	    $i++;
	}
	print table(
		    TR({-align=>'left'},
		       th('Bibliography: <a href="../../Tutorial/#ComExpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
		       td((blockquote(address(join(br,map { ObjectLink($_,$_->Biblio) } @infos))))),
		       #td((blockquote(address(join(br,map { ObjectLink($_,$_->Publication) } @infos))))),
		       td((blockquote(address(join(br,@www))))),
		       )
		    );
        my @title=();
        my @email=();
        my @first=();
        my @listaut=();

        my $jc=0;
        my $j=0;
        for ($jc=0;$jc<=$#infos;$jc++)
        {
            if ($infos[$j]->First_Author)
            {
                $first[$j] = $infos[$j]->First_Author." et al." ;
            }
            if ($infos[$j]->AuthorList)
            {
                my $tmp=$infos[$j]->AuthorList ;
                $tmp=~/^([^\,]+)\,?/;
                my $res=$1;
                if ($res)
                {
                    $listaut[$j]=$res." et al.";
                }
            }
            if ($infos[$j]->Contact_Email)
            {
                $email[$j] = $infos[$j]->Contact_Email;
            }
            if ($infos[$j]->Title)
            {
                $title[$j] = $infos[$j]->Title;
            }
            $j++;
        }
        if ((@first)&&(@title))
        {
            print table(
                        TR({-align=>'left'},
                           th('First author and title: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                           td((blockquote(address(join(br,@first))))),
                           td((blockquote(address(join(br,@title))))),
                           )
                        );
        }
        elsif ((@title)&&(@listaut))
        {
            print table(
                        TR({-align=>'left'},
                           th('First author and title: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                           td((blockquote(address(join(br,@listaut))))),
                           td((blockquote(address(join(br,@title))))),
                           )
                        );
        }
        elsif (@first)
        {
            print table(
                        TR({-align=>'left'},
                           th('First author: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                           td((blockquote(address(join(br,@first))))),
                           )
                        );
        }
        elsif (@title)
        {
            print table(
                        TR({-align=>'left'},
                           th('Title: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                           td((blockquote(address(join(br,@title))))),
                           )
                        );
        }
        if (@email)
        {
            print table(
                        TR({-align=>'left'},
                           th('Contact email: <a href="../../Tutorial/#MatrixDBexpData"><span style="background-color:#6666ff;color: #ffffff;">?</span></a>'),
                           td((blockquote(address(join(br,@email))))),
                           )
                        );
        }
    } 
}
sub print_report5 {
    my $UniGene = shift;
    print h2($UniGene);
    if (my @infos = $UniGene->Title)
    { 
	$UniGene=~/(\w+).(\d+)/;
	my $www="<a href=\"http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=".$1."&amp;CID=".$2."&amp;log$=TitleAreaLink\" target=\"_blank\">Link to UniGene</a>";
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('UniGene Title: '),
		       td(blockquote(address(join(br,@list)))),
		       td(blockquote(address(join(br,$www)))),
		       )
		    );
    }
    if (my @infos = $UniGene->BioMolecule)
    { 
	my @list=@infos;
	my @list_name=();
	my $i=0;
	foreach my $biom (@infos)
	{
	    if ($biom->Common_Name)
	    {
		$list_name[$i] = $biom->Common_Name;
	    }
	    else 
	    {
		$list_name[$i]="-";
	    }
	    $i++;
	}
	print table(
		    TR({-align=>'left'},
		       th({-style=>"background-color:#c2f2c2;"},'Related to biomolecule(s): '),
		       td(blockquote(address(join(br,map{ObjectLink($_,$_->BioMolecule) }@list)))),
		       td(blockquote(address(join(br,@list_name)))),
		       )
		    );
    }
    if (my @infos = $UniGene->Gene)
    { 
	my @list=@infos;
	print table(
		    TR({-align=>'left'},
		       th('Gene: '),
		       td(blockquote(address(join(br,@list)))),
		       )
		    );
    }
    if (my @infos = $UniGene->Chromosome)
    {
        my @list=@infos;
        print table(
                    TR({-align=>'left'},
                       th('Chromosome: '),
                       td(blockquote(address(join(br,@list)))),
                       )
                    );
    }

    if (my @infos = $UniGene->Express)
    { 
	my @list=();
       	foreach my $list(@infos)
	{
	    $list=ucfirst($list);
	    $list=~s/\_/ /g;
	    push(@list,$list);
	}
	print table(
		    TR({-align=>'left'},
		       th('Express: '),
		       td(blockquote(address(join(", ",@list)))),
		       )
		    );
    }
    if (my @infos = $UniGene->Data)
    { 
	my $HS=$infos[0];
	my @dataHS=$HS->col;
	

	my @dataHS2=();
	my @dataHS2_show=();
	my @dataHS3_show=();
	
	foreach my $data (@dataHS)
	{
	    my @temp=$data->col;
	    foreach my $temp (@temp)
	    {

		if (! $data)
		{
		    $data=0;
		}
		my $temp2=$data." / ".$temp; 

		my $temp3=$data*1000000/$temp;

		push(@dataHS2_show,$temp2);
		push(@dataHS3_show,$temp3);
		push(@dataHS2,$temp);
	    }
	}

	my @dataHS3=();

	foreach my $data (@dataHS2)
	{
	    my $temp=$data->right;
	    $temp=~s/\_/ /g;
	    $temp=ucfirst($temp);
	    push(@dataHS3,$temp);
	}

	my %tritabHS;
	my $iHS=0;
	
	my @dataHS3_show_trie;
	my @dataHS3_trie;
	my @dataHS2_show_trie;
	
	push (@dataHS2_show_trie, "<b>Gene EST / Total EST in pool</b>");
	push (@dataHS3_show_trie, "<b>Transcripts per million (TPM)</b>");
	push (@dataHS3_trie,"<b>Pool name</b>");

	foreach my $tri (@dataHS3_show)
	{
	    if (!$tritabHS{$tri})
	    {
		$tritabHS{$tri}=$dataHS3[$iHS].";".$dataHS2_show[$iHS]."|";
	    }
	    else
	    {
		$tritabHS{$tri}.=$dataHS3[$iHS].";".$dataHS2_show[$iHS]."|";
	    }
	    $iHS++;
	}

	my @ordreHS = sort {$a <=> $b} keys (%tritabHS);

	foreach (@ordreHS)
	{
	    my $corres=$tritabHS{$_};   
	    my $t=$_;
	    while ($corres=~s/([\w\s]+);([\d\/\s]+)\|//)
	    {
		my $pool=$1;
		my $taux=$2;
		if ($t != 0)
		{
		    my $num="";
		    if ($t=~/\d/)
		    { 
			$num=int($t);
		    }
		    else
		    {
			$num=$t;
		    }
		    push(@dataHS3_show_trie,$num);
		    push(@dataHS3_trie,$pool);
		    push(@dataHS2_show_trie,$taux);
		}
	    }
	}		
	
	print table(
		    TR({-align=>'left'},
		       th('Health State: '),
		       td(blockquote(address(join(br,@dataHS3_trie)))),
		       td(blockquote(address(join(br,@dataHS3_show_trie)))),
		       td(blockquote(address(join(br,@dataHS2_show_trie)))),
		       )
		    );

	my $DS=$infos[1];
	my @dataDS=$DS->col;
	

	my @dataDS2=();
	my @dataDS2_show=();

	my @dataDS3_show=();

	foreach my $data (@dataDS)
	{
	    my @temp=$data->col;
	    foreach my $temp (@temp)
	    {

		if (! $data)
		{
		    $data=0;
		}
		my $temp2=$data." / ".$temp; 

		my $temp3=$data*1000000/$temp;

		push(@dataDS2_show,$temp2);
		push(@dataDS3_show,$temp3);
		push(@dataDS2,$temp);
	    }
	}

	my @dataDS3=();

	foreach my $data (@dataDS2)
	{
	    my $temp=$data->right;
	    $temp=~s/\_/ /g;
	    $temp=ucfirst($temp);
	    push(@dataDS3,$temp);
	}

	my %tritabDS;
	my $iDS=0;
	
	my @dataDS3_show_trie;
	my @dataDS3_trie;
	my @dataDS2_show_trie;
	
	push (@dataDS2_show_trie, "<b>Gene EST / Total EST in pool</b>");
	push (@dataDS3_show_trie, "<b>Transcripts per million (TPM)</b>");
	push (@dataDS3_trie,"<b>Pool name</b>");


	foreach my $tri (@dataDS3_show)
	{
	    if (!$tritabDS{$tri})
	    {
		$tritabDS{$tri}=$dataDS3[$iDS].";".$dataDS2_show[$iDS]."|";
	    }
	    else
	    {
		$tritabDS{$tri}.=$dataDS3[$iDS].";".$dataDS2_show[$iDS]."|";
	    }
	    $iDS++;
	}

	my @ordreDS = sort {$a <=> $b} keys (%tritabDS);

	foreach (@ordreDS)
	{
	    my $corres=$tritabDS{$_};   
	    my $t=$_;
	    while ($corres=~s/([\w\s]+);([\d\/\s]+)\|//)
	    {
		my $pool=$1;
		my $taux=$2;
		if ($t != 0)
		{
		    my $num="";
		    if ($t=~/\d/)
		    { 
			$num=int($t);
		    }
		    else
		    {
			$num=$t;
		    }
		    push(@dataDS3_show_trie,$num);
		    push(@dataDS3_trie,$pool);
		    push(@dataDS2_show_trie,$taux);
		}
	    }
	}		
		
	print table(
		    TR({-align=>'left'},
		       th('Developmental <br/>Stage: '),
		       td(blockquote(address(join(br,@dataDS3_trie)))),
		       td(blockquote(address(join(br,@dataDS3_show_trie)))),
		       td(blockquote(address(join(br,@dataDS2_show_trie)))),
		       )
		    );

	my $BS=$infos[2];
	my @dataBS=$BS->col;
	

	my @dataBS2=();
	my @dataBS2_show=();
	my @dataBS3_show=();

	foreach my $data (@dataBS)
	{
	    my @temp=$data->col;
	    foreach my $temp (@temp)
	    {

		if (! $data)
		{
		    $data=0;
		}
		my $temp2=$data." / ".$temp; 

		my $temp3=$data*1000000/$temp;

		push(@dataBS2_show,$temp2);
		push(@dataBS3_show,$temp3);
		push(@dataBS2,$temp);
	    }
	}

	my @dataBS3=();

	foreach my $data (@dataBS2)
	{
	    my $temp=$data->right;
	    $temp=~s/\_/ /g;
	    $temp=ucfirst($temp);
	    push(@dataBS3,$temp);
	}

	my %tritabBS;
	my $iBS=0;
	
	my @dataBS3_show_trie;
	my @dataBS3_trie;
	my @dataBS2_show_trie;
	
	push (@dataBS2_show_trie, "<b>Gene EST / Total EST in pool</b>");
	push (@dataBS3_show_trie, "<b>Transcripts per million (TPM)</b>");
	push (@dataBS3_trie,"<b>Pool name</b>");


	foreach my $tri (@dataBS3_show)
	{
	    if (!$tritabBS{$tri})
	    {
		$tritabBS{$tri}=$dataBS3[$iBS].";".$dataBS2_show[$iBS]."|";
	    }
	    else
	    {
		$tritabBS{$tri}.=$dataBS3[$iBS].";".$dataBS2_show[$iBS]."|";
	    }
	    $iBS++;
	}

	my @ordreBS = sort {$a <=> $b} keys (%tritabBS);

	foreach (@ordreBS)
	{
	    my $corres=$tritabBS{$_};   
	    my $t=$_;
	    while ($corres=~s/([\w\s]+);([\d\/\s]+)\|//)
	    {
		my $pool=$1;
		my $taux=$2;
		if ($t != 0)
		{
		    my $num="";
		    if ($t=~/\d/)
		    { 
			$num=int($t);
		    }
		    else
		    {
			$num=$t;
		    }
		    push(@dataBS3_show_trie,$num);
		    push(@dataBS3_trie,$pool);
		    push(@dataBS2_show_trie,$taux);
		}
	    }
	}		
		
	print table(
		    TR({-align=>'left'},
		       th('Body Sites: '),
		       td(blockquote(address(join(br,@dataBS3_trie)))),
		       td(blockquote(address(join(br,@dataBS3_show_trie)))),
		       td(blockquote(address(join(br,@dataBS2_show_trie)))),
		       )
		    );


    }
}
1;

