package customNetwork;

use Log::Log4perl qw(get_logger :levels);
use Data::Dumper;
=pod GL 130627
    reusing Emilie code "out of the box"
    just getting rid of the sif making    
=cut

my $logger = get_logger ("customNetwork");
$logger->level($ERROR);

sub query
{
    $logger->trace("Running query");
    my $p = common::arg_parser(@_);
    #(@_ != 8) && $logger->logdie ("Ace2Sif1 requires 8 args @_");
    my ($controlledVocR,$keywordsR,$disease,$tissueR,$seuil,$strict,$db);
    $db = $p->{ database };
    $controlledVocR = $p->{ localKeyWords };
    $keywordsR = $p->{ uniprotKeywords };
    $disease = $p->{ diseaseListString };
    $tissueR = $p->{ tissueList };
    $seuil = $p->{ tpmTreshold };
    $strict = $p->{ strictBool };
    
    my @controlledVoc = @$controlledVocR ;

    # if no terms defined, default to "full" (ie all human biomolecules)
    (@controlledVoc) || (push(@controlledVoc, "full")) ;

# $query: must produce a list of interaction objects   
# We will build on the acedb stack a keyset of BioMolecules;
# When done, we will simply pop this keyset, follow Interaction, and
# convert the resulting list of interactions to sif format.

    my $query = "query find BioMolecule ; " ;
    
    while (my $voc = pop(@controlledVoc))
    {
	if ($voc eq "cpt_PM") { $query .= "Personal_Membrane" ; }
	elsif ( $voc eq "cpt_ECM") { $query .= "Personal_ECM" ; }
	elsif( $voc eq "cpt_BS") { $query .= "Personal_Secreted" ; }
	elsif( $voc eq "full") { $query .= "Personal_Human" ; }
	else { $logger->logdie ("unknown term in controlledVoc: $voc. $!\n") ; }
	# add OR if needed
	(@controlledVoc) && ($query .= " OR ") ;
    }
    $query.="; Personal_Human";
    $logger->trace("attempting \"$query\"");
    $db->raw_query($query) ;
    $db->raw_query("spush") ;

    my @keywords = @$keywordsR ;
    if (@keywords)
    {
	# push empty keyset
	$db->raw_query("Clear") ;
	$db->raw_query("spush") ;
	while(my $kw = pop(@keywords))
	{
	    $query = "query find Keywrd \"$kw\" ; follow BioMolecule" ;
	    $logger->trace("attempting \"$query\"");
	    $db->raw_query($query) ;
	    $db->raw_query("sor") ;
	    $kw =~ s/\s/_/g;
            # ne sert a rien aucun kw concerne
	    #$query = "query find BioMolecule where Personal_Keyword=\"$kw\"";
	    #$db->raw_query($query) ;
	    #$db->raw_query("sor") ;
	    #a voir pour ensuite si on ne pt pas faire "map to KW" pour avoir GO
	    #$query = "query find GO \"GO:0016020\" ; follow BioMolecule" ;
	    #$db->raw_query($query) ;
	    #$db->raw_query("sor") ;
	}
	# finally pop (ie get all prots with the specified keywords)
	$db->raw_query("spop") ;
	# and AND with top of stack (from controlledVoc)
	$db->raw_query("sand") ;
    }

    my @disease;
    if ($disease)
    {
        while ($disease=~s/([^,]+),? ?//)
        {
            push (@disease,$1);
        }
    }
    if (@disease)
    {
        # push empty keyset
        $db->raw_query("Clear") ;
        $db->raw_query("spush") ;
        while(my $ds = pop(@disease))
        {
            $query = "query find OMIM \"$ds\" ; follow BioMolecule" ;
	    $logger->trace("running query " . $query);
            $db->raw_query($query) ;
            $db->raw_query("sor") ;
        }
        # finally pop (ie get all prots with the specified keywords)
        $db->raw_query("spop") ;
        # and AND with top of stack (from controlledVoc)
        $db->raw_query("sand") ;
    }

    # OK, pop the top of stack
    $db->raw_query("spop") ;

    # we want to fill a hash with the names of all selected biomolecules 
    # and their neighbours
    my %biomols = () ;
    
    $db->raw_query("query follow Association") ;
    # make sure it's a binary interaction (query taken from subclasses.wrm)
   
=pod 
   if ($subset)
    {
        $db->raw_query("query IsInteraction; $subset") ;
    }
    else
    {
        $db->raw_query("query IsInteraction") ;
    }
=cut
    $db->raw_query("query follow BioMolecule") ;
    $db->raw_query("spush") ;

    my @allBiomolecule = $db->fetch(-query=>"*") ;
    $logger->trace(" i have " . scalar(@allBiomolecule) . " biomolecule objects in store");

    my @tissues = @$tissueR ;
    if (@tissues)
    {
        # push empty keyset
        #$db->raw_query("Clear") ;
        #$db->raw_query("spush") ;
	foreach my $biomol (@allBiomolecule)
        {
            if ($biomol->UniGene)
            {
                my @unigene=$biomol->UniGene;
                #warn @unigene;

                foreach my $unigene (@unigene) ##pour si plusieurs
                {
                    ###donnees Body Sites
                    my @infos = $unigene->Data;

                    my $BS=$infos[2];

                    if ($BS)
                    {
                        my @dataBS=$BS->col;


                        my @dataBS2=();
                        my @dataBS3=();

                        foreach my $data (@dataBS)
                        {
                            my @temp=$data->col;
                            foreach my $temp (@temp)
                            {
                                if (! $data)
                                {
                                    $data=0;
                                }
                                ## calcul du TPM
                                my $temp3=int($data*1000000/$temp);

                                push(@dataBS3,$temp3);
                                push(@dataBS2,$temp);
                            }
                        }
                        my @dataBS4=();

                        foreach my $data (@dataBS2)
                        {
                            my $temp=$data->right;
                            push(@dataBS4,$temp);
                        }
                        my $i=0;
                        my %corres2;
                        foreach my $data (@dataBS4)
                        {
                            $corres2{$data}=$dataBS3[$i];
                            $i++;
                        }
                        foreach my $tiss (keys %corres2)
                        {
                            foreach my $tissue (@tissues)

                            {
                                if ($tiss eq $tissue)
                                {
                                    if (($corres2{$tiss} >$seuil)||($corres2{$tiss} == $seuil))
                                    {
					$logger->trace("Keeping $biomol");
                                        #warn "ok,seuil2 depasse $corres2{$tiss} pour $seuil ($tissue)";
                                        #warn "$biomol";
                                        $biomols{"$biomol"} = 1 ;
                                    }
                                    else
                                    {
                                        #warn "non ,seuil2 inferieur $corres2{$tiss} pour $seuil ($tissue)";
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        ##ref pas bonne
                        $logger->warn ("ref incorrecte unigene $unigene sans BS");
                    }
                }
            }
            else {}## garde ou pas ds le sous reseau celles qui n'on pas d'unigene?
            }
        # finally pop (ie get all prots with the specified keywords)
        #$db->raw_query("spop") ;
        # and AND with top of stack (from controlledVoc)
        #$db->raw_query("sand") ;
    }
    else
    {
        foreach my $biomol (@allBiomolecule)
        {
            $biomols{"$biomol"} = 1 ;
            #warn "here there is a molecule $biomol";
        }
    }

    # and finish by "following association"
    $db->raw_query("spop") ;    
    $query = "query follow Association";  
    $db->raw_query($query) ;

=pod
    if (($strict)&&($subset))
    {
        $query = "query IsInteraction; $subset" ; 
    }
    else 
    {
        $query = "query IsInteraction" ;
    }

    $db->raw_query($query) ;
=cut
    $db->raw_query("spush") ;

    my @allAssociations = $db->fetch(-query=>"*") ;

   
    my @interactorListTmp;
    my $assocRef = {};
    my $cnt = 0;
    foreach my $aAceObject (@allAssociations) {
	$logger->trace($aAceObject->asString);	
	my $partners = $aAceObject->get('biomolecule');
	my @col = $partners->col();
	foreach my $elem (@col) {
	    push @interactorListTmp, $elem->name;
	    if (exists($assocRef->{ $elem->name })) {
		push @{$assocRef->{ $elem->name }}, $cnt;
	    } else {
		$assocRef->{ $elem->name } = [$cnt];
	    }
	}
	$cnt++;
    }
    
    my $interactorList = common::uniqList(\@interactorListTmp);
  
    my @iData;
    foreach my $interactor (@{$interactorList}) {
	my $container = {
	    name => $interactor,
	    ref => $assocRef->{ $interactor }
	};
	push @iData, $container;
    }
    
    my $dataContainer = {association => \@allAssociations, interactor => \@iData};
    

    $logger->trace("Custom Network dataContainer :\n" . Dumper($dataContainer));
    return $dataContainer;
}



