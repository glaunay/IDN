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


/* Custom sorting function for images */
jQuery.fn.dataTableExt.oSort['species-asc']  = function(x,y) {

    var xAsString = $(x).attr('title'); 
    var yAsString = $(y).attr('title'); 
    
    return ((xAsString < yAsString) ? -1 : ((xAsString > yAsString) ?  1 : 0));
};
 
jQuery.fn.dataTableExt.oSort['species-desc'] = function(x,y) {
    var xAsString = $(x).attr('title'); 
    var yAsString = $(y).attr('title'); 
    
    return ((xAsString < yAsString) ?  1 : ((xAsString > yAsString) ? -1 : 0));
};




var tmp = $.fn.popover.Constructor.prototype.show;
$.fn.popover.Constructor.prototype.show = function () {
  tmp.call(this);
  if (this.options.callback) {
    this.options.callback();
  }
}

/*
GL 2014 30 06
 a div to ajax display the number of interactions reported in psicquicview and provide and hyperlink to
 the results page
	the div is inserted in table interact at the bottom of it
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
	    rootUrl : options.rootUrl ? options.rootUrl : 'http://matrixdb.ibcp.fr:9999', 
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
		testBinding : false,
		testMiscella : false,
		navBarTypeIcons : {
			"experiment"  : '<i class="fa fa-flask pull-left icon-white"></i>',
			"association" : '<i class="fa fa-link pull-left icon-white"></i>',
			"publication" : '<i class="fa fa-book pull-left icon-white"></i>',
			"biomolecule" : '<i class="fa fa-spinner pull-left icon-white"></i>',
			"author"      : '<i class="fa fa-user pull-left icon-white"></i>',
			"keywrd"	  : '<i class="fa fa-pencil-square-o pull-left icon-white"></i>'			
			},
		cartButton: {
			defaultAdd :'<div class="btn-group"><a class="btn btn-success btn-mini" ><i class="fa fa-pencil"></i></a><a class="btn btn-default btn-mini"><i class="fa fa-shopping-cart "></i></a></div>',
			biomAdd : '<div class="btn-group"><a class="btn btn-success btn-mini" ><i class="fa fa-spinner"></i></a><a class="btn btn-default btn-mini"><i class="fa fa-shopping-cart "></i></a></div>',
			publiAdd : '<div class="btn-group"><a class="btn btn-success btn-mini" ><i class="fa fa-book"></i></a><a class="btn btn-default btn-mini"><i class="fa fa-shopping-cart "></i></a></div>',
			},
		helpLink : {
			"experiment"  : {
								title :"Here you can browse all data related to an experiment.",
								content : '<i class="fa fa-hand-o-right"></i> additional help can be found <a href = "https://www.youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg" target = "_blank">Here</a>',
							 	html  : true,
							 	placement : "bottom",
							 	container : "div#reportDiv",
							 	trigger : "manual"
							 },
			"association" : {
								title :"Here you can browse all data related to an association.",
								content : '<i class="fa fa-hand-o-right"></i> additional help can be found <a href = "https://www.youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg" target = "_blank">Here</a>',
							 	html  : true,
							 	placement : "bottom",
							 	container : "div#reportDiv",
							 	trigger : "manual"
							 },
			"publication" : {
								title :"Here you can browse all data related to a publication.",
								content : '<i class="fa fa-hand-o-right"></i> additional help can be found <a href = "https://www.youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg" target = "_blank">Here</a>',
							 	html  : true,
							 	placement : "bottom",
							 	container : "div#reportDiv",
							 	trigger : "manual"
							 },
			"biomolecule" : {
								title :"Here you can browse all data related to a biomolecule.",
								content : '<i class="fa fa-hand-o-right"></i> additional help can be found <a href = "https://www.youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg" target = "_blank">Here</a>',
							 	html  : true,
							 	placement : "bottom",
							 	container : "div#reportDiv",
							 	trigger : "manual"
							 },
			"author"      : {
								title :"Here you can browse all data related to an author.",
								content : '<i class="fa fa-hand-o-right"></i> additional help can be found <a href = "https://www.youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg" target = "_blank">Here</a>',
							 	html  : true,
							 	placement : "bottom",
							 	container : "div#reportDiv",
							 	trigger : "manual"
							 },
			"keywrd"	  : {
								title :"Here you can browse all data related to a UniprotKB keyword.",
								content : '<i class="fa fa-hand-o-right"></i> additional help can be found <a href = "http://youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg" target = "_blank">Here</a>',
							 	html  : true,
							 	placement : "bottom",
							 	container : "div#reportDiv",
							 	trigger : "manual"
							 },
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
	psicquicViewHotPatch : function () {
		var scaffold = '<div id="psicquicView" class="row-fluid"><div class="span2 psqLogo"><img class="pull-left" src="' + this.rootUrl + 
			'/img/psicquic.png"></img></div>'
			+ '<div class="psqStatus span8"><div class="row-fluid"><div class="psqTitle span12">Psicquic remote querying</div><div class="span12">Expanding to non-ECM partners</div></div></div>' 
			+'<div class="psqFont span2"><i class="fa fa-spinner fa-spin fa-2x"></i></div>' 
			+'</div>';	
			$('.tableInteract').append(scaffold);
			var self = this;
			var name;
			if (this.jsonData.xref){
				this.jsonData.xref.forEach(function(elem){
					if(elem.hasOwnProperty('EBI_xref')) {
						console.dir(elem.EBI_xref);
						name = elem.EBI_xref;							
					}	
					if(elem.hasOwnProperty('CheBI_identifier')) {
						console.dir(elem.CheBI_identifier);
						name = elem.CheBI_identifier;							
					}	
	
				})
			}
			name = name ? name : this.jsonData.name;
			console.log(name);
			var data = { biomolecule : name };
			var text = JSON.stringify(data);
	setTimeout  (function (){
			var jqxhr = $.ajax({
		            contentType: 'application/json',
        		     	dataType : "json",
		             	cache : false,
				data : { data : text },	
				url : self.rootUrl + "/cgi-bin/current/psicquicRelay"					
				})
  				.success(function (data) {
					if (data.number) {
					$(".psqStatus").empty()
							.append('<div class="row-fluid"><div class="psqTitle span12">Psicquic remote querying</div><div><a href="' + data.url + '" target="_blank">'
								+ data.number + ' interactions found in psicquic</a></div></div>');
						$(".psqFont").empty()
							.append('<i class="fa fa-2x fa-check-circle"></i>');
					} else {
						$(".psqStatus").empty().addClass("psqError")
							.append('<div class="row-fluid"><div class="psqTitle span12">Psicquic remote querying</div><div class="span12">Sorry, unable to contact service</div></div>');
						$(".psqFont").empty().addClass("psqError")
							.append('<i class="fa fa-2x fa-exclamation-circle"></i>');
					}
	
				})
				.error(function(){
			
				})
				.complete(function(){
					
				});	
	}, 2000);

	
	},	

  		_draw : function(){//dessine les composant en fonction du type de data
  			var self = this;
  			var data = data;
  			console.log('v data for this page v')
  			console.dir(self.jsonData);
  			var imgPath = self.rootUrl === 'HTML' ? 'img' : '../../img';
	    	imgPath += '/matrixdb_logo_medium.png';
  			var navBar = '<nav class="navbar header navbar-fixed-top" role="navigation"><div class=" header">'+
  						 '<span id ="topLogo"><a style = "float:left;" href = "' + self.rootUrl + '">'+
  						 '<img src="' + imgPath + '" alt="Smiley face" height="40px" width="40px"></a> '+ 
  						 self.navBarTypeIcons[self.jsonData.type] + '</span><i class = "fa fa-question-circle helpMe"></i></div></nav>';
  			$(self.targetDomElem).append(navBar);
  			var header = $(self.targetDomElem).find("nav.header>div");
  			header.append('<div id="testCart" class = "cart"></div>');
  			if(!self.jsonData.type){
  				$(self.targetDomElem).append("<div class = 'noMatch'><h4> Sorry this type is wrong</h4><a href  ='" +
  											  self.rootUrl + "'> Click here to go to index </a></div>");
  				return;
  			}
  			if(!self.jsonData.name){
  				$(self.targetDomElem).append("<div class = 'noMatch'><h4> Sorry no result with this " + 
  											 self.jsonData.type + " in Matrix DB</h4><a href  ='" + self.rootUrl +
  											 "'> Click here to go to index </a></div>");
  				return;
  			}
  			$(self.targetDomElem).find('i.helpMe').popover(self.helpLink[self.jsonData.type])
			   .on("mouseenter", function () {
		        var _this = this;
		        $(_this).popover('show');
		        $(".popover").on("mouseleave", function () {
		            $(_this).popover('hide');
		        });
		    }).on("mouseleave", function () {
		    	if(!window.showHelp){return;}
		        var _this = this;
		        setTimeout(function () {
		            if (!$(".popover:hover").length) {
		                $(_this).popover("hide")
		            }
		        }, 100);
		       })
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
					$(self.targetDomElem).find("i.startMolView").click(function(){
						$(this).remove();
						try {
							widget.draw(nodeTest);
							$("#elementInfo").addClass("reportEi");
							$("#elementInfo").children('*').addClass("reportEi");


					            }
						catch (err) {
							self._errMessPdb();
							console.dir("error num = " + err)
						}

					});
    				
				}
  			}
  			if (self.jsonData.type == 'experiment'){
  				self._infoOrganisatorXp();
  				self._partnerOrganisator();
  				$(self.targetDomElem).find('dd').each(function(){
  					$(this).html(_linkMi($(this).html()));
  				})
  			}
  			if (self.jsonData.type == 'association'){
  				self._associationOrganisator();
  			}
  			if (self.jsonData.type == 'publication'){
  				self._publicationOrganisator();
  			}
  			if (self.jsonData.type == 'author'){
  				self._authorOrganisator();
  			}
  			if(self.jsonData.type == 'keywrd'){
  				self._uniProtWord();
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
			$(self.targetDomElem).find("span.addCart.kewrd").click(function(){self.addCartCallback({type : "keyword" , value : $( this ).attr("name")})});
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
  		
			this.psicquicViewHotPatch();
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
  			
  			var domainDivHtml = self._domainGenerateDivHtml();
  			if(domainDivHtml){infoDiv.append(domainDivHtml);}
  			
  			infoDiv.append(divSpan);
  			
  			var ftDivHtml = self._ftGenerateDivHtml();
  			if(ftDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(ftDivHtml);}
  			
  			var pdbDivHtml = self._pdbGenerateDivHtml();
  			if(pdbDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(pdbDivHtml);}
  			
  			var complexDivHtml = self._complexGenerateDivHtml();
  			if(complexDivHtml){infoDiv.find('div.row-fluid.inPostit:last-child').append(complexDivHtml);}
  			
  			var bioProssDivHtml = self._bioProssGenerateDivHtml();
  			if(bioProssDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(bioProssDivHtml);}

  			var externalRefDivHtml = self._externalRefGenerateDivHtml();
  			if(externalRefDivHtml){infoDiv.find(' div.row-fluid.inPostit:last-child').append(externalRefDivHtml);}
  			
  			$(self.targetDomElem).find('div.inPostit div.span6:last-child > div:nth-child(2)').attr("class","odd");
  			$(self.targetDomElem).find('div.inPostit div.span6:first-child > div:nth-child(3)').attr("class","odd");
  			infoDiv.find("div.postitSpecie").tooltip()
  			
  		},
  		/*méthode de génération des div
  		 */
  		_pdbGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.pdb){return false;}
  			self.nbDiv++
  			var divCible = self._newRow(barchart);
  			var content ="<div class ='divTitre'>Structure</div><div class = 'pdb postitContent'>";
  			content += self._pdbList() + "<div id = 'molView' ><i class='startMolView fa fa-eye'></i></div></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6'><div class =' " + classSpan + " pdbMolViewPostit'>" + content + "</div></div>" ;
  			if (divCible){
  				divCible.append("<div class = '" + classSpan + " pdbMolViewPostit'>" + content + "</div>");
  				return false;
  			}
  			return divString;
  		},
  		_domainGenerateDivHtml : function(){
  			var self = this;
  			if(!self.jsonData.pfam && !self.jsonData.interpro){return false;}
  			var content = "<div class ='divTitre'>Domain annotations</div><div class = 'postitContent'><dl>";
  			content += self._domainAnnot() + "</dl></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'row-fluid'><div class = 'span12 domainAnnot'>" + content + "</div></div>" ;
  			return divString;
  		},
  		_complexGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.stoichiometry && !self.jsonData.relationship  && !self.jsonData.moreInfo){return false;}
  			if(!self.jsonData.relationship.In_multimer[0] && !self.jsonData.relationship.Component[0]){return false;}
  			self.nbDiv++
  			var divCible = self._newRow(barchart);
  			var content ="<div class = 'divTitre'> Complex information</div><div class = 'infoComplex postitContent'><dl>";
  			content += self._moreInfo() + self._multmer() +self._stoichiometrie()  + "</dl></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6'><div class =' " + classSpan + "'>" + content + "</div></div>" ;
  			if (divCible){
  				divCible.append("<div class = '" + classSpan + "'>" + content + "</div>");
  				return false;
  			}
  			return divString;
  		},
  		_bioProssGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.relationship){return false;}
  			if(!self.jsonData.relationship.ContainsFragment[0] && !self.jsonData.relationship.Belongs_to[0] && !self.jsonData.relationship.Bound_Coval_to[0]){return false;}
  			self.nbDiv++
  			var divCible = self._newRow(barchart);
  			var content ="<div class = 'divTitre'> Biological processing</div><div class = 'Biopross postitContent'><dl>";
  			content += self._process() + self._belongTo() + self._covalent() + "</dl></div>";
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6'><div class =' " + classSpan + "'>" + content + "</div></div>" ;
  			if (divCible){
  				divCible.append("<div class = '" + classSpan + "'>" + content + "</div>");
  				return false;
  			}
  			return divString;
  		},
  		_externalRefGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.xref && !self._nameAccess()){return false;}
  			self.nbDiv++
  			var mapper = {
				"Molecule_Processing" : {url : "http://www.uniprot.org/uniprot/", term : "Uniprot fragment"},  				
  				"CheBI_identifier" : {url : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=", term : "CheBI"},
  				"KEGG_Compound" : {url : "http://www.genome.jp/dbget-bin/www_bget?cpd:", term : "KEGG"},
  				"EBI_xref" : {url : "http://www.ebi.ac.uk/intact/complex/details/", term : "EBI"},
  				"LipidMaps": {url : "http://www.lipidmaps.org/data/LMSDRecord.php?LMID=", term : "LipidMaps"},
  			}
  			
  			var divCible = self._newRow(barchart);
  			var content ="<div class ='divTitre'>Cross reference <i class='fa fa-external-link ' style = 'margin-top 5px'></i></div><div class = 'divers postitContent'><dl>";
  			if(self._nameAccess()){content += "<dt class ='hReport'>Uniprot reference:</dt><dd><a target = '_blank' href = 'http://www.uniprot.org/uniprot/" + self.jsonData.name + "'>" + self.jsonData.name + "</a></dd>";}
  			if(self.jsonData.xref){
  				for (var i=0; i < self.jsonData.xref.length; i++) {
			 		$.each(self.jsonData.xref[i], function(name,id){
			 			if(name=="Molecule_Processing"){
			 				content += "<dt class ='hReport'>" + mapper[name].term +":</dt><dd><a target = '_blank' href = '" + mapper[name].url + self.jsonData.relationship.Belongs_to[0] + '#' +id + "'>" + id +"</a></dd>"
			 			}else{
			 				content += "<dt class ='hReport'>" + mapper[name].term +":</dt><dd><a target = '_blank' href = '" + mapper[name].url + id + "'>" + id +"</a></dd>"
			 			}
			 		});
				};
			}
			content += "</dl></div>"
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6'><div class =' " + classSpan + "'>" + content + "</div></div>" ;
  			if (divCible){
  				divCible.append("<div class = '" + classSpan + "'>" + content + "</div>");
  				return false
  			}
  			return divString;
  		},
  		_nameGenerateDivHtml : function(barchart){
  			var self = this;
  			var subtype = self.jsonData.subType.charAt(0).toUpperCase() + self.jsonData.subType.slice(1);
  			var specie = self.jsonData.specie.names ? self.jsonData.specie.names[1] : "Universal";
  			var taxonId = self.jsonData.specie.value ? self.jsonData.specie.value : "NA";
  			var tooltip = "<div>Specie : " + specie + "</div><div> Taxon id : " + taxonId + "</div>"; 
  			var linkSpeci = self.jsonData.specie.value ? 
  							'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=' + self.jsonData.specie.value :
  							'http://www.ncbi.nlm.nih.gov/Taxonomy';
			var content = "<span class = 'reportType'>" + subtype + "</span><div class ='divTitre special'>" + self.jsonData.name + "<div class = ' tooltipContent postitSpecie' "+
			              'data-container = "body" data-html = "true" data-placement = "left" data-toggle="tooltip" data-delay=\'{"show":"1000", "hide":"1000"}\' data-title = "' + tooltip + '">'+
			              '<a target = "_blank" href = "' + linkSpeci + '"><img ' + speciUrl(self.jsonData.specie.value,self.rootUrl) + '>'+
						  "</img></a></div></div><div class = 'name postitContent'><span class = 'cartBio'>" + self.cartButton.biomAdd + "</span><dl>";
			content += self._names() + self._gene() + self._specie() + self._molWeight() + self._aaNumber() + "</dl></div>"
  			var divString ="<div class = 'row-fluid'><div class = 'span12 general'>" + content + "</div></div>" ;
  			return divString;
  		},
  		_ftGenerateDivHtml : function(barchart){
  			var self = this;
  			if(!self.jsonData.biofunc && !self.jsonData.comments && !self.jsonData.location && !self.jsonData.location.comments && !self.jsonData.location.compartiment){return false;}
  			self.nbDiv++;
  			var divCible = self._newRow(barchart);
  			var content = "<div class ='divTitre'>Biological function and location</div><div class = 'divers postitContent'><dl>";
  			content += self._biofunc() + self._commentsName() + self._location() + "</dl></div>";
  			if(self.nbDiv == 0 || self.nbDiv == 3 || self.nbDiv==4){var classSpan = "odd"}
  			else{var classSpan = "even"}
  			var divString = "<div class = 'span6'><div class =' " + classSpan + "'>" + content + "</div></div>" ;
  			if (divCible){
  				divCible.append("<div class = '" + classSpan + "'>" + content + "</div>");
  				return false;
  			}
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
		_specie : function(data){
			var self = this;
			if(data){
				var specieString =  data[0];
				for (var i = 1; i <  data.length; i++) {
				   specieString += ', ' + data[i];
				};
				
			}else{
				if(!self.jsonData.specie.name){return "";}
				var nom =  self.jsonData.specie.names[0];
				for (var i = 1; i <  self.jsonData.specie.names.length; i++) {
				   nom += ', ' + self.jsonData.specie.names[i];
				};
				var specieString ="<dt class ='hReport'>Specie:</dt><dd> <a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=" + self.jsonData.specie.value + "'>" + nom + " <i class='fa fa-external-link'></i></a></dd>";
				
			}
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
	       // GL comments are disabled if dealing with multimeric complex
  		_commentsName : function(){
  			var self = this;
  			if(!self.jsonData.comments)
			    return "";
  			if(self.jsonData.subType ===  "multimeric complex")
			    return "";
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
  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value="
  			if(!self.jsonData.relationship.In_multimer[0]){return "";}
  			var line = "<dt class ='hReport'>In multimer:</dt><dd>";
  			for (var i=0; i < self.jsonData.relationship.In_multimer.length; i++) {
			 	line += "<a target ='_blank' href = '" + rootUrl + self.jsonData.relationship.In_multimer[i] + "'>" + self.jsonData.relationship.In_multimer[i] + "</a>, ";
			  };
			  line = line.substring(0,line.length - 2);
			  line += '</dd>';
  			return line;
  		},
  		_stoichiometrie : function(){
  			var self = this;
  			if(!self.jsonData.stoichiometry){return "";}
  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value=";
  			var returnString = "<dt class ='hReport'>Stoichiometry:</dt><dd>" + self.jsonData.stoichiometry + "</dd>";
  			for (var i=0; i < self.jsonData.relationship.Component.length; i++) {
  				var reg = new RegExp (self.jsonData.relationship.Component[i]);
			 	var replaceString = "<a target ='_blank' href = '" + rootUrl +self.jsonData.relationship.Component[i] + "'>" + self.jsonData.relationship.Component[i] + "</a>";
			 	returnString = returnString.replace(reg, replaceString);
			 };
  			return returnString
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
			if(self.jsonData.location.comments){
				line += "<dt class ='hReport'>Comment:</dt><dd>" + self.jsonData.location.comments + "</dd>";
			}
  			return line;
  		},
  		_process : function(){
  			var self = this;
  			if(!self.jsonData.relationship){return "";}
  			if(!self.jsonData.relationship.ContainsFragment[0]){return "";}
  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value="
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
  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value="
  			var line = "<dt class ='hReport'>Processed from:</dt><dd>";
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
  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value="
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
  			var regex1 = /[A-N,R-Z][0-9][A-Z][A-Z, 0-9][A-Z, 0-9][0-9]/i;
			var regex2 = /[O,P,Q][0-9][A-Z, 0-9][A-Z, 0-9][A-Z, 0-9][0-9]/i;
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
				navTitle =  self.jsonData.partnerDetails[0].name + ' Homodimer experiment';
			} else {
				navTitle =  self.jsonData.partnerDetails[0].name + '-' +
				self.jsonData.partnerDetails[1].name + ' Heterodimer experiment';
			}
		
			$(self.targetDomElem).append("<div class='contentXp infoXp' ><div class='centralXp' ></div></div>");
  			var infoDiv =$(self.targetDomElem).find("div.contentXp:last div.centralXp");
  			
  			var ancre = "<div class = 'navigueBar reportTarget'><a cible = 'div.infoXp' >" + navTitle + "</a></div>";
  			//var titre = "<div id = 'infoXp'></div><h3> Information on " + self.jsonData.name + " experiment</h3>";
  			//titre = titre.replace(/__/,' & ')
  			//titre = titre.replace(/_/g, ' ');
  			
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
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
			if(self.jsonData.partnerDetails.length == 2){
				listeSpeci.push("<span class = 'reportType'> Experiment </span><div class = 'divTitreGeneral divTitre special'>" +
								self.jsonData.partnerDetails[0].commonName + '</span></br> and <span></br>' + 
								self.jsonData.partnerDetails[1].commonName + " </span></div>");
			}else{
				listeSpeci.push("<span class = 'reportType'> Experiment </span><div class = 'divTitreGeneral special divTitre'>  <span> " +
								self.jsonData.partnerDetails[0].commonName + '</span></div>');
			}
			listeSpeci.push( '<dt class ="hReport">Identifier:</dt><dd> ' + self.jsonData.name + "</dd>");
			listeSpeci.push(self._imexId());
			listeSpeci.push(self._database());
			listeSpeci.push(self._creationDate());
			listeSpeci.push(self._update());
			listeSpeci.push(self._assoLink());
			listeSpeci.push(self._xrefList());
			listeSpeci.push(self._generalComment());
			listeSpeci.push(self._bindingSiteComment());
			listeSpeci.push(self._cautionComment());
			listeSpeci.push(self._confidence());
			listeSpeci.push(self._host());
			listeSpeci.push(self._compartment());
			listeSpeci.push(self._cellLine());
			listeSpeci.push(self._interactDetectMethod());
			listeSpeci.push(self._interactionType());
			listeSpeci.push(self._positiveControl());
			listeSpeci.push(self._experimentModif());
			
			var tempForPubli = "<dt class = 'hReport'>Supporting Information:</dt> <dd>" + self._publication() + self._file() + self._table() + self._figure();
			tempForPubli = tempForPubli.substring(0,tempForPubli.length - 2);
			tempForPubli += "</dd>";
			listeSpeci.push(tempForPubli);
			_clean("xpDetail");

			
			for (var i=0; i < listeForAllOrganiser.length; i++) {
				lineFinal += "<div class = 'row-fluid' ><div style = 'margin-top: 20px;' class = 'span12 " +  listeForAllOrganiser[i][listeForAllOrganiser[i].length-1] + "'>";
				
				for (var j=0; j < listeForAllOrganiser[i].length - 1; j++) {
					if(j==1){ lineFinal += "<div class ='featureContent'><dl>"}
					lineFinal += listeForAllOrganiser[i][j] ;
				};
				
				lineFinal +="</dl></div></div>"
				
			};
			if(listeForAllOrganiser.length%2 == 0){lineFinal += "</div>";}
			coteInfo.append(lineFinal);
			/*kinetic */
			var affinity = ''
			if(self.jsonData.affinityKinetic){
				var affinity
				affinity += "<div class ='kinetic'><div class = 'divTitreKinetic divTitre'>Kinetics and Affinity</div><dl class ='featureContent'>"+
							self._associationRate() + self._dissociation() + self._kd() + '</dl></div>';
			}
			coteInfo.find("div.xpDetail").append(affinity);
		},
		/*methode info*/
		_interaction : function(){
			var self = this;
			if(!self.jsonData.association){return }
			var assoc = self.jsonData.association.split('__')
			var lineString = '<dt class ="hReport">Interaction between:</dt><dd> '
			var RootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value="
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
			var returnString = '<dt class ="hReport">Supports the following interaction:</dt>';
			for (var i=0; i < self.jsonData.association.length; i++) {
			 returnString+= '<dd><a target = "_blank" href ="' + this.rootUrl + '/cgi-bin/current/newPort?type=association&value=' + self.jsonData.association[i] + '">' + self.jsonData.association[i] + "</a></dd>";
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
			var regDip = /-[0-9]+E/;
			var innateReg = /[0-9]+$/; 
			var mapper = {
				"DIP_xref": "<a target = '_blank' href = 'http://dip.doe-mbi.ucla.edu/dip/Main.cgi'>DIP</a>",
			};
			var returnString = '<dt class ="hReport">External reference:</dt><dd> ';
			for (var i=0; i < self.jsonData.xrefList.length; i++) {
				if (self.jsonData.xrefList[i].provider == "DIP_xref" ){
					var dipNode = self.jsonData.xrefList[i].value.match(regDip);
					returnString += "<a target = '_blank' href = 'http://dip.doe-mbi.ucla.edu/dip/DIPview.cgi?IK=" + 
					dipNode[0].substring(1,dipNode[0].length-1) + "'>DIP <i class='fa fa-external-link'></i></a>, "
				}if(self.jsonData.xrefList[i].provider == "IntAct_xref"){
					returnString += "<a target = '_blank' href = 'http://www.ebi.ac.uk/intact/interaction/" + 
					self.jsonData.xrefList[i].value +"'>IntAct <i class='fa fa-external-link'></i></a>, "
				}if(self.jsonData.xrefList[i].provider == "InnateDB_xref"){
					var innateNode = self.jsonData.xrefList[i].value.match(innateReg);
					returnString += "<a target = '_blank' href = 'http://www.innatedb.com/getInteractionCard.do?id=" + 
					innateNode[0] + "'>InnateDB <i class='fa fa-external-link'></i></a>, ";
				}if(self.jsonData.xrefList[i].provider == "MINT_xref"){
					
				}
			};
			returnString = returnString.substring(0,returnString.length -2);
			returnString += "</dd>";//liens a créer
			return returnString
		},
		_publication : function(){
			var self = this;
			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=publication&value="
			if(!self.jsonData.publication){return}
			if (self.jsonData.publication instanceof Array) {
				var returnString = '<dt >PubMed reference:</dt>';
				var star = '<i class="fa fa-star-o"></i>'
				for (var i=0; i < self.jsonData.publication.length; i++) {
					if(self.jsonData.publication[i].imexId){
						star = '<i class="fa fa-star" style = "color:yellow;"></i>';
					}
					returnString += '<dd> <a target = "_blank" href ="' + rootUrl  + self.jsonData.publication[i].name + '">' + 
									self.jsonData.publication[i].name + '</a> '+ star +
									'<span class = "addCart publi pull-right" name ="' + self.jsonData.publication[i] + '">' + 
									self.cartButton.publiAdd + '</span></dd>';
				};
				return returnString;
			}
			else{
				return 'PubMed reference: <a target = "_blank" href ="' + rootUrl + self.jsonData.publication + '">' + self.jsonData.publication + "</a>, ";
			}
		},
		_table : function(){
			var self = this;
			if(!self.jsonData.table){return "";}
			return 'Table: ' + self.jsonData.table + ", ";
		},
		_figure : function(){
			var self = this;
			if(!self.jsonData.figure){return "";}
			return 'Figure: ' + self.jsonData.figure + ", ";
		},
		_file : function(){
			var self = this;
			if(!self.jsonData.file){return "";}
			return 'File: ' + self.jsonData.file + ", ";
		},
		_imexId : function(){
			var self = this;
			if(!self.jsonData.imexExperimentId){return}
			return '<dt class ="hReport">Imex-id for this experiment:</dt><dd> ' + self.jsonData.imexExperimentId + "</dd>";
		},
		/*méthode kinetic*/
		_associationRate : function(){
			var self = this;
			if(!self.jsonData.affinityKinetic.AssociationRate1){return '';}
			var string = '<dt class ="hReport">Association rate (ka):</dt><dd> ' + self.jsonData.affinityKinetic.AssociationRate1 + ' <span class="unit">M-1s-1</span></dd>';
                        if(self.jsonData.affinityKinetic.AssociationRate2_MS){
				string += '<dt class ="hReport">Association rate 2(ka):</dt><dd> ' + self.jsonData.affinityKinetic.AssociationRate2_MS + ' <span class="unit">M-1s-1</span></dd>';
			} else if(self.jsonData.affinityKinetic.AssociationRate2_S) {
				string += '<dt class ="hReport">Association rate 2(ka):</dt><dd> ' + self.jsonData.affinityKinetic.AssociationRate2_S + ' <span class="unit">s-1</span></dd>';
			}	
			return string;
		},
		_dissociation : function(){
			var self = this;
			if(!self.jsonData.affinityKinetic.DissociationRate1){return '';}
			var string = '<dt class ="hReport">Dissociation rate (kd):</dt><dd> ' + self.jsonData.affinityKinetic.DissociationRate1 + ' <span class="unit">s-1</span></dd>';
			if(self.jsonData.affinityKinetic.DissociationRate2){
				string += '<dt class ="hReport">Dissociation rate 2 (kd):</dt><dd> ' + self.jsonData.affinityKinetic.DissociationRate2 + ' <span class="unit">s-1</span></dd>';
			}	 
			return string;
		},
		_kd : function(){
			var self = this;
			if(!self.jsonData.affinityKinetic.KD1_nM){return '';}
			var string = '<dt class ="hReport">Affinity (KD) :</dt><dd> ' + self.jsonData.affinityKinetic.KD1_nM + ' <span class="unit">nM</span></dd>';
			if(self.jsonData.affinityKinetic.KD2_nM){
				string += '<dt class ="hReport">Affinity 2 (KD) :</dt><dd> ' + self.jsonData.affinityKinetic.KD2_nM + ' <span class="unit">nM</span></dd>';
			}
			return string;
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
  			var ancre = "<div class = 'navigueBar'><a cible = 'div.partner' >Participants features </a></div>";
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			var scaffold = complexType === 'heteroDimer' 
  				? '<div class = "row-fluid"><div class = "span12  partcipants"><div class = "divTitre">Participant features</div>'+
  				  '<div class = "row-fluid"><div class = "span6 partner1"></div><div class = "span6 partner2"></div></div>'
  				: '<div class = "row-fluid "><div class = "span12 partcipants partner1"></div></div></div></div>'
  			partnerDiv.append(scaffold);
  			var doubleInfo = false;
  			if(complexType === 'heteroDimer' && self.jsonData.partnerDetails[0].feature && self.jsonData.partnerDetails[1].feature){
	  			if(self.jsonData.partnerDetails[0].feature.bindingSite && self.jsonData.partnerDetails[1].feature.bindingSite){
	  				var doubleInfo = true;
	  				var bindingSiteLine = '<div class = "bindingSite" ><div class="divTitre"> Binding site </div>'+
	  									  ' <div class = "row-fluid">'+
	  									  '<div class = "span6"><dl class = "partner1 downFeature"></dl></div>'+
	  									  '<div class = "span6"><dl class = "partner2 downFeature"></dl></div></div></div>';
	  			}
  			}
  			for (var i=0; i < self.jsonData.partnerDetails.length; i++) {
  				var lineString = '';
  				var partner;
				if(i == 0){partner = partnerDiv.find('.partner1');}
				else{partner = partnerDiv.find('.partner2');}
				
				lineString += self._namePartner(i);
				lineString += "<span class ='addCart biom' name = '" + self.jsonData.partnerDetails[i].name + "'>" + self.cartButton.biomAdd + "</span>";
				lineString += "<div class= 'featureContent'><dl>";
				lineString += self._bioRole(i);
				lineString += self._detectionMethod(i);
				lineString += self._role(i);
				lineString += self._expression(i);
				lineString += self._isoform(i);
				lineString += self._stochiometrie(i);
				lineString += self._strainDetails(i);
					if(self.jsonData.partnerDetails[i].feature && self.jsonData.partnerDetails[i].feature.miscellaneous){
					lineString += self._miscella(self.jsonData.partnerDetails[i].feature.miscellaneous.data)
				}
				if(self.jsonData.partnerDetails[i].feature && self.jsonData.partnerDetails[i].feature.ptm){
					lineString += self._ptm(self.jsonData.partnerDetails[i].feature.ptm.data)
				}
				lineString += "</dl></div>";
				partner.append(lineString);
				if(self.jsonData.partnerDetails[i].feature && self.jsonData.partnerDetails[i].feature.bindingSite && !doubleInfo){
					partner.append(self._bindingSite(self.jsonData.partnerDetails[i].feature.bindingSite.data, doubleInfo));
				}
				
				
				//self._structurePdb(i);
			  };
			  if (doubleInfo) {
			  	partnerDiv.find("div.partcipants").append(bindingSiteLine);
			  	partnerDiv.find("div.bindingSite dl.partner1").append(self._bindingSite( self.jsonData.partnerDetails[0].feature.bindingSite.data, doubleInfo));
			  	partnerDiv.find("div.bindingSite dl.partner2").append(self._bindingSite( self.jsonData.partnerDetails[1].feature.bindingSite.data, doubleInfo));
			  	
			  };
			  var scaffold = complexType === 'heteroDimer' 
  				? '<div class = "row-fluid"><div class = "span6 muta partner1"></div>'+
  				  '<div class= "span6 muta partner2"></div></div>'
  				: '<div class = "row-fluid "><div class = "span12 muta partner1"></div></div></div></div>';
  			  console.dir(partnerDiv.find("div.partcipants"))
			  partnerDiv.find("div.partcipants").append(scaffold)
			  partnerDiv.find('.partner1.muta').append(self._feature(0, true));
			  if(complexType === 'heteroDimer' ){
			  	partnerDiv.find('.partner2.muta').append(self._feature(1, true));
			  }
			  if(partnerDiv.find('.partner1.muta table')){
			  	partnerDiv.find('.partner1.muta .divTitre').css({
			  		"background-color": "rgb(24, 145, 255)",
			  	});
			  	partnerDiv.find('.partner1.muta table').css({
			  		"background-color": "rgba(24, 145, 255, 0.6)",
			  	});
			  }
			  if(partnerDiv.find('.partner2.muta table')){
			  	partnerDiv.find('.partner2.muta table').css({
			  		"background-color" :"rgba(69, 152, 228, 0.6)",
			  	});
			  	partnerDiv.find('.partner2.muta .divTitre').css({
			  		"background-color" :"rgba(69, 152, 228, 1)",
			  	});
			  }
  			
		},
		_namePartner : function(index){
			var self = this;
			if(!self.jsonData.partnerDetails[index].name){return '';}
			var logoBullet = '<div class = "bulletSpecie"><img ' + speciUrl(false,self.rootUrl) + ' ></img></div>';
			if(self.jsonData.partnerDetails[index].specie){
				logoBullet = '<div class = "bulletSpecie"><img ' + speciUrl(self.jsonData.partnerDetails[index].specie,self.rootUrl) + ' ></img></div>';
			}
			var RootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value="
			var lineString = '<div class="divTitre feature" >';
			lineString += logoBullet + '<a target = "_blank" href = "' + RootUrl + self.jsonData.partnerDetails[index].name + '">' + 
						  self.jsonData.partnerDetails[index].commonName +'</a>'
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
			return '<dt class ="hReport">Experimental role:</dt><dd> ' + self.jsonData.partnerDetails[index].experimentalRole + "</dd>";
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
		_feature : function(index, doubleInfo){
			var self = this;
			var feature = ''
			if(!self.jsonData.partnerDetails[index].feature){return}
			var feature = ''
			$.each(self.jsonData.partnerDetails[index].feature, function(type,data){
				
				if(!data){return}
				if(data.type == "bindingSiteData" && !doubleInfo){feature +=self._bindingSite(data.data)}
				if(type == "pointMutation"){feature +=self._mutation(data.data)}
			});
			feature += ''
			return feature;
		},
		_miscella : function(data){
			var self = this;
			
			var returnString = '';
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
			return returnString;
		},
		_bindingSite : function(data,doubleInfo){
			var self = this;
			console.dir(data)
			var returnString = '<div class = "bindingSite" ><div class="divTitre"> Binding site </div><dl class = "downFeature">';
			if(doubleInfo){
				returnString = '';
			}
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
		_mutation : function(data){
			var self = this;
			
			var mutationType = {
				unknown : '<i class="fa fa-question"></i>',
				"mutation_decreasing_interaction" : '<i class="fa fa-arrow-right fa-rotate-45"></i>',
				"mutation_increasing_interaction" : '<i class="fa fa-arrow-up fa-rotate-45"></i>',
				"mutation" : '<i class="fa fa-question"></i>',
			}
			var returnString = '<div class = "mutation" ><div class="divTitre"> Mutation </div>'+
							   '<table class = "mutationTable table table-striped">'+
							   '<tr class = "header"><td> Position </td><td> Effect on the interaction</td></tr>';
			for (var i=0; i < data.length; i++) {
			  var nameMutationList = [];
			  var typeMutation = data[i].mutationType ? mutationType[data[i].mutationType] : mutationType.unknown;
			  if(data[i].mutationData.name){
			  	$.merge(nameMutationList, self._nameMutation(data[i].mutationData.name));
			  }else{
			  	$.merge(nameMutationList, self._rangeNameMutation(data[i].mutationData.rangeData));
			  }
			  console.dir(i)
			  for (var j=0; j < nameMutationList.length; j++) {
				returnString += '<tr class = "body"><td> ' + nameMutationList[j].toUpperCase() + ' </td><td>' + typeMutation + '</td></tr>'
			  };
			  console.dir(i)
			};
			return returnString;
		},
		_nameMutation : function(nameData){
			var nameTable = nameData.split("_");
			return nameTable;
		},
		_rangeNameMutation : function(rangeData){
			var self = this;
			var returnTable = [];
			for (var i=0; i < rangeData.length; i++) {
				if(rangeData[i].Position_end === rangeData[i].Position_start){
					returnTable.push("???"+rangeData[i].Position_end+"???")
				}else{
					returnTable.push(rangeData[i].Position_start + " to " + rangeData[i].Position_end);
				}
			    	
			};
			return returnTable;
		},
		_ptm : function(data){
			var self = this ;
			var returnString = "";
			for (var i=0; i < data.length; i++) {
			  var posi = data[i].ptmData.rangeData[0].Position_end;
			  if (data[i].ptmChoice ==="required"){
			  	returnString += '<dt class ="hReport">Required Ptm :</dt><dd>' + data[i].ptmType.replace("_"," ") + " " + posi + "</dd>";
			  }else{
			  	returnString += '<dt class ="hReport">Ptm :</dt><dd>' + data[i].ptmType.replace("_"," ") + " " + posi + "</dd>";
			  }
			};
			return returnString;
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
			// nbXp += data.aaData[i][1];
			data.aaData[i][1] ='<span index = "' + i + '">'+ data.aaData[i][1] + '</span> <i class="fa fa-info-circle"></i>';
		    };
  		    var plural =  data.aaData.length > 1 ? 's' : ''; 
  		    var titre = "<div class='divTitre'> <div>This molecule has <span class = 'niceRed'>" 
  			+ data.aaData.length + "</span> partner" + plural + ' '
			+ ' described in ' + (data.xpTotal.inferred  + data.xpTotal.genuine) + 
			' experiments:<ul class="xpPool">'
			+ '<li><span class="headGenCount">' 
  			+ data.xpTotal.genuine + '</span> with this biomolecule</li>'
			+ '<li><span class="headInfCount">' 
			+ data.xpTotal.inferred + '</span> with one of its homolog </li></ul></div>';
  		    var tableForm = "<table class='interact'><thead></thead><tbody></tbody></table>";
  		    var interactDiv = $(self.targetDomElem).find("div.tableInteract");
  			interactDiv.append(titre)
  			interactDiv.append(tableForm);
  			
			
  			self._addCheckSel(data.aaData,"biomAdd");
		    $(this).ready(function() {
			 	      var anOpen = [];
      				      var table = $( 'table.interact' )
					  .dataTable( {
      		 					  "aaData": data.aaData,
      		 					  sScrollY: "100%",
   		  	 				  "aoColumns": [
   		  	 	   			      { "sTitle": "Partner name", "sClass": "center","sWidth": "350px"},
       			   				      { "sTitle": "Number of experiments", "sClass": "center" },
       			   				      { "sTitle": "Species", "sClass": "center","sWidth": "auto", sType : "species"},
       			   				      { "sTitle": "", "sClass": "center"}],
    							  "oLanguage": {
    				 			      "sSearch": "Filter:"
  				  			  },
  				  			  "sDom": '<"top"<"row"<"span6"f><"span6 pull-right"i>>>rt<"bottom"p><"clear">',
  				  			  "sPaginationType": "bootstrap",
  							  "bLengthChange": false,
  							  "aoColumnDefs": [{ 'bSortable': false, 'aTargets': [ 3 ] }]
						      });
					   
				//	   globTable = table;

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
   				 table.$("td:nth-child(2)").each(function() {
   				  		var popTriggerer = this;
   				  		var index = $(this).find("span").attr('index');	
   				  		var position = $(this).offset()		  		
   				  		$(this).popover({
   				  				 title: data.supportingXpData[index].id + " <i style = 'color:red;cursor:pointer;' class = 'fa fa-times-circle pull-right'></i>",
   				  				 html : true, 
   				  				 callback : function () {
   				  				 		$(".fa-times-circle").click(function() {
   				  				 				$(popTriggerer).popover("hide");
   				  				 		});
   				  				 },
   				  				 content:self._popThisTd(data.supportingXpData[index]), 
   				  				 placement : 'bottom', container : 'body'});
   				  });
   				 
   				 table.$("td:nth-child(2)").click(function(){
   				 	var self = this;
   				 	table.$("td:nth-child(2)").each(function() {
   				  			if(self !=this){
   				  				$(this).popover("hide");
   				  			}
   					});
   				});
   				 $('.pagination').on('click', function () {
   					table.$("td:nth-child(2)").each(function() {
   				  		$(this).popover("hide");
   				 	})
   				});
   				table.$('td span').tooltip();		
   				
   				
			});
  		},
  	    _interactionGenerateTableData : function(){
  		var self = this;
  		var dataForTable = [];
  		var xpData = [];
  		var cnt = -1;
  		var rootLink = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value=";

		var xpPool = {
		    genuine : {},
		    inferrence : {}
		};
		
		
  		for (var i = 0; i < self.jsonData.interactions.length; i++) {
		    console.log("i vaut " + i);
  		    var lineTable = [];
		    var speci = '';
		    var nbGenuine = 0;
		    var nbInferred = 0;
		    var commonName = '';
		    var xpObject = {
			genuineExperiments : [],
			inferrenceExperiments: [],
			name : null,
			id : null
		    };
//		    xpObject.experiments = [];
		    jQuery.each(self.jsonData.interactions[i],function(name,info){
				    if(name == "supportingExperiments"){
					nbGenuine +=   info.length ;
					$.merge(xpObject.genuineExperiments,info);
				    }
				    if(name == "inferrenceExperiments"){
					//console.log("nb vaut 0 , at " + i + " , pour " + commonName);
					nbInferred +=   info.length;
					$.merge(xpObject.inferrenceExperiments,info);
				    }
				    if(name == "partner"){
					var id = info.id;
					var common = info.common.anyNames[0];
					xpObject.name = info.id;
					commonName = '<span  data-toggle="tooltip" data-delay=\'{"show":"500", "hide":"500"}\' title="' 
					    + id + '">'+ '<a href ="' + rootLink + id + '" target = "_blank">' + common + '</a></span>' ;
					if(!info.specie.names){					    
					    speci = '<span  data-toggle="tooltip" data-delay=\'{"show":"500", "hide":"500"}\' title = "Universal">'
						+ '<img ' + speciUrl(info.specie.value,self.rootUrl) + " alt = 'human'></img></span>";
					} else {
					    speci = '<span  data-toggle="tooltip" data-delay=\'{"show":"500", "hide":"500"}\' title="'
						+ self._specie(info.specie.names) + '"><img ' + speciUrl(info.specie.value,self.rootUrl) 
						+ ' alt = "human"></img>';
					}
					
					
				    }
				    if(name == "id"){
					xpObject.id = "Association : <a target = '_blank' "+
					    "href = '" + self.rootUrl + "/cgi-bin/current/newPort?type=association&value=" + info +"'>" + 
					    info +"</a>";
				    }
				});
		    lineTable = [commonName, '<span class="nbGen">' + nbGenuine + '</span>'
				 + '<span class="nbInf">  (' + nbInferred + ')</span>', speci];
		    //				if(nb > 0){
		    xpData.push(xpObject);
		    dataForTable.push(lineTable);
		    /*			} else {
		     console.log("nb vaut 0 , at " + i + " , pour " + commonName);
		     }*/
		
		    xpObject.genuineExperiments.forEach(function (xpDatum){
							    xpPool.genuine[xpDatum.name] = 1;
							});
		    xpObject.inferrenceExperiments.forEach(function (xpDatum){
							       xpPool.inferrence[xpDatum.name] = 1;
							   });
		}
		console.dir(xpPool);
		var xpTotalGen = 0, 
		xpTotalInf = 0;
		for (var key in xpPool.inferrence) {
		    xpTotalInf++;
		}
		for (var key in xpPool.genuine) {
		    xpTotalGen++;
		}		
		
		return {aaData :dataForTable, supportingXpData : xpData, xpTotal : { genuine : xpTotalGen, inferred : xpTotalInf }};
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
  			//self._addCheckSel(aaData,"defaultAdd");
  			 
  			 	
    			var table = $( 'table.Go' ).dataTable( {
      		 	"aaData": aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  	 		{ "sTitle": "Ontology", "sClass": "center","sWidth": "75px"},
   		  			{ "sTitle": "Term", "sClass": "center","sWidth": "175px"},
       			    { "sTitle": "<span >Link to identifier</span>", "sClass": "center","sWidth": "80px" },//tooltip
       			    { "sTitle": "Definition", "sClass": "center","sWidth": "700px" },
       			    /*{ "sTitle": "","sWidth": "40px", "sClass": "center"}*/],
    			"oLanguage": {
    			  		
    				 	"sSearch": "Filter:"
  				  	},
  				 "sDom": '<"top"<"row"<"span6"f><"span6 pull-right"i>>>rt<"bottom"p><"clear">', 	
  				 "sPaginationType": "bootstrap",
  				 "bLengthChange": false,
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
				var ontology = '';
				jQuery.each(self.jsonData.go[i],function(name,info){
					if(name == 'definition'){
						def = self._cutAndTooltip(info, 170);				
					}
					if(name == 'id'){
						
						id = self._cutAndTooltip(info, 500, rootUrl+info);
					}
					if(name == 'ontology'){
						ontology = info.replace("_"," ");
					}
					if(name == 'term'){
						term = self._cutAndTooltip(info, 80);
					}
				});
				lineTable = [ontology,term,id,def]
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
			var returnString = "<span class = 'reportType'>Interaction</span><div class = 'divTitre'> Supporting Experiments</div><div class = 'postitContent'><dl>"
			returnString += self._assocPartner() + self._supportXp() + self._publication() + self._sourceDb() + "</dl></div>"
			return returnString;
			
		},
		_supportXp : function(){
			var self = this;
			if(!self.jsonData.directExperiments[0]){return;}
			var returnString = '<dt > Direct experiment:</dt>'
			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=experiment&value="
			for (var i=0; i < self.jsonData.directExperiments.length; i++) {
				returnString +="<dd><a target ='_blank' href = '" + rootUrl + self.jsonData.directExperiments[i] + "'>" + self.jsonData.directExperiments[i] +"</a></dd>"
			};
			return returnString;
		},
		_sourceDb : function (){
			var self = this;
			if(!self.jsonData.sourceDatabases[0]){return;}
			var returnString = '<dt > Source database:</dt>'
			for (var i=0; i < self.jsonData.sourceDatabases.length; i++) {
				returnString +="<dd>" + self.jsonData.sourceDatabases[i] + "</dd>";
			};
			return returnString;
		},
		_assocPartner
		: function (){
			var self = this;
			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value=";
			if(!self.jsonData.partnerNames[0]){return;}
			var returnString = '<dt > Biomolecules:</dt>'
			for (var i=0; i < self.jsonData.partnerNames.length; i++) {
				var logoBullet = '<div class = "bulletSpecie"><i class="fa fa-ban"></i></div>';
				if(self.jsonData.partnerCommon[self.jsonData.partnerNames[i]].specie){
					
					logoBullet = '<div class = "bulletSpecie"><img ' + speciUrl(self.jsonData.partnerCommon[self.jsonData.partnerNames[i]].specie.value,self.rootUrl) + ' width = "15px"></img></div>';
				}
				var name = self.jsonData.partnerCommon[self.jsonData.partnerNames[i]].anyNames[0]
				returnString +="<dd>" + logoBullet + "<a target ='_blank' href = '" + rootUrl + self.jsonData.partnerNames[i] + "'>" + name +"</a><span class = ' addCart biom pull-right' name = '" + self.jsonData.partnerNames[i] +"'>" + self.cartButton.biomAdd + "</span></dd>"
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
			if(returnString){returnString+= self._assocPartner() + "</dl></div>";}
			return returnString;
		},
		_supportByAssoc : function(string){
			var self = this;
			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=association&value="
			if(string){var returnString = string + '<dt > Supported by interaction:</dt>';}
			else{var returnString = '<div class ="divTitre"> Inferred human interaction</div><div class = "postitContent">'+
									'<dl><dt class = "hReport"> Supported by interaction:</dt>';}
			for (var i=0; i < self.jsonData.supportByAssociation.length; i++) {
				returnString += "<dd><a target ='_blank' href='" + rootUrl + self.jsonData.supportByAssociation[i] + "'>" + 
							    self.jsonData.supportByAssociation[i] + "</a></dd>";
			};
			return returnString;
		},
		_supportToAssoc : function(string){
			var self = this;
			if(string){var returnString = string + '<dt> Inferred human interaction:</dt>'}
			else{var returnString = '<div class ="divTitre"> Supported interaction</div><div class = "postitContent">'+
									'<dl><dt class = "hReport"> Inferred human interaction:</dt>'}
			for (var i=0; i < self.jsonData.supportToAssociation.length; i++) {
				returnString +="<dd><a target ='_blank' href='" + self.rootUrl + self.jsonData.supportToAssociation[i] + "'>" + 
							    self.jsonData.supportToAssociation[i] + "</a></dd>";
							    }
			return returnString;
		},
/*fin de bandeau association
 ---------------------------------------------------------------------------------------------------------------
bandeau keywrd
*/	
		_uniProtWord : function(){
			var self = this;
			var cart = '<span class = "addCart kewrd pull-right" name ="' + self.jsonData.name + '">' + 
									self.cartButton.defaultAdd + '</span>';
			$(self.targetDomElem).append("<div class ='author Content contentXp content'><div class = 'keywrdDef'>"+
										"<span class = 'reportType'>UniProtKB</span><div class = 'divTitre'> " + self.jsonData.identifier + "</div>"+ cart +
										"<div class = 'feature'>" + self.jsonData.definition + "</div></div><div class=' biomUni ' ></div></div>");
  			var publiDiv =$(self.targetDomElem).find("div.biomUni");
  			var tableForm = "<table class='biomUniTable'><thead></thead><tbody></tbody></table>";
  			var authorTableDiv =$(self.targetDomElem).find("div.biomUni");
  			var ancre = " <div style = 'margin-left:20px;' class = 'navigueBar'><a>" + self.jsonData.identifier + " " + 
  						self.jsonData.name + "</a></div>";
  			authorTableDiv.append(tableForm);
  			$(self.targetDomElem).find("nav.header div.header").append(ancre);
  			var aaData = self._unitBioKwrdGenerateTableData();
  			
  			var table = $( 'table.biomUniTable' ).dataTable( {
      		 	"aaData": aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  	 		{ "sTitle": "Biomolecule", "sWidth": "450px", "sClass": "center"},
   		  	 		{ "sTitle": "Specie", "sClass": "center","sWidth": "150px"},
       			    { "sTitle": "Add biomolecule", "sWidth": "150px", "sClass": "center"}],
    			"oLanguage": {
    				 	"sSearch": "Filter:",
						"sInfo": "<div class = 'title'>This Keyword annote <span class = 'niceRed '>_TOTAL_</span> biomolecule(s)</div>"
  				  	},
  				 "sDom": '<"topHead"f><"topBody"i>rt<"bottom"p><"clear">',
  				 "sPaginationType": "bootstrap",
  				 "bLengthChange": false,
  				 "aoColumnDefs": [
        		   { 'bSortable': false,  'aTargets': [ 2 ]}
      			 ]
 		  		}); 
   				table.$('td:last-child div.btn-group').click( function () {
 		  		 	var item = $( this ).parent().parent().find('td:first-child a').attr("name");
 		  		 	var data ={type : "biomolecule", value : item};
 		  		 	self.addCartCallback(data);
   				 })
	},
	_unitBioKwrdGenerateTableData : function (){
  			var self = this;
  			var aaData = [];
  			
  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value=";
  			for (var i = 0; i < self.jsonData.biomolecules.length; i++) {
  				var name = self.jsonData.biomolecules[i].name;
  				var nom =   self.jsonData.biomolecules[i].specie.names[0];
				for (var j = 1; i <  self.jsonData.biomolecules[i].specie.names.length; i++) {
			  		nom += ', ' + self.jsonData.biomolecules[i].specie.names.length;
				};
				var specieString =" <a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=" + self.jsonData.biomolecules[i].specie.value + "'>" + nom + " <i class='fa fa-external-link'></i></a>";
  				var biom = "<a target = '_blank' href='" + rootUrl + name + "' name ='" + name + "'>" + self.jsonData.biomolecules[i].common.anyNames[0] + "</a>";
  				
				aaData.push([biom, specieString,self.cartButton.biomAdd]);
			  };
			return aaData;
	},
/*
 	fin de bandeau keywrd
 *  ---------------------------------------------------------------------------------------------------------------
	bandeau publication 
 */
		
		_publicationOrganisator : function (){
			var self = this;
			self.tailleHeader++
			$(self.targetDomElem).append("<div class ='publicationContent contentXp content'><div class ='row-fluid'>"+
										 "<div class = 'span6 postitSide'>"+
										 "<div class ='row-fluid'></div></div><div class='span6 assocTable ' ></div></div></div>");
  			var publiDiv =$(self.targetDomElem).find("div.span6.postitSide > div.row-fluid");
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
  			if(abstactHtml){$(self.targetDomElem).find("div.span6.postitSide").append(abstactHtml);}
  			
  			
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
			var star = self.jsonData.imexId ?  '<i class="fa fa-star pull-right" style="color:yellow;"></i>' 
											:  '<i class="fa fa-star-o pull-right"></i>';
			var returnString = "<span class = 'reportType'> Publication </span>"+
							   "<div class = 'divTitre special' style='padding-right:10px;padding-left: 20px;'>Reference" + star + "</div><span class = 'addCart publi pull-right' name = '" + 
							   self.jsonData.name + "'>" + self.cartButton.publiAdd + "</span><div class = 'postitContent'><dl>" + 
							   self._imexIdPubli() + self._journal() + self._copyright() + self._date() + self._aviable() + 
							   self._contact() + self._ref() + "</dl></div>";
			
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
		_ref : function(){
			var self = this;
			return '<dt class ="hReport">Link to PubMed :</dt><dd> <a target = "_blank" href = "http://www.ncbi.nlm.nih.gov/pubmed/'  + self.jsonData.name + '">' + self.jsonData.name + " <i class='fa fa-external-link'></i></a></dd>";
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
		
		_contact : function(){
			var self = this;
			if(!self.jsonData.contactEmail){return ""}
			return '<dt class ="hReport">Contact:</dt><dd> ' + self.jsonData.contactEmail + "</dd>";
		},
		_firstAuthor : function(){
			var self = this;
			if(!self.jsonData.firstAuthor){return ""}
			var nom = self.jsonData.firstAuthor.replace(" ","%20");
			return '<dt class ="hReport">First author:</dt><dd> <a target = "_blank" href = "' + 
					self.rootUrl + '/cgi-bin/current/newPort?type=author&value=' + nom + '">' + 
					self.jsonData.firstAuthor + '</a></dd>';
		},
		_author : function(){
			var self = this;
			if(!self.jsonData.authorList){return ""}
			var returnString = '<dt class ="hReport">Author:</dt><dd>';
			for (var i=0; i < self.jsonData.authorList.length; i++) {
			  var nom = self.jsonData.authorList[i].replace(" ","%20");
			  returnString +=  '<a target = "_blank" href = "' + 
								self.rootUrl + '/cgi-bin/current/newPort?type=author&value=' + nom + '">' + 
								self.jsonData.authorList[i] + '</a>, ';
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
  			console.dir(aaData)
  			self._addCheckSel(aaData,"biomAdd");
  			 $(this).ready(function() {
    			var table = $( 'table.assoTable' ).dataTable( {
      		 	"aaData": aaData.aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  	 		{ "sTitle": "First partner", "sClass": "center"},
   		  	 		{ "sTitle": "Second partner","sClass": "center"},  
       			    { "sTitle": "Supporting experiment", "sWidth": "30px", "sClass": "center"}],
    			"oLanguage": {
    				 	"sSearch": "Filter:",
						"sInfo": "<div class = 'title'>This publication shows <span class = 'niceRed '>_TOTAL_</span> interaction(s)</div>"
  				  	},
  				 "sDom": '<"topHead"i><"topBody"f>rt<"bottom"p><"clear">',
  				 "sPaginationType": "bootstrap",
  				 "bLengthChange": false,
  				 
 		  		}); 
 		  		table.$('td span.addCart').click( function () {
 		  		 	var item = $( this ).attr('name');
 		  		 	var data ={type : "biomolecule", value : item};
 		  		 	self.addCartCallback(data);
   				 })
   				 table.$("td:nth-child(3)").css('cursor','pointer');
   				 table.$("td:nth-child(3)").each(function(){
   					var popTriggerer = this;
   				  		var index = $(this).find("span").attr('index');	
   				  		var position = $(this).offset()		  		
   				  		$(this).popover({
   				  				 title: aaData.xpObject[index].id + " <i style = 'color:red;cursor:pointer;' class = 'fa fa-times-circle pull-right'></i>",
   				  				 html : true, 
   				  				 callback : function () {
   				  				 		$(".fa-times-circle").click(function() {
   				  				 				$(popTriggerer).popover("hide");
   				  				 		});
   				  				 },
   				  				 content:self._popThisTd(aaData.xpObject[index]), 
   				  				 placement : 'bottom', container : 'body'});
   				  });
   				 
   				 table.$("td:nth-child(3)").click(function(){
   				 	var self = this;
   				 	table.$("td:nth-child(3)").each(function() {
   				  			if(self !=this){
   				  				$(this).popover("hide");
   				  			}
   					});
   				});
   				 $('.pagination').on('click', function () {
   					table.$("td:nth-child(3)").each(function() {
   				  		$(this).popover("hide");
   				 	})
   				})
 		  	})

		},
		_assocGenerateTableData : function (){
  			var self = this;
  			var aaData = {};
  			aaData.aaData = [];
  			aaData.xpObject = [];

  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=biomolecule&value=";
  			for (var i = 0; i < self.jsonData.association.length; i++) {
  				var name = self.jsonData.association[i].partners;
  				
  				var idXp = 'Association : <a target = "_blank" '+
  						   'href = "' + self.rootUrl + '/cgi-bin/current/newPort?type=association&value=' + 
  						   self.jsonData.association[i].association + '">' + self.jsonData.association[i].association + "</a>";
  				
  				var partner1 = "<a target = '_blank' href='" + rootUrl + name[0] + "'>" + 
  				               self.jsonData.biomolecule[name[0]].common.anyNames[0] + "</a></br>"+
  				               "<span class ='biom addCart' name ='" + name[0] +"'>" + 
  				               self.cartButton.biomAdd + "</span>";
  				var partner2 = "<a target = '_blank' href='" + rootUrl + name[1] + "'>" + 
  				               self.jsonData.biomolecule[name[1]].common.anyNames[0] + "</a>"+
  				               "<span class ='biom addCart' name ='" + name[1] +"'>" + 
  				               self.cartButton.biomAdd + "</span>";
  				var support = "<span index = '" + i + "'>" + self.jsonData.association[i].supportingExperiment.length + 
  				  			  ' <i class="fa fa-info-circle"></i></span> ';
  				aaData.xpObject.push({id : idXp, 
  									  experiments : self.jsonData.association[i].supportingExperiment});
				aaData.aaData.push([partner1,partner2,support]);
			  };
			return aaData;
  		},

	
 /* fin de assoc table
  * ---------------------------------------------------------------------------------------------------------------
 * bandeau author
 */ 
 		_authorOrganisator : function(){
 			var self = this;
 			$(self.targetDomElem).append("<div class ='author Content contentXp content'><div class=' authorTable ' ></div></div>");
 			var tableForm = "<table class='authorTable'><thead></thead><tbody></tbody></table>";
  			var authorTableDiv =$(self.targetDomElem).find("div.authorTable");
  			var ancre = " <div style = 'margin-left:20px;' class = 'navigueBar'><a>" + self.jsonData.name + " publication(s)</a></div>";
  			authorTableDiv.append(tableForm);
  			$(self.targetDomElem).find("nav.header div.header").append(ancre);
  			
  			var imexTable = [];
  			var soloTable = [];
  			for (var i=0; i < self.jsonData.publications.length; i++) {
  				if(self.jsonData.publications[i].imexId || self.jsonData.publications[i].association){
  					imexTable.push(self.jsonData.publications[i]);;
  				}else{
  					soloTable.push(self.jsonData.publications[i]);
  				}
			};
  			if(imexTable.length > 0){
  				var aaData = self._authorGenerateTableData(imexTable);
  			}else{
  				var aaData = self._authorGenerateTableData(soloTable);
  			}
    		var table = $( 'table.authorTable' ).dataTable( {
      		 	"aaData": aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  	 		{ "sTitle": "Publication", "sWidth": "450px", "sClass": "center"},
   		  	 		{ "sTitle": "Number of reported associations", "sClass": "center","sWidth": "50px"},
   		  	 		{ "sTitle": "Publication Date", "sClass": "center","sWidth": "50px"},
					{ "sTitle": "IMEx curated", "sClass": "center","sWidth": "50px"},  
       			    { "sTitle": "Add publication", "sWidth": "150px", "sClass": "center"}],
    			"oLanguage": {
    				 	"sSearch": "Filter:",
						"sInfo": "<div class = 'title'>This author wrote <span class = 'niceRed '>_TOTAL_</span> publication(s)</div>"
  				  	},
  				 "sDom": '<"topHead"f><"topBody"i>rt<"bottom"p><"clear">',
  				 "sPaginationType": "bootstrap",
  				 "bLengthChange": false,
  				 "aoColumnDefs": [
        		   { 'bSortable': false,  'aTargets': [ 3,4 ]}
      			 ]
 		  		}); 
   				table.$('td:last-child div.btn-group').click( function () {
 		  		 	var item = $( this ).parent().parent().find('td:first-child a').attr("name");
 		  		 	var data ={type : "publication", value : item};
 		  		 	self.addCartCallback(data);
   				 })
   				 table.$('td>a').tooltip();
		},
		_authorGenerateTableData : function (data){
  			var self = this;
  			var aaData = [];
  			var rootUrl = this.rootUrl + "/cgi-bin/current/newPort?type=publication&value=";
  			for (var i = 0; i < data.length; i++) {
  				var titre = '<a name="' + data[i].name + '" data-toggle="tooltip" data-delay=\'{"show":"500", "hide":"500"}\' title="' + 
  							data[i].title + '" target = "_blank" '+
  							'href="' + rootUrl + data[i].name + '">' + data[i].title + '</a>';
  				var asso = data[i].association ? data[i].association.length : 0;
  				var date = data[i].date ? data[i].date : "unknow";
  				var imex = data[i].imexId ? '<i class="fa fa-star" style="color:yellow;"></i>': '<i class="fa fa-star-o" ></i>';
				aaData.push([titre,asso,date,imex,self.cartButton.publiAdd]);
			  };
			return aaData;
  		},
 /* fin de bandeau author
 *   bandeau unitKewrd
 */
		_uniprotKewrdOrganisator : function(){
			var self = this;
			if(!self.jsonData.uniprotKW){return}
			self.tailleHeader++
  			$(self.targetDomElem).append("<div class='content uniprot' ></div>");
  			var uniDiv =$(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar'><a cible = 'div.uniprot' > UniProtKB keywords</a></div>";
  			var titre = "<h3> This molecule is annoted by <span class = 'niceRed' >" + self.jsonData.uniprotKW.length + "</span> UniProtKB keywords</h3>";
  			var tableForm = "<table class='Uniprot'><thead></thead><tbody></tbody></table>";
  			uniDiv.append(titre);
  			uniDiv.append(tableForm)
  			
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			var aaData = self._uniprotGenerateTableData();
  			self._addCheckSel(aaData,"defaultAdd");
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
			//ici pour responsive layout
			
			var heigthOfDiv = [];
			$(self.targetDomElem).find("div.postitGeneral div.inPostit:last-child div.span6").each(function(){
				heigthOfDiv.push($(this).height())
			});	
			if(heigthOfDiv.length >= 2){
				var h = Math.abs(heigthOfDiv[0] - heigthOfDiv[1]);
				if (h > 90){
					if(heigthOfDiv[0] < heigthOfDiv[1]){
						divCible = $(self.targetDomElem).find("div.postitGeneral div.inPostit:last-child div.span6:first-child");
					}else{
						divCible = $(self.targetDomElem).find("div.postitGeneral div.inPostit:last-child div.span6:last-child");
					}
					self.nbDiv--;
					return divCible;
					
				}else{
					if(self.nbDiv%2 == 0 && self.nbDiv != 0){
	  					infoDiv.append("<div class = 'row-fluid inPostit'></div>");	
					}
				}
			}else{
	  			if(self.nbDiv%2 == 0 && self.nbDiv != 0){
	  				infoDiv.append("<div class = 'row-fluid inPostit'></div>");	
	  			}
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
		_popThisTd : function(xpData){
		var self = this;
		var returnString = "";
		    var xpTypes = ['genuineExperiments', 'inferrenceExperiments' ];
		    xpTypes.forEach(function (xpType) {
					if (!xpData[xpType]) return;
					if (!xpData[xpType].length === 0 ) return;
					var style = xpType === 'genuineExperiments' ? "genuineTD" : "inferrenceTD";
					xpData[xpType].forEach(function(xpDatum) { 
								    var name = xpDatum.name ? xpDatum.name : xpDatum;
								    returnString += '<div class = "popoverContent ' + style 
									+ '"><a href="' + self.rootUrl 
									+ '/cgi-bin/current/newPort?type=experiment&value=' + name 
									+ '" target = "_blank">' + name + '</a>'; 
								    if(xpDatum.pmid){
									returnString += '</br> PubMed&nbsp;&nbsp; <a target = "_blank" href = "' 
									    + self.rootUrl + '/cgi-bin/current/newPort?type=publication&value=' 
									    + xpDatum.pmid + '">' + xpDatum.pmid + '</a>';
								    }
								    if(xpDatum.imexid){
									returnString += '</br> Imex-id&nbsp;&nbsp;&nbsp;&nbsp;   '
									    + '<a target = "_blank" href = "' + self.rootUrl
									    + '/cgi-bin/current/newPort?type=publication&value=' 
									    + xpDatum.pmid + '">' + xpDatum.imexid 
									    + '</a>';  
								   } 
								});
					returnString += '</div>';
				    });
		    
		    return returnString 
		},
		_test : function(){
			alert('toto')
		},
		_plural : function(string, value){
			if(value > 1){
				return string + "s";
			}else{
				return string;
			}
		},
		
  
		_errMessPdb : function(){
			var self = this;
			$(self.targetDomElem).find("div.pdb.postitContent").remove();
			$(self.targetDomElem).find("div.pdbMolViewPostit").append("<div class = 'postitContent'>Sorry your configuration "+
									  "does not support graphic rendering.</div>");
		}
/*fin événement sur la page
 *---------------------------------------------------------------------------------------------------------------
*/	
	}
}