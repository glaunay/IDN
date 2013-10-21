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
    
    var widget = initElementInfo({width : '350px', height : '600px',
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
    var molViewer = GLmolInit({width : '200px', height : '200px', target : '#elementInfo .pdbDiv'});
    return {
	molViewIndex : null,
	target : opt.target,
	molViewer : molViewer,
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

	},
	erase : function () {

	},
	displayMoleculeLoader : function () {
	    $(this.selector + ' .pdbDiv').append('<div class="molLoader"><i class="icon-spin icon-rotate-right"></i></div>');
	    var h =$(this.selector + ' .pdbDiv').height();
	    $(".molLoader").css({"margin-top" : -h});
	    $(".molLoader").css({"height" : h, "width" : "100%", "padding-top" : 0.5 * h});
	},	
	generateLinkContent : function (){

	},
	generateNodeContent : function () {	    
	    console.log("generating node content");
	    $(this.selector + ' .upmark').text(this.data.name);
	    $(this.selector + ' .ei-header').append(this.data.common + '<i class="icon-remove-circle pull-right"></i>');
	    var self = this;
	    // Systematic are name common and betweeness weight
	    if (this.data.type === "protein") {
		var tags = ['pdb', 'biofunc', 'molecularWeight', 'uniprotKW'];
		for (var i = 0; i < tags.length; i++) {
		    var elem = tags[i];
		    if (this.data[elem]) {	
			console.log("i have " + elem + ' content');
			self.bodyContentGenerate[elem].call(this);
		    }
		}
	    }

	    $(this.selector + ' .category-header i')
		.on('click', function (){
			console.log("coucou");
			$(this).parent().siblings('.category-content').toggle( "fast", function() {
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
		console.log("pdb tag");
		console.dir(this);
		$(this.selector + ' .ei-body').append('<div class="pdbDiv"></div>');	
		this.molViewer.draw({loadCompleteCallBack : function(){$(this.selector + ' .molLoader').remove();}});		
		this.molViewer.load(this.data.pdb[0]);

		if (this.data.pdb.length > 0) {
		    $(this.selector + ' .ei-body div.pdbDiv')
			.append('<div class="pdbChange"><i class="icon-chevron-right"></i></div>')
			.prepend('<div class="pdbChange"><i class="icon-chevron-left"></i></div>'); 
		}


		this.molViewIndex = 0;
		$(".pdbChange i").on('click', function (){
					 self.displayMoleculeLoader();
					 if ($(this).hasClass('icon-chevron-left')) {
					  self.molViewIndex =  self.molViewIndex > 0
					      ? self.molViewIndex - 1 : self.data.pdb.length - 1;
				      } else {
					  self.molViewIndex = self.molViewIndex < self.data.pdb.length - 1 
					      ? self.molViewIndex + 1 : 0;
				      }
					 console.log("-->" + self.molViewIndex);
					 self.molViewer.load(self.data.pdb[self.molViewIndex]);
				     });
		
		console.log("done");
	    }
	}
	
    };
    
}