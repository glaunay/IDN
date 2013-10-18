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
	pdb : ["3emlA"]
    };    
    
    var widget = initElementInfo({width : '350px', height : '400px',
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
    var width = opt.width ? opt.width : '200px';
    var height = opt.height ? opt.height : '200px';

    var computeCss = function () {
	return {element : {position : 'absolute', top : '50px', right : '50px', width : "250px", height : "350px"} ,
		upmark :  {position : 'absolute', top : '40px', right : '50px', width : "250px", height : "350px"}};
    };    
    if (opt.callback.computeCss)
	computeCss = opt.callback.computeCss;
    var molViewer = GLmolInit({width : '150px', height : '150px', target : '#elementInfo .pdbDiv'});
    return {
	target : opt.target,
	molViewer : molViewer,
	computeCss : computeCss,
	selector : opt.target + ' div#elementInfo',
	data : null,
	draw : function (data) {
	    console.log("lets draw");
	    this.data = data;
	    
	    $(this.target).append('<div id="elementInfo"><div class="upmark"></div><div class="ei-header"></div><div class="ei-body"></div></div>');

	    var self = this;
	    $( window ).resize(function() {
				   var newWindowCss = self.computeBookmarkPosition();	    
				   $(self.selector).css(newWindowCss.element);
				   $(self.selector + ' .upmark').css(newWindowCss.upmark);
			       });
	    console.log(this.data);
	    if (this.data.type === "association") {
	    } else {
		this.generateNodeContent();
	    }
	},
	erase : function () {

	},
	generateLinkContent : function (){

	},
	generateNodeContent : function () {	    
	    console.log("generating node content");
	    $(this.selector + ' .upmark').text(this.data.name);
	    $(this.selector + ' .ei-header').append(this.data.common + '<i class="icon-remove-circle pull right"></i>');
	    var self = this;
	    // Systematic are name common and betweeness weight
	    if (this.data.type === "protein") {
		var tags = ['PDB', 'biofunc', 'molecularWeight', 'uniprotKW'];
		for (var i = 0; i < tags.length; i++) {
		    var elem = tags[i];
		    if (this.data[elem]) {	
			console.log("i have " + elem + ' content');
			self.bodyContentGenerate[elem].call(this);
		    }
		}
	    }
	    
	    /*Protein_Fragment*/
	    
	    /*Glycosaminoglycan*/

	    /*Lipid*/

	    /* Multimer */
	    
	    /* Inorganic */	    
	    
	    /* Prot*/
	},
	bodyContentGenerate : {
	    biofunc : function () {
		$(this.selector + ' ei-body').append('<div class="biofuncDiv">' + this.data.biofunc + '</div>');
	    },
	    molecularWeight : function () {
		var self = this;
		$(this.selector + ' ei-body').append('<div class="daltonDiv">' + this.data.molecularWeight + '</div>');
	    },
	    uniprotKW : function (){
		var self = this;
		$(this.selector + ' ei-body').append('<div class="uniprotKwDiv"><ul></ul></div>');
		console.dir(this);
		this.data.uniprotKW.forEach(function (elem) {
						$(self.target + ' .uniprotKwDiv').append('<li>' + elem + '</li>');
					    });
	    },
	    PDB : function () {
		console.dir(this);
		$(this.selector + ' ei-body').append('<div class="pdbDiv"></div>');	
		this.molViewer.draw();
		this.molViewer.draw(this.data.pdb[0]);		
	    }
	}
	
    };
    
}