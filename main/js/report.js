/*
 traitement des différent report 
 affichage résultat +  navigation top
 initialisation:
 doit être appelé avec un objet littéral options => {reportDiv : targetDiv, url : "path"  , json : [json brut]}
 var obj = initMyReport (options)
 obj.start();
  ---------------------------------------------------------------------------------------
  initialisation
 */
function initMyReport (options){
	
	if (! options.hasOwnProperty('reportDiv')) {
		alert("Cant start component w/out targetDiv");
		return;
	}
	
	var elem = $(options.reportDiv)[0]; 
	
	if (!elem) {
		alert("Cant get targetDiv element in document");
		return;
	}
	if(!options.hasOwnProperty('url')){
		if(!options.hasOwnProperty('jsonData')){
			alert('miss data or url to generate result');
			return;
		}
	}
	var defaultAddCartCallback = function(){
		console.dir('default add click');
	}
	var defaultDelCartCallback = function(){
		console.dir('default del click');
	}
	var defaultCallbackPdbView = function(i){
		$(this.targetDomElem).find('ul.pdb').hide();
		widget.loadWithPdbId($(i).attr("id"));
	}
/*fin intialisation
 * -----------------------------------------------------------------
 */
	return {
		targetDomElem : elem, //permet de selectionner la targetdiv
		barClass : 'reportDiv', // la class de la div cible
		barSel : '.reportDiv', // le selecteur
		callbackPdbView : options.callbackPdbView || defaultCallbackPdbView,
		url : options.url ? options.url : false,
		jsonData : options.jsonData ? options.jsonData : false,
		addCartCallback : options.addCartCallback || defaultAddCartCallback,
		delCartCallback : options.delCartCallback || defaultDelCartCallback,
		tailleHeader : 0 ,
		nbDiv : -1,
		navBarTypeIcons : {
			"experiment"  : '<i class="fa fa-flask pull-left icon-white"></i>',
			"association" : '<i class="fa fa-link pull-left icon-white"></i>',
			"publication" : '<i class="fa fa-book pull-left icon-white"></i>',
			"biomolecule" : '<i class="fa fa-spinner pull-left icon-white"></i>'
			},
		cartButton: {
			defaultAdd :'<div class="btn-group"><a class="btn btn-success btn-mini" ><i class="fa fa-pencil"></i></a><a class="btn btn-default btn-mini">Add to cart</a></div>',
			biomAdd : '<div class="btn-group"><a class="btn btn-success btn-mini" ><i class="fa fa-spinner"></i></a><a class="btn btn-default btn-mini">Add to cart</a></div>',
			publiAdd : '<div class="btn-group"><a class="btn btn-success btn-mini" ><i class="fa fa-book"></i></a><a class="btn btn-default btn-mini">Add to cart</a></div>',
			},
/*
 * ---------------------------------------------------------------------------------
 * on load event
 */
		start : function (){// test du type de donnée et dessine le composant
			var self = this;
			$(self.targetDomElem).addClass(self.barclass);
			// test a faire
			 if (self.jsonData){
			 	self._draw(self.jsonData)
			 }if (self.url){
			 	self._load(self.url)
			 }
		},
		_load : function () { // downlaod json table content from url 
			var self = this;
			var url = "";		
			var jqxhr = $.ajax({
					dataType : "json",	
					url: "tableData.json",// url a passer en argument
				})
  				.done(function(data, testSig, jqxhr) {
  
    				self.jsonData = data;
    				self._draw();
  				})
  		},
  		_draw : function(){//dessine les composant en fonction du type de data
  			var self = this;
  			var data = data;
  			console.log('v data for this page v')
  			console.dir(self.jsonData)
  			var navBar = '<nav class="navbar header navbar-fixed-top" role="navigation"><div class=" header"><span id ="topLogo">' + self.navBarTypeIcons[self.jsonData.type] + '</span></div></nav>'
  			$(self.targetDomElem).append(navBar);
  			var header = $(self.targetDomElem).find("nav.header>div");
  			header.append('<div id="testCart" class = "cart"></div>');
  			if (self.jsonData.type == 'biomolecule'){
  				self._infoOrganisatorBiomol();
  				self._barchartOrganisator();
				self._interactionOrganisator();
				self._uniprotKewrdOrganisator();
				self._goOrganisator();
				if(self.jsonData.pdb){
					var pdbList = []
					for (var i=0; i < self.jsonData.pdb.data.length; i++) {
					  pdbList.push(self.jsonData.pdb.data[i].id);
					};
					var nodeTest = {
						pdb : pdbList,
    				};    
    				widget = initElementInfo({
				    	 width : '100%', height : '100%',
				     	 target : '#molView',
				     	 callback : {
				     		computeCss : function(jqueryNode){
				     			var top = $(jqueryNode).position().top ;
								var left = $(jqueryNode).position().left ;
								return {main : {top : top + 'px', left : left + 'px', width : this.width, 'max-height' : this.height} ,
										upmark :  { display : 'none'}
								};
				     		}
				     	}				  
				 	});

    				widget.draw(nodeTest);
				}
  			}
  			if (self.jsonData.type == 'experiment'){
  				self._infoOrganisatorXp();
  				self._partnerOrganisator();
  			}
  			if (self.jsonData.type == 'association'){
  				self._associationOrganisator();
  			}
  			if (self.jsonData.type == 'publication'){
  				self._publicationOrganisator();
  			}
  			
  			$(self.targetDomElem).find('a.pdb').click(function(){$( $(self.targetDomElem).find('ul.pdb') ).toggle()})
  			$(self.targetDomElem).find('div.pdb').click(function(event){
    			event.stopPropagation();
				});
			$('html').click(function() {
				$(self.targetDomElem).find('ul.pdb').hide()
				});
			$(self.targetDomElem).find('i.pdbView').click(function(event){self.callbackPdbView(this)});
			$(self.targetDomElem).find("span.addCart.biom").click(function(){self.addCartCallback({type : "biomolecule" , value : $( this ).attr("name")})});
			$(self.targetDomElem).find("span.addCart.publi").click(function(){self.addCartCallback({type : "publication" , value : $( this ).attr("name")})});
			//$(self.targetDomElem).find("div.featureDrop").click(function(){self._showFeature(this)});
  			$(self.targetDomElem).find("nav div.navigueBar a").click(function() {
  				var contentCible = $(this).attr("cible");
    			$('html, body').animate({
      			 scrollTop: $(self.targetDomElem).find(contentCible).offset().top-20
    			}, 750);
			});
			//$(self.targetDomElem).find("i.pdbView").click(function() {
			//	console.log('click')
			//	console.log($(this).attr("id"))
				
		//	})
			$(self.targetDomElem).find("span.cartBio").click(function(){self.addCartCallback({type : "biomolecule" , value : self.jsonData.name})});
  		},
/*fin event onload
 * ___________________________________________________________________________________________________________________________________
 * bandeau info biomol
 */
  		_infoOrganisatorBiomol : function(){//traite les données du bandeau info
  			var self = this;
  			self.tailleHeader++
  			$(self.targetDomElem).append("<div class='content infoBio' ></div>");
  			var infoDiv =$(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar reportTarget'><a cible = 'div.infoBio'>" + self.jsonData.name + " Biomolecule</a></div>";
  			if(self.jsonData.interactions[0]){
  				var titre = "<div class ='row-fluid '><div class = 'span7 postitGeneral'></div><div class = 'span5 tableInteract'></div></div>";
  				infoDiv.append(titre);
  				
  			}else{
  				var titre = "<div id = 'info'></div><div class ='row-fluid postitGeneral'></div>";
  				infoDiv.append(titre);
  			}
  			infoDiv = $(self.targetDomElem).find("div.postitGeneral");
  			var divSpan = "<div class ='row-fluid inPostit'></div>";
  			
  			
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			/*remplissage du bandeau
  			 */
  			var nameDivHtml = self._nameGenerateDivHtml();
  			if(nameDivHtml){infoDiv.append(nameDivHtml);}
  			
  			infoDiv.append(divSpan);
  			
  			var ftDivHtml = self._ftGenerateDivHtml();
  			if(ftDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(ftDivHtml);}
  			
  			var domainDivHtml = self._domainGenerateDivHtml();
  			if(domainDivHtml){infoDiv.find('div.row-fluid.inPostit:last-child').append(domainDivHtml);}
  			
  			var pdbDivHtml = self._pdbGenerateDivHtml();
  			if(pdbDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(pdbDivHtml);}
  			
  			var complexDivHtml = self._complexGenerateDivHtml();
  			if(complexDivHtml){infoDiv.find('div.row-fluid.inPostit:last-child').append(complexDivHtml);}
  			
  			var bioProssDivHtml = self._bioProssGenerateDivHtml();
  			if(bioProssDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(bioProssDivHtml);}

  			var externalRefDivHtml = self._externalRefGenerateDivHtml();
  			if(externalRefDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(externalRefDivHtml);}

  		},
  		/*méthode de génération des div
  		 */
  		_pdbGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.pdb){return false;}
  			self.nbDiv++
  			self._newRow(barchart);
  			var content ="<div class ='divTitre'>Structure</div><div class = 'pdb postitContent'>";
  			content += self._pdbList() + "<div id = 'molView' ></div></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6 " + classSpan + "'>" + content + "</div>" ;
  			return divString;
  		},
  		_domainGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.pfam && !self.jsonData.interpro){return false;}
  			self.nbDiv++
  			self._newRow(barchart);
  			var content = "<div class ='divTitre'>Domain annotation</div><div class = 'domainAnnot postitContent'><dl>";
  			content += self._domainAnnot() + "</dl></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6 " + classSpan + "'>" + content + "</div>" ;
  			return divString;
  		},
  		_complexGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.stoichiometry && !self.jsonData.relationship  && !self.jsonData.moreInfo){return false;}
  			if(!self.jsonData.relationship.In_multimer[0] && !self.jsonData.relationship.Component[0]){return false;}
  			self.nbDiv++
  			self._newRow(barchart);
  			var content ="<div class = 'divTitre'> Complex information</div><div class = 'infoComplex postitContent'><dl>";
  			content += self._moreInfo() + self._multmer() +self._stoichiometrie() +  self._component() + "</dl></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6 " + classSpan + "'>" + content + "</div>" ;
  			return divString;
  		},
  		_bioProssGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.relationship){return false;}
  			if(!self.jsonData.relationship.ContainsFragment[0] && !self.jsonData.relationship.Belongs_to[0] && !self.jsonData.relationship.Bound_Coval_to[0]){return false;}
  			self.nbDiv++
  			self._newRow(barchart)
  			var content ="<div class = 'divTitre'> Biological processings</div><div class = 'Biopross postitContent'><dl>";
  			content += self._process() + self._belongTo() + self._covalent() + "</dl></div>";
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6 " + classSpan + "'>" + content + "</div>" ;
  			return divString;
  		},
  		_externalRefGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.xref && !self._nameAccess()){return false;}
  			self.nbDiv++
  			var mapper = {
				"Molecule_Processing" : {url : "http://www.uniprot.org/?query=", term : "Uniprot fragment"},  				
  				"CheBI_identifier" : {url : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=", term : "CheBI"},
  				"KEGG_Compound" : {url : "http://www.genome.jp/dbget-bin/www_bget?cpd:", term : "KEGG"},
  				"EBI_xref" : {url : "http://www.ebi.ac.uk/intact/interaction/EBI-2550721", term : "EBI"},
  				"LipidMaps": {url : "http://www.lipidmaps.org/data/LMSDRecord.php?LMID=", term : "LipidMaps"},
  			}
  			
  			self._newRow(barchart);
  			var content ="<div class ='divTitre'>External reference <i class='fa fa-external-link ' style = 'margin-top 5px'></i></div><div class = 'divers postitContent'><dl>";
  			if(self._nameAccess()){content += "<dt class ='hReport'>Uniprot reference:</dt><dd><a target = '_blank' href = 'http://www.uniprot.org/uniprot/" + self.jsonData.name + "'>" + self.jsonData.name + "</a></dd>";}
  			if(self.jsonData.xref){
  				for (var i=0; i < self.jsonData.xref.length; i++) {
			 		$.each(self.jsonData.xref[i], function(name,id){
			 			content += "<dt class ='hReport'>" + mapper[name].term +":</dt><dd><a target = '_blank' href = '" + mapper[name].url + id + "'>" + id +"</a></dd>"
			 		});
				};
			}
			content += "</dl></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6 " + classSpan + "'>" + content + "</div>" ;
  			return divString;
  		},
  		_nameGenerateDivHtml : function(barchart){
  			var self = this;
			var content = "<div class ='divTitre'>General informations</div><div class = 'name postitContent'><span class = 'cartBio'>" + self.cartButton.biomAdd + "</span><dl>";
			content += self._names() + self._biofunc() + self._commentsName() +  "</dl></div>"
  			var divString ="<div class = 'row-fluid'><div class = 'span12 general'>" + content + "</div></div>" ;
  			return divString;
  		},
  		_ftGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.gene && !self.jsonData.molecularWeight && !self.jsonData.specie){return false;}
  			self.nbDiv++
  			self._newRow(barchart);
  			var content = "<div class ='divTitre'>Divers</div><div class = 'divers postitContent'><dl>";
  			content += self._gene() + self._specie() + self._molWeight() + self._aaNumber() + self._location() + "</dl></div>";
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6 " + classSpan + "'>" + content + "</div>" ;
  			return divString;
  		},
  		/*méthode associer au remplissage de chaque div
  		 */
  		_gene : function(){
			var self = this;
			if(!self.jsonData.gene){return"" }
			var geneString = "<dt class ='hReport'>Gene:</dt><dd> " + self.jsonData.gene.GeneName	;
			if( self.jsonData.gene.Synonym ){
				geneString += ", " + self.jsonData.gene.Synonym;	
			}
			if ( self.jsonData.gene.ORF_Name){
				geneString = geneString + "(ORF: " + self.jsonData.gene.ORF_Name;
				if(self.jsonData.gene.OrderedLocusName){
					geneString = geneString + ", Locus: " + OrderedLocusName +")";
				}
			}else{
				if(self.jsonData.gene.OrderedLocusName){
					geneString = geneString + "(Locus: " + OrderedLocusName +")";
				}
			}
			geneString = geneString + '</dd>'
			return geneString;
		},
		_specie : function(){
			var self = this;
			if(!self.jsonData.specie){return "";}
			var nom =  self.jsonData.specie.names[0];
			for (var i = 1; i <  self.jsonData.specie.names.length; i++) {
			   nom += ', ' + self.jsonData.specie.names[i];
			};
			var specieString ="<dt class ='hReport'>Specie:</dt><dd> <a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=" + self.jsonData.specie.value + "'>" + nom + " <i class='fa fa-external-link'></i></a></dd>";
			return specieString;
		},
		_domainAnnot : function(){
			
			var self = this;
			var domainString = ""
			if(self.jsonData.pfam){
				domainString +='<dt><a href="http://pfam.sanger.ac.uk/" target = "_blank"><img src="../../img/pfamLogo.png" alt="pfamLogo" style="border:none;width:40px;" /></a></dt><dd><a target = "_blank" href = "http://pfam.sanger.ac.uk/family/' + self.jsonData.pfam.data[0].id + '">' + self.jsonData.pfam.data[0].Desc + '</a>' ;
				for (var i = 1; i < self.jsonData.pfam.data.length; i++) {
			  		domainString += ', <a target = "_blank" href = "http://pfam.sanger.ac.uk/family/' + self.jsonData.pfam.data[i].id + '">' + self.jsonData.pfam.data[i].Desc + '</a>';
				};
				domainString += '</dd>';
			}if(self.jsonData.interpro){
				domainString +='<dt><a href="https://www.ebi.ac.uk/interpro/" target = "_blank"><img src="../../img/logoInterpro.png" alt="interproLogo" style="border:none;height:20px;margin-top:4px;" /></a></dt><dd><a target = "_blank" href = "https://www.ebi.ac.uk/interpro/entry/' + self.jsonData.interpro.data[0].id + '">' + self.jsonData.interpro.data[0].EntryName + '</a>'
				for (var i = 1; i < self.jsonData.interpro.data.length; i++) {
			  		domainString += ', <a target = "_blank" href = "https://www.ebi.ac.uk/interpro/entry/' + self.jsonData.interpro.data[i].id + '">' + self.jsonData.interpro.data[i].EntryName + '</a>';
				};
			
			}
			domainString += '</dd>';
			return domainString;
		},
		_pdbList : function(){
			var self = this;
			if(!self.jsonData.pdb){return '';}
			var pdbString = '<div class = "pdb"><b>Pdb (<i class="fa fa-exclamation-triangle"></i> module ): ' + 
				self.jsonData.pdb.data.length + ' structures <a class ="pdb" data-toggle="dropdown ">show <i class ="fa fa-chevron-down"></i></a><ul class = "dropdown-menu pdb">'+
				'<li style="overflow:hidden;"><div class="row-fluid"><div class = "span4"> <b>Id</div><div class="span4"><b>Method</div><div class = "span4">See </div></li>';
			for (var i=0; i < self.jsonData.pdb.data.length; i++) {
			  pdbString = pdbString + "<li><div class='row-fluid'><div class = 'span4'> " + self.jsonData.pdb.data[i].id +"</div><div class='span4'>" + self.jsonData.pdb.data[i].determinationMethod + "</div><i class='fa fa-eye pdbView' id ='" + self.jsonData.pdb.data[i].id + "'></i></li>"
			};
			pdbString = pdbString + "</ul></div>";
			return pdbString ;
		},
  		_names : function(){//return les différents noms de maniére lisible
  			var self = this;
  			if(!self.jsonData.common){return ""}
  			var lineNames = "<dt class ='hReport'>Names:</dt><dd>";
  			for (var i = 0; i < self.jsonData.common.anyNames.length; i++) {
				lineNames += self.jsonData.common.anyNames[i] + ", "
			  
			};
			lineNames = lineNames.substring(0,lineNames.length - 2);
			lineNames += "</dd>";
			return lineNames;
  		},
  		_molWeight : function (){// retourne le poid moléculaire de maniére lisible
  			var self = this ;
  			if(!self.jsonData.molecularWeight){return ""}
  			var lineMol = "<dt class ='hReport'>Molecular Weight:</dt><dd> " + self.jsonData.molecularWeight + " Da</dd>"
  			return lineMol;
  		},
  		_biofunc : function(){
  			var self = this;
  			if(!self.jsonData.biofunc){return "";}
  			return "<dt class ='hReport'>Biological function:</dt><dd> " + self.jsonData.biofunc + "</dd>";
  		},
  		_commentsName : function(){
  			var self = this;
  			if(!self.jsonData.comments){return "";}
  			var line = "<dt class ='hReport'>Comments:</dt><dd>";
  			for (var i=0; i < self.jsonData.comments.data.length; i++) {
			 	line +=  self.jsonData.comments.data[i] + ", ";
			};
			line = line.substring(0,line.length - 2);
			line += '</dd>'
  			return line;
  		},
  		_moreInfo : function(){
  			var self = this;
  			if(!self.jsonData.moreInfo){return "";}
  			return "<dt class ='hReport'>Composition:</dt><dd> " + self.jsonData.moreInfo + "</dd>";
  		},
  		_aaNumber : function(){
  			var self = this;
  			if(!self.jsonData.aaNumber){return "";}
  			return "<dt class ='hReport'>Number of residue:</dt><dd> " + self.jsonData.aaNumber + "</dd>";
  		},
  		_stoichiometrie : function(){
  			var self = this;
  			if(!self.jsonData.stoichiometry){return "";}
  			return "<dt class ='hReport'>Stoichiometry:</dt><dd> " + self.jsonData.stoichiometry + "</dd>";
  		},
  		_multmer : function(){
  			var self = this;
  			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
  			if(!self.jsonData.relationship.In_multimer[0]){return "";}
  			var line = "<dt class ='hReport'>In multimer:</dt><dd>";
  			for (var i=0; i < self.jsonData.relationship.In_multimer.length; i++) {
			 	line += "<a target ='_blank' href = '" + rootUrl + self.jsonData.relationship.In_multimer[i] + "'>" + self.jsonData.relationship.In_multimer[i] + "</a>, ";
			  };
			  line = line.substring(0,line.length - 2);
			  line += '</dd>'
  			return line;
  		},
  		_component : function(){
  			var self = this;
  			if(!self.jsonData.relationship.Component[0]){return "";}
  			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
  			var line = "<dt class ='hReport'>Subunit ref:</dt><dd>";
  			for (var i=0; i < self.jsonData.relationship.Component.length; i++) {
			 	line += "<a target ='_blank' href = '" + rootUrl +self.jsonData.relationship.Component[i] + "'>" + self.jsonData.relationship.Component[i] + "</a>, ";
			  };
			  line = line.substring(0,line.length - 2);
			  line += '</dd>'
			  		
  			  return line;
  		},
  		_stoichiometrie : function(){
  			var self = this;
  			if(!self.jsonData.stoichiometry){return "";}
  			return "<dt class ='hReport'>Stoichiometry:</dt><dd> " + self.jsonData.stoichiometry + "</dd>";
  		},
  		_location : function(){
  			var self = this;
  			if(!self.jsonData.location){return "";}
  			if(!self.jsonData.location.compartiment){return "";}
  			var line = "<dt class ='hReport'>Cellular location:</dt><dd>";
  			for (var i=0; i < self.jsonData.location.compartiment.length; i++) {
			 	line +=  self.jsonData.location.compartiment[i] + ", ";
			};
			line = line.substring(0,line.length - 2);
			line += '</dd>'
  			return line;
  		},
  		_process : function(){
  			var self = this;
  			if(!self.jsonData.relationship){return "";}
  			if(!self.jsonData.relationship.ContainsFragment[0]){return "";}
  			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
  			var line = "<dt class ='hReport'>Cleaved in:</dt><dd>";
  			for (var i=0; i < self.jsonData.relationship.ContainsFragment.length; i++) {
			 	line += "<a target ='_blank' href = '" + rootUrl + self.jsonData.relationship.ContainsFragment[i] + "'>" + self.jsonData.relationship.ContainsFragment[i] + "</a>, ";
			};
			line = line.substring(0,line.length - 2);
			line += '</dd>'
  			return line;
  		},
  		
  		_belongTo : function(){
  			var self = this;
  			if(!self.jsonData.relationship){return "";}
  			if(!self.jsonData.relationship.Belongs_to[0]){return "";}
  			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
  			var line = "<dt class ='hReport'>Precurssor of:</dt><dd>";
  			for (var i=0; i < self.jsonData.relationship.Belongs_to.length; i++) {
			 	line += "<a target ='_blank' href = '" + rootUrl + self.jsonData.relationship.Belongs_to[i] + "'>" + self.jsonData.relationship.Belongs_to[i] + "</a>, ";
			};
			line = line.substring(0,line.length - 2);
			line += '</dd>'
  			return line;
  		},
  		_covalent : function(){
  			var self = this;
  			if(!self.jsonData.relationship){return "";}
  			if(!self.jsonData.relationship.Bound_Coval_to[0]){return "";}
  			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
  			var line = "<dt class ='hReport'>Can be found bound covalently to:</dt><dd>";
  			for (var i=0; i < self.jsonData.relationship.Bound_Coval_to.length; i++) {
			 	line += "<a target ='_blank' href = '" + rootUrl + self.jsonData.relationship.Bound_Coval_to[i] + "'>" + self.jsonData.relationship.Bound_Coval_to[i] + "</a>, ";
			};
			line = line.substring(0,line.length - 2);
			line += '</dd>'
  			return line;
  		},
  		_nameAccess : function(){
  			var self = this;
  			var regex1 = /[A-N,R-Z][0-9][A-Z][A-Z, 0-9][A-Z, 0-9][0-9]/;
			var regex2 = /[O,P,Q][0-9][A-Z, 0-9][A-Z, 0-9][A-Z, 0-9][0-9]/;
			if (regex1.test(self.jsonData.name) || regex2.test(self.jsonData.name)) {
  				return true; 
			} else {
 				return false;
			}
  		},
/*fin de bandeau info biomol
 * ___________________________________________________________________________________________________________________________________
 * bandeau info xp
 */
		_infoOrganisatorXp : function(){
			var self = this;
			self.tailleHeader++
			var navTitle;
			if (self.jsonData.partnerDetails.length == 1){
				navTitle ='<span class = "niceRed">' + self.jsonData.partnerDetails[0].name + '</span> Homodimer experiment';
			} else {
				navTitle = '<span class = "niceRed">' + self.jsonData.partnerDetails[0].name + '-' +
				self.jsonData.partnerDetails[1].name + ' </span>Heterodimer experiment';
			}
		
			$(self.targetDomElem).append("<div class='contentXp infoXp' ><div class='centralXp' ></div></div>");
  			var infoDiv =$(self.targetDomElem).find("div.contentXp:last div.centralXp");
  			
  			var ancre = "<div class = 'navigueBar reportTarget'><a cible = 'div.infoXp' >" + navTitle + "</a></div>";
  			//var titre = "<div id = 'infoXp'></div><h3> Information on " + self.jsonData.name + " experiment</h3>";
  			//titre = titre.replace(/__/,' & ')
  			//titre = titre.replace(/_/g, ' ');
  			var titre = "<h3> Informations on the experiment</h3>";
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			infoDiv.append(titre);
  			self._xpWithKinetic(infoDiv);

		},
		_xpWithKinetic : function (divCible){
			var self = this;
			var divRow = "<div class = 'infoXp'></div>";
			divCible.append(divRow);
			var listeForAllOrganiser = [];
			var listeSpeci = [];
			var lineFinal = '';
			var _clean = function(classCss){
			 	listeSpeci = listeSpeci.filter( function(val){return val != undefined} );
			 	if(listeSpeci.length > 1){
			 		listeSpeci.push(classCss)
			 		listeForAllOrganiser.push(listeSpeci)
			 	;}
				listeSpeci = []
			 }
			var coteInfo = divCible.find('div.infoXp');
			/*remplissage coté info
			 general*/
			//listeSpeci.push(self._interaction());
			/*experiment detail*/
			listeSpeci.push("<div class = 'divTitreGeneral divTitre'>References</div>");
			listeSpeci.push( '<dt class ="hReport">Identifier:</dt><dd> ' + self.jsonData.name + "</dd>");
			listeSpeci.push(self._database());
			listeSpeci.push(self._creationDate());
			listeSpeci.push(self._update());
			listeSpeci.push(self._assoLink());
			listeSpeci.push(self._xrefList());
			_clean("xpDetail");
			/*interaction Details*/
			listeSpeci.push("<div class = 'divTitreInteraction divTitre'>Interaction</div>");
			listeSpeci.push(self._interactDetectMethod());
			listeSpeci.push(self._interactionType());
			listeSpeci.push(self._positiveControl());
			listeSpeci.push(self._experimentModif());
			_clean("interactionDetail");
			/*comment*/
			listeSpeci.push("<div class = 'divTitreComment divTitre'>Comment</div>");
			listeSpeci.push(self._generalComment());
			listeSpeci.push(self._bindingSiteComment());
			listeSpeci.push(self._cautionComment());
			listeSpeci.push(self._confidence());
			listeSpeci.push(self._host());
			listeSpeci.push(self._compartment());
			listeSpeci.push(self._cellLine());
			_clean("commentDetail");
			/*associate publication*/
			listeSpeci.push("<div class = 'divTitrePubmed divTitre'>Information on publication </div><span class ='addCart publi' name = '" + self.jsonData.publication + "'>" + self.cartButton.publiAdd + "</span>");
			listeSpeci.push(self._publication());
			listeSpeci.push(self._imexId());
			listeSpeci.push(self._file());
			listeSpeci.push(self._table());
			listeSpeci.push(self._figure());
			_clean("publicationDetail");
			/*kinetic */
			if(self.jsonData.affinityKinetic){
				listeSpeci.push("<div class = 'divTitreKinetic divTitre'>Kinetic and Affinity</div>");
				listeSpeci.push(self._associationRate());
				listeSpeci.push(self._dissociation());
				listeSpeci.push(self._kd());
				_clean("kinetic");
			}	
			for (var i=0; i < listeForAllOrganiser.length; i++) {
				if(i%2 == 0){lineFinal += "<div class = 'row-fluid' style = 'margin-top: 20px;'><div class = 'span6 " +  listeForAllOrganiser[i][listeForAllOrganiser[i].length-1] + "'>";}
				if(i%2 == 1){lineFinal += "<div class = 'span6 " +  listeForAllOrganiser[i][listeForAllOrganiser[i].length-1] + "'>";}
				for (var j=0; j < listeForAllOrganiser[i].length - 1; j++) {
					if(j==1){ lineFinal += "<div class ='featureContent'><dl>"}
					lineFinal += listeForAllOrganiser[i][j] ;
				};
				lineFinal +=("</dl></div></div>")
				if(i%2 == 1){lineFinal += "</div>";}
			};
			if(listeForAllOrganiser.length%2 == 0){lineFinal += "</div>";}
			coteInfo.append(lineFinal)
		},
		/*methode info*/
		_interaction : function(){
			var self = this;
			if(!self.jsonData.association){return }
			var assoc = self.jsonData.association.split('__')
			var lineString = '<dt class ="hReport">Interaction between:</dt><dd> '
			var RootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
			for (var i=0; i < assoc.length; i++) {
			  lineString += "<a target = '_blank' href = '" + RootUrl + assoc[i] +"'>" + assoc[i] +"</a>&nbsp;&nbsp;and&nbsp;&nbsp;" 
			};
			lineString = lineString.substring(0, lineString.length - 27)
			 lineString += "</dd>";
			return lineString;
		},
		_generalComment : function(){
			var self = this;
			if(!self.jsonData.generalComment){return}
			return '<dt class ="hReport">General comment:</dt><dd> ' + self.jsonData.generalComment + "</dd>";
		},
		_bindingSiteComment : function(){
			var self = this;
			if(!self.jsonData.bindingSiteComment){return}
			return '<dt class ="hReport">Binding site comment:</dt><dd> ' + self.jsonData.bindingSiteComment + "</dd>";
		},
		_cautionComment : function(){
			var self = this;
			if(!self.jsonData.cautionComment){return}
			return '<dt class ="hReport">Caution comment:</dt><dd> ' + self.jsonData.cautionComment + "</dd>";
		},
		_confidence : function(){
			var self = this;
			if(!self.jsonData.confidence){return}
			return '<dt class ="hReport">Confidence:</dt><dd> ' + self.jsonData.confidence + "</dd>";
		},
		_cellLine : function(){
			var self = this;
			if(!self.jsonData.cellLine){return}
			return '<dt class ="hReport">Cell line:</dt><dd> ' + self.jsonData.cellLine + "</dd>";
		},
		_assoLink : function(){
			var self = this;
			if(!self.jsonData.association){return}
			var returnString = '<dt class ="hReport">Support following association:</dt>';
			for (var i=0; i < self.jsonData.association.length; i++) {
			 returnString+= ' <a target = "_blank" href ="http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=association&value=' + self.jsonData.association[i] + '">' + self.jsonData.association[i] + "</a></dd>";
			};
			return returnString;
		},
		_compartment : function(){
			var self = this;
			if(!self.jsonData.compartment){return}
			return '<dt class ="hReport">Compartment:</dt><dd> ' + self.jsonData.compartment + "</dd>";
		},
		_creationDate : function(){
			var self = this;
			if(!self.jsonData.creationDate){return}
			return '<dt class ="hReport">Creation date:</dt><dd> ' + self.jsonData.creationDate + "</dd>";
		},
		_database : function(){
			var self = this;
			if(!self.jsonData.database){return}
			return '<dt class ="hReport">Database:</dt><dd> ' + self.jsonData.database + "</dd>";
		},
		_experimentModif : function(){
			var self = this;
			if(!self.jsonData.experimentModification){return}
			return '<dt class ="hReport">Experiment modification:</dt><dd> ' + self.jsonData.experimentModification + "</dd>";
		},
		_host : function(){
			var self = this;
			if(!self.jsonData.host){return}
			return '<dt class ="hReport">Host:</dt><dd> ' + self.jsonData.host + "</dd>";
		},
		_interactDetectMethod : function(){
			var self = this;
			if(!self.jsonData.interactionDetectionMethod){return}
			return '<dt class ="hReport">Interaction detection method:</dt><dd> ' + self.jsonData.interactionDetectionMethod + "</dd>";
		},
		_interactionType : function(){
			var self = this;
			if(!self.jsonData.interactionType){return}
			return '<dt class ="hReport">Interaction type:</dt><dd> ' + self.jsonData.interactionType + "</dd>";
		},
		_positiveControl : function(){
			var self = this;
			if(!self.jsonData.positiveControl){return}
			return '<dt class ="hReport">Positive control:</dt><dd> ' + self.jsonData.positiveControl + "</dd>";
		},
		_update : function(){
			var self = this;
			if(!self.jsonData.updateDate){return}
			return '<dt class ="hReport">Update date:</dt><dd> ' + self.jsonData.updateDate + "</dd>";
		},
		_xrefList : function(){
			var self = this;
			if(!self.jsonData.xrefList){return}
			return '<dt class ="hReport">External reference:</dt><dd> ' + self.jsonData.xrefList + "</dd>";//liens a créer
		},
		_publication : function(){
			var self = this;
			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=publication&value="
			if(!self.jsonData.publication){return}
			if (self.jsonData.publication instanceof Array) {
				var returnString = '<dt >Pubmed reference:</dt>';
				for (var i=0; i < self.jsonData.publication.length; i++) {
				returnString += '<dd> <a target = "_blank" href ="' + rootUrl  + self.jsonData.publication[i] + '">' + self.jsonData.publication[i] + '</a><span class = "addCart publi pull-right" name ="' + self.jsonData.publication[i] + '">' + self.cartButton.publiAdd + '</span></dd>';
				};
				return returnString;
			}
			else{
				return '<dt class ="hReport">Pubmed reference:</dt><dd> <a target = "_blank" href ="' + rootUrl + self.jsonData.publication + '">' + self.jsonData.publication + "</a></dd>";
			}
		},
		_table : function(){
			var self = this;
			if(!self.jsonData.table){return}
			return '<dt class ="hReport">Table:</dt><dd> ' + self.jsonData.table + "</dd>";
		},
		_figure : function(){
			var self = this;
			if(!self.jsonData.figure){return}
			return '<dt class ="hReport">Figure:</dt><dd> ' + self.jsonData.figure + "</dd>";
		},
		_file : function(){
			var self = this;
			if(!self.jsonData.file){return}
			return '<dt class ="hReport">File:</dt><dd> ' + self.jsonData.file + "</dd>";
		},
		_imexId : function(){
			var self = this;
			if(!self.jsonData.imexExperimentId){return}
			return '<dt class ="hReport">Imex-id for this experiment:</dt><dd> ' + self.jsonData.imexExperimentId + "</dd>";
		},
		/*méthode kinetic*/
		_associationRate : function(){
			var self = this;
			if(!self.jsonData.affinityKinetic.AssociationRate1){return}
			return '<dt class ="hReport">Association rate:</dt><dd> ' + self.jsonData.affinityKinetic.AssociationRate1 + "nM</dd>";
		},
		_dissociation : function(){
			var self = this;
			if(!self.jsonData.affinityKinetic.DissociationRate1){return}
			return '<dt class ="hReport">Dissociation rate:</dt><dd> ' + self.jsonData.affinityKinetic.DissociationRate1 + "nM</dd>";
		},
		_kd : function(){
			var self = this;
			if(!self.jsonData.affinityKinetic.KD1_nM){return}
			return '<dt class ="hReport">Kd:</dt><dd> ' + self.jsonData.affinityKinetic.KD1_nM + "nM</dd>";
		},
/*fin de bandeau info xp
 * ----------------------------------------------------------------------------------------------------------------------------------
 * bandeau partner
 */
		_partnerOrganisator : function(){
			var self = this;
			self.tailleHeader++
			if (self.jsonData.partnerDetails.length == 0) {return;}

			var complexType = self.jsonData.partnerDetails.length == 1 ? 'homoDimer' : 'heteroDimer';
			
			$(self.targetDomElem).append("<div class='contentXp partner' ><div class='centralXp' ></div></div>");
  			var partnerDiv =$(self.targetDomElem).find("div.contentXp:last div.centralXp");
  			var ancre = complexType === 'heteroDimer' 
  				? "<div class = 'navigueBar'><a cible = 'div.partner' >Detailed informations on the partners </a></div>"
  				:  "<div class = 'navigueBar'><a cible = 'div.partner' >Detailed informations on the subunit </a></div>"
  			var titre = complexType === 'heteroDimer' 
  				? "<h3>Detailed informations on the partners</h3>" 
  				: "<h3>Detailed informations on the subunit</h3>";
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			partnerDiv.append(titre);
  			var scaffold = complexType === 'heteroDimer' 
  				? '<div class = "row-fluid"><div class = "span6 partner1"></div><div class = "span6 partner2"></div></div>'
  				: '<div class = "row-fluid"><div class = "span6 offset3 partner1"></div></div>'
  			partnerDiv.append(scaffold);
  			
  			for (var i=0; i < self.jsonData.partnerDetails.length; i++) {
  				var lineString = '';
  				var partner;
				if(i == 0){partner = partnerDiv.find('.partner1');}
				else{partner = partnerDiv.find('.partner2');}
				
				lineString += self._namePartner(i);
				lineString += "<span class ='addCart biom' name = '" + self.jsonData.partnerDetails[i].name + "'>" + self.cartButton.biomAdd + "</span>";
				lineString += "<div class= 'featureContent'><dl>";
				lineString += self._authorName(i);
				lineString += self._bioRole(i);
				lineString += self._detectionMethod(i);
				lineString += self._role(i);
				lineString += self._expression(i);
				lineString += self._isoform(i);
				lineString += self._stochiometrie(i);
				lineString += self._strainDetails(i);
				lineString += "</dl></div>";
				partner.append(lineString);
				partner.append(self._feature(i));
				self._structurePdb(i);
				console.dir(i);
			  };
  			
		},
		_namePartner : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].name){return '';}
			var RootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
			var lineString = '<div class="divTitre" >';
			if(self.jsonData.partnerDetails[index].commonName){
				lineString += self.jsonData.partnerDetails[index].commonName + " (";
			}
			
			lineString += '<a target = "_blank" href = "' + RootUrl + self.jsonData.partnerDetails[index].name + '">' + self.jsonData.partnerDetails[index].name +'</a>'
			if(self.jsonData.partnerDetails[index].commonName){
				lineString += ")";
			}
			lineString += "</div>";
			return lineString;
		},
		_bioRole : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].biologicalRole){return '';}
			return '<dt class ="hReport">Biological role:</dt><dd> ' + self.jsonData.partnerDetails[index].biologicalRole + "</dd>";
		},
		_detectionMethod : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].detectionMethod){return '';}
			return '<dt class ="hReport">Detection method:</dt><dd> ' + self.jsonData.partnerDetails[index].detectionMethod + "</dd>";
		},
		_role : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].experimentalRole){return '';}
			return '<dt class ="hReport">Role in experiment:</dt><dd> ' + self.jsonData.partnerDetails[index].experimentalRole + "</dd>";
		},
		_expression : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].expressionLevel){return '';}
			return '<dt class ="hReport">Expression level:</dt><dd> ' + self.jsonData.partnerDetails[index].expressionLevel + "</dd>";
		},
		_isoform : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].isoform){return '';}
			return '<dt class ="hReport">Isoform:</dt><dd> ' + self.jsonData.partnerDetails[index].isoform + "</dd>";
		},
		_stochiometrie : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].stoichiometry){return '';}
			return '<dt class ="hReport">Stoichiometry:</dt><dd> ' + self.jsonData.partnerDetails[index].stoichiometry + "</dd>";
		},
		_strainDetails : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].strainDetails){return '';}
			return '<dt class ="hReport">Strain Details:</dt><dd> ' + self.jsonData.partnerDetails[index].strainDetails + "</dd>";
		},
		_authorName : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].authorMoleculeName){return '';}
			var otherName = '<dt> Common name :</dt><dd>'
			for (var i=0; i < self.jsonData.partnerDetails[index].authorMoleculeName.length; i++) {
				
			  otherName += " " + self.jsonData.partnerDetails[index].authorMoleculeName[i] + ","
			};
			otherName = otherName.substring(0,otherName.length - 1);
			otherName += '</dd>'
			return otherName;
		},
		_feature : function(index){
			var self = this;
			var feature = ''
			if(!self.jsonData.partnerDetails[index].feature){return}
			var feature = ''
			$.each(self.jsonData.partnerDetails[index].feature, function(type,data){
				if(!data){return}
				if(data.type == "miscellaneousFeatures"){feature += self._miscella(data.data)}
				if(data.type == "bindingSiteData"){feature +=self._bindingSite(data.data)}
				if(data.type == "pointMutation"){feature +=self._mutatoin(data.data)}
				if(data.type == "ptm"){feature +=self._ptm(data.data)}
			});
			feature += ''
			return feature;
		},
		_miscella : function(data){
			var self = this;
			
			var returnString = '<div class = "xpModif" ><div class="divTitre "> Modification in experiment</div><dl class = "downFeature">';
			var domain = '';
			var dataString = '';
			var feature = ''
			var type = '';
			for (var i=0; i < data.length; i++) {
			  if(data[i].domain){domain = self._domainFeat(data[i].domain);}
			  if(data[i].data){dataString = self._dataString(data[i].data);}
			  if(data[i].featureType){feature = self._featureType(data[i].featureType);}
			  if(data[i].type){type = self._type(data[i].type);}
			};
			var returnList = [domain, feature, type, dataString]
			for (var i=0; i < returnList.length; i++) {
			  returnString += returnList[i]; 
			};
			returnString += '</dl></div>';
			return returnString;
		},
		_bindingSite : function(data){
			var self = this;
			var returnString = '<div class = "bindingSite" ><div class="divTitre"> Caracteristic of binding site </div><dl class = "downFeature">';
			var domain = '';
			var dataString = '';
			var type = '';
			for (var i=0; i < data.length; i++) {
			  if(data[i].bindingSiteType){type = self._bindingSiteType(data[i].bindingSiteType);}
			  if(data[i].bindingSiteDomain){domain = self.domainFeat(data[i].bindingSiteDomain);}
			  if(data[i].bindingSiteData){dataString = self._dataString(data[i].bindingSiteData);}
			};
			var returnList = [domain, type, dataString]
			for (var i=0; i < returnList.length; i++) {
			  returnString += returnList[i]; 
			};
			returnString += '</dl></div>';
			return returnString;
			
		},
		_ptm : function(data){
			console.dir(data)
		},
		_bindingSiteType: function(data){
			var self = this;
			return '<dt class ="hReport">Binding site type:</dt><dd> ' + data + "</dd>";
		},
		_domainFeat : function(data){
			var self = this;
			return '<dt class ="hReport">Domain:</dt><dd> ' + data + "</dd>";
		},
		_dataString : function(data){
			var self = this;
			var returnString = ''
			var name = '';
			var detection = '';
			var otherData = '';
			var finalPosition = "";
			var test = false;
			var positionStart = "";
			var positionEnd = ""
			if(data.Name){name = '<dt class ="hReport">' + data.Name + '</dt>';}	
			if(data.detectionMethod){detection = '<dt class ="hReport">detected by:</dt><dd> ' + data.detectionMethod + '</dd>';}
			if(data.otherData){otherData = '<dt class ="hReport">Other data:</dt><dd> ' + data.otherData + '</dd>';}
			if(data.rangeData){
				for (var i=0; i < data.rangeData.length; i++) {
					positionStart = "";
					positionEnd = "";
				  	if(data.rangeData[i].Position_start){
				  		if(data.rangeData[i].Position_end){
				  			test = true;
				  			positionStart = data.rangeData[i].Position_start + ' at '; 
				  			positionEnd = data.rangeData[i].Position_end +"</br>"
				  		}
				  	}
				  	finalPosition += positionStart + positionEnd ;
				}
				if(test){finalPosition = "<dt class ='hReport'>Sequences position:</dt><dd>" + finalPosition + "</dd>";}
			}
			var returnList = [name, detection, otherData, finalPosition]
			for (var i=0; i < returnList.length; i++) {
			  returnString += returnList[i]; 
			};
			returnString += '</div>';
			return returnString;
		},
		_featureType : function(data){
			var self = this;
			return '<dt class ="hReport">Feature type:</dt><dd>' + data + "</dd>";;
		},
		_type : function(data){
			var self = this;
			return '<dt class ="hReport">Type:</dt><dd>' + data + "</dd>";
		},
		_structurePdb : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].pdb){return;}
			var data = self.jsonData.partnerDetails[index].pdb
			var i = index + 1;
			var cibleMolView = '<div class = "structurePdb" ><div class="divTitre">' 
			+ 'Pdb Structure</div><div class ="postitContent" ><div id = "experimentMolView' 
			+ i + '"></div>';
			
			$(self.targetDomElem).find("div.contentXp:last div.partner" + i).append(cibleMolView);
			var nodeTest = {
					pdb : data,
    			};    
    		widget = initElementInfo({
				width : '100%', height : '100%',
				target : '#experimentMolView',
				targetSuffix : i,
				callback : {
					computeCss : function(jqueryNode){
				    	var top = $(jqueryNode).position().top ;
						var left = $(jqueryNode).position().left ;
						return {main : {top : top + 'px', left : left + 'px', width : this.width, 'max-height' : this.height} ,
								upmark :  {top : top - 30 + 'px', left : left + 'px', display : 'none'}
						};
				     }
				}				  
			});
    		widget.draw(nodeTest);
			
		},
		
/*fin de bandeau partner
 * ----------------------------------------------------------------------------------------------------------------------------------
 * bandeau interactions
 */
  		_interactionOrganisator : function(){// organise le bandeau intéraction
  			var self = this;
  			if(!self.jsonData.interactions[0]){return;}
  			var data = self._interactionGenerateTableData();
  			var nbXp = 0
  			for (var i=0; i < data.aaData.length; i++) {
				nbXp += data.aaData[i][1];
				 data.aaData[i][1] =''+ data.aaData[i][1] + ' <i class="fa fa-info-circle"></i>'
			  };
  			var plural =  data.aaData.length > 1 ? 's' : ''; 
  			var titre = "<div class='divTitre'> This molecule has <span class = 'niceRed'>" + data.aaData.length + "</span> partner" + plural + " described in <span style = 'color : green; font-weight : bold'>" + nbXp + "</span> evidences </div>";
  			var tableForm = "<table class='interact'><thead></thead><tbody></tbody></table>";
  			var interactDiv = $(self.targetDomElem).find("div.tableInteract");
  			interactDiv.append(titre)
  			interactDiv.append(tableForm);
  			
			
  			self._addCheckSel(data.aaData,"biomAdd");

			 $(this).ready(function() {
			 	var anOpen = [];
    			var table = $( 'table.interact' ).dataTable( {
      		 		"aaData": data.aaData,
      		 		sScrollY: "100%",
   		  	 		"aoColumns": [
   		  	 	   		{ "sTitle": "Partner name", "sClass": "center","sWidth": "350px"},
       			   		{ "sTitle": "Number of experiment", "sClass": "center" },
       			   		{ "sTitle": "Status", "sClass": "center","sWidth": "auto" },
       			   		{ "sTitle": "", "sClass": "center"},],
    				"oLanguage": {
    				 	"sSearch": "Filter:"
  				  	},
  				  	"sDom": '<"top"<"row"<"span6"f><"span6 pull-right"i>>>rt<"bottom"p><"clear">',
  				  	"sPaginationType": "bootstrap",
  					"bLengthChange": false,
  					"aoColumnDefs": [{ 'bSortable': false, 'aTargets': [ 3 ] }],
  					
 		  		});
 		  		 $(window).bind('resize', function () {
  			 		table.fnAdjustColumnSizing();
  				 } );
 		  		 var taille = table.css("height");
 		  		 table.parent().css("max-height", taille);
 		  		 table.$('div.btn-group').click( function () {
 		  		 	
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(1) span').attr("data-original-title");
 		  		 	var data ={type : "biomolecule", value : item} ;	 		  		 
 		  		 	self.addCartCallback(data); 					
   				 });
   				 table.$("td:nth-child(2)").css("cursor","pointer");
   				 table.$("td:nth-child(2)").click(function(){
   				 	
   				 	var nTr = this.parentNode;
  					var i = $.inArray( nTr, anOpen );
  					if ( i === -1 ) {  						
  						var toto = function () {
  								
  							$('td.supportingXp').parent().prev().each(function(){
  								table.fnClose( this );
  							})		
							table.fnOpen( nTr, fnFormatDetails(table, nTr), 'supportingXp' ); 
  						}();
  						
  						anOpen = [nTr] ;
  					}else{
  						
  						table.fnClose( nTr );
     					anOpen = [];
  					}
   				});
   				table.$('td>span').tooltip();		
   				function fnFormatDetails( table, nTr ){
   					
   					var partner = table.fnGetData( nTr );	
   									
   					var link=partner[0];
   					
   					partner = $(link).attr("title");
   					console.dir(partner);
   					var returnString = ''
   					for (var i = 0; i < data.supportingXpData.length; i++) {
						var xp = data.supportingXpData[i]
						if(xp.name == partner){
							for (var j=0; j < xp.experiments.length; j++) {	//ligne du dessous param
								if(j%2==0){returnString +="<div class = 'row-fluid' >" }
							 	returnString += "<div class = 'span6 inlineTable' ><a href='http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=experiment&value=" + xp.experiments[j].name + "' target = '_blank'>" + xp.experiments[j].name + "</a>" 
							 	if(xp.experiments[j].pmid){
							 		returnString += "</br> Pubmed&nbsp;&nbsp; <a target = '_blank' href = 'http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=publication&value="+ xp.experiments[j].pmid + "'>" + xp.experiments[j].pmid + "</a> <a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/pubmed/" + xp.experiments[j].pmid + "' style ='font-size : 0.7em; text-decoration : underline;'>link</a>"
							 		if(xp.experiments[j].imexid){
							 			returnString += "</br> Imex-id&nbsp;&nbsp;&nbsp;&nbsp;   <a target = '_blank' href = 'http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=publication&value="+ xp.experiments[j].pmid + "'>" + xp.experiments[j].imexid + "</a> <a target = '_blank' href = 'http://www.ebi.ac.uk/intact/imex/main.xhtml?query=" + xp.experiments[j].pmid +"' style ='font-size : 0.7em; text-decoration : underline;'>link</a>"  
							 		}	
							 	}
							 	if(j%2==1){returnString +="</div>" }
							 	returnString += "</div>";
							};
						}
					   };
   					return returnString;
   				}
			} );
			
  		},
  		_interactionGenerateTableData : function(){
  			var self = this;
  			var dataForTable = []
  			var xpData = []
  			var rootLink ="http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
  			for (var i = 0; i < self.jsonData.interactions.length; i++) {
  				var lineTable = [];
				var statue = '';
				var nb = '';
				var commonName = '';
				var xpObject = {};
				jQuery.each(self.jsonData.interactions[i],function(name,info){
					if(name == "supportingExperiments"){
						nb =  info.length ;
						xpObject.experiments = info;
					}
					if(name == "partner"){
						var id = info.id;
						var common = info.common.anyNames[0];
						xpObject.name = info.id;
						commonName = '<span  data-toggle="tooltip" data-delay=\'{"show":"500", "hide":"500"}\' title="' + id + '"><a href ="' + rootLink + id + '" target = "_blank">' + common + '</a></span>' ;
					}
					if(name == "kind"){		
						if(info == "genuine"){
							statue = '<i class="fa fa-star fa-lg" style = "color:yellow;"></i>';
						}else{
							statue = '<i class="fa fa-star-o fa-lg"></i>';
						}
					}
				});
				lineTable = [commonName, nb, statue];
				xpData.push(xpObject);
				dataForTable.push(lineTable);
			  };
			 return {aaData :dataForTable, supportingXpData : xpData};
  		},
/*fin de bandeau interactions
 *---------------------------------------------------------------------------------------------------------------
 *  bandeau go
 */
  		_goOrganisator : function (){//traite les données du bandeau Go
  			var self = this;
  			if(!self.jsonData.go){return;}
  			self.tailleHeader++
  			$(self.targetDomElem).append("<div class='content Go' ></div>");
  			var goDiv = $(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar'><a cible = 'div.Go' >GO Terms</a></div>";
  			var titre = "<h3> This molecule is annoted by <span class = 'niceRed'>" + self.jsonData.go.length + "</span> GO terms</h3>";
  			
  			var tableForm = "<table class='Go'><thead></thead><tbody></tbody></table>"
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			goDiv.append(titre)
  			goDiv.append(tableForm);
  			var aaData = self._goGenerateTableData();
  			self._addCheckSel(aaData,"defaultAdd");
  			 
  			 	
    			var table = $( 'table.Go' ).dataTable( {
      		 	"aaData": aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  			{ "sTitle": "Term", "sClass": "center","sWidth": "250px"},
       			    { "sTitle": "<span >Link to identifier</span>", "sClass": "center","sWidth": "80px" },//tooltip
       			    { "sTitle": "Definition", "sClass": "center","sWidth": "700px" },
       			    { "sTitle": "","sWidth": "40px", "sClass": "center"}],
    			"oLanguage": {
    			  		
    				 	"sSearch": "Filter:"
  				  	},
  				 "sDom": '<"top"<"row"<"span6"f><"span6 pull-right"i>>>rt<"bottom"p><"clear">', 	
  				 "sPaginationType": "bootstrap",
  				 "bLengthChange": false,
  				 "aoColumnDefs": [
        		   { 'bSortable': false, 'aTargets': [ 3 ] }
      			 ]
 		  		} ); 
 		  		table.$('div.btn-group').click( function () {
 		  			
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(2)').text(); 		  		 
 		  		 	var data ={type : "goTerm", value : item};
 		  		 	self.addCartCallback(data);
   				 })
   				 
   				 table.$('td>span').tooltip();

			
			
  		},
  		_goGenerateTableData : function (){
  			var self = this;
  			var aaData =[];
  			var rootUrl= "http://amigo.geneontology.org/cgi-bin/amigo/term_details?term=";
  			
  			for (var i = 0; i < self.jsonData.go.length; i++) {
  				var lineTable = [];
				var term = '';
				var id = '';
				var def = '';
				jQuery.each(self.jsonData.go[i],function(name,info){
					if(name == 'definition'){
						console.dir(self.jsonData.go[i])
						def = self._cutAndTooltip(info, 170);				
					}
					if(name == 'id'){
						
						id = self._cutAndTooltip(info, 500, rootUrl+info);
					}
					if(name == 'term'){
						term = self._cutAndTooltip(info, 80);}
				});
				lineTable = [term,id,def]
				aaData.push(lineTable);
			  };
			return aaData;
  		},
/*fin de bandeau go
 *---------------------------------------------------------------------------------------------------------------
	bandeau association 
 */
		_associationOrganisator : function (){
			var self = this;
			self.tailleHeader++
			$(self.targetDomElem).append("<div class ='associationContent row-fluid'></div>");
  			var assocDiv =$(self.targetDomElem).find("div.associationContent" );
  			var ancre = "<div class = 'navigueBar reportTarget'>" + self.jsonData.name + " association</div>";
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			var listeForPostitGenerator = []
  			
  			var postitXpHtml = self._postitXpAssoc();
  			if(postitXpHtml){listeForPostitGenerator.push(postitXpHtml);}
  			
  			var postitSupportAssocHtml = self._supportAssoc()
  			if(postitSupportAssocHtml){listeForPostitGenerator.push(postitSupportAssocHtml);}
  			
  			var htmlFinal = self._postitGeneratorSmallPage(listeForPostitGenerator)
  			assocDiv.append(htmlFinal);
  			
		},
  		_postitGeneratorSmallPage : function(listeOfPostitContent){
  			var self = this;
  			var taille = listeOfPostitContent.length;
  			var scaffold = ""
  			if(taille == 1){
  				scaffold = "<div class ='center Small'>" + listeOfPostitContent[0] ;
  			}
  			if(taille == 2){
  				scaffold = '<div class ="center Small">' + listeOfPostitContent[0] 
  						   + '</div><div class ="center Small">' + listeOfPostitContent[1];
  			}
  			scaffold += "</div>";
  			
  			return scaffold;
  		},
		_postitXpAssoc :function(){
			var self = this;
			if(!self.jsonData.sourceDatabases && !self.jsonData.directExperiments && !self.jsonData.publication){return false;}
			var returnString = "<div class = 'divTitre'> Information on the association </div><div class = 'postitContent'><dl>"
			returnString += self._assocPartner() + self._supportXp() + self._publication() + self._sourceDb() + "</dl></div>"
			return returnString;
			
		},
		_supportXp : function(){
			var self = this;
			if(!self.jsonData.directExperiments[0]){return;}
			var returnString = '<dt > Direct experiment:</dt>'
			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=experiment&value="
			for (var i=0; i < self.jsonData.directExperiments.length; i++) {
				returnString +="<dd><a target ='_blank' href = '" + rootUrl + self.jsonData.directExperiments[i] + "'>" + self.jsonData.directExperiments[i] +"</a></dd>"
			};
			return returnString;
		},
		_sourceDb : function (){
			var self = this;
			if(!self.jsonData.sourceDatabases[0]){return;}
			var returnString = '<dt > Database Source:</dt>'
			for (var i=0; i < self.jsonData.sourceDatabases.length; i++) {
				returnString +="<dd>" + self.jsonData.sourceDatabases[i] + "</dd>"
			};
			return returnString;
		},
		_assocPartner
		: function (){
			var self = this;
			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=biomolecule&value="
			if(!self.jsonData.partnerNames[0]){return;}
			var returnString = '<dt > Biomolecule:</dt>'
			for (var i=0; i < self.jsonData.partnerNames.length; i++) {
				var name = self.jsonData.partnerCommon[self.jsonData.partnerNames[i]].anyNames[0]
				returnString +="<dd><a target ='_blank' href = '" + rootUrl + self.jsonData.partnerNames[i] + "'>" + name +"</a><span class = ' addCart biom pull-right' name = '" + self.jsonData.partnerNames[i] +"'>" + self.cartButton.biomAdd + "</span></dd>"
			};
			return returnString;
		},
		_supportAssoc : function (){
			var self = this;
			var returnString = false;
			if(self.jsonData.supportByAssociation){
				returnString = self._supportByAssoc(returnString);
			}if(self.jsonData.supportToAssociation){
				returnString = self._supportToAssoc(returnString);
			}
			if(returnString){returnString+= self._assocPartner() + "</dl></div>"}
			return returnString;
		},
		_supportByAssoc : function(string){
			var self = this;
			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=association&value="
			if(string){var returnString = string + '<dt > Support by association:</dt>'}
			else{var returnString = '<div class ="divTitre"> Supported association</div><div class = "postitContent"><dl><dt class = "hReport"> Support by association:</dt>'}
			for (var i=0; i < self.jsonData.supportByAssociation.length; i++) {
				returnString +="<dd><a target ='_blank' href='" + rootUrl + self.jsonData.supportByAssociation[i] + "'>" + self.jsonData.supportByAssociation[i] + "</a></dd>"
			};
			return returnString;
		},
		_supportToAssoc : function(string){
			var self = this;
			if(string){var returnString = string + '<dt> Support to association:</dt>'}
			else{var returnString = '<div class ="divTitre"> Supported association</div><div class = "postitContent"><dl><dt class = "hReport"> Support to association:</dt>'}
			for (var i=0; i < self.jsonData.supportToAssociation.length; i++) {
				returnString +="<dd>" + self.jsonData.supportToAssociation[i] + "</dd>"
			};
			return returnString;
		},
/*fin de bandeau association
 ---------------------------------------------------------------------------------------------------------------
	bandeau publication 
 */
		
		_publicationOrganisator : function (){
			var self = this;
			self.tailleHeader++
			$(self.targetDomElem).append("<div class ='publicationContent contentXp content'><div class ='row-fluid'><div class = 'span7'><div class ='row-fluid'></div></div><div class='span5 assocTable ' ></div></div></div>");
  			var publiDiv =$(self.targetDomElem).find("div.span7 > div.row-fluid");
  			var ancre = "<div class = 'navigueBar reportTarget'>" + self.jsonData.name + " Publication</div>";
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			var listeForPostitGenerator = [];
  			
  			var generalInfoHtml = self._infoPubli();
  			if(generalInfoHtml){listeForPostitGenerator.push(generalInfoHtml);}
  			
  			var postitAuthorInfoHtml = self._infoAuthorPubli()
  			if(postitAuthorInfoHtml){listeForPostitGenerator.push(postitAuthorInfoHtml);}
  			
  			var htmlFinal = self._postitGeneratorSmallPubli(listeForPostitGenerator)
  			publiDiv.append(htmlFinal);
  			
  			self._associationPubliDatatable()
  			
  			var abstactHtml = self._abstractPubli();
  			if(abstactHtml){$(self.targetDomElem).find("div.span7").append(abstactHtml);}
  			
  			
		},
		_postitGeneratorSmallPubli : function(listeOfPostitContent){
  			var self = this;
  			var taille = listeOfPostitContent.length;
  			var scaffold = ""
  			if(taille == 2){
  				scaffold = '<div class ="span6 Small">' + listeOfPostitContent[0] 
  						   + '</div><div class ="span6 Small">' + listeOfPostitContent[1];
  			}else{alert("error")}
  			scaffold += "</div>";
  			
  			return scaffold;
  		},
		_infoPubli : function (){
			var self = this;
			var returnString = "<div class = 'divTitre'> Reference </div><span class = 'addCart publi pull-right' name = '" + self.jsonData.name + "'>" + self.cartButton.publiAdd + "</span><div class = 'postitContent'><dl>";
			returnString +=   self._imexIdPubli() + self._journal() + self._copyright() + self._date() + self._aviable() + self._biomolecule() + self._contact() + "</dl></div>"
			return returnString;
		},
		_infoAuthorPubli : function (){
			var self = this;
			if(!self.jsonData.firstAuthor && !self.jsonData.authorList[0]){return false;}
			var returnString = "<div class = 'divTitre'> Data </div><div class = 'postitContent'><dl>";
			returnString += self._title() + self._firstAuthor() + self._author() + "</dl></div>";
			return returnString;
		},
		_abstractPubli : function(){
			var self = this;
			if(!self.jsonData.Abstract){return false;}
			var returnString = "<div class ='row-fluid publicationContent '><div class ='span12 abstract'><div class = 'divTitre '> Abstract </div><div class = 'postitContent'>";
			returnString += self.jsonData.Abstract + "</div></div></div>";
			return returnString;
		},
		_title : function(){
			var self = this;
			if(!self.jsonData.title){return ""}
			return '<dt class ="hReport">Title:</dt><dd> ' + self.jsonData.title + "</dd>";
		},
		_imexIdPubli : function(){
			var self = this;
			if(!self.jsonData.imexId){return ""}
			return '<dt class ="hReport">Imex-id:</dt><dd> <a target = "_blank" href = "http://www.ebi.ac.uk/intact/imex/main.xhtml?query='  + self.jsonData.imexId + '">' + self.jsonData.imexId + "</a></dd>";
		},
		_journal : function(){
			var self = this;
			if(!self.jsonData.journal){return ""}
			return '<dt class ="hReport">Journal:</dt><dd> ' + self.jsonData.journal + "</dd>";
		},
		_copyright : function(){
			var self = this;
			if(!self.jsonData.copyright){return ""}
			return '<dt class ="hReport">Copyright:</dt><dd> ' + self.jsonData.copyright + "</dd>";
		},
		_date : function(){
			var self = this;
			if(!self.jsonData.date){return ""}
			return '<dt class ="hReport">Date of parution:</dt><dd> ' + self.jsonData.date + "</dd>";
		},
		_aviable : function(){
			var self = this;
			if(!self.jsonData.availability){return ""}
			return '<dt class ="hReport">Avialability:</dt><dd> ' + self.jsonData.availability + "</dd>";
		},
		_biomolecule : function(){
			var self = this;
			if(!self.jsonData.biomolecule){return ""}
			return '<dt class ="hReport">Biomolecule in publication:</dt><dd> ' + self.jsonData.biomolecule + "</dd>";
		},
		_contact : function(){
			var self = this;
			if(!self.jsonData.contactEmail){return ""}
			return '<dt class ="hReport">Contact:</dt><dd> ' + self.jsonData.contactEmail + "</dd>";
		},
		_firstAuthor : function(){
			var self = this;
			if(!self.jsonData.firstAuthor){return ""}
			return '<dt class ="hReport">First author:</dt><dd> ' + self.jsonData.firstAuthor + "</dd>";
		},
		_author : function(){
			var self = this;
			if(!self.jsonData.authorList){return ""}
			var returnString = '<dt class ="hReport">Author:</dt><dd>';
			for (var i=0; i < self.jsonData.authorList.length; i++) {
			  returnString +=  self.jsonData.authorList[i] + ", "
			};
			returnString = returnString.substring(0,returnString.length - 2);
			returnString += "</dd>"
			return returnString;
		},
		
/*fin de bandeau publication
 * ---------------------------------------------------------------------------------------------------------------
 * bandeau assoc table
 */
		_associationPubliDatatable : function(){
			var self = this;
			if(!self.jsonData.association){return}
  			
  			
  			var tableForm = "<table class='assoTable'><thead></thead><tbody></tbody></table>";
  			var assoTableDiv =$(self.targetDomElem).find("div.assocTable");
  			assoTableDiv.append(tableForm)
  			var aaData = self._assocGenerateTableData();
  			self._addCheckSel(aaData,"biomAdd");
  			 $(this).ready(function() {
    			var table = $( 'table.assoTable' ).dataTable( {
      		 	"aaData": aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  	 		{ "sTitle": "Add first partner", "sWidth": "150px", "sClass": "center"},
   		  	 		{ "sTitle": "Association", "sClass": "center","sWidth": "150px"},  
       			    { "sTitle": "Add second partner", "sWidth": "150px", "sClass": "center"}],
    			"oLanguage": {
    				 	"sSearch": "Filter:",
						"sInfo": "<div class = 'title'>This publication shows <span class = 'niceRed '>_TOTAL_</span> association(s)</div>"
  				  	},
  				 "sDom": '<"topHead"i><"topBody"f>rt<"bottom"p><"clear">',
  				 "sPaginationType": "bootstrap",
  				 "bLengthChange": false,
  				 "aoColumnDefs": [
        		   { 'bSortable': false,  'aTargets': [ 0,2 ]}
      			 ]
 		  		}); 
 		  		table.$('td:first-child div.btn-group').click( function () {
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(2) a').attr("name1"); 	
 		  		 	console.dir($( this ).parent().parent().find('td:nth-child(2)'))	  		 
 		  		 	var data ={type : "biomolecule", value : item};
 		  		 	self.addCartCallback(data);
   				 })
   				 table.$('td:last-child div.btn-group').click( function () {
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(2) a').attr("name2"); 		  		 
 		  		 	var data ={type : "biomolecule", value : item};
 		  		 	self.addCartCallback(data);
   				 })
 		  	})

		},
		_assocGenerateTableData : function (){
  			var self = this;
  			var aaData = [];
  			var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=association&value=";
  			for (var i = 0; i < self.jsonData.association.length; i++) {
  				var name = self.jsonData.association[i];
  				name = name.split("__")
  				var info = "<a target = '_blank' href='" + rootUrl + self.jsonData.association[i] + "' name1 ='" + name[0] + "' name2 = '" + name[1] + "'>" + self.jsonData.association[i] + "</a>";
  				
				aaData.push([self.cartButton.biomAdd, info]);
			  };
			return aaData;
  		},

	
 /* fin de assoc table
  * ---------------------------------------------------------------------------------------------------------------
 *   bandeau unitKewrd
 */
		_uniprotKewrdOrganisator : function(){
			var self = this;
			if(!self.jsonData.uniprotKW){return}
			self.tailleHeader++
  			$(self.targetDomElem).append("<div class='content uniprot' ></div>");
  			var uniDiv =$(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar'><a cible = 'div.uniprot' > UniProt Keyword</a></div>";
  			var titre = "<h3> This molecule is annoted by <span class = 'niceRed' >" + self.jsonData.uniprotKW.length + "</span> UniProt keyword</h3>";
  			var tableForm = "<table class='Uniprot'><thead></thead><tbody></tbody></table>";
  			uniDiv.append(titre);
  			uniDiv.append(tableForm)
  			
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			var aaData = self._uniprotGenerateTableData();
  			self._addCheckSel(aaData,"defaultAdd");
  			console.dir(aaData)
  			 $(this).ready(function() {
    			var table = $( 'table.Uniprot' ).dataTable( {
      		 	"aaData": aaData,
      		 	
   		  	 	"aoColumns": [
   		  	 		{ "sTitle": "Term", "sClass": "center","sWidth": "200px"},
       			    { "sTitle": "<span >Link to identifier</span>", "sClass": "center","sWidth": "100px" },//tooltip
       			    { "sTitle": "Definition", "sClass": "center","sWidth": "700px" },
       			    { "sTitle": "","sWidth": "60px", "sClass": "center"}],
    			"oLanguage": {
    			  		
    				 	"sSearch": "Filter:"
  				  	},
  				 "sDom": '<"top"<"row"<"span6"f><"span6 pull-right"i>>>rt<"bottom"p><"clear">',
  				 "sPaginationType": "bootstrap",
  				 "bLengthChange": false,
  				 "aoColumnDefs": [
        		   { 'bSortable': false, 'aTargets': [ 3 ] }
      			 ]
 		  		} ); 
 		  		table.$('div.btn-group').click( function () {
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(2)').text(); 		  		 
 		  		 	var data ={type : "keyword", value : item};
 		  		 	self.addCartCallback(data);
   				 })
   				 
   				 table.$('td>span').tooltip();
			} );
  			var testScroll =  uniDiv.offset();
  			console.dir(testScroll)
		}, 	
		_uniprotGenerateTableData : function (){
  			var self = this;
  			var aaData =[];
  			var rootUrl= "http://www.uniprot.org/keywords/";
  			
  			for (var i = 0; i < self.jsonData.uniprotKW.length; i++) {
  				var lineTable = [];
				var id = '';
				var def = '';
				var term ='';
				jQuery.each(self.jsonData.uniprotKW[i],function(name,info){
					if(name == 'term'){
						term = info;
						}
					if(name == 'definition'){
						
						def = self._cutAndTooltip(info, 170);				
					}
					if(name == 'id'){
						
						id = self._cutAndTooltip(info, 500, rootUrl+info);
					}

				});
				lineTable = [term,id,def]
				aaData.push(lineTable);
			  };
			return aaData;
  		},
 /*fin de bandeau unitKewrd
 *---------------------------------------------------------------------------------------------------------------
 *  événement la page
 */ 	
 		/*génération du bandeau barChart*/
 		_barchartOrganisator : function(){
 			var self = this;
 			if(!self.jsonData.location.expressionLevels){return}
			if(!self.jsonData.location.expressionLevels.data){return}
  			$(self.targetDomElem).append("<div class='content barChart' ></div>");
  			var barDiv = $(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar'><a cible = 'div.barChart' > Expression data</a></div>";
  			var chartSvg= "<div id = 'barChart'></div>";
  			barDiv.append(chartSvg);
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			optionBar = {data : self.jsonData.location, barChartDiv : "div#barChart"}
  			var bar = initBarChart (optionBar)
  			bar.draw();
 		},	
  		_addCheckSel : function(aaData,typeAdd){
  			var self = this ;
  			for (var i=0; i < aaData.length; i++) {
			 	aaData[i].push(self.cartButton[typeAdd])	
			 };
  		},
		_cutAndTooltip : function (string, sizeMax, link){
			var self = this ;
			var stringCut = string;
			if(string.length >= sizeMax){
				stringCut = string.substring(0,sizeMax-4) + "...";
				stringCut = '<span  data-toggle="tooltip" data-delay=\'{"show":"500", "hide":"500"}\' title="' + string + '">' + stringCut + '</span>';	
			}
			if(link){
				stringCut = '<a href = "' + link + '" target = "_blank" >' + stringCut + '</a>';
			}
			return stringCut;
		},
		_newRow : function(){
			var self = this;
			var infoDiv = $(self.targetDomElem).find("div.postitGeneral");
  			if(self.nbDiv%2 == 0 && self.nbDiv != 0){
  				infoDiv.append("<div class = 'row-fluid inPostit'></div>");	
  			}
  			
		},
		_showFeature : function(divCible){
			var self = this;
			var ulCible = $(divCible).parent().find("dl.downFeature");
			var iCible =  $(divCible).find("i");
			if (ulCible.is(":visible")){
				ulCible.slideUp();
				setTimeout(function(){iCible.removeClass("fa-sort-desc");iCible.addClass("fa-sort-asc");},400)
			}else{
				ulCible.slideDown();
				setTimeout(function(){iCible.removeClass("fa-sort-asc");iCible.addClass("fa-sort-desc");},400)
				
			}
		},
		_toggleArrow : function(iCible){
			var self = this;
			if(iCible.hasClass("fa-sort-asc")){
				iCible.removeClass("fa-sort-asc")
				iCible.addClass("fa-sort-desc")
			}else{
				iCible.removeClass("fa-sort-desc")
				iCible.addClass("fa-sort-asc")
			}
		},
/*fin événement sur la page
 *---------------------------------------------------------------------------------------------------------------
*/	
	}
}