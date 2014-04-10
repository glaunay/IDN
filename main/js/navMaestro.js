/* Vizualiser component declaration and settings */

function networkTest_alpha (opt) {
    
    vizObject = { 
	core : null, 
	tabular : null,
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
	    
	    var subString = location.match(/([^\/]+)/g);
	    console.dir(subString);
	    if (subString[1] === 'http:')
		context.rootUrl = subString[1] + '//' + subString[2];
	    else
		context.rootUrl = subString[1];
	    
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
				    
    var legendDivHTML = vizObject.core.generateSymbolLegend({target : "body"});    
    
    console.log("starting widgets");       
    vizObject.cartCtrl = initCartCtrl({ target : "#vizContainer",	
					draggable : true,
					"iState" : "minified", //  "magnified",
					location : {host : opt.target , position : { side : "left", rank : 2, total : 5 }},
					computeBookmarkPosition : computeBookmarkPosition,
					callback : {
					    ajaxSearch : function (data) {
						networkExpand(data, function (networkData, request) {
								  vizObject.networkID = networkData.id;
								  vizObject.core.add(networkData);
								  vizObject.core.addCenter(networkData.newCenters);								  
							      });
					    },
					    jobExhaustion : function () {
						var tabularDomElemSelector = vizObject.tabular.getSelector("maxi");
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
     * barSearch Component 
     * 
     * 
     */
    vizObject.barSearch = initBarSearch({
					      targetDiv : "#searchBarNav",
					      iNavContext : true,
					      addCartNavCallback : function(critObj){
						  vizObject.cartCtrl.addCriterion(critObj);
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
		console.log("filterData");
		console.dir(filterSet);
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
								position : "absolute", top : "0", right: "-1px","font-weight":"normal",
								"text-shadow":"none","background-color":"black"
							    },
							    upmark :  {
								width: "231px",overflow : "visible",  position : "absolute","font-weight":
								"normal",top : "-50px",right:"-1px","text-shadow":"none","background-color":"black"
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
							 url: 'http://matrixdb.ibcp.fr:9999/cgi-bin/current/dataFetcher',
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
							 for (var i = 0; i < referer.length; i++) {							 
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
							     vizObject.core.activateLink(referer[i]);
							     vizObject.tabular.touchLink(referer[i]);						
							 }							 
						     }
						 }
					     },
					     onExhaustionCallback : function () {
						 vizObject.core.dispatchLinkData();
					     }					     
					 });

    vizObject.scheduler.start();
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
    //var dataOut = vizObject.networkFilter.getActive('node');

    // networkFilter.getActive expects 'node' or 'link' argument and returns the approriate Robot
    vizObject.core.registerCom({tabular : vizObject.tabular.getTabularSelector(),
			        filter : vizObject.networkFilter 
				? vizObject.networkFilter
				: null });
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
				    console.log("mouseOverElement");
				    console.log(d);
				    vizObject.historicHover.add(d);
				    
				    //vizObject.elementInfo.update(d);				   				    
				});
    $(vizObject.core.target).on('linkDataToFetch', function(event, d) {
				    vizObject.scheduler.add(d);
				    vizObject.tabular.setWait({nodeTab : "wait", linkTab : "wait"});			
				});	        
    $(vizObject.cartCtrl.target)
	.on('databaseQuery', function (event,data) {
		vizObject.idleDiv.draw({type : 'databaseQuery', opt : 'blocker'});
		vizObject.core.bubbleCriterionNodes(data, 'start');		
	    });    
    $(vizObject.core.target)
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

}


// Start network with a set of request
function litteralLoader (searchCrit) {
    var searchTypeList = ["biomolecule", "publication", "keyword", "goTerm"];
    var data = [];
    for (var i = 0; i < searchTypeList.length; i++) {
	var type = searchTypeList[i];
	if (! searchCrit.hasOwnProperty(type)) continue;
	for (var j = 0; j < searchCrit[type].length ; j++) {
	    data.push({name : searchCrit[type][j], type : type});
	}
    }

    networkExpand(data, function (networkData, request) {
		      vizObject.networkID = networkData.id;
		      vizObject.core.add(networkData);
		      vizObject.core.addCenter(networkData.newCenters);								  
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
    if (vizObject.tabular)
	vizObject.tabular.add (networkData);
	
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


function bindExportActions () {
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
			      cacheOutNetwork({callback : function(data){vizObject.core.add(data, "static");}});
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
				  nodeData : nodes/*,networkData : networkData*/
			      };
			      console.dir(networkState);
			      cystoscapeExporter({networkState: networkState});
			  });
}
