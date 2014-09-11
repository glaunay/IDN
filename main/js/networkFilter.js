/* A simple component to search the network*/

function initNetworkFilter (opt) {
    
    if ( $(opt.target).length == 0) {
		alert ("Unable to find target div " + opt.target);
		return null;
    }
	var size = "minified";
    if ("iState" in opt)
		{size = opt.iState;}
	var onApplyCallbackDefault = function (){
		console.dir("default apply ");
	}
	var onChangeCallbackDefault = function (filter, strict){
		console.dir("default change filter v ");
		console.dir(filter);
	}
	var onCancelCallbackDefault = function(){
		console.dir("default cancel");
	}
	
	var positionSettings = {};
    if ('position' in opt.location) {
		positionSettings = opt.location;
    }  
    var focusOutGlobal = [];
    if ('focusOutGlobal' in opt){
    	focusOutGlobal = opt.focusOutGlobal;
    }
    
    
	return {
		computeBookmarkPosition : opt.computeBookmarkPosition,
		positionSettings: positionSettings,
		focusOutGlobal :focusOutGlobal, // apply and event on all siblings for widget close
		target : opt.target,
		size : size,
		table: {},
		strict :false,
		miniSel : null,
		maxiSel : null,
		stopTime : null,
		tpm : 0,
	/*	data : {"type" : "detectionMethod",
				"data": { "affinity_chromatography_technology[MI:0004]": 5,"comigration_in_sds_page[MI:0808]": 1,"far_western_blotting[MI:0047]": 1,"pull_down[MI:0059]": 47,"solid_phase_assay[MI:0892]": 6,"surface_plasmon_resonance[MI:0107]": 6,"surface_plasmon_resonance_array[MI:0921]": 3,"two_hybrid[MI:0018]": 1,"x_ray_crystallography[MI:0114]": 2,
						},
				"action" : "init"
		},*/
	        data : null,
		previousStatus : [],
		activeFilter : false,
		nodeOrLinkFilter : {},//liste de filtre qui se rempli et se vide au fur et a mesure des check
		
		onApplyCallback : opt.onApplyCallback ? opt.onApplyCallback : onApplyCallbackDefault,
		onChangeCallback : opt.onChangeCallback ? opt.onChangeCallback : onChangeCallbackDefault,
		onCancelCallback : opt.onCancelCallback ? opt.onCancelCallback : onCancelCallbackDefault,
		
		draw : function () {
		    var self = this;	    
		    var buttonStrict = '<div class = "mdeCheck"><span class = "clickBox">Include MDE <i class="fa checkStrict fa-check-square-o"></i></span>'+
		    				   '<i class="fa fa-question-circle pull-right fa-2x"></i></div>';
		    var checkAll = '';
		    var test = '<ul class="nav nav-tabs">'
			+'<li class="active"><a href="#expTableDiv" data-toggle="tab">Expression level</a></li>'
	  		+'<li><a href="#detectionTableDiv" data-toggle="tab">Interaction detection method</a></li>'
  			/*+'<li><a href="#messages" data-toggle="tab">Messages</a></li>'
  			+'<li><a href="#settings" data-toggle="tab">Settings</a></li>'*/
			+'</ul>'
			+'<div class="tab-content">'
  			+'<div class="tab-pane active" id="expTableDiv">'
  			
  			+'<div class = "dataTableDiv"><div class = "tableExp tableFilter">'
  			+'<div class = "expressionTempMess"> Waiting for data </div><div class = "expressionTempMess">'
  			+'<i class="fa fa-spinner fa-spin fa-3x"></i></div></div>'
  			+'<div class = "footerFilter"><div class = "mdePart">'
  			+ buttonStrict
  			+'<div class = "tpmLog">Treshold '
  			+'<input type="text" class="tpm" placeHolder = "0.0"><div class = "jolieDiv operateLabel"> TPM</div></div>'
	    	+'</div><button class ="btn btn-primary apply pull-right"><i class="fa fa-power-off"></i> Apply</button></div></div></div>'
  			+'<div class="tab-pane" id="detectionTableDiv">'
  			
  			+'<div class = "dataTableDiv"><div class = "tableDetect tableFilter">'
  			+'<div class = "detectionTempMess"> Waiting for data</div><div class = "detectionTempMess"> <i class="fa fa-spinner fa-spin fa-3x"></i></div></div>'
  			+'<div class = "footerFilter"><div class = "mdePart">'
  			+ buttonStrict
	    		+'</div><button class ="btn btn-primary apply pull-right"><i class="fa fa-power-off"></i> Apply</button></div></div></div>'
 		/*	+'<div class="tab-pane" id="messages">...</div>'
 			+'<div class="tab-pane" id="settings">...</div>'*/
			+'</div>';
		    
		    
		    var scaffold =  '<div id="loopLargeWrapper">'
			+ '<div class = "loopNetworkHeader"><span class="closeCall"><i class="fa fa-minus-square-o fa-2x"></i></span>'
			+'<i class="fa fa-question-circle pull-right fa-2x helpMe"></i></div>'
			+ test
			+ '</div>'		
			+ '<div id="loopBookmarkWrapper"><i class="fa fa-filter fa-4x"></i></div>';		    
		    $(self.target).append(scaffold);
		    /*Explicit defauklt data load for devel purpose 
		     self.update(self.data);	  
		     */
		    
		    $(self.target + ' #myTab a').click(function () {
  							   $(this).tab('show');
						       });
			$(this.target + ' i.helpMe').popover({ 
	    	   html : true,
	    	   placement : 'right', 
			   title : 'For advanced usage see our <a target = "_blank" href = "https://www.youtube.com/watch?v=Db1tLUz8IAo&index=4&list=PLw61Ua8TujDRLFSZMZChqmqX7yFBYLaz0" >help</a>', 
			   container : 'body',
			   trigger : "manual"
			   })
			   .on("mouseenter", function () {
			   	if(!window.showHelp){return;}
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
	    });
	    
			$(this.target + ' div.mdeCheck i.fa-question-circle')
			.popover({ 
	    			     html : true,
	    			     placement : 'top', 
				     title : '<dl><dt>MDE :</dt><dd>Missing Data Element(s)</dd><dt>TPM</dt><dd>Tanscrit Per Million</dd></dl>', 
				     container : 'body',
				     trigger : 'manual',
				 }).on('mouseenter', function () {
			   		   if(!window.showHelp){return;}
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
					     });
		    
		    this.miniSel = this.target + ' #loopBookmarkWrapper';
		    this.maxiSel = this.target + ' #loopLargeWrapper';
		    var defaultCss = self.computeBookmarkPosition();	 	  
		    $(this.miniSel).css(defaultCss);
		    defaultCss.left = "20%";
		    defaultCss.top = "10%";
		    $(this.maxiSel).css(defaultCss);
		    $(self.target).find('div.footerFilter div.mdeCheck span.clickBox')
			.click(function(){
	    			   if(!self.strict){
	    			       self.strict = true;
	    			       $(self.target).find('div.footerFilter div.mdeCheck span.clickBox').find("i.checkStrict").removeClass("fa-check-square-o");
	    			       $(self.target).find('div.footerFilter div.mdeCheck span.clickBox').find("i.checkStrict").addClass("fa-square-o");
	    			   }else{
	    			       self.strict = false;
	    			       $(self.target).find('div.footerFilter div.mdeCheck span.clickBox').find("i.checkStrict").removeClass("fa-square-o")
	    			       $(self.target).find('div.footerFilter div.mdeCheck span.clickBox').find("i.checkStrict").addClass("fa-check-square-o");
	    			   }				 
	    			   self.onChangeCallback(self.nodeOrLinkFilter,self.strict);
			       });
		    $(self.target).find('div.dataTableDiv button.apply')
			.click(function(){
	    			   self.onApplyCallback(self.strict);
			       });
		    $( window )
			.resize(function() {
				    var newWindowCss = self.computeBookmarkPosition();	 
				    $(self.miniSel).css(newWindowCss);
				});
		    $(this.target).on('click', function (event){
					  // event.stopPropagation();
				      });
	   
		    var elem = $(self.target).find('div.footerFilter input');
		    elem.bind("propertychange  input paste", function(event){ //recherche effectuer	
				  var string = elem.val();
			  clearTimeout(self.stopTime); //si il n'y a pas d'input pendant 1000 ms 
    		  self.stopTime = setTimeout(function(){self._tpmVerif(elem.val())},1000); 	//	on génére la page de résultat
			  
		      });
	    if (this.size === "minified")
		$(this.maxiSel).hide();
	    else
		$(this.miniSel).hide();
	   
	    $(this.miniSel).on('click', function () { self._togglePanel();});	   

	    $(this.maxiSel + ' .btn.add').tooltip({
						      title : function (){return 'Pin matching nodes in tabular widget';},
						      animation : true,
						      placement : 'right',
						      container : 'body'
						  });
	    
	    $(this.maxiSel + ' .closeCall').on ('click', function () {
						    self._togglePanel();
						});
	  
	 

	    $(this.maxiSel + ' .go').on('click', function (e) {					   
					    var type = null;
					    
					    $(self.maxiSel + ' li i')
						.each(function (){
							  type = $(this).parent().attr("etype");
						      });
					    var value = $(self.maxiSel + ' input').val();
					    
					    if ( !value || 
						 $(self.maxiSel + ' li i').length == 0
					       ) {
						   $(this).popover('show');
						   $(this).find('.popover i')
						       .on('click', function(event){
							       event.stopPropagation();
							       $(self.target + ' .go').popover('hide'); 
							   });
						   return;
					       }    
					    
					    $(self.target).trigger('searchWidgetEvent', {type: type, value : value});
					});
	    
	    
	   $(this.target + ' #loopLargeWrapper').drags({handle : ".loopNetworkHeader"});
	    
	},
	_togglePanel : function () {	  
	    if (this.size === "minified") {
		$(this.miniSel).hide();
		this.onChangeCallback(this.nodeOrLinkFilter,this.strict);	
		$(this.maxiSel).show();		
		this.size = "magnified";	
	    } else {
		this._closePanel();
	    }
	},
	_closePanel : function () {
	    $(this.maxiSel).hide();		
	    $(this.miniSel).show();		
	    this.onCancelCallback();
	    this.size = "minified";
	},

		getActive : function(type){/**/
			var self = this;
			
			if(type === "node"){
				return {
					hasFilter : self.nodeOrLinkFilter.length > 0 ? true : false,
					filter : function (nodeData) {
							for (var i=0; i < self.nodeOrLinkFilter.length; i++) {
							  if(self.nodeOrLinkFilter[i](nodeData)){return false;}
							};
							return true
					}}}
					/*,self.generatenodeOrLinkFilter.call(self)
				};
					
			} else if(type === "link"){/*robotlink
				return {
					hasFilter : true,
				};
					
			} 
			alert("unknown type for robot");
			return null;*/
		},
		generatenodeOrLinkFilter : function(){
			/*var returnLitt = {};
			for (var i=0; i < nodeOrLinkFilter.length; i++) {
			  nodeOrLinkFilter[i]
			};*/
			return 
				
			
		},
		_testFilter : function(data){
			var self = this;
			if (data.type === "node"){
				for (var filtreN = 0; filtreN < self.nodeOrLinkFilter.length; i++) {
			 		if(!self.nodeOrLinkFilter[filtreN](data)){return false}//si data ne passe pas un des filtre false
				};
			}else if (data.type === "link"){
				for (var filtreN = 0; filtreN < self.linkFilter.length; i++) {
			 		if(!self.linkFilter[filtreN](data)){return false}//si data ne passe pas un des filtre false
				};
			}
			return true;
		},
		update : function(data){//data{action : "init", type : expressionsTags, data : {tag : nbNode , ... }}type : expressionsTags utile pr tab
			/*call by maestro on any network content change*/
			var self = this;
			self.tpm = 0;
			//console.dir('now update')
			//console.dir(data)
			if(data.type == "expressionLevels"){
				$(self.target).find("div.expressionTempMess").remove();
				self._datatableExpressionLevel(data);
			}
			if(data.type =="detectionMethod"){
				$(self.target).find("div.detectionTempMess").remove();
				self._datatableDetectionMethod(data);
			}
				
		},
		_datatableExpressionLevel : function (data){
			var self = this;
			//console.dir('construct expression filter')
			if(self.table.exp){
				//console.dir('here destroy')
				self.table.exp.fnDestroy();
			}
			$(self.target).find(".tableExpressionData").remove();
			var tableForm = "<table class='tableExpressionData'><thead></thead><tbody></tbody></table>";
			$(self.target).find('div.dataTableDiv div.tableExp').append(tableForm);
			var aaData = self._generateTableData(data.data);
			self.nodeOrLinkFilter.expressionLevel = {}				
    		var table = $(self.target +' table.tableExpressionData').dataTable( {
      	 			"aaData": aaData,
   	  	 			"aoColumns": [
   	  	 	 	  		{ "sTitle": '<i class="fa fa-square-o"></i>',"sWidth": "15px"},
     			 	  	{ "sTitle": "Tissue/State", "sClass": "center","sWidth": "150px" },
      				  	{ "sTitle": "Biomolecule number", "sClass": "center" ,"sWidth": "80px"},
       					],
  			 	 	"sDom": '<"top"f>rt<"bottom"p><"clear">',
  			 	 	"sPaginationType": "bootstrap",
  					"bLengthChange": false,
  					"aoColumnDefs": [{ 'bSortable': false, 'aTargets': [ 0 ] }],
					"fnInitComplete": function(oSettings, json) {
						var oTable = this;
						//console.dir(oTable);
  						$('tr').each(function(){
 		  					$(this).attr("pStatue", "uncheck");
 	 					})
 		  					
     					$(".tableExpressionData th:first-child").click(function(){
     						//console.log("toggle all ExpressionData click");
 	  						self._toggleAll(this, oTable, "expressionLevel");     					
     					});
     					/*
     					                                          each(function(){
     					alert('toto');
     					})*/
     					
     					
 				 		//});
 					 		
				 	}
 	  			});
 	  //			console.dir(table);
 	 			table.$("td:nth-child(1)").click(function(){
 	  						self._toggleCheckBox($(this).find("i"),"expressionLevel");
	  					})
 	  			table.$('td>span').tooltip();
			
			self.table.exp = table;
		},
		_datatableDetectionMethod : function (data){
			var self = this;
			//console.dir("construct detect filter")
			if(self.table.detect){
				self.table.detect.fnDestroy();
			}
			$(self.target).find(".tableDetectionMethod").remove();
			var tableForm = "<table class='tableDetectionMethod'><thead></thead><tbody></tbody></table>";
			$(self.target).find('div.dataTableDiv div.tableDetect').append(tableForm);
			var aaData = self._generateTableData(data.data);
			self.nodeOrLinkFilter.detectionMethod = {}				
			$(this).ready(function(){
    			self.table.detect = $( 'table.tableDetectionMethod' ).dataTable( {
      	 			"aaData": aaData,
   	  	 			"aoColumns": [
   	  	 	 	  	    { "sTitle": '<i class="fa fa-square-o"></i>',"sWidth": "15px"},
     			 	  	    { "sTitle": "Detection method", "sClass": "center","sWidth": "150px" },
      				  	    { "sTitle": "Experiment Number", "sClass": "center" ,"sWidth": "80px"},
       					],
  			 	 	"sDom": '<"top"f>rt<"bottom"p><"clear">',
  			 	 	"sPaginationType": "bootstrap",
  					"bLengthChange": false,
  					"aoColumnDefs": [{ 'bSortable': false, 'aTargets': [ 0 ] }],
					"fnInitComplete": function(oSettings, json) {
						var oTable = this;
  						$('tr').each(function(){
 		  					$(this).attr("pStatue", "uncheck");
 	 					})
 		  					
     					$("table.tableDetectionMethod th:nth-child(1)").click(function(){
//     						console.log("toggle all tableDetectionMethod click");
 	  						self._toggleAll(this, oTable, "detectionMethod")
 				 		});
 					 		
				 	}
 	  			});
 	 			self.table.detect.$("td:nth-child(1)").click(function(){
 	  						self._toggleCheckBox($(this).find("i"), "detectionMethod");
	  					})
 	  			self.table.detect.$('td>span').tooltip();
			});
		},
		_generateTableData : function (data){
  			var self = this;
  			var aaData =[];
  			var uncheckBox ='<i class="fa fa-square-o"></i>';
  			var rootXp = "https://www.ebi.ac.uk/ontology-lookup/?termId="
  			
  			$.each(data,function(expressIn , nbNode){
  		
				expressIn = '<span title="'+ expressIn + '">' + _linkMi(expressIn) + '</span>';
				
				lineTable = [uncheckBox,expressIn,nbNode]
				aaData.push(lineTable);
			  });
			return aaData;
		},
		_tpmVerif : function(value){
			
			var self = this;
			var regexp = /^\+?[0-9]+(\.[0-9]+)?$/
			if(regexp.test(value)){
				$(self.target).find('div.footerFilter input').css("color","green")
				self.tpm = parseFloat(value)
				if(self.nodeOrLinkFilter.expressionLevel){
					self._changeTpm()
					self.onChangeCallback(self.nodeOrLinkFilter,self.strict);
				}
			}else{
				$(self.target).find('div.footerFilter input').css("color","red")
			}
			
		},
		_changeTpm : function(){
			var self = this;
			for (var id in self.nodeOrLinkFilter.expressionLevel) { 
   				self.nodeOrLinkFilter.expressionLevel[id] = self.tpm;
			}
		},
		_toggleAll : function(cible,table,typeOfTable){
			var self = this;
			
			if($(cible).find('i').hasClass('fa-square-o')){
			    $(cible).find('i').attr("class", "fa fa-check-square-o");
			    table.$('td:nth-child(2)').each(function(){
					if(typeOfTable == 'expressionLevel'){
	    				self.nodeOrLinkFilter.expressionLevel[$(this).find("span").attr('data-original-title')] = self.tpm;
	    			}
	    			if(typeOfTable == 'detectionMethod'){
	    				self.nodeOrLinkFilter.detectionMethod[$(this).find("span").attr('data-original-title')] = true;
	    			}
			 	});
	    		table.$('td:nth-child(1)').find("i").each(function(){
	    			$(this).attr("class","fa fa-check-square-o");
		    	});
			}else{
				$(cible).find('i').attr("class", "fa fa-square-o");
				if(typeOfTable == 'expressionLevel'){
	    				self.nodeOrLinkFilter.expressionLevel = {};
	    			}
	    			if(typeOfTable == 'detectionMethod'){
	    				self.nodeOrLinkFilter.detectionMethod = {};
	    			}
				table.$('td:nth-child(1)').find("i").each(function(){
	   				$(this).attr("class","fa fa-square-o");
	   			});
			}
			self.onChangeCallback(self.nodeOrLinkFilter,self.strict);
		},
		_toggleCheckBox : function(tdCible,typeOfTable){
			var self = this;
			if(tdCible.hasClass('fa-square-o')){
				tdCible.removeClass("fa-square-o");
				tdCible.addClass("fa-check-square-o");
				if(typeOfTable == 'expressionLevel'){
					self.nodeOrLinkFilter.expressionLevel[$(tdCible).parent().next().find("span").attr("data-original-title")] = self.tpm;
				}
				if(typeOfTable == 'detectionMethod'){
					self.nodeOrLinkFilter.detectionMethod[$(tdCible).parent().next().find("span").attr("data-original-title")] = true;
				}
			}else{
				tdCible.removeClass("fa-check-square-o");
				tdCible.addClass("fa-square-o");
				if(typeOfTable == 'expressionLevel'){
					delete self.nodeOrLinkFilter.expressionLevel[$(tdCible).parent().next().find("span").attr("data-original-title")];
				}
				if(typeOfTable == 'detectionMethod'){
					delete self.nodeOrLinkFilter.detectionMethod[$(tdCible).parent().next().find("span").attr("data-original-title")];
				}
			}
			self.onChangeCallback(self.nodeOrLinkFilter, self.strict);
		},
		getSelectors : function(){
	    	return {maxi : this.maxiSel, mini: this.miniSel};
   		},
   		
	}
}