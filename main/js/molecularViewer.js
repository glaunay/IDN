/**
 * Widget embedding GLMOL
 * 
 */


function GLmolInit (opt) {
    
   
    var width = opt.width ? opt.width : '500px';
    var height = opt.height ? opt.height : '400px';
    
    return {
	opt : opt,
	width : width,
	height : height,
	glmol : null,
	srcSelector : opt.target + ' #glmolWidget_src',
	residueSel : {},
	draw : function () {
	    $(this.opt.target).css({"max-width" : width, overflow : "hidden"});
	    
	    var scaffold = '<div class="glmolHeader"></div>'
		+ '<div id="glmolWidget" style="width: ' + width + '; height: ' + height  + 
		'; background-color: black;"></div>'
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
	 
		       },
		       error: function (request, type, errorThrown){  //timeout", "error", "abort", and "parsererror".
			   ajaxErrorDecode(request, type, errorThrown);
			   
		       }, 
		       success : function (data, textStatus, jqXHR){			   
			   $('#' + self.srcSelector).val(data.atomRecord);
			   self.glmol.loadMolecule();
		 	   self.storeSequences(data);
			   self.drawFooter();
		       }
		   });
		       /*
			* get("../data/" + pdbName, function(ret) {
			var coreObject = ret;
			*/
	

	    //GetResiduesById(atomlist,resi)
	  
	    
	},
	storeSequences : function (data) { // Store the pdbnum sse and aaseq array out of ajax
	    this.pdbnumArray = data.pdbnumArray;
	    this.aaSeqArray = data.aaSeqArray;
	    this.sseArray = data.sseArray;
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
	drawFooter : function () { /*Append sequence descriptor to widget --> IMPLEMENT FOR n CHAINID */
	    var self = this;	    

	    var HTML = '<div class="molecularSerie"></div>' // future svg sse descriptions
		+      '<div class="molecularSequence"><table class="Xsequence"><thead><tr></tr></thead><tbody><tr class="index"></tr>'
		+ '<tr class="sequence"></tr></tbody></table></div>'; 
	    
	    $('#' + this.opt.target + " .glmolFooter").append(HTML);
	    for (var i = 0; i < self.aaSeqArray.length; i++){
		$('#' + this.opt.target + ' .molecularSequence thead tr').append('<th></th>');
		$('#' + this.opt.target + ' .molecularSequence tr.sequence').append('<td>' + self.aaSeqArray[i]
										    +  '</td>');
		if ((i + 1)%5 === 0) 
		    $('#' + this.opt.target + ' .molecularSequence tr.index').append('<td>' 
										     + (i+1) + '</td>');			
		else 
		    $('#' + this.opt.target + ' .molecularSequence .index').append('<td></td>');		
	    }
	    
	    $('.Xsequence').dataTable( {   "sDom": "tS",
					   "bSort": false,
					   "sScrollX": "100%",
					   "sScrollXInner": "110%",
					   "bScrollCollapse": true,
					   "fnInitComplete" : function (oSettings) {					       					   
					       
					       this.$('tr.sequence').find('td')
						   .each(function(){
							     var tdElem = this;
							     $(this).css({"color":"red"});

							     $(this).on('click',function(){
									    $(this).toggleClass('pushed');
									    if($(this).hasClass('pushed')) {
										self.addResidueSelection({absNum : $(tdElem).index()});
									    } else {
										self.delResidueSelection({absNum : $(tdElem).index()});
									    }
									    self.colorSelResidue();
									});
							     
							    /* $(this).hoverIntent( 
								 {
								     over : function () {
									 self.pickResidue($(tdElem).index());
								     },
								     timeout : 500,
								     out : function (){
									 console.log("hiding");
								     }
								 });*/
							 });	    
					   }
				       });	
	}, 
	addResidueSelection : function (data) {
	    if (data.hasOwnProperty('absNum')) {
		var pdbnum = parseInt(this.pdbnumArray[data.absNum]);
		if (! isASCII(pdbnum)) {
		    alert("not an ascii");
		    return;
		}
		if (! this.residueSel[pdbnum]) {
		    this.residueSel[pdbnum] = [];		
		    for (var i = 1; i < this.glmol.atoms.length;i++) {
			if(this.glmol.atoms[i] == undefined) continue;
			if(this.glmol.atoms[i].resi === pdbnum){			    
			    this.residueSel[pdbnum].push(i);
			}
		    }
		}
	    }
	},				       
	delResidueSelection : function (data) {
	    if (data.hasOwnProperty('absNum')) {
		var pdbnum = this.pdbnumArray[data.absNum];
		if (this.residueSel[pdbnum])
		    delete this.residueSel[pdbnum];		
	    }
	},				       
	colorSelResidue : function () {
	    var self = this;
	    
	    var list = [];
	    console.log(self.residueSel);
	    for (nres in self.residueSel) {
		list.push.apply(list, self.residueSel[nres]);
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