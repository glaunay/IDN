/*
 * 
 * Element displaying current node or link info 
 * 
 * 
 */

/*
 * 
 * Element displaying current node or link info 
 * 
 * 
 */

function ei_test() {

    var nodeTest = {
	pdb : ["3s35", "3s35"],
	defaultSel : [{absNum : 2 , chainNumber : 0}]
    };    
    
    var widget = initElementInfo({
				     context : 'HTML',
				     rootUrl : 'http://matrixdb.ibcp.fr:9999',
				     width : '350px', height : '600px',
				     target : 'div#molView',
				     callback : {
				     	 computeCss : function(jqueryNode){
				     	     var top = $(jqueryNode).position().top ;
					     var left = $(jqueryNode).position().left ;
					     
					     return {main : {top : top + 'px', left : left + 'px', width : this.width, 'max-height' : this.height} ,
						     upmark :  {position : 'absolute', top : top - 30 + 'px', left : left + 'px', display : 'none',width : "100%"}
						    };
				     	 }
				     }				  
				 });
    
    widget.draw(nodeTest);
    
    return widget;
}






function initElementInfo(opt) {
    
   if (!opt.target) {
       alert ("no DOM target to initialize elementInfo component");
       return null;
   }
    var width = opt.width ? opt.width : '350px';
    var height = opt.height ? opt.height : '600px';
 	
 	var onClose = function(data){
 		console.log('default Close')
 		console.dir(data)
 	}
 	
    var computeCss = function () {
	//console.dir(this);
	var top = $(window).height() * 1 / 3;
	var left = $(window).width() * 1 / 4;
	return {main : {position : 'absolute', top : top + 'px', left : left + 'px', width : this.width, 'max-height' : this.height} ,
		upmark :  {position : 'absolute', top : top - 30 + 'px', left : left + 'px', width : this.width}};
    };    
    if (opt.callback.computeCss){
	computeCss = opt.callback.computeCss;
    }
    
    
    
    return {
	rootUrl : opt.rootUrl ? opt.rootUrl :'http://matrixdb.ibcp.fr:9999',
	targetSuffix : opt.hasOwnProperty('targetSuffix') ? opt.targetSuffix : null,
	molViewIndex : null,
	target : opt.hasOwnProperty('targetSuffix') ? opt.target + opt.targetSuffix : opt.target,
	molViewer : null,
	onClose : opt.callback.onClose ? opt.callback.onClose : onClose,
	computeCss : computeCss,
	selector : opt.hasOwnProperty('targetSuffix') ? opt.target + opt.targetSuffix + ' div#elementInfo' + opt.targetSuffix : opt.target + ' div#elementInfo',
	data : null,
	compteur : 1,
	context : opt.context ? 'opt.context' : 'HTML',
	defaultSel : [],
	height : height,
	width : width,
	setUrl : function () {
	    this.urlReport.association = this.rootUrl + '/cgi-bin/current/newPort?type=association&value=';
	    this.urlReport.biomolecule = this.rootUrl + '/cgi-bin/current/newPort?type=biomolecule&value=';
	},
	urlReport : {
	    "association" : null,
	    "biomolecule" : null
	},
	baseUrl : {
	    uniprotKeyWord : "http://www.uniprot.org/keywords/",
	    uniprot : "http://www.uniprot.org/uniprot/",
	    pdb : "http://www.rcsb.org/pdb/explore/explore.do?structureId=",
	    taxon : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id="
	},
	draw : function (data) {
	    this.setUrl();
	   // console.log("lets draw " + this.targetSuffix);
	    this.data = data;
	 //   console.dir(data);
	    if (data.defaultSel){
	    	this.defaultSel = data.defaultSel;
	    }
	    
	    var divId = this.targetSuffix ? "elementInfo" +  this.targetSuffix : "elementInfo";
	  //  console.log(divId);
	    $(this.target).append('<div id="' + divId + '"><div class="upmark"></div><div class="ei-main"><div class="ei-header"></div><div class="ei-body"></div></div><div>');

	    var self = this;
	   
	//    console.log(this.data);
	    if (this.data.details) {
	    	this.generateLinkContent()
	    } else {
			this.generateNodeContent();
	    }
	    //console.log("totot");
	    var styleObj = this.computeCss($(self.target ));
	  	$(this.selector + ' .upmark').css(styleObj.upmark); 
	    $(this.selector + ' .ei-main').css(styleObj.main); 

	    $(this.selector).find('.upmark i.fa-angle-double-right').on('click', function (){self.destroy();self.onClose(data);});

	},
	startMolViewer : function () {
	    var self = this;
	    console.dir("sele---->" + self.selector);
	    var actualTargetId = this.targetSuffix  ? '#glmolWidget' + this.targetSuffix : '#glmolWidget';
	    this.molViewer = GLmolInit({width : '90%', height : '200px', target : self.selector +' .pdbDiv', defaultSel :self.defaultSel, forceGlmolId : actualTargetId, 
			       callbackLoadSuccess : function (){ 
				   console.log("success");
				   self.toggleMoleculeLoader({display : "hide"});
				   $(self.selector + ' ' + actualTargetId).show();
				   $(self.selector + ' .glmolFooter').show();
				   $(self.selector + ' .pdbBanner').show();
			       },
			       callbackLoadError : function (){ 
				   console.log("ERROR LOADING PDB");
				   self.toggleMoleculeLoader({display : "hide"});
				   self.toggleMoleculeLoader({display : "show", type : "error"});
			       }
			      });
	},
	update : function (d) {
	    var self = this;
	    if ($(this.selector).length > 0) {			    
		console.log("update");
		this.destroy(function(){self.draw(d);});
	    } else {
		this.draw(d);
	    }
	},
	destroy : function (callback) {
	    var self = this;
	    
	    if (!callback) {
		callback = function (){};
	    }	
	    this.toggleMoleculeLoader({display : "show"});
	    $(this.selector).fadeToggle({duration : 200, easing : "swing", complete : function (){ $(self.selector).remove();callback();}});
	},
	toggleMoleculeLoader : function (opt) {
	    var html = '<div class="molLoader"><i class="fa fa-spin fa-rotate-right"></i></div>';
	    console.dir(opt);
	    var actualTargetId = this.targetSuffix  ? '#glmolWidget' + this.targetSuffix : '#glmolWidget';
	    var errorRescue = undefined;
	    
	    if(opt) {
		if (opt.display === "show")
		    if($(this.selector + ' .molLoader').length > 0)
			return;
		if (opt.display === "hide")
		    if($(this.selector + ' .molLoader').length === 0)
			return;
		if (opt.type == "error"){
		    html =  '<div class="molLoader"><i class="fa fa-times fa-2x"></i></div>' ;
		    errorRescue = true;
		    }
	    }

	    if ($(this.selector + ' .molLoader').length === 0) {				    
		
		if (errorRescue) {
			$(this.selector + ' .pdbDiv .pdbBanner').after(html);		
		} else {
			$(this.selector + ' .pdbDiv').append(html);		   	
		}
		var name =  this.targetSuffix ? " #glmolWidget" +  this.targetSuffix : " #glmolWidget";
		var h = $(this.selector + name).height();
		
		h = h ? h : "100";
		$(this.selector + " .molLoader").css({"width" : '100%', "height" : "191px", "padding-top" : 0.5 * h});
		$(this.selector + ' ' + actualTargetId).hide();
		$(this.selector + ' .glmolFooter').hide();
		$(this.selector + ' .pdbBanner').hide();	
		if (errorRescue) {			
			$(this.selector + ' .pdbBanner').show();	    
			$(this.selector + ' .molLoader').css({"background-color"  : 'rgb(240, 143, 162)',
			  									  "-moz-border-radius": "5px 5px 5px 5px",  
   												  "border-radius"     : "5px 5px 5px 5px",
    											  "border"            : "solid white 1px"});
			}		

	    } else {
		console.log("i shall remove");
		$(this.selector + ' .molLoader').remove();
	    }
	},	
	
	generateNodeContent : function () {	    
	    //console.log("generating node content");
	 
	    var self = this;
		self.bodyVisitCardGenerate()
	   	   
	    var tags = ['pdb','biofunc','relationship']; //, 'uniprotKW'
	    for (var i = 0; i < tags.length; i++) {
		    var elem = tags[i];
		if (this.data[elem]) {	
		  //  console.log("i have " + elem + ' content');
		    self.bodyContentGenerate[elem].call(this);
		}
	    }
	    
	    $(this.selector + ' .category-header i')
		.on('click', function (){		
			var iconElem = this;
			$(this).parent().siblings('.category-content').toggle( "fast", function() {
										   
										   $(iconElem).toggleClass("fa-collapse").toggleClass("fa-collapse-top");
										   // Animation complete.
									       });
		    });
	    
	    /*Protein_Fragment*/
	    
	    /*Glycosaminoglycan*/

	    /*Lipid*/

	    /* Multimer */
	    
	    /* Inorganic */	    
	    
	    /* Prot*/
	},
	generateLinkContent : function(){
	    var imgPath = this.context === 'HTML' ? 'img' : '../../img';
	    imgPath += '/matrixdb_logo_medium.png';
	    
	    var self = this;
	    var name = self._assocName(self.data.details.name);
	    var listeDiv = [];
	    self.compteur = 1;
	    $(self.selector + ' .upmark').append('<div class= "headerEi assoEi">'+
						 '<i class = "fa fa-search pull-left fa-3x"></i>'+
						 '<div class = "titreInfoElem">Interaction</div>'+
						 '<i class ="fa fa-angle-double-right closerElemInfo fa-3x pull-right"></i></div>'
										);
	    var commonInfo = "<div class = 'commonInfo' ><div class = 'compteur'></div><div class = 'type'>" + self.data.details.knowledge + "</div></div>";
	    if(self.data.details.Experiments.length > 1){
		var header = "<div class = 'caroussel'><i class='fa fa-chevron-left pull-left fa-2x'></i>"+
					 "<div class='titleAsso' style = 'width: 81%;'><a  target = '_blank'"+
					 " href = '" + self.urlReport.association + self.data.details.name + "'>"+ name + "</a></div>"+
					 "<i class='fa fa-chevron-right pull-right fa-2x'></i></div>";
		
			for (var i=0; i < self.data.details.Experiments.length; i++) {
				listeDiv.push(self._divXpGenerator(self.data.details.Experiments[i],i));
			};
			
			var taille = listeDiv.length
		}else{
			var header = "<div class='titleAsso' style = 'width: 81%;'><a  target = '_blank'"+
						 " href = '" + self.urlReport.association + self.data.details.name + "'>"+ name + "</a></div>"+
			listeDiv.push(self._divXpGenerator(self.data.details.Experiments[0],0))
			var taille = 1
		}
		$(this.selector + ' .ei-header').append(header);
		$(this.selector + ' .ei-body').append(commonInfo);
		var nbXp = self.compteur + "/" + taille;
		$(this.selector + ' .ei-body').find("div.compteur").append(nbXp);
		for (var i=0; i < listeDiv.length; i++) {
			
			$(this.selector + ' .ei-body').append(listeDiv[i]);
			
		};
		$(this.selector + ' .ei-body').find("div.contentXp").each(function(){

			if($(this).attr("index") != 1){
				$(this).hide();
			}
		})
		$(this.selector + ' .ei-header').find("i").click(function(){
			self._changeXp(this, taille);
		});
	},
	_changeXp : function(iCible, taille){
		var self = this;
		if($(iCible).hasClass("fa-chevron-right")){
			self.compteur++
			console.dir('click')
			if(self.compteur > taille){
				self.compteur = 1;
			}
		}
		else if($(iCible).hasClass("fa-chevron-left")){
			self.compteur--;
			if(self.compteur == 0){
				self.compteur = taille;
			}
			
		}
		$(this.selector + ' .ei-body').find("div.contentXp").each(function(){
				if($(this).attr("index") != self.compteur){
					$(this).hide();
				}else{
					$(this).show();
				}
			});
		var nbXp = self.compteur + "/" + taille;
		$(this.selector + ' .ei-body').find("div.compteur").text(nbXp);
	},
	_partnerDetailsContentGenerator : function(dataList){
		var self = this;
		if(dataList.length == 1){
			var contentPartner1 = '<div class = "partnerDetail"><dl>'+
			self._accessNumber(dataList[0]) +
			self._bioRole(dataList[0]) +
			self._detectMeth(dataList[0]) +
			self._expRole(dataList[0]) +
			self._isoform(dataList[0]) +
			self._species(dataList[0]) +
			self._nameOfPartner(dataList[0]) +
			'<dl></div>';
			var contentPartner2 = ''
		}else if(dataList.length == 2){
			var contentPartner1 = '<div class = "partnerDetail1"><dl>'+
			self._nameOfPartner(dataList[0]) +
			self._accessNumber(dataList[0]) +
			self._bioRole(dataList[0]) +
			self._detectMeth(dataList[0]) +
			self._expRole(dataList[0]) +
			self._isoform(dataList[0]) +
			self._species(dataList[0]) +
			'<dl></div>';
			
			var contentPartner2 = '<div class = "partnerDetail2"><dl>'+
			self._nameOfPartner(dataList[1]) +
			self._accessNumber(dataList[1]) +
			self._bioRole(dataList[1]) +
			self._detectMeth(dataList[1]) +
			self._expRole(dataList[1]) +
			self._isoform(dataList[1]) +
			self._species(dataList[1]) +
			'<dl></div>';
		}
		return contentPartner1 + contentPartner2;
		
	},
	bodyVisitCardGenerate : function () {	   
	    if(!this.data.x){return;}
	   
	    $(this.selector + ' .upmark').append('<div class= "headerEi">'+
						 '<i class = "fa fa-search pull-left fa-3x"></i>'+
						 '<div class = "titreInfoElem">Biomolecule</div>'+
						 '<i class ="fa fa-angle-double-right closerElemInfo fa-3x pull-right"></i></div>'
						);
	    if(this.data.common){
		
	    }else{
		$(this.selector + ' .ei-header').hide();
	    }
	 //   console.dir(this.data);
	    var tmpName = this.data.aceAccessor ? this.data.aceAccessor : this.data.name;
	    var name = '<div style = "text-align:center;">'+
				   '<a target = "_blank" href = "' + this.urlReport.biomolecule + tmpName + '" >' +
				   this.data.common.anyNames[0] + "</a></div>";
	    $(this.selector + ' .ei-body').append(name);
	    var cv = '<div class="summary"></div>';
	    $(this.selector + ' .ei-body').append(cv);
	    var tags = ["Type", "Specie", "Molecular weight", "Length", "Current interactors", "Registred interactors"]; 
	    var self = this;
	    var writer = {
		cnt : 0,
		Type : function(){	
		    if (!self.data.type) return null;
		    this.cnt++;
		    return '<dt class = "hReport">Type</dt><dd>' + self.data.type + '</dd>';
		},
		Specie : function () {
		    if (!self.data.specie) return null;
		    if (!self.data.specie.name) return null;
		    this.cnt++;
			var nom =  self.data.specie.names[0];
			for (var i = 1; i <  self.data.specie.names.length; i++) {
			   nom += ', ' + self.data.specie.names[i];
			};
			var specieString ="<dt class ='hReport'>Specie:</dt><dd> <a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=" + self.data.specie.value + "'>" + nom + " <i class='fa fa-external-link'></i></a></dd>";
			return specieString;
		},
		Length : function () {
		    if(!self.data.seqLength) return null;
		    this.cnt++;
		    return '<dt class = "hReport">amino acid number</dt><dd>' + self.data.seqLength + '</dd><';
		},
		"Current interactors" : function () {
		    if(!self.data.weight) return null;
		    this.cnt++;
		    return '<dt class = "hReport">Current network</dt><dd>' + self.data.weight + ' interactors</dd>';
		},
		"Registred interactors" : function () {
		    if(!self.data.betweenness) return null;
		    this.cnt++;
		    return '<dt class = "hReport">Registred in databases</dt><dd>' +  self.data.betweenness +  ' interactors</dd>';
		},
		"Molecular weight": function () {
		    if(!self.data.molecularWeight) return null;
		    this.cnt++;
		    return '<dt class = "hReport">Molecular weight</dt><dd>' + self.data.molecularWeight + ' Da</dd>';
		}
	    };	 
	   // console.log(tags);
	    for (var i = 0; i < tags.length; i++) {	
			var html = writer[tags[i]]();		
			if (!html) continue;
		//	console.dir(html);
			$(this.selector + " .summary").append('<div class = "info"><dl>' + html + '</dl></div>');
	    }
	    
	},
	bodyContentGenerate : {
	    biofunc : function () {
		$(this.selector + ' .ei-body').append('<div class="biofuncDiv"><div class="category-header">Biological function<i class="fa fa-collapse pull-right"></i></div><div class="category-content">' + this.data.biofunc + '</div></div>');
	    },
	    molecularWeight : function () {
		var self = this;
		console.log("MW tag");
		$(this.selector + ' .ei-body').append('<div class="daltonDiv">' + this.data.molecularWeight + '</div>');
	    },
	    uniprotKW : function (){
		var self = this;
		$(this.selector + ' .ei-body').append('<div class="uniprotKwDiv"><div class="category-header">UniprotKeyword<i class="fa fa-collapse pull-right"></i></div><div class="category-content"><ul class="term-list"></ul></div></div>');
		console.dir(this);
		this.data.uniprotKW.forEach(function (elem) {
						$(self.target + ' .uniprotKwDiv ul').append('<li><a href="' + self.baseUrl.uniprotKeyword + elem + '">' + elem + '</a></li>');
					    });
	    },
	    pdb : function () {
		var self = this;
		if(self.data.x){return}
		if (!this.molViewer)
		    this.startMolViewer();
		
		console.log(self.baseUrl.pdb)
		var pdbCode = this.data.pdb[0].match(/^.{4}/);
		$(this.selector + ' .ei-body').append('<div class="pdbDiv"><div class="pdbBanner"><div class="pull-left">PDB code<a' 
						      + ' href="' + self.baseUrl.pdb  + pdbCode[0] + '" target="_blank" class = "aPdb"> '
						      + pdbCode[0] + '</a></div><div class="pull-right"><span class="pdbChange"><i class="fa fa-angle-double-left"></i>'
						      +	'</span><span class="sup"><span id="structureCount">1</span>/' +  this.data.pdb.length 
						      + '</span><span class="pdbChange"><i class="fa fa-angle-double-right"></i></span></div></div></div>');	
		var e = $(this.selector + ' div.pdbDiv')[0];
		console.dir(this.selector)
		this.molViewer.draw();
		this.toggleMoleculeLoader();		
		if (this.data.pdb.length === 1) {		  
		    $(this.selector + ' .ei-body div.pdbDiv span.pdbChange').remove();
		}

		this.molViewer.load(this.data.pdb[0]);
		
		this.molViewIndex = 0;
		$(this.selector +" .pdbChange i").on('click', function (){
					 self.defaultSel = [];
					 if ($(".molLoader .fa-times").length > 0) {
					 	self.toggleMoleculeLoader();					 	
					 }								
					 self.toggleMoleculeLoader();
					 if ($(this).hasClass('fa-angle-double-left')) {
					     self.molViewIndex =  self.molViewIndex > 0
						 ? self.molViewIndex - 1 : self.data.pdb.length - 1;
					 } else {
					     self.molViewIndex = self.molViewIndex < self.data.pdb.length - 1 
						 ? self.molViewIndex + 1 : 0;
					 }
					 console.log("-->" + self.molViewIndex);
					 self.molViewer.load(self.data.pdb[self.molViewIndex],true);
					 var pdbCode = self.data.pdb[self.molViewIndex].match(/^.{4}/);				
					 // replace pdbCode and self.molViewIndex	
					 $(self.selector + ' .ei-body #structureCount').text(self.molViewIndex+1);
					 $(self.selector + ' .ei-body .pdbDiv a').text(pdbCode).attr("href",self.baseUrl.pdb + pdbCode);			     
		});
		
		console.log("done");
	    },
	    relationship : function () {
		
	    }
	},
	loadWithPdbId : function (pdbCodeStr) {
		var self = this;
		if ($(this.selector + " .molLoader .fa-times").length > 0) {
				self.toggleMoleculeLoader();					 	
		 }	
		console.dir(self.data.pdb)
		self.toggleMoleculeLoader();
		for (var i=0; i < self.data.pdb.length; i++) {
			console.dir(pdbCodeStr)
			console.dir(self.data.pdb[i])
			if (pdbCodeStr == self.data.pdb[i]) {
				self.molViewer.load(pdbCodeStr);
				self.molViewIndex = i;
				$(self.selector + ' .ei-body #structureCount').text(i+1);
				$(self.selector + ' .ei-body .pdbDiv a').text(pdbCodeStr).attr("href",self.baseUrl.pdb + pdbCodeStr);
				return;			
			}
		}	
		
		self.toggleMoleculeLoader("error");
		
	},
	_assocName : function(nameBrut){
		var split = nameBrut.split("__");
		var name = split[0] + " " + split[1] ;
		return name;
	},
	_divXpGenerator : function(xpData , index){
		var self = this;
		var index = index + 1;
		if(!xpData){
			return "waiting for data..";
		}
		var divReturn = '<div class  = "contentXp" index = "' + index + '"><div class = "generalInfo"><dl>'+
		self._xpModif(xpData) +
		self._database(xpData) +
		self._host(xpData) +
		self._interactDetectMethod(xpData) +
		self._interactionType(xpData) +
		self._knowledgeSupport(xpData) +
		self._kinetic(xpData) +
		self._publication(xpData) +
		self._figure(xpData) +
		self._imexId(xpData) +
		'</dl></div></div>';
		
		return divReturn;
	},
	_xpModif : function(xpData){
		var self = this;
		
		if(!xpData.Experiment_modification || xpData.Experiment_modification == "N/A"){return ''}
		return '<dt class ="hReport">Experiment modification:</dt><dd> ' + self._linkMi(xpData.Experiment_modification) + "</dd>";
	},
	_database : function(xpData){
		var self = this;
		if(!xpData.sourceDatabase || xpData.Experiment_modification == "N/A"){return ''}
		return '<dt class ="hReport">Database:</dt><dd> ' + self._linkMi(xpData.sourceDatabase) + "</dd>";
	},
	_host : function(xpData){
		var self = this;
		if(!xpData.Host_System || xpData.Host_System == "N/A"){return ''}
		return '<dt class ="hReport">Host System:</dt><dd> ' + self._linkMi(xpData.Host_System) + "</dd>";
	},
	_interactDetectMethod : function(xpData ){
		var self = this;
		if(!xpData.Interaction_Detection_Method || xpData.Interaction_Detection_Method == "N/A"){return ''}
		return '<dt class ="hReport">Interaction detection method:</dt><dd> ' + self._linkMi(xpData.Interaction_Detection_Method) + "</dd>";
	},
	_interactionType : function(xpData){
		var self = this;
		if(!xpData.Interaction_Type || xpData.Interaction_Type == "N/A"){return ''}
		return '<dt class ="hReport">Interaction type:</dt><dd> ' + self._linkMi(xpData.Interaction_Type) + "</dd>";
	},
	_knowledgeSupport : function(xpData){
		var self = this;
		if(!xpData.knowledgeSupport || xpData.knowledgeSupport == "N/A"){return ''}
		return '<dt class ="hReport">Knowledge Support:</dt><dd> ' + self._linkMi(xpData.knowledgeSupport) + "</dd>";
	},
	_kinetic : function(xpData){
		var self = this;
		if(!xpData.Kinetics || xpData.Kinetics == "N/A"){return ''}
		return '<dt class ="hReport">Kinetics details:</dt><dd> ' + self._linkMi(xpData.Kinetics) + "</dd>";
	},
	_publication : function(xpData){
		var self = this;
		var rootUrl = "http://matrixdb.ibcp.fr:9999/cgi-bin/current/newPort?type=publication&value="
		if(!xpData.Publication || xpData.Publication == "N/A"){return ''}
		if (xpData.Publication instanceof Array) {
			var returnString = '<dt class ="hReport">Pubmed reference:</dt><dd>';
			for (var i=0; i < xpData.Publication.length; i++) {
			returnString += '<a target = "_blank" href ="' + rootUrl  + xpData.Publication[i].pmid + '">' + xpData.Publication[i].pmid + '</a> ';
			};
			returnString += "</dd>"
			return returnString;
		}
		
	},
	_figure : function(xpData){
		var self = this;
		if(!xpData.Figure || xpData.Experiment_modification == "N/A"){return ''}
		return '<dt class ="hReport">Figure:</dt><dd> ' + self._linkMi(xpData.Figure) + "</dd>";
	},
	_imexId : function(xpData){
		var self = this;
		if(!xpData.IMEx_ID_Experiment || xpData.IMEx_ID_Experiment == "N/A"){return ''}
		return '<dt class ="hReport">Imex-id for this experiment:</dt><dd> ' + xpData.IMEx_ID_Experiment + "</dd>";
	},
	_accessNumber : function(partnerData){
		var self = this;
		if(!partnerData.Accession_Number || partnerData.Accession_Number == "N/A"){return ''}
		return '<dt class ="hReport">Accession number:</dt><dd> ' + self._linkMi(partnerData.Accession_Number) + "</dd>";
	},
	_bioRole : function(partnerData){
		var self = this;
		if(!partnerData.BioRole || partnerData.BioRole == "N/A"){return ''}
		return '<dt class ="hReport">Biological role:</dt><dd> ' + partnerData.BioRole + "</dd>";
	},
	_detectMeth : function(partnerData){
		var self = this;
		if(!partnerData.Detect_Meth || partnerData.Detect_Meth == "N/A"){return ''}
		return '<dt class ="hReport">Detection method:</dt><dd> ' + self._linkMi(partnerData.Detect_Meth) + "</dd>";
	},
	_expRole : function(partnerData){
		var self = this;
		if(!partnerData.ExpRole || partnerData.ExpRole == "N/A"){return ''}
		return '<dt class ="hReport">Experiment role:</dt><dd> ' + self._linkMi(partnerData.ExpRole) + "</dd>";
	},
	_isoform : function(partnerData){
		var self = this;
		if(!partnerData.Isoform || partnerData.Isoform == "N/A"){return ''}
		return '<dt class ="hReport">Isoform:</dt><dd> ' + self._linkMi(partnerData.Isoform) + "</dd>";
	},
	_species : function(partnerData){
		var self = this;
		if(!partnerData.Species || partnerData.Species == "N/A"){return ''}
		return '<dt class ="hReport">Species:</dt><dd> ' + self._linkMi(partnerData.Species) + "</dd>";
	},
	_nameOfPartner : function(partnerData){
		var self = this;
		if(!partnerData.name || partnerData.name == "N/A"){return ''}
		return '<dt class ="hReport">Id:</dt><dd> ' + partnerData.name + "</dd>";
	},
	_linkMi : function(string){
		var self = this;
		var regExpMi = /\[MI:[0-9]{4}\]/;
		var debutUrl = "https://www.ebi.ac.uk/ontology-lookup/?termId=";
		if (regExpMi.test(string)) {
			var listeString = string.split("[");
			var name = listeString[0];
			var finUrl = listeString[1].substring(0,listeString[1].length - 1);
			var returnString = "<a target = '_blank' href = '" + debutUrl + finUrl + "'>" + name + "</a>";
			return returnString;
		}else{
			return string;
		}
	}
  };
   
    
}