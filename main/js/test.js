/* Vizualiser component declaration and settings */

function networkTest_alpha (opt) {
    
    vizObject = { 
	core : null, 
	tabular : null,
	getProviderList : function () {
	    return ["matrixdb"];
	}
    };   
    bindExportActions();
    
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
    
    

    initUnityBar({ target : { type : "form", sel : "#unitySearchBar" },
		   callback : function (critObj) {
		 //      console.dir(critObj);
		       vizObject.cartCtrl.addCriterion(critObj);		     
		   }
		 });
    
    $(opt.target).append('<div id="networkLoopContainer"></div>');
    vizObject.networkLoop = initNetworkSearch(
	{
	    target : "#networkLoopContainer",
	    "iState" : "minified", // "magnified", 
	    location : {host : opt.target , position : { side : "left", rank : 3, total : 5 }},
	    computeBookmarkPosition : computeBookmarkPosition
	}
    );
    vizObject.networkLoop.draw();
    
    
    /*     Style managment widget     */
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


    vizObject.elementInfo = initElementInfo({width : '350px', height : '600px', target : 'body',callback : {}});
    
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
							 url: 'cgi-bin/current/dataFetcher',
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

    vizObject.core.registerCom({tabular : vizObject.tabular.getTabularSelector()});
    // , elementInfo : vizObject.elementInfo
    $(vizObject.core.target).on('mouseOverElement', function(event, d) {
				    console.log("mouseOverElement");
				    console.log(d);
				    vizObject.elementInfo.update(d);				   				    
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
    $(vizObject.networkLoop.target)
	.on('searchWidgetEvent',function(event, data) {
		vizObject.core.nodeGlowSearch(data);
	    })
	.on('pinGlowingEvent',function(event, data) {
		vizObject.tabular.pinRow(data);
	    });
    if ('networkState' in opt)
	jsonLoader(opt.networkState);    
    


//    setTimeout (function(){jsonLoader("data/customExtraCellularNetwork.json");}, 10000);

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
