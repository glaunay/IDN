/* Vizualiser component declaration and settings */


function networkTest_alpha (opt) {
    
    vizObject = { 
	core : null, 
	tabular : null,
	tooltipContents : null,
	getProviderList : function () {
	    return ["matrixdb"];
	},
	getContext : function() {
	    var context = {
		rootUrl : null,
		from : null
	    };
	    var location = document.URL;
	    var cgiPattern = new RegExp("iNavigatorGateWay");
	    var htmlPattern = new RegExp("iNavigator.html");
	    
	    if (cgiPattern.test(location)) {
		context.from = 'CGI';
	    } else if (htmlPattern.test(location)) {
		context.from = 'HTML';	    
	    }
	    
	    var publicPattern = /matrixdb-new.ibcp.fr/;
	    context.rootUrl = publicPattern.test(location) ? 'http://matrixdb-new.ibcp.fr' : 'http://matrixdb.ibcp.fr:9999'; 
	    
	    return context;
	}
    };   
    bindExportActions();
    
    var context = vizObject.getContext();
    console.log("CONTEXT");
    console.dir(context);
    // polluting namespance with #networkWindow should be sent as opt.target to core Init
    // later ...
    vizObject.core = coreInit(opt);          
    vizObject.core.draw();
    vizObject.networkWindow = $('#networkWindow');
    vizObject.tabular = tabularInit({ target : "#vizContainer",
				      staticHref : context.rootUrl,
				      "height" : "500px",
				      "width" : "580px",
				      "draggable" : true,
				      "iState" : "minified", 
				      location : {host : opt.target , position : { side : "left", rank : 1, total : 5 }
						 }, 
				      computeBookmarkPosition : computeBookmarkPosition,
				      callback : {
					  addCriterion : function (critObj) {
					      vizObject.cartCtrl.addCriterion(critObj);
					  },
					  deleteNode : function (nodeNameList) {
					      vizObject.core.remove(nodeNameList);
					  }
				      }});    
    vizObject.tabular.draw();

    vizObject.monitor = initMonitor({ target : "#vizContainer"});
    vizObject.monitor.draw();

    var legendDivHTML = vizObject.core.generateSymbolLegend({target : "body"});    
    
    vizObject.cartCtrl = initCartCtrl({ target : "#vizContainer",	
					draggable : true,
					"iState" : "minified", //  "magnified",
					location : {host : opt.target , position : { side : "left", rank : 2, total : 5 }},
					computeBookmarkPosition : computeBookmarkPosition,
					callback : {
					    ajaxSearch : function (data) {
						vizObject.core.setStatus("fetching");
						networkExpand(data, function (networkData, request) {
								  console.log("network Expand callback");
								  vizObject.networkID = networkData.id;
								  vizObject.core.add(networkData);
								  vizObject.core.addCenter(networkData.newCenters);	
								  var keywordDistrib = vizObject.core.getKeywordDistribution();
								  vizObject.statComp.makeStatUniprotKeywrd(keywordDistrib);								  
							      });
					    },
					    jobExhaustion : function () {
						var tabularDomElemSelector = vizObject.tabular.getSelector("maxi");
						console.log("dataFetchDone STAGE <<<<");
						$(tabularDomElemSelector).trigger('dataFetchDone');						
					    },
					    getGlowyAsCriterionList : function () {
						var data = vizObject.core.getGlowyNodes();
						var crit = [];
						for (var i = 0; i < data.length; i++) {
						    crit.push({ type : "biomolecule", name : data[i].name});
						}
						return crit;
					    }
					}
				      });
    vizObject.cartCtrl.draw();
    
    /*
     * statisticWidjet component
     * 
     * 
     */  
    
	vizObject.statComp = initMyStatWidjet({
							target : 'body',
							rootUrl : context.rootUrl,
							"draggable" : true,	
						});
	vizObject.statComp.loadRessource();
	
	
    /*
     * barSearch Component 
     * 
     * 
     */
    vizObject.barSearch = initBarSearch({
					      targetDiv : "#searchBarNav",
					      rootUrl : context.rootUrl,
					      iNavContext : true,
					      addCartNavCallback : function(critObj){
						  		vizObject.cartCtrl.addCriterion(critObj);
					      },
					      graphSearchCallback : function (string){
					      		
					      		var result = vizObject.core.bubbleSearchedNodes(string,"start");
					      		return result;
					      }
					  });
    vizObject.barSearch.draw();
    

    /*
     * 
     * NetworkSearch Component
     * 
     */
    $(opt.target).append('<div id="networkLoopContainer"></div>');
    vizObject.networkFilter = initNetworkFilter(
	{
	    target : "#networkLoopContainer",
	    "iState" : "minified", // "magnified", 
	    location : {host : opt.target , position : { side : "left", rank : 3, total : 5 }},
	    computeBookmarkPosition : computeBookmarkPosition,
            onApplyCallback : function () {
		vizObject.core.applyFilter();  
	    },
	    onChangeCallback : function(filterSet) {
	    if(vizObject.core.getStatus() === "fetching"){
	    	return;
	    }
		//console.log("filterData");
		//console.dir(filterSet);
		vizObject.core.previewFilter(filterSet, true);    		
	    },
	    onCancelCallback : function () {
		vizObject.core.cancelFilter();    	
	    }	    
	}
    );
    vizObject.networkFilter.draw();
    // Start historicHover widget
    vizObject.historicHover = initHistoricHover({
    						    target : 'body',
    						    callbackInfo : function (data){
    							vizObject.elementInfo.draw(data);
   						    },
   						    callbackBubbleStart : function (data){
   							if(data.type != "association"){
   							    vizObject.core.bubbleNode(data, 'start');
   							}else{
   							    console.log("css change on link")
   							}
   							
   						    },
   						    callbackBubbleStop : function (data){
   							if(data.type != "association"){
   							    vizObject.core.bubbleNode(data, 'stop');
   							}else{
   							    console.log("stop css change on link")
   							}
   						    }
   						});
    vizObject.historicHover.draw();

    /*
     * Style managment widget         
     * 
     */
    $(opt.target).append('<div id="paletteContainer"></div>');
    vizObject.paintCtrl = initPalette(
	{
	    target : "#paletteContainer",
	    "iState" : "minified", // "magnified", 
	    location : {host : opt.target , position : { side : "left", rank : 4, total : 5 }},
	    computeBookmarkPosition : computeBookmarkPosition,
	    draggable : "true",
	    callback : {
		onColorChange : function (hexCode) {
		    vizObject.core.colorGlowyNodes(hexCode);
		}
	    }
	}
    );
    vizObject.paintCtrl.draw();
	
    vizObject.elementInfo = initElementInfo({
						target : 'div.historyWidjet',
						width : '350px', height : '600px',
						context : context.from,
						rootUrl : context.rootUrl,
						callback : {
   						    computeCss : function(){
   							return {
							    main : { 
								width : "251px", 'height' : "300px", 
								position : "absolute", top : "0", right: "-1px",
							    },
							    upmark :  {
								width: "251px",overflow : "visible",  position : "absolute",
								top : "-60px",right:"-1px",
							    }
							};
   						    },
   						    onClose : function(data){
   							vizObject.core.bubbleNode(data, 'stop');
   						    }
						}
					    });
    
    vizObject.idleDiv = startIdle({target : 'body', parent : vizObject.networkWindow});
    
    vizObject.scheduler = schedulerInit ({   chunkSize : 10,
					     period : 5000,
					     nThread : 5,
					     jobMaker : {
						 template : function (data) {						   
						     var requestObject = {
							 providers : vizObject.getProviderList(),
							 data : data
						     };
						     var JSONText = JSON.stringify(requestObject);
						     return {
							 url: context.rootUrl + '/cgi-bin/current/dataFetcher',
							 data : JSONText,
							 type: 'POST',
							 contentType: 'application/json',
							 processData: false,
							 dataType: 'json',
							 data : JSONText
						     };
						 },
						 callback : {
						     success : function (referer, data){
							 console.dir(referer);
							 	 //console.dir(data);
							 var nodeCount = 0;
							 var linkCount = 0;
							 
							 for (var i = 0; i < referer.length; i++) {
							     if (referer[i].type === "association") {
								 console.log("Association data, treating dataFetched for " + data[i].name);
							     	 console.dir(data[i]);
								 
								 if (referer[i].details.name !== data[i].name) {  // link.details can be undefined 
								     console.log("Error! in ajax link data retrieval ");
								     console.dir (referer[i]);
								     console.dir (data[i]);
								     continue;
								 }
								 for (var key in data[i]) {
								     if (key === "name") continue;
								     referer[i].details[key] = data[i][key];
								 }
								 linkCount++;
								 vizObject.core.activateLink(referer[i]);
								 vizObject.tabular.touchLink(referer[i]);
							     } else { // nodes by default
							     	console.log("Default, treating dataFetched for " + data[i].name);
							     	console.dir(data[i]);
								 for (var key in data[i]) {
								     if (key === "name") continue;
								     referer[i][key] = data[i][key];
								 }
								 vizObject.core.activateNode(referer[i]);
								 nodeCount++;
							     }							     
							 }
							 vizObject.monitor.update(
							     {
								 nodes : nodeCount,
								 links : linkCount 
							     });
						     }
						 }
					     },
					     onExhaustionCallback : function () {
						 vizObject.core.dispatchLinkData();
						 vizObject.core.dispatchNodeData();
						 vizObject.monitor.stop();
						 vizObject.core.setStatus("complete");
					     }					     
					 });

    vizObject.scheduler.start();
        /* add button for centre*/
   
   
   		
    /*
     * 
     * 
     *  Events managment
     *
     * 
     */


 /* dataOut = [{ 
  *         type : "expressionTag" OR "detectionMethod", 
  *         criterions : { 
  *                        "monTissu" : value, ... },
  *         strict : boolean 
  * }, ... ] */
    var dataOut = vizObject.networkFilter.getActive('node');

    //networkFilter.getActive expects 'node' or 'link' argument and returns the approriate Robot
    vizObject.core.registerCom({tabular : vizObject.tabular.getTabularSelector(),
			        filter : vizObject.networkFilter 
				? vizObject.networkFilter
				: null });

    $(vizObject.tabular.target)
    	.on('tickToggle', function (event,d){
		vizObject.core.setGlowyNodes(d); 
		//event.stopPropagation();
	    })
	.on('nodeLabelToggle', function (event,d){
		vizObject.core.toggleNodeLabel(d); 
		event.stopPropagation();
	    })
	.on('nodeHideTabularAction', function (event, data){
		vizObject.core.nodeVisibilityToggle({nodeNames : data.nodeNameList}, "hidden");
	    })
	.on('nodeShowTabularAction', function (event, data){	
		vizObject.core.nodeVisibilityToggle({nodeNames : data.nodeNameList}, "visible");
	    });

    /*    $(vizObject.core.target).on('networkChangeStart', function(event,d) {
     vizObject.networkFilter.blockAll();
     });
     */
    /*   $(vizObject.core.target).on('networkNodeChangeComplete', function(event,dataIn) {*/
    /* dataIn {
     * type : nodes, 
     * expressionTag : { 
     * toAdd :{ expressionTag : nbNodes , .. }, 
     * toDel []}*/	
    /*
     vizObject.networkFilter.update(dataIn);
     vizObject.networkFilter.unblock(data);
     
     
     vizObject.core.hideNodes(dataOut);
     
     });
     $(vizObject.core.target).on('networkLinkChangeComplete', function(event,d) {
     
    });
  */

    // , elementInfo : vizObject.elementInfo
    $(vizObject.core.target).on('mouseOverElement', function(event, d) {
				    vizObject.historicHover.add(d);
				});
    $(vizObject.core.target).on('linkDataToFetch', function(event, d) {
				    vizObject.scheduler.add(d);
				    vizObject.tabular.setWait({nodeTab : "wait", linkTab : "wait"});			
				});
    $(vizObject.core.target).on('nodeDataToFetch', function(event, d) {
				    vizObject.scheduler.add(d);
				    vizObject.tabular.setWait({nodeTab : "wait", linkTab : "wait"});			
				});
	        
    $(vizObject.cartCtrl.target)
	.on('databaseQuery', function (event,data) {
		vizObject.idleDiv.draw({type : 'databaseQuery', opt : 'blocker'});
		vizObject.core.bubbleCriterionNodes(data, 'start');		
	    });    
    $(vizObject.core.target)
	.on('startMonitor', function (event, data){		
		vizObject.monitor.start(data);
	    })
	.on('networkRendering', function (event,data) {
		vizObject.idleDiv.draw({type : 'networkRenderer', opt : 'blocker'});
	    })
	.on('networkEnd', function (event,data) {
		vizObject.idleDiv.erase();
		vizObject.core.bubbleCriterionNodes({}, 'stop');
	    })
	.on('glowingTouch', function (event,data) {			
		vizObject.tabular.tickNodes(data); 
		vizObject.cartCtrl.notify(data);
	    })
	.on('nodeRowMouseOver',function(event, data) {
		vizObject.core.bubbleNode(data, 'start'); 
	    })
	.on('nodeRowMouseOut',function(event, data) {
		vizObject.core.bubbleNode(data, 'stop'); 
	    })
	.on('neighbourhoodCellMouseOver',function(event, data) {
		vizObject.core.bubbleNodeNeighbourhood(data, 'start'); 
	    })
	.on('neighbourhoodCellMouseOut',function(event, data) {
		vizObject.core.bubbleNodeNeighbourhood(data, 'stop'); 
	    });    


/*    $(vizObject.networkLoop.target)
	.on('searchWidgetEvent',function(event, data) {
		vizObject.core.nodeGlowSearch(data);
	    })
	.on('pinGlowingEvent',function(event, data) {
		vizObject.tabular.pinRow(data);
	    });
*/
    if ('networkState' in opt)
	jsonLoader(opt.networkState);    
    

//    setTimeout (function(){jsonLoader("data/customExtraCellularNetwork.json");}, 10000);
	this.bindWidgetTooltips()
	
}


// Start network with a set of request
function litteralLoader (searchCrit) {
//    alert("Litteral Loader");
    vizObject.idleDiv.draw({type : 'databaseQuery', opt : 'blocker'});

    var searchTypeList = ["biomolecule", "publication", "keyword", "goTerm"];
    var data = [];
    for (var i = 0; i < searchTypeList.length; i++) {
	var type = searchTypeList[i];
	if (! searchCrit.hasOwnProperty(type)) continue;
	for (var j = 0; j < searchCrit[type].length ; j++) {
	    data.push({name : searchCrit[type][j], type : type});
	}
    }
    vizObject.core.setStatus("fetching");
    networkExpand(data, function (networkData, request) {
		      vizObject.networkID = networkData.id;
		      vizObject.core.add(networkData);
		      vizObject.core.addCenter(networkData.newCenters);	
		      var keywordDistrib = vizObject.core.getKeywordDistribution();
		      vizObject.statComp.makeStatUniprotKeywrd(keywordDistrib);		
		      		  
		  });
}

function jsonLoader (jsonLocation) {
    var networkData;
    console.log("reading json from " + jsonLocation);

    $.ajax({
               type: 'GET',
               url: jsonLocation,
               dataType: 'json',
               success: function(data) {                   
                   console.log("Data loaded as:");
		   console.dir(data);
                   networkData = data;	
                   },
	       error: function (request, type, errorThrown){
		   ajaxErrorDecode(request, type, errorThrown);		  
	       },		
               data: {},
	       async: false
           });
    
    var coreOptions = {};

    
    
    if (vizObject.core) {	    
	vizObject.core.add (networkData, coreOptions);
    }
  /*
   *   if (vizObject.tabular)
	vizObject.tabular.add (networkData);
   */
    console.log("data added");

}

function computeBookmarkPosition () {
    var defaultCss = {};    
    var TopOffset = 125;
    if (this.positionSettings) { // this is the component
	//console.log(this.positionSettings);
	TopOffset += this.positionSettings.position.rank * 20;
	defaultCss = {
	    position : "absolute",
	    top : TopOffset + $(window).height() * 0.95 * 0.5 * (this.positionSettings.position.rank / this.positionSettings.position.total) + "px",
	    left : this.positionSettings.side === "left" ? "Opx" : "Opx" //  right ??
	    };
	return defaultCss;
    }
    console.dir(this);
    alert("no position settings for current bookmark");
    return null;
}



// vizobject as execution context provided as namespace safe reference to the active/disable status
// of the help
function bindWidgetTooltips (){
	var self = this;
    var helpTooltip = {
	tooltipContentTabular : {
	    html : true,
	    //delay : { show : 1000, hide : 1000 },
	    container : 'body',
	    title : '<div class="bookmarkTooltip">'
		+ '<div class = "titreHelp">Tabular network widget</div>'
		+ '<p>Here you can manage node and link selections</p>'
		+ '<p><i class="fa fa-hand-o-right"></i> For advanced usage see our <a target="_blank" href="http://youtu.be/BR6LetDITmw?t=1m39s">Help<a/> </p>'
		+ '</div>',
	    placement : 'right' ,
	    trigger : 'manual'
	},
	tooltipContentCart : {
	    html : true,
	    //delay : { show : 1000, hide : 1000 },
	    container : 'body',
	    title : '<div class="bookmarkTooltip">'
		+ '<div class = "titreHelp">Cart network widget</div>'
		+ '<p>Here you can add new node to the current graph</p>'
		+ '<p><i class="fa fa-hand-o-right"></i> For advanced usage see our <a target="_blank" href="http://youtu.be/BR6LetDITmw?t=1m39s">Help<a/></p>'
		+ '</div>',
	    placement : 'right' ,
	    trigger : 'manual'
	},
	tooltipContentFilter : {
	    html : true,
	    //delay : { show : 1000, hide : 1000 },
	    container : 'body',
	    title : '<div class="bookmarkTooltip">'
		+ '<div class = "titreHelp">Filter network widget</div>'
		+ '<p>Here you can filter element out of the network basedone:</p>'
	       +'<ul><li>Expression Level of biomolecules</li><li>Experimental detection method of association</li></ul>'
		+ '<p><i class="fa fa-hand-o-right"></i> For advanced usage see our <a target="_blank" href="http://youtu.be/BR6LetDITmw?t=1m39s">Help<a/> </p>'
		+ '</div>',
	   placement : 'right' ,
	    trigger : 'manual'
	},
	tooltipContentPalette : {
	    html : true,
	    //delay : { show : 1000, hide : 1000 },
	    container : 'body',
	    title : '<div class="bookmarkTooltip">'
		+ '<div class = "titreHelp">Palette network widget</div>'
		+ '<p>Here you can change the color of the selected node </p>'
		+ '<p><i class="fa fa-hand-o-right"></i> For advanced usage see our <a target="_blank" href="http://youtu.be/BR6LetDITmw?t=1m39s">Help<a/></p>'
		+ '</div>',
	    placement : 'right' ,
	    trigger : 'manual'
	}
    };    
    
    var button = "<div class = 'help'><div id = 'showHelp' class = 'showHelp'><i class = 'fa fa-check-square-o'></i> Show help</div>"+
    			 "<div class = 'linkToHelp'> <a target = '_blank' href = 'http://www.youtube.com' >Online tutorial</a></div></div>";
     $('div.container').append(button);
     console.dir($('div.container'))
    // 1ST bind toggle check box w/ this.helpActive boolean.
	$('#showHelp').click(function(){
		console.dir("click");
		if ($(this).hasClass('showHelp')){
			console.dir("no show")
			$(this).find('i').removeClass('fa-check-square-o');
			$(this).find('i').addClass('fa-square-o');
			$(this).removeClass('showHelp');
			self.showHelp = false;
		}else{
			console.dir("show")
			$(this).find('i').removeClass('fa-square-o');
			$(this).find('i').addClass('fa-check-square-o');
			$(this).addClass('showHelp');
			self.showHelp = true;
		}
	});
    // iterate over minified widget DOM elements and create tooltips accordingly;
    console.dir("here tooltip")
   console.dir(this)
    
    $('#tabularBookmarkWrapper').popover(helpTooltip.tooltipContentTabular)
    	.on("mouseenter", function () {
    		if(!self.showHelp){return;}
	        var _this = this;
	        $(_this).popover('show');
	        $(".popover").on("mouseleave", function () {
	            $(_this).popover('hide');
	        });
	    }).on("mouseleave", function () {
	    	if(!self.showHelp){return;}
	        var _this = this;
	        setTimeout(function () {
	            if (!$(".popover:hover").length) {
	                $(_this).popover("hide")
	            }
	        }, 100);
	    });

    
    $('#cartBookmarkWrapper').popover(helpTooltip.tooltipContentCart)
    	.on("mouseenter", function () {
    		if(!self.showHelp){return;}
	        var _this = this;
	        $(_this).popover('show');
	        $(".popover").on("mouseleave", function () {
	            $(_this).popover('hide');
	        });
	    }).on("mouseleave", function () {
	    	if(!self.showHelp){return;}
	        var _this = this;
	        setTimeout(function () {
	            if (!$(".popover:hover").length) {
	                $(_this).popover("hide")
	            }
	        }, 100);
	    });
    $('#paletteMiniWrapper').popover(helpTooltip.tooltipContentPalette)
    	.on("mouseenter", function () {
    		if(!self.showHelp){return;}
	        var _this = this;
	        $(_this).popover('show');
	        $(".popover").on("mouseleave", function () {
	            $(_this).popover('hide');
	        });
	    }).on("mouseleave", function () {
	    	if(!self.showHelp){return;}
	        var _this = this;
	       setTimeout(function () {
	            if (!$(".popover:hover").length) {
	                $(_this).popover("hide")
	            }
	        }, 100);
	    });
    $('#loopBookmarkWrapper').popover(helpTooltip.tooltipContentFilter)
    	.on("mouseenter", function () {
    		if(!self.showHelp){return;}
	        var _this = this;
	        $(_this).popover('show');
	        $(".popover").on("mouseleave", function () {
	           $(_this).popover('hide');
	        });
	    }).on("mouseleave", function () {
	    	if(!self.showHelp){return;}
	        var _this = this;
	        setTimeout(function () {
	            if (!$(".popover:hover").length) {
	                $(_this).popover("hide")
	            }
	        }, 100);
	    });
    


};
//bindWidgetTooltips();


function bindExportActions () {
    $("#download").tooltip({
			       html : true,
			       //delay : { show : 0, hide : 1000 },
			       container : 'body',
			       title : '<div class="bookmarkTooltip">'
				   +'Export or save your work'
				   + '</div>',
			       placement : 'left' 
			   });
    $('#snapshot').on('click', function (event) {			  
			  graphicExporter();
			  //event.stopPropagation();  
		      });

    $('#serializeOut').on('click', function (event) {			  
			      var data = vizObject.core.serialize({});
			      storeNetwork(data);
			  //event.stopPropagation();  
		      });

    $('#serializeIn').on('click', function (event) {			  
			      cacheOutNetwork({callback : function(data){
						   console.log("Calling add Network with::::");
						   console.dir(data);
						   vizObject.core.add(data, "static");
					       }});
			  //event.stopPropagation();  
		      });

    $('#cytoscapeOut').on('click', function (event) {			  
			      var nodes = [], 
			      links = [];
			      
			      vizObject.core.svg.selectAll(".node")
				  .each( function (d) {   
					     nodes.push(d);                         
					 });
			      vizObject.core.svg.selectAll(".link")
				  .each( function (d) {   
					     console.dir(this);
					     var sd = {
						 source : d.source.name,
						 target : d.target.name,
						 associationData : d.details
					     };
//					     console.dir(sd);
					     links.push(sd);      
					 });
			     // var networkData = [this.graphFeatures.upKeywordTree];
			      var networkState = {
				  linksData : links,
				  nodeData : vizObject.core.exportNodes()/*,networkData : networkData*/
			      };
			      console.dir(networkState);
			      cytoscapeExporter({networkState: networkState});
			  });

    $('#excelOut').on('click', function (event) {			  
			  var nodes = [], 
			  links = [];
			  vizObject.core.svg.selectAll(".node")
			      .each( function (d) {   
					 nodes.push(d);                         
				     });
			  vizObject.core.svg.selectAll(".link")
			      .each( function (d) {   
					 console.dir(this);
					 var sd = {
					     source : d.source.name,
					     target : d.target.name,
					     associationData : d.details
					 };
					 //					     console.dir(sd);
					 links.push(sd);      
				     });
			  // var networkData = [this.graphFeatures.upKeywordTree];
			  var networkState = {
			      linksData : links,
			      nodeData : vizObject.core.exportNodes()/*,networkData : networkData*/
			  };
			  console.dir(networkState);
			  excelExporter({networkState: networkState});
		      });


}


