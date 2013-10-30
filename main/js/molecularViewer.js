/**
 * Widget embedding GLMOL
 * 
 * TO drawFooter, list sequence using colorCode
 * Click event must target correct segid -> implies atom selection expression w/ segid
 * 
 */


function GLmolInit (opt) {
    
   
    var width = opt.width ? opt.width : '500px';
    var height = opt.height ? opt.height : '400px';
    
    var complete = function (){	
    };
    var error = function (){	
    };
    var success = function (){	
    };

    if (opt.callbackLoadComplete)
	complete = opt.callbackLoadComplete;
    if (opt.callbackLoadError)
	error = opt.callbackLoadError;
    if (opt.callbackLoadSuccess)
	success = opt.callbackLoadSuccess;

    return {
	opt : opt,
	callbackLoadSuccess : success,
	callbackLoadComplete : complete,
	callbackLoadError : error,
	width : width,
	height : height,
	glmol : null,
	srcSelector : opt.target + ' #glmolWidget_src',
	residueSel : [],
	pdbnumArray : null,
	aaSeqArray : null,
	sseArray : null,
	chainidArray : null,
	draw : function () {
	    $(this.opt.target).css({"max-width" : width, overflow : "hidden"});
	    
	    var scaffold = '<div class="glmolHeader"></div>'
		+ '<div id="glmolWidget" style="width: ' + width + '; height: ' + height  + 
		'; background-color: none;"></div>'
		+ '<textarea id="glmolWidget_src" style="display: none;"></textarea>'
		+ '<div class="glmolFooter"></div>';
	    
	    $(this.opt.target).append(scaffold);    
	    this.glmol = new GLmol(this.opt.target + ' #glmolWidget', true); // no#
	    
	   

	    this.glmol.defineRepresentation = function() {
		var all = this.getAllAtoms();
		var hetatm = this.removeSolvents(this.getHetatms(all));
		this.colorByAtom(all, {});
		this.colorByChain(all);
		var asu = new THREE.Object3D();
		
		this.drawBondsAsStick(asu, hetatm, this.cylinderRadius, this.cylinderRadius);
		this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['A'])), [58, 87]), this.cylinderRadius, this.cylinderRadius);
		this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['B'])), [63, 92]), this.cylinderRadius, this.cylinderRadius);
		this.drawCartoon(asu, all, this.curveWidth, this.thickness);
		
		this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);
		this.modelGroup.add(asu);
	    };
	    
	    if (this.opt.draggable) {			    
		if(this.opt.draggable === "true")
		    $('#' + opt.target).drags({handle : ".glmolHeader"});
	    } else {
		$(opt.target + ' .glmolHeader').remove();
	    }
	},
	load : function (pdbName) {
	    var self = this;
	    
	    var JSONText = JSON.stringify({pdbName : pdbName});
  
	    //  console.log("trying to load " + pdbName);
	    $.ajax({		      		   
		       url : '../../cgi-bin/current/structureFetcher',
		       data : JSONText,
		       type : 'POST',
		       contentType: 'application/json',
		       processData : false,
		       dataType: 'json',
		       complete : function () {
			   self.callbackLoadComplete();
		       },
		       error: function (request, type, errorThrown){  //timeout", "error", "abort", and "parsererror".
			   ajaxErrorDecode(request, type, errorThrown);
			   self.callbackLoadError();
		       }, 
		       success : function (data, textStatus, jqXHR){	
			   $(self.srcSelector).val(data.atomRecord);
			   self.glmol.loadMolecule();
		 	   self.storeSequences(data);
			   self.drawFooter();
			   self.callbackLoadSuccess();			   
		       }
		   });
		       /*
			* get("../data/" + pdbName, function(ret) {
			var coreObject = ret;
			*/
	

	    //GetResiduesById(atomlist,resi)
	  
	    
	},
	storeSequences : function (data) { // Store the pdbnum sse and aaseq array out of ajax
	    console.log("storing");
	    console.log(data);
	    this.pdbnumArray = data.pdbnumArray;
	    this.aaSeqArray = data.aaSeqArray;
	    this.sseArray = data.sseArray;
	    this.chainidArray = data.chainidArray;
	},
	cycleTest : function () {
	    var i = 10;
	    setInterval (function(){
			     this.id = this.id ? this.id + 10 : i;
			     var list = [];
			     for (var iatom = 1; iatom < this.id; iatom++) {
				 list.push(iatom);
 			     }
			     
			     //			     console.log(list);		     
			     self.glmol.defineRepresentation = function() { 
				 var all = this.getAllAtoms();
				 var hetatm = this.removeSolvents(this.getHetatms(all));
				 this.colorByAtom(all, {});
				 this.colorByChain(all);
				 this.colorAtoms(list, 204);
				 var asu = new THREE.Object3D();				 
				 /* this.drawBondsAsStick(asu, hetatm, this.cylinderRadius, this.cylinderRadius);
				  this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['A'])), [58, 87]), this.cylinderRadius, this.cylinderRadius);
				  this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['B'])), [63, 92]), this.cylinderRadius, this.cylinderRadius);*/
				 this.drawCartoon(asu, all, this.curveWidth, this.thickness);				 
				 /*this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);*/
				 this.modelGroup.add(asu);				 
			     };
			     self.glmol.rebuildScene();
			     self.glmol.show();
			 }, 500000);  
	},
	erase : function () {
	    $(this.opt.target + " .glmolFooter div.Xsequence")
		.each (function (){
			   $(this).dataTable().fnDestroy();
		       });
	    $(this.opt.target).empty(); 
	},
	drawFooter : function () { /*Append sequence descriptor to widget --> IMPLEMENT FOR n CHAINID */
	    var self = this;	    
	    
	    var colorCode = this.glmol.getChainColor();
	    self.colorChainCode = {};
	    for (var i = 0; i < colorCode.length; i++) {
		self.colorChainCode[colorCode[i].chain] = colorCode[i].color;
	    }
	    var HTML = '<div class="molecularSerie"></div>' // future svg sse descriptions
		+      '<div class="molecularSequence"></div>'; 
	    

	    var dropHtml = '<div id="segid-toggle" class="btn-group dropup">'
		+ '<a class="btn dropdown-toggle" id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="/page.html">'
//		+ 'Chain' 
		+ '<span class="caret"></span>'
		+ '</a>'
		+ '<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">'
		+ '</ul>'
		+ '</div>';
	    
	    
	    $(this.opt.target + " .glmolFooter div.Xsequence")
		.each (function (){
			   $(this).dataTable().fnDestroy();
		       });
	    	 
	    $(this.opt.target + " .glmolFooter").empty().append(dropHtml);
	    $(this.opt.target + " .glmolFooter .dropdown-menu")
		.each(function(){
			  for (var i = 0; i < self.chainidArray.length; i++) {
			      var segid = self.chainidArray[i];
			      var color = self.colorChainCode[segid];
			      $(this).append('<li style="color:' +  color
					     + ';">' + segid + '</li>');			      
			  } 
		      });
	    $(this.opt.target + " .glmolFooter .dropdown-menu li")
		.on('click', function () {			
			var iShow = $(this).index();
			$(self.opt.target + ' .molecularSequence > div')
			    .each(function (index, elem){
				      if (index === iShow) {					 				     
					  $(this).show();
				      } else {
					  $(this).hide();
				      } 					
				  });
		    });
	    
	    $(this.opt.target + " .glmolFooter").append(HTML);
	 
	    for (var j = 0; j < self.chainidArray.length; j++) {	
		$(this.opt.target + ' .glmolFooter .molecularSequence')
		    .append('<table class="Xsequence"><thead><tr></tr></thead><tbody><tr class="index"></tr>'
			    + '<tr class="sequence"></tr></tbody></table>');
		for (var i = 0; i < self.aaSeqArray[j].length; i++){
		    $(this.opt.target + ' .molecularSequence table:last-child thead tr').append('<th></th>');
		    $(this.opt.target + ' .molecularSequence table:last-child tr.sequence').append('<td>' + self.aaSeqArray[j][i]
										  +  '</td>');
		    if ((i + 1)%5 === 0) 
			$(this.opt.target + ' .molecularSequence table:last-child tr.index').append('<td>' 
										   + (i+1) + '</td>');			
		    else 
			$(this.opt.target + ' .molecularSequence table:last-child .index').append('<td></td>');		
		}
	    }
	    var cnt = 0;
	    $('.Xsequence').dataTable( {   "sDom": "tS",
					   "bSort": false,
					   "sScrollX": "100%",
					   "sScrollXInner": "110%",
					   "bScrollCollapse": true,
					   "fnInitComplete" : function (oSettings) {
					       this.$('tr.sequence').find('td')
						   .each(function(){							 
							     var tdElem = this;
							     var segid = self.chainidArray[cnt];
							     var color = self.colorChainCode[segid];
							     $(this).css({"color":color});
							     
							     $(this).on('click',function(){
									    var index = $(this).closest('.dataTables_wrapper').index();
									    console.log("->" + index);	
									    $(this).toggleClass('pushed');
									    if($(this).hasClass('pushed')) {
										self.addResidueSelection(
										    {absNum : $(tdElem).index(), 
										     chainNumber:index});
									    } else {
										
										self.delResidueSelection(
										    {absNum : $(tdElem).index(),
										     chainNumber: index});
									    }
									    self.colorSelResidue();
									});

							 });
					       cnt++;					       
					   }
				       });
	    $('.molecularSequence > div').each(function (index, elem){
				     if (index > 0) {					 				     
					 $(this).hide();
				     }
				 });
	    
	}, 
	addResidueSelection : function (data) {
	    if (data.hasOwnProperty('absNum')) {				
		console.dir(data);
		console.log(this.chainidArray[data.chainNumber]);
		var selector = {
		    pdbnum : parseInt(this.pdbnumArray[data.chainNumber][data.absNum]),
		    chain : this.chainidArray[data.chainNumber],
		    atomIndex : []
		};
		if (! isASCII(selector.pdbnum)) {
		    alert("not an ascii");
		    return;
		}
		for (var i = 0; i < this.residueSel; i++) {
		 if (this.residueSel[i].pdbnum === selector.pdbnum && this.residueSel[i].chain === selector.chain)
		     return;
		}

		
		for (var i = 1; i < this.glmol.atoms.length;i++) {
		    if(this.glmol.atoms[i] == undefined) continue;
		    if(this.glmol.atoms[i].resi === selector.pdbnum && this.glmol.atoms[i].chain === selector.chain){			    
			selector.atomIndex.push(i);
		    }		
		}
		this.residueSel.push(selector);
	    }
	},				       
	delResidueSelection : function (data) {
	    if (data.hasOwnProperty('absNum')) {
		var selector = {
		    pdbnum : parseInt(this.pdbnumArray[data.chainNumber][data.absNum]),
		    chain : this.chainidArray[data.chainNumber],
		    atomIndex : []
		};		
		for (var i = 0; i < this.residueSel; i++) {
		    if (this.residueSel[i].pdbnum === selector.pdbnum && this.residueSel[i].chain === selector.chain) {
			this.residueSel.splice(i, 1);
			return;
		    }			
		}
	    }
	},				       
	colorSelResidue : function () {
	    var self = this;
	    
	    var list = [];
	    console.log(self.residueSel);
	    for (var i = 0; i < self.residueSel.length;i++) {
		list.push.apply(list, self.residueSel[i].atomIndex);
	    }
	    console.log(list);
	    self.glmol.defineRepresentation = function() { 
		var all = this.getAllAtoms();
		var hetatm = this.removeSolvents(this.getHetatms(all));
		this.colorByAtom(all, {});
		this.colorByChain(all);
		this.colorAtoms(list, 13369344);
		var asu = new THREE.Object3D();				 
	/*	this.drawBondsAsStick(asu, hetatm, this.cylinderRadius, this.cylinderRadius);
		this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['A'])), [58, 87]), this.cylinderRadius, this.cylinderRadius);
		this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['B'])), [63, 92]), this.cylinderRadius, this.cylinderRadius);
	*/
		this.drawCartoon(asu, all, this.curveWidth, this.thickness);				 
		/*this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);*/
		this.modelGroup.add(asu);				 
	    };
	    self.glmol.rebuildScene();
	    self.glmol.show();
	},

	defineRepFromController : function () {
	    var idHeader = "#" + this.id + '_';
	    
	    var time = new Date();
	    var all = this.getAllAtoms();
	    var allHet = this.getHetatms(all);
	    var hetatm = this.removeSolvents(allHet);
	    console.log("selection " + (+new Date() - time)); time = new Date();
	    this.colorByAtom(all, {});
	    
	    var colorMode = $(idHeader + 'color').val();
	    if (colorMode == 'ss') {
		this.colorByStructure(all, 0xcc00cc, 0x00cccc);
	    } else if (colorMode == 'chain') {
		this.colorByChain(all);
	    } else if (colorMode == 'chainbow') {
		this.colorChainbow(all);
	    } else if (colorMode == 'b') {
		this.colorByBFactor(all);
	    } else if (colorMode == 'polarity') {
		this.colorByPolarity(all, 0xcc0000, 0xcccccc);
	    }
	    console.log("color " + (+new Date() - time)); time = new Date();
	    
	    var asu = new THREE.Object3D();
	    var mainchainMode = $(idHeader + 'mainchain').val();
	    var doNotSmoothen = ($(idHeader + 'doNotSmoothen').attr('checked') == 'checked');
	    if ($(idHeader + 'showMainchain').attr('checked')) {
		if (mainchainMode == 'ribbon') {
		    this.drawCartoon(asu, all, doNotSmoothen);
		    this.drawCartoonNucleicAcid(asu, all);
		} else if (mainchainMode == 'thickRibbon') {
		    this.drawCartoon(asu, all, doNotSmoothen, this.thickness);
		    this.drawCartoonNucleicAcid(asu, all, null, this.thickness);
		} else if (mainchainMode == 'strand') {
		    this.drawStrand(asu, all, null, null, null, null, null, doNotSmoothen);
		    this.drawStrandNucleicAcid(asu, all);
		} else if (mainchainMode == 'chain') {
		    this.drawMainchainCurve(asu, all, this.curveWidth, 'CA', 1);
		    this.drawMainchainCurve(asu, all, this.curveWidth, 'O3\'', 1);
		} else if (mainchainMode == 'cylinderHelix') {
		    this.drawHelixAsCylinder(asu, all, 1.6);
		    this.drawCartoonNucleicAcid(asu, all);
		} else if (mainchainMode == 'tube') {
		    this.drawMainchainTube(asu, all, 'CA');
		    this.drawMainchainTube(asu, all, 'O3\''); // FIXME: 5' end problem!
		} else if (mainchainMode == 'bonds') {
		    this.drawBondsAsLine(asu, all, this.lineWidth);
		}
	    }
	    
	    if ($(idHeader + 'line').attr('checked')) {
		this.drawBondsAsLine(this.modelGroup, this.getSidechains(all), this.lineWidth);
	    }
	    console.log("mainchain " + (+new Date() - time)); time = new Date();
	    
	    if ($(idHeader + 'showBases').attr('checked')) {
		var hetatmMode = $(idHeader + 'base').val();
		if (hetatmMode == 'nuclStick') {
		    this.drawNucleicAcidStick(this.modelGroup, all);
		} else if (hetatmMode == 'nuclLine') {
		    this.drawNucleicAcidLine(this.modelGroup, all);
		} else if (hetatmMode == 'nuclPolygon') {
		    this.drawNucleicAcidLadder(this.modelGroup, all);
		}
	    }
	    
	    var target = $(idHeader + 'symopHetatms').attr('checked') ? asu : this.modelGroup;
	    if ($(idHeader + 'showNonBonded').attr('checked')) {
		var nonBonded = this.getNonbonded(allHet);
		var nbMode = $(idHeader + 'nb').val();
		if (nbMode == 'nb_sphere') {
		    this.drawAtomsAsIcosahedron(target, nonBonded, 0.3, true);
		} else if (nbMode == 'nb_cross') {
		    this.drawAsCross(target, nonBonded, 0.3, true);
		}
	    }
	    
	    if ($(idHeader + 'showHetatms').attr('checked')) {
		var hetatmMode = $(idHeader + 'hetatm').val();
		if (hetatmMode == 'stick') {
		    this.drawBondsAsStick(target, hetatm, this.cylinderRadius, this.cylinderRadius, true);
		} else if (hetatmMode == 'sphere') {
		    this.drawAtomsAsSphere(target, hetatm, this.sphereRadius);
		} else if (hetatmMode == 'line') {
		    this.drawBondsAsLine(target, hetatm, this.curveWidth);
		} else if (hetatmMode == 'icosahedron') {
		    this.drawAtomsAsIcosahedron(target, hetatm, this.sphereRadius);
		}
	    }
	    console.log("hetatms " + (+new Date() - time)); time = new Date();
	    
	    var projectionMode = $(idHeader + 'projection').val();
	    if (projectionMode == 'perspective') this.camera = this.perspectiveCamera;
	    else if (projectionMode == 'orthoscopic') this.camera = this.orthoscopicCamera;
	    
	    this.setBackground(parseInt($(idHeader + 'bgcolor').val()));
	    
	    if ($(idHeader + 'cell').attr('checked')) {
		this.drawUnitcell(this.modelGroup);
	    }
	    
	    if ($(idHeader + 'biomt').attr('checked')) {
		this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);
	    }
	    if ($(idHeader + 'packing').attr('checked')) {
		this.drawSymmetryMatesWithTranslation2(this.modelGroup, asu, this.protein.symMat);
	    }
	    this.modelGroup.add(asu);
	}
    };
}