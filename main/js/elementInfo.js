/*
 * 
 * Element displaying current node or link info 
 * 
 * 
 */

function ei_test() {

    var nodeTest = {
	betweenness: "3",
	biofunc: "Induces KLC1 association with vesicles and functions as a cargo in axonal anterograde transport. Complex formation with APBA2 and APP, stabilizes APP metabolism and enhances APBA2-mediated suppression of beta-APP40 secretion, due to the retardation of intracellular APP maturation. In complex with APBA2 and C99, a C-terminal APP fragment, abolishes C99 interaction with PSEN1 and thus APP C99 cleavage by gamma-secretase, most probably through stabilization of the direct interaction between APBA2 and APP. The intracellular fragment AlcICD suppresses APBB1-dependent transactivation stimulated by APP C-terminal intracellular fragment (AICD), most probably by competing with AICD for APBB1-binding. May modulate calcium-mediated postsynaptic signals. (by similarity)",
	central: false,
	common: "Calsyntenin-1, Alcadein-alpha",
	fixed: true,
	glow: false,
	index: 5,
	molecularWeight: "109793",
	name: "O94985",
	px: 809.6392110253162,
	py: 421.7860937665938,
	relationship: {    
	    boundTo: [],
	    hasComponent: [], 
	    hasFragment : [],
	    isComponentOf: [],
	    isFragmentOf: []
	},
	specie: "9606",
	type: "protein",
	uniprotKW: ["KW-0025", "KW-0106", "KW-0130", "KW-0965", "KW-1003", "KW-0966", "KW-0181", "KW-0903"],
	weight: 2,
	x: 809.9553477290684,
	y: 421.7995313214508,
	pdb : ["3emlA", "3emlA"]
    };    
    
    var widget = initElementInfo({
				     width : '350px', height : '600px',
				     target : 'body',
				     callback : {}				  
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

    var computeCss = function () {
	console.dir(this);
	return {main : {position : 'absolute', top : '50px', left : '50px', width : this.width, 'max-height' : this.height} ,
		upmark :  {position : 'absolute', top : '20px', left : '50px'}};
    };    
    if (opt.callback.computeCss)
	computeCss = opt.callback.computeCss;
      
    return {
	molViewIndex : null,
	target : opt.target,
	molViewer : null,
	computeCss : computeCss,
	selector : opt.target + ' div#elementInfo',
	data : null,
	height : height,
	width : width,
	baseUrl : {
	    uniprotKeyWord : "http://www.uniprot.org/keywords/",
	    uniprot : "http://www.uniprot.org/uniprot/",
	    pdb : "www.rcsb.org",
	    taxon : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id="
	},
	draw : function (data) {
	    console.log("lets draw");
	    this.data = data;
	    
	    $(this.target).append('<div id="elementInfo"><div class="upmark"></div><div class="ei-main"><div class="ei-header"></div><div class="ei-body"></div></div><div>');

	    var self = this;
	    $( window ).resize(function() {
				   var newWindowCss = self.computeBookmarkPosition();	    
				   $(self.selector + ' .ei-main').css(newWindowCss.main);
				   $(self.selector + ' .upmark').css(newWindowCss.upmark);
			       });
	    console.log(this.data);
	    if (this.data.type === "association") {
	    } else {
		this.generateNodeContent();
	    }
	    console.log("totot");
	    var styleObj = this.computeCss();
	    console.dir(styleObj);
	    $(this.selector + ' .upmark').css(styleObj.upmark); 
	    $(this.selector + ' .ei-main').css(styleObj.main); 

	    $(this.selector + ' .icon-remove-circle').on('click', function (){self.destroy();});

	},
	startMolViewer : function () {
	    var self = this;
	    this.molViewer = GLmolInit({width : '250px', height : '200px', target : '#elementInfo .pdbDiv', 
			       callbackLoadSuccess : function (){ 
				   console.log("success");
				   self.toggleMoleculeLoader();
				   $(self.selector + ' #glmolWidget').show();
				   $(self.selector + ' .glmolFooter').show();
				   $(self.selector + ' .pdbBanner').show();
			       },
			       callbackLoadError : function (){ 
				   console.log("ERROR LOADING PDB");
			       }
			      });
	},
	destroy : function () {
	    var self = this;
	    this.toggleMoleculeLoader("show");
	    $(this.selector).fadeToggle({duration : 200, easing : "swing", complete : function (){ $(self.selector).remove();}});
	  
	},
	toggleMoleculeLoader : function (opt) {
	    console.log("TOGGLER");	    
	    if(opt) {
		if (opt === "show")
		    if($(this.selector + ' .molLoader').length > 0)
			return;
		if (opt === "hide")
		    if($(this.selector + ' .molLoader').length === 0)
			return;
	    }

	    if ($(this.selector + ' .molLoader').length === 0) {				    
		var html = '<div class="molLoader"><i class="icon-spin icon-rotate-right"></i></div>';
		if ($(this.selector + ' .pdbDiv .pdbChange').length > 0) {
		    var elem = $(this.selector + ' .pdbDiv .pdbChange')[0];
		    $(elem).after(html);
		} else {	
		    $(this.selector + ' .pdbDiv').append(html);		   
		}
	
		var h = $(this.selector + ' #glmolWidget').height();
		h = h ? h : "100px";
		$(".molLoader").css({"width" : h, "height" : "191px", "padding-top" : 0.5 * h});
		$(this.selector + ' #glmolWidget').hide();
		$(this.selector + ' .glmolFooter').hide();	
		$(this.selector + ' .pdbBanner').hide();	    
				

	    } else {
		console.log("i shall remove");
		$(this.selector + ' .molLoader').remove();
	    }
	},	
	generateLinkContent : function (){

	},
	generateNodeContent : function () {	    
	    console.log("generating node content");
	    $(this.selector + ' .upmark').text(this.data.name);
	    $(this.selector + ' .ei-header').append(this.data.common + '<i class="icon-remove-circle pull-right"></i>');
	    var self = this;

	    self.bodyVisitCardGenerate();	   
	    var tags = ['pdb', 'biofunc', 'relationship']; //, 'uniprotKW'
	    for (var i = 0; i < tags.length; i++) {
		    var elem = tags[i];
		if (this.data[elem]) {	
		    console.log("i have " + elem + ' content');
		    self.bodyContentGenerate[elem].call(this);
		}
	    }
	    
	    $(this.selector + ' .category-header i')
		.on('click', function (){		
			var iconElem = this;
			$(this).parent().siblings('.category-content').toggle( "fast", function() {
										   
										   $(iconElem).toggleClass("icon-collapse").toggleClass("icon-collapse-top");
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
	bodyVisitCardGenerate : function () {	    
	    var cv = '<div class="summary"><table class="cv" ><tbody></tbody></table></div>';
	    $(this.selector + ' .ei-body').append(cv);
	    var tags = ["Type", "Specie", "Molecular weight", "Length", "Current interactors", "Registred interactors"]; 
	    var self = this;
	    var writer = {
		cnt : 0,
		Type : function(){	
		    if (!self.data.type) return null;
		    this.cnt++;
		    return '<dl><dt>Type</dt><dd>' + self.data.type + '</dd></dl>';
		},
		Specie : function () {
		    if (!self.data.specie) return null;
		    this.cnt++;
		    return '<dl><dt>Specie</dt><dd><a href="' + self.baseUrl.taxon + '/'
			+ self.data.specie + '" target="_blank">' + self.data.specie + '</a></dd></dl>';
		},
		Length : function () {
		    if(!self.data.seqLength) return null;
		    this.cnt++;
		    return '<dl><dt>amino acid number</dt><dd>' + self.data.seqLength + '</dd></dl>';
		},
		"Current interactors" : function () {
		    if(!self.data.weight) return null;
		    this.cnt++;
		    return '<dl><dt>Current network</dt><dd>' + self.data.weight + ' interactors</dd></dl>';
		},
		"Registred interactors" : function () {
		    if(!self.data.betweenness) return null;
		    this.cnt++;
		    return '<dl><dt>Registred in databases</dt><dd>' +  self.data.betweenness +  ' interactors</dd></dl>';
		},
		"Molecular weight": function () {
		    if(!self.data.molecularWeight) return null;
		    this.cnt++;
		    return '<dl><dt>Molecular weight</dt><dd>' + self.data.molecularWeight + ' Da</dd></dl>';
		}
	    };	 
	    console.log(tags);
	    for (var i = 0; i < tags.length; i++) {	
		console.log(tags[i]);
		console.dir(writer);
		var html = writer[tags[i]]();		
		if (!html) continue;
		if((writer.cnt -1) %3 === 0 || writer.cnt == 1)
		    $(this.selector + " .summary table tbody").append('<tr></tr>');
		$(this.selector + " .summary table tbody tr:last-child").append('<td>' + html + '</td>');
	    }
	    
	},
	bodyContentGenerate : {
	    biofunc : function () {
		$(this.selector + ' .ei-body').append('<div class="biofuncDiv"><div class="category-header">Biological function<i class="icon-collapse pull-right"></i></div><div class="category-content">' + this.data.biofunc + '</div></div>');
	    },
	    molecularWeight : function () {
		var self = this;
		console.log("MW tag");
		$(this.selector + ' .ei-body').append('<div class="daltonDiv">' + this.data.molecularWeight + '</div>');
	    },
	    uniprotKW : function (){
		var self = this;
		$(this.selector + ' .ei-body').append('<div class="uniprotKwDiv"><div class="category-header">UniprotKeyword<i class="icon-collapse pull-right"></i></div><div class="category-content"><ul class="term-list"></ul></div></div>');
		console.dir(this);
		this.data.uniprotKW.forEach(function (elem) {
						$(self.target + ' .uniprotKwDiv ul').append('<li><a href="' + self.baseUrl.uniprotKeyword + elem + '">' + elem + '</a></li>');
					    });
	    },
	    pdb : function () {
		var self = this;
		if (!this.molViewer)
		    this.startMolViewer();
		
		
		var pdbCode = this.data.pdb[0].match(/^.{4}/);
		$(this.selector + ' .ei-body').append('<div class="pdbDiv"><div class="pdbBanner"><div class="pull-left">PDB structure Code <a' 
						      + ' href="' + self.baseUrl.pdb + '/' + pdbCode[0] + '" target="_blank">'
						      + pdbCode[0] + '</a></div><div class="pull-right">1/' +  this.data.pdb.length + '</div></div></div>');	
		var e = $(this.selector + ' div.pdbDiv')[0];
		
		this.molViewer.draw();
		this.toggleMoleculeLoader();		
		if (this.data.pdb.length > 1) {		  
		    $(this.selector + ' .ei-body div.pdbDiv')
			.append('<div class="pdbChange"><i class="icon-chevron-right"></i></div>')
			.prepend('<div class="pdbChange"><i class="icon-chevron-left"></i></div>'); 
		}
		var top = jQuery(e).offset().top;
		top += 75;
		console.log("-->" + top);
		$(this.selector + " .pdbChange i").css({top : top + "px"});
		this.molViewer.load(this.data.pdb[0]);
		
		


		this.molViewIndex = 0;
		$(".pdbChange i").on('click', function (){
					 self.toggleMoleculeLoader();
					 if ($(this).hasClass('icon-chevron-left')) {
					     self.molViewIndex =  self.molViewIndex > 0
						 ? self.molViewIndex - 1 : self.data.pdb.length - 1;
					 } else {
					     self.molViewIndex = self.molViewIndex < self.data.pdb.length - 1 
						 ? self.molViewIndex + 1 : 0;
					 }
					 console.log("-->" + self.molViewIndex);
					 self.molViewer.load(self.data.pdb[self.molViewIndex]);
					 var pdbCode = self.data.pdb[self.molViewIndex].match(/^.{4}/);					
					 $(self.selector + ' .pdbBanner').empty().append(
					     '<div class="pull-left">PDB structure Code <a' 
						 + ' href="' + self.baseUrl.pdb  + '/' + pdbCode[0] + '" target="_blank">'					     
						 + pdbCode[0] + '</a></div><div class="pull-right">' + (self.molViewIndex + 1) + '/' +  self.data.pdb.length + '</div></div></div>');	
					     
				     });
		
		console.log("done");
	    },
	    relationship : function () {
		
	    }
	}
	
    };
    
}