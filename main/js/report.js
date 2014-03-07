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
	var defaultCallbackPdbView = function(){
		console.dir('default pdb view ')
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
		tailleBandeau : 0,
		color : d3.scale.category20(),
		dataChartObject : {},
/*
 * ---------------------------------------------------------------------------------
 * on load event
 */
		start : function (){// test du type de donnée et dessine le composant
			var self = this;
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
  			$(self.targetDomElem).append('<nav class="navbar header navbar-fixed-top" role="navigation"><div class=" header"></div></nav>');
  			var header = $(self.targetDomElem).find("nav.header>div");
  			header.append('<div id="testCart" class = "cart"></div>');
  			if (self.jsonData.type == 'biomolecule'){
  				self._infoOrganisatorBiomol();
				self._interactionOrganisator();
				self._uniprotKewrdOrganisator();
				self._goOrganisator();
  			}
  			if (self.jsonData.type == 'experiment'){
  				self._infoOrganisatorXp()
  				self._partnerOrganisator()
  			}
  			$(self.targetDomElem).find('a.pdb').click(function(){$( $(self.targetDomElem).find('ul.pdb') ).toggle()})
  			$(self.targetDomElem).find('div.pdb').click(function(event){
    			event.stopPropagation();
				});
			$('html').click(function() {
				$(self.targetDomElem).find('ul.pdb').hide()
				});
			$(self.targetDomElem).find('i.pdbView').click(function(event){self.callbackPdbView()});
			$(self.targetDomElem).find('select').change(function(){
				var str = "";
   				$( "select.barChart option:selected" ).each(function() {
      				str = $( this ).text() ;
      				var svg = d3.select("div.svg");
      				svg.selectAll(".bar")
					  .transition()
    				  .duration(700)
    				  .ease("quad")
			          .attr("height", 0)
			          .attr("transform", function(d,i) {
			          	//{var value = 450 - y(d.ppm);return "translate(0," + value + ")";}
           				 return "translate(" + [0, 500] + ")"
      				  })
        
   				 });
   				 $.each(self.dataChartObject, function(name, data){

   				 	if(name == str){setTimeout(function(){self._barChartGenerator(data)},800);}
   				 })
   				 
   			
			});
			//;
  			
  		},
/*fin event onload
 * ___________________________________________________________________________________________________________________________________
 * bandeau info biomol
 */
  		_infoOrganisatorBiomol : function(){//traite les données du bandeau info
  			var self = this;
  			self.tailleBandeau += 1;
  			$(self.targetDomElem).append("<div class='content' ></div>");
  			var infoDiv =$(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar'><p style = 'color : white; float : left;margin-right:5px; margin-left: 0'>" + self.jsonData.name + "</p><a href=#info > Information</a></div>";
  			var titre = "<div id = 'info'></div></br><h3> Information on " + self.jsonData.name + "</h3>";
  			console.dir (self.jsonData);
  			if(self.jsonData.location.expressionLevels){
  				var contains = "<div class = 'span4 general'></div><div class = 'span8 barChart'></div>";
  			}else{
  				var contains = "<div class = 'span12 general'></div>";
  			}
  			var divSpan = "<div class ='row-fluid infoSpan'>" + contains +"</div>";
  			infoDiv.append(titre);
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			infoDiv.append(self._names());
  			var id = "<p><b>Id:</b> " + self.jsonData.name + "</p>";
  			infoDiv.append(id);
  			infoDiv.append(self._biofunc());
  			infoDiv.append(divSpan);
			infoDiv.find('div.infoSpan > div.general').append(self._molWeight());
  			infoDiv.find('div.infoSpan > div.general').append(self._gene());
  			infoDiv.find('div.infoSpan > div.general').append(self._specie());
  			infoDiv.find('div.infoSpan > div.general').append(self._domainAnnot());
  			infoDiv.find('div.infoSpan > div.general').append(self._pdbList());
  			if(self.jsonData.location.expressionLevels){if(self.jsonData.location.expressionLevels.data){
  				infoDiv.find('div.infoSpan > div.barChart').append(self._barChartDivOrganisator());
  			}} 			
  		},
  		_gene : function(){
			var self = this;
			if(!self.jsonData.gene){return"<p><b>Gene</b>: Unknown</p>" }
			var geneString = "<p><b>Gene</b>: " + self.jsonData.gene.GeneName	;
			if( self.jsonData.gene.Synonym ){
				geneString = geneString + ", " + self.jsonData.gene.Synonym;	
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
			geneString = geneString + '</p>'
			return geneString;
		},
		_specie : function(){
			var self = this;
			if(!self.jsonData.specie){return "<p><b>Specie</b>: Unknown</p>";}
			var nom =  self.jsonData.specie.names[0];
			for (var i = 1; i <  self.jsonData.specie.names.length; i++) {
			   nom += ', ' + self.jsonData.specie.names[i];
			};
			var specieString ="<p><b>Specie</b>: <a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=" + self.jsonData.specie.value + "'>" + nom + " <i class='fa fa-external-link'></i></a></p>";
			return specieString;
		},
		_domainAnnot : function(){
			
			var self = this;
			if(!self.jsonData.pfam){return '<p><b>Domain annotation</b>: Unknown</p>';}
			var domainString ='<p><b>Domain annotation</b>:</br> <a href="http://pfam.sanger.ac.uk/" target = "_blank"><img src="../../img/pfamLogo.jpeg" alt="pfamLogo" style="border:none;heigth:20px;width:40px;" /></a></br><a target = "_blank" href = "http://pfam.sanger.ac.uk/family/' + self.jsonData.pfam.data[0].id + '">' + self.jsonData.pfam.data[0].Desc + '</a>' ;
			for (var i = 1; i < self.jsonData.pfam.data.length; i++) {
			  domainString = domainString + ', <a target = "_blank" href = "http://pfam.sanger.ac.uk/family/' + self.jsonData.pfam.data[i].id + '">' + self.jsonData.pfam.data[i].Desc + '</a>';
			};
			domainString = domainString + '</p>';
			return domainString;
		},
		_pdbList : function(){
			var self = this;
			if(!self.jsonData.pdb){return '<p><b>Pdb</b>: Unknown</p>';}
			var pdbString = '<div class = "pdb"><b>Pdb</b>: ' + self.jsonData.pdb.data.length + ' structures <a class ="pdb" data-toggle="dropdown ">show <i class ="fa fa-chevron-down"></i></a><ul class = "dropdown-menu pdb"><li style="overflow:hidden;"><div class="row-fluid"><div class = "span4"> <b>Id</b></div><div class="span4"><b>Method</b></div><div class = "span4">See </div></li>';
			for (var i=0; i < self.jsonData.pdb.data.length; i++) {
			  pdbString = pdbString + "<li><div class='row-fluid'><div class = 'span4'> " + self.jsonData.pdb.data[i].id +"</div><div class='span4'>" + self.jsonData.pdb.data[i].determinationMethod + "</div><i class='fa fa-eye pdbView' id ='" + self.jsonData.pdb.data[i].id + "'></i></li>"
			};
			pdbString = pdbString + "</ul></div>";
			return pdbString ;
		},
  		_names : function(){//return les différents noms de maniére lisible
  			var self = this;
  			if(!self.jsonData.common){return "<p><b>Names</b>: Unknown</p>"}
  			var listeName = [];
  			for (var i = 0; i < self.jsonData.common.length; i++) {
				$.each(self.jsonData.common[i],function(name, value){
					listeName.push(value);
				});
			  };
			var lineNames = "<p><b>Names</b>: " + listeName[0];
			for (var i = 1; i < listeName.length; i++) {
			  lineNames = lineNames + ", " +listeName[i];
			};
			lineNames = lineNames + "</p>";
			return lineNames;
  		},
  		_molWeight : function (){// retourne le poid moléculaire de maniére lisible
  			var self = this ;
  			if(!self.jsonData.molecularWeight[0]){return "<p><b>Molecular Weight</b>: Unknown</p>"}
  			var lineMol = "<p><b>Molecular Weight</b>: " + self.jsonData.molecularWeight[0].Molecular_Weight + "</p>"
  			return lineMol;
  		},
  		_biofunc : function(){
  			var self = this;
  			if(!self.jsonData.biofunc){return "<p><b>Biofunction</b>: Unknown";}
  			return "<p><b>Biofunction</b>: " + self.jsonData.biofunc + "</p>";
  		},
/*fin de bandeau info biomol
 * ___________________________________________________________________________________________________________________________________
 * bandeau info xp
 */
		_infoOrganisatorXp : function(){
			var self = this;
			console.log("test info")
			console.dir(self.jsonData);
		},
/*fin de bandeau info xp
 * ----------------------------------------------------------------------------------------------------------------------------------
 * bandeau partner
 */
		_partnerOrganisator : function(){
			var self = this;
			console.log("test partner")
		},
/*fin de bandeau partner
 * ----------------------------------------------------------------------------------------------------------------------------------
 * bandeau interactions
 */
  		_interactionOrganisator : function(){// organise le bandeau intéraction
  			var self = this;
  			if(!self.jsonData.interactions){return;}
  			self.tailleBandeau += 1;
  			var data = self._interactionGenerateTableData();
  			var nbXp = 0
  			for (var i=0; i < data.aaData.length; i++) {
				nbXp += data.aaData[i][1];
				 data.aaData[i][1] =''+ data.aaData[i][1] + ' <i class="fa fa-sort-asc"></i>'
			  };
  			$(self.targetDomElem).append("<div class='content' ></div>");
  			var ancre = "<div class = 'navigueBar'><a href=#interact >Knowns partners and interactions</a></div>";
  			var plural =  data.aaData.length > 1 ? 's' : ''; 
  			var titre = "<div id = 'interact'></div></br><h3> This molecule has <span class = 'niceRed'>" + data.aaData.length + "</span> partner" + plural + " described in <span style = 'color : green; font-weight : bold'>" + nbXp + "</span> evidences </h3>";
  			var tableForm = "<table class='interact'><thead></thead><tbody></tbody></table>";
  			var interactDiv = $(self.targetDomElem).find("div.content:last");
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			interactDiv.append(titre)
  			interactDiv.append(tableForm);
  			
			
  			self._addCheckSel(data.aaData);

			 $(this).ready(function() {
			 	var anOpen = [];
    			var table = $( 'table.interact' ).dataTable( {
      		 		"aaData": data.aaData,
      		 		sScrollX: "100%",
   		  	 		"aoColumns": [
   		  	 	   		{ "sTitle": "Partner name", "sClass": "center","sWidth": "150px"},
       			   		{ "sTitle": "Number of experiment", "sClass": "center","sWidth": "200px" },
       			   		{ "sTitle": "Statue", "sClass": "center","sWidth": "100px" },
       			   		{ "sTitle": "Add to cart","sWidth": "60px", "sClass": "center"},],
    				"oLanguage": {
    			  		"oPaginate": {
      						"sNext": "",
      				  		"sPrevious": "",
    				 	}
  				  	},
  					"bLengthChange": false,
  					"aoColumnDefs": [{ 'bSortable': false, 'aTargets': [ 3 ] }],
 		  		});
 		  		
 		  		 table.$('i').click( function () {
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(1)').text();
 		  		 	var data ={type : "biomolecule", value : item} ;	 		  		 
 		  		 	self._clickButton(this,data); 					
   				 });
   				 table.$("td:nth-child(2)").css("cursor","pointer");
   				 table.$("td:nth-child(2)").click(function(){
   				 	$(this).find('i').toggleClass('fa-sort-asc fa-sort-desc');
   				 	var nTr = this.parentNode;
   				 	console.dir(nTr);
  					var i = $.inArray( nTr, anOpen );
  					if ( i === -1 ) {  						
  						var toto = function () {
  							console.log('pass')
  							$('td.supportingXp').parent().prev().each(function(){
  								console.dir(this)
  								$(this).find('i').toggleClass('fa-sort-asc fa-sort-desc');
  								table.fnClose( this );
  							})		
							table.fnOpen( nTr, fnFormatDetails(table, nTr), 'supportingXp' ); 
  							$('.supportingXp i').click(function(){console.dir('callback here');});			
  						}();
  						
  						anOpen = [nTr] ;
  					}else{
  						table.fnClose( nTr );
     					anOpen.splice( i, 1 );
  					}
  					
   				});
   				 table.$('tr').tooltip();		
   				function fnFormatDetails( table, nTr ){
   					var partner = table.fnGetData( nTr );					
   					var link=partner[0];
   					partner = $(link).text();
   					var returnString = ''
   					for (var i = 0; i < data.supportingXpData.length; i++) {
						var xp = data.supportingXpData[i]
						if(xp.name == partner){
							for (var j=0; j < xp.experiments.length; j++) {	//ligne du dessous param
								if(j%2==0){returnString +="<div class = 'row-fluid' >" }
							 	returnString += "<div class = 'span6 inlineTable' ><a href='http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPortTest?type=experiment&value=" + xp.experiments[j].name + "' target = '_blank'>" + xp.experiments[j].name + "</a></br><i class='fa fa-eye pull-right'></i>" 
							 	if(xp.experiments[j].pmid){
							 		returnString += "</br> Pubmed&nbsp;&nbsp; <a target = '_blank' href = 'http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPortTest?type=publication&value="+ xp.experiments[j].pmid + "'>" + xp.experiments[j].pmid + "</a> <a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/pubmed/" + xp.experiments[j].pmid + "' style ='font-size : 0.7em; text-decoration : underline;'>link</a>"
							 		if(xp.experiments[j].imexid){
							 			returnString += "</br> Imex-id&nbsp;&nbsp;&nbsp;&nbsp;   <a target = '_blank' href = 'http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPortTest?type=publication&value="+ xp.experiments[j].pmid + "'>" + xp.experiments[j].imexid + "</a> <a target = '_blank' href = 'http://www.ebi.ac.uk/intact/imex/main.xhtml?query=" + xp.experiments[j].pmid +"' style ='font-size : 0.7em; text-decoration : underline;'>link</a>"  
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
  			var rootLink ="http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPortTest?type=biomolecule&value="
  			for (var i = 0; i < self.jsonData.interactions.length; i++) {
  				var lineTable = [];
				var statue = '';
				var nb = '';
				var id = '';
				var xpObject = {};
				jQuery.each(self.jsonData.interactions[i],function(name,info){
					if(name == "supportingExperiments"){
						nb =  info.length ;
						xpObject.experiments = info;
					}
					if(name == "partner"){
						xpObject.name = info;
						id = self._cutAndTooltip(info, 240, rootLink+info); ;
					}
					if(name == "kind"){		
						statue = info;
					}
				});
				lineTable = [id, nb, statue];
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
  			self.tailleBandeau += 1;
  			if(!self.jsonData.go){return;}
  			$(self.targetDomElem).append("<div class='content' ></div>");
  			var goDiv = $(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar'><a href=#go >GO Terms</a></div>";
  			var titre = "<div id = 'go'></div></br><h3> This molecule is annoted by <span class = 'niceRed'>" + self.jsonData.go.length + "</span> Go terms</h3>";
  			
  			var tableForm = "<table class='Go'><thead></thead><tbody></tbody></table>"
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			goDiv.append(titre)
  			goDiv.append(tableForm);
  			var aaData = self._goGenerateTableData();
  			self._addCheckSel(aaData);
  			 $(this).ready(function() {
  			 	
    			var table = $( 'table.Go' ).dataTable( {
      		 	"aaData": aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  			{ "sTitle": "Term", "sClass": "center","sWidth": "250px"},
       			    { "sTitle": "<span >Link to identifier</span>", "sClass": "center","sWidth": "80px" },//tooltip
       			    { "sTitle": "Definition", "sClass": "center","sWidth": "700px" },
       			    { "sTitle": "Add to cart","sWidth": "40px", "sClass": "center"}],
    			"oLanguage": {
    			    "oPaginate": {
      					"sNext": "",
      				 	"sPrevious": ""
    				},
  				 },
  				
  				 "bLengthChange": false,
  				 "aoColumnDefs": [
        		   { 'bSortable': false, 'aTargets': [ 3 ] }
      			 ]
 		  		} ); 
 		  		table.$('i').click( function () {
 		  			
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(2)').text(); 		  		 
 		  		 	var data ={type : "other", value : item};
 		  		 	self._clickButton(this,data);
   				 })
   				 
   				 table.$('td>span').tooltip();
			} );
			
			
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
 *  bandeau unitKewrd
 */
		_uniprotKewrdOrganisator : function(){
			var self = this;
			if(!self.jsonData.uniprotKW){return}
  			self.tailleBandeau += 1;
  			$(self.targetDomElem).append("<div class='content' ></div>");
  			var uniDiv =$(self.targetDomElem).find("div.content:last");
  			var ancre = "<div class = 'navigueBar'><p style = 'color : white; float : left;margin-right:5px; margin-left: 0'> </p><a href=#uniprot > Uniprot Keyword</a></div>";
  			var titre = "<div id = 'uniprot'></div></br><h3> This molecule is annoted by <span class = 'niceRed' >" + self.jsonData.uniprotKW.length + "</span> Uniprot keyword</h3>";
  			var tableForm = "<table class='Uniprot'><thead></thead><tbody></tbody></table>";
  			uniDiv.append(titre);
  			uniDiv.append(tableForm)
  			
  			$(self.targetDomElem).find("nav.header>div").append(ancre);
  			var aaData = self._uniprotGenerateTableData();
  			self._addCheckSel(aaData);
  			 $(this).ready(function() {
    			var table = $( 'table.Uniprot' ).dataTable( {
      		 	"aaData": aaData,
      		 	sScrollX: "100%",
   		  	 	"aoColumns": [
   		  	 		{ "sTitle": "Term", "sClass": "center","sWidth": "200px"},
       			    { "sTitle": "<span >Link to identifier</span>", "sClass": "center","sWidth": "100px" },//tooltip
       			    { "sTitle": "Definition", "sClass": "center","sWidth": "700px" },
       			    { "sTitle": "Add to cart","sWidth": "60px", "sClass": "center"}],
    			"oLanguage": {
    			    "oPaginate": {
      					"sNext": "",
      				 	"sPrevious": ""
    				},
  				 },
  				
  				 "bLengthChange": false,
  				 "aoColumnDefs": [
        		   { 'bSortable': false, 'aTargets': [ 3 ] }
      			 ]
 		  		} ); 
 		  		table.$('i').click( function () {
 		  		 	var item = $( this ).parent().parent().find('td:nth-child(2)').text(); 		  		 
 		  		 	var data ={type : "other", value : item};
 		  		 	self._clickButton(this,data);
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
 *  événement sur tableau
 */ 		
  		_addCheckSel : function(aaData){
  			var self = this ;
  			for (var i=0; i < aaData.length; i++) {
			 	aaData[i].push('<i class="fa fa-minus-square"></i> - <i class="fa fa-plus-square"></i>')	
			 };
  			
  		},
  		_clickButton : function(iCible,item){
  			var self = this;
			
  			if($(iCible).hasClass('fa-plus-square')){
  				self.addCartCallback(item);
  			}else{
				self.delCartCallback(item);
  			}
 
  			
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
/*fin événement sur tableau
 *---------------------------------------------------------------------------------------------------------------
 *  barChart
 */ 			
		_barChartDivOrganisator : function(){
			var self = this; 
			
			var divBarChart = $(self.targetDomElem).find("div.content:last > div.infoSpan > div.barChart");
			var line = ''
			var expressionLevel = self.jsonData.location.expressionLevels;
			var compartiment = self.jsonData.location.compartiment;
			line +='<div class = "row-fluid"><div class = "span5">';
			$.each(expressionLevel, function(name, info){
				if(name != "data"){
					
					line += '<b>' + name + '</b>: ' + info +', ' ;
				}else{
					$.each(info, function(statue, dataInChart){
						self.dataChartObject[statue] = self._dataChartOrganisator(dataInChart);
					})
			
				}
			});
			line = line.substring(0,line.length-2)
			if(expressionLevel.data){
				line += "</div><div class = 'span6'><select class='form-control barChart'>";
				$.each(expressionLevel.data, function(name, info){
				    line += "<option name = '" + name + "'>" + name + "</option>";
				});
				line += "</select></div></div>";
				divBarChart.append(line);
				self._barChartGenerator(self.dataChartObject.Body_Sites);
			}else{
				line += "</div><div class = 'span6'><select class='form-control' disabled='disabled'> </select> </div></div>";
			}
 			
		},
		_dataChartOrganisator : function(data){
			var self = this;

			var dataForChartTemp = [];
			var dataForChartFinal = [];
			
			for (var i=0; i < data.length; i++) {
				if((data[i][0]/data[i][1])*1000000==0){}
				else{
			 		dataForChartTemp.push([(data[i][0]/data[i][1])*1000000, data[i][2]])
			 	}
			};
			dataForChartTemp.sort(function(a,b){return b[0] - a[0]})
			for (var i=0; i < dataForChartTemp.length; i++) {
			  dataForChartFinal.push({ppm : dataForChartTemp[i][0], tissue : dataForChartTemp[i][1]})
			};
			console.dir(dataForChartFinal)
			return dataForChartFinal;
		},
		_barChartGenerator : function(data){
			var self = this;
			
			var divBarChart = $(self.targetDomElem).find(" div.barChart ")
			divBarChart.find("div.svg").remove()
			divBarChart.append("<div class = 'svg'></div>")
			
			var margin = {top: 20, right: 20, bottom: 300, left: 40},
    			width = 750
  			 	height = 500

			var x = d3.scale.ordinal()
    			.rangeRoundBands([0, width], .1);

			var y = d3.scale.linear()
    			.range([height, 0]);
    			
			var yBack = d3.scale.linear()
    			.range([0, height]);
		
			var xAxis = d3.svg.axis()
    			.scale(x)
    			.orient("bottom")
    			

			var yAxis = d3.svg.axis()
    			.scale(y)
    			.orient("left");
    			
    			

			var svg = d3.select("div.svg").append("svg")
    			.attr("width", width + margin.left + margin.right)
    			.attr("height", height + margin.top + margin.bottom)
  			 	.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 			
 			x.domain(data.map(function(d) { return d.tissue; }));
  			y.domain([0, d3.max(data, function(d) { return d.ppm+50; })]);
			yBack.domain( [0, d3.max(data, function(d) { return d.ppm+50; })] );
  			svg.append("g")
       			 .attr("class", "x axis")
       			 .attr("transform", "translate(0," + height + ")")
        	 	 .call(xAxis)
       		 	 .selectAll("text")  
          		 .style("text-anchor", "end")
            	 .attr("dx", "-.8em")
           		 .attr("dy", ".15em")
            	 .attr("transform", function(d) {
               		 return "rotate(-45)" 
               	  })
               	  .style("overflow","visible");
      			
  			svg.append("g")
      			.attr("class", "y axis")
      			.call(yAxis)
    		    .append("text")
      			.attr("transform", "rotate(-90)")
      			.attr("y", 6)
      			.attr("dy", ".71em")
      			.style("text-anchor", "end")
      			.text("ppm");
			
			
			svg.selectAll(".bar")
      			.data(data)
    		  .enter().append("rect")
      			.attr("class", "bar")
      			.attr("x", function(d) { return x(d.tissue); })
     			.attr("width", x.rangeBand())
      			.attr("y", function(d) { return 0; })
      			.attr("height", 0)
      			.attr("transform", function(d,i) {
			          	//{var value = 450 - y(d.ppm);return "translate(0," + value + ")";}
           				 return "translate(0, " + height + ")";
           			})
           		.style("fill", function(d) { return self.color(d.tissue)})
				.transition()
    				  .duration(700)
    				  .ease("quad")
			          .attr("height", function(d) { return  height - y(d.ppm) ; })
			          .attr("transform", function(d,i) {
			          	//{var value = 450 - y(d.ppm);return "translate(0," + value + ")";}
           				 return "translate(" + [0,  height - yBack(d.ppm)] + ")"
      				  })
			
			
/*  		workin chart input
 	svg.selectAll(".bar")
      			.data(data)
    		  .enter().append("rect")
      			.attr("class", "bar")
      			.attr("x", function(d) { return x(d.tissue); })
     			.attr("width", x.rangeBand())
      			.attr("y", function(d) { return 0; })
      			.attr("height", function(d) { return  450 - y(d.ppm) ; })      			
				.style("fill", function(d) { return self.color(d.tissue)})
				.attr("transform", function(d){
						console.log(d.ppm +'  '+ yBack(d.ppm) + ' ' + y(d.ppm));
						var value = height - yBack(d.ppm);
						
						return "translate(0," + value + ")";
						});
*/


			function type(d) {
  				d.ppm = +d.ppm;
 				return d;
			}
		},
	}
}