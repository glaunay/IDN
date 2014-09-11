/*
 * 
 * Component for svg network managment
 * 
 * 
 * */

function coreInit (opt) {
   
    

    return {
	linkAs : "line",
	hotNodes : [],
	bubblingNodes : [],
	delElements : {
	    nodes : {
		name : [],
		obj : []
	    },
	    links : []
	},
	tooltipForced : false,
	target : opt.target,
	targetCom : {},
	width : null,
	height : null,
	vpController : null,
	svg : null,
	nodeToSvg : {}, /* To hash table referencing corresponding svg elements*/ 
	nodeToLinks : {}, /*key are node name, they reference a list of links reference where the node is source // target*/
	linkToSvg : {},
	gNodes : [], // A list to eventually store glowy node for computation speed needs
	expressionTag : {},	
	expresionTagLess : [],
	detectionMethod : {},
	detectionMethodLess : [],
	status : "fetching",//or "complete"	
	getStatus : function () {	    
	    return this.status;
	},
	setStatus : function (state) {
	    if (!state){	      	  
		this.status = this.status === "fetching" ? "complete" : "complete";
	    } else {
		if (state !== "fetching" && state !== "complete"){
		    alert ("Wrong status at \"" + state + "\"");
		}
		this.status = state;
	    }
	    return this.status;
	},
	draw : function () {
	    var self = this;
	    
	    this.width = $(window).width() * 0.95,
	    this.height = $(window).height() * 0.95;	  
	    
	    var scaffold = '<div id="networkWindow"><svg></svg></div>';
	    $(this.target).append(scaffold);	    
	    

	    /* Set Blur filter(s)*/
	    d3.select(this.target + ' #networkWindow svg').append('defs').append('filter').attr('id', 'f1');
	    d3.select(this.target + ' #networkWindow svg defs filter#f1')
		.attr('x', '-40%')
		.attr('y', '-40%')
		.attr('height', '200%')
		.attr('width', '200%');
	    d3.select(this.target + ' #networkWindow svg defs filter#f1').append('svg:feOffset')
		.attr('result', 'offOut')
		.attr('in', 'SourceAlpha')
		.attr('dx', '4')
		.attr('dy', '4');
	    d3.select(this.target + ' #networkWindow svg defs filter#f1').append('svg:feGaussianBlur')
		.attr('result', 'blurOut')
		.attr('in', 'offOut')
		.attr('stdDeviation', '8');
	    d3.select(this.target + ' #networkWindow svg defs filter#f1').append('svg:feBlend')
		.attr('in', 'SourceGraphic')
	    	.attr('in2', 'blurOut')	    
		.attr('mode', 'normal');

	    d3.select('#networkWindow svg defs').append("defs")
		.append("filter")
		.attr("id", "blur")
		.append("feGaussianBlur")
		.attr("stdDeviation", 0.5);
	    
	  	    
	    
	    d3.select(window)
    		.on("resize", function () {
			self.width = $(window).width() * 0.95;
			self.height = $(window).height() * 0.95;
			d3.select(self.target + ' #networkWindow svg')
			    .attr("width", self.width)
			    .attr("height", self.height);		
		    });
	    
	    this.force = d3.layout.force()
		.charge(-400)
		.linkDistance(50)
		.size([this.width, this.height]);   
	    d3.select(this.target + ' #networkWindow svg').append("svg:g").attr('id','network').style('fill', 'green');	  
	    this.svg = d3.select(this.target + ' #networkWindow svg g[id=network]');	    	    	    
	    this.force.nodes([]).links([]).start([]);
	    
	    d3.select(this.target + ' #networkWindow svg')
		.attr('width', this.width)
		.attr('height', this.height);	   	    
	    /* Drag and drop and unselect events */ 
	    this._setDrawDragBox();

	    this.vpController = startPanZoomControler ({svgElement : '#networkWindow svg',
						       onClickCallback : function () {
							   //console.dir(self);
							   if (self.tooltipForced) {
							       d3.selectAll('.node')
								   .each(function(){
									     if(d3.select(this).style("visibily") === "hidden"){
										 return;
									     }
									     //$(this).tooltip('hide');
									     $(this).tooltip('show');
									 });
							   }
						       }});
	    return;
	},

	activateLink : function (d) {
	    var self = this;
	    var name = d.source.name + "--" + d.target.name;
	    var link = this.linkToSvg[name];
	    d3.select(link) //.style('stroke', "yellow")
		.style("stroke-dasharray", null)
		.style('stroke-width','3px').each(function(d){
						      self._storeElementStyle(this); // IMPORTANT
						  });
	},
	activateNode : function (d) {
	    /*	    var self = this;
	     var node = this.nodeToSvg[d.name];
	     d3.select(node)
	     .style('stroke', "yellow")
	     .each(function(d){
	     self._storeElementStyle(this); // IMPORTANT
	     });
	     */
	},
	bubbleNodeClear : function () {
		var temp = vizObject.core.force.nodes();
		for (var node=0; node < temp.length; node++) {
		  this.bubbleNode(temp[node],"stop");
		};
	    this.bubblingNodes = [];
	},
	_bubbleCycleStep : function (node, animationSettings) {
	    var nodeName;
	    var d = d3.select(node).data()[0];
	    //console.dir(node)
	    if (!d) {
		console.log("Error: failed load d3datum from");
		console.dir(node);
		return;
	    }
	    //console.dir(d);
	    var specLow = this.shapeCreator[d.type](node, "regular", "getShapeSpecs");
	    var specBig = this.shapeCreator[d.type](node, "glowy", "getShapeSpecs");

	  /*  d3.select(node).transition().attr('r', animationSettings.rmax).duration(250);
	    d3.select(node).transition().attr('r', animationSettings.rmin).delay(250);*/
	    
//	    console.dir(specBig);
	    
	    d3.select(node).transition().attr('d', d3.svg.symbol()
					      .size(specBig.size)
					      .type(specBig.shape))
		.duration(250);
	    d3.select(node).transition().attr('d', d3.svg.symbol()
					      .size(specLow.size)
					      .type(specLow.shape))
		.delay(250);
	    
	},
	_bubbleCycleStop : function (node) {
	    var nodeName;
	    d3.select(node).each(function(d){nodeName = d.name;});
	    var d = d3.select(node).data()[0];
        //console.log("attempting to stop bubble cycle of " + nodeName);
	    if (!d) {
		console.log("Error: failed load d3datum from");
		console.dir(node);
		return;
	    }
	    for (var i = 0; i < this.bubblingNodes.length; i++) {
		if (this.bubblingNodes[i].name === nodeName) {
		    clearInterval(this.bubblingNodes[i].stamp);		   
		    var spec = this.shapeCreator[d.type](node, "regular", "getShapeSpecs");
		    d3.select(node)
			.transition().attr('d', d3.svg.symbol()
					   .size(spec.size)
					   .type(spec.shape))		  
			.style('stroke', spec.stroke)
			.style('fill', function (d) {
				   if (d.userColor)
				       return d.userColor;
				   else
				       return spec.fill;
				   
			       })
			.style('stroke-width', '1px');	  
		    
		    this.bubblingNodes.splice(i,1);
		}	 
	    }
	},
	bubbleSearchedNodes : function(string, type){
		var self = this;
	    if (type === "start") {
			var regexp = new RegExp(string,"i");
			self.hotNodes = [];		
			var nodesForce = self.force.nodes();
			var nodeFound = [];
		// Set the attributes inspected by the search bar
               // requires knowledge of the node data structure
		var searchScalarPath = [
		    "name", "aceAccessor", "biofunc"		    
		];
		var searchListPath = [
		    "common.anyNames",
                    "comments.data",
		    "uniprotKW"
		];

		nodesForce.forEach(function (node) {
				       var tableOfSearch = [];				       
				       searchScalarPath.forEach(function(elem) {
								    var string = getPropByKey(node, elem);    
								    if (string) 
									tableOfSearch.push (string); 
								});
				       searchListPath.forEach(function(elem) {
								  var array = getPropByKey(node, elem);    
								  if (array) 
								      Array.prototype.push.apply(tableOfSearch, array); 
							      });
				       
				       if(!self._searchString(regexp,tableOfSearch)) 
					   return;
				       nodeFound.push(node);
				       var svg =  self.nodeToSvg[node.name];
				       if (svg) {
					   self.hotNodes.push(svg);
					   //console.log('search in network =>' + node.name)
					   self.bubbleNode ({name : node.name, rFactor : 2.5, 
							     style : {'stroke-width' : '5px', stroke : 'orange', fill : 'red'} 
							    },'start');
				       }
				       
				   });
		return nodeFound;
	    } else {
		
		self.hotNodes.forEach(function(node) {
					  console.log("stopping hot node");
					  console.dir(node);
					  var nodeName;
					  d3.select(node).each(function(d){nodeName = d.name;});
					  self.bubbleNode ({name : nodeName}, "stop");
				      });
		self.hotNodes = [];
	    }
	},
	_searchString : function(regexp,tableOfObject){
		for (var name=0; name < tableOfObject.length; name++) {
		  if(regexp.test(tableOfObject[name])){
		  	return true;
		  }
		};
		return false;
	},
	bubbleCriterionNodes : function (data, type) {
	    var self = this;
	    if (type === "start") {
		self.hotNodes = [];		
		data.criterionList
		    .forEach(function (elem) {
				 if (elem.type === 'biomolecule') {
				     var node =  self.nodeToSvg[elem.name];
				     if (node) {
					 self.hotNodes.push(node);
					 self.bubbleNode ({name : elem.name, rFactor : 2.5, 
							   style : {'stroke-width' : '5px', stroke : 'orange', fill : 'red'} 
							  },'start');
				     }
				 }
			     });
	    } else {		
		self.hotNodes.forEach(function(node) {
					  var nodeName;
					  d3.select(node).each(function(d){
							 self.bubbleNode ({ name : d.name }, "stop");
							});					 
				      });
		self.hotNodes = [];
	    }
	
	    
	},
	_getNeighbourhood : function (nodeName) {
	    var list = [];
	    this.nodeToLinks[nodeName].forEach(function(elem){
						   var link = elem.linkRef;
						   var item = elem.role === "source" 
						       ? link.target.name
						       : link.source.name;
						   list.push(item);
					       });
	    return list;
	},
	bubbleNodeNeighbourhood : function (data, type) {
	    var self = this;
	    if (!data.hasOwnProperty('name')) return;
	    var list = this._getNeighbourhood(data.name);
	    list.forEach(function(nodeName){
			     self.bubbleNode({name : nodeName}, type);     
			 });
	},
	bubbleNode : function (data, type) {	  
	    var self = this;
	    var node;
	    /*if(type != "stop"){
	    console.dir("pass in bubble node with")
	    console.dir(data)
	    console.dir(type)
	    }*/
	    
	    if (data.hasOwnProperty('name'))
		node = this.nodeToSvg[data.name];
	    if (type === 'start') {			    	    
		var rmin, rmax, nodeName;	    
		d3.select(node)
		    .each(function(d){
			      nodeName = d.name;
			  
			   /* 
			    * d.previousStyle.stroke = d3.select(this).style('stroke');
			      d.previousStyle.fill = d3.select(this).style('fill');
			      d.previousStyle['stroke-width'] = d3.select(this).style('stroke-width');
			      d.unBubbleStyle['r'] = d3.select(this).attr("r");
			    */
			      rmin = d3.select(this).attr("r");
			      rmax = rmin * 2;
			  //    console.log('Adding bubbling effect to '+ nodeName +
			  //  ' boundary a current animation step ' + rmin + ' ' + rmax);
			      if (data.hasOwnProperty('rFactor'))
				  rmax = rmin * data.rFactor;
			      if (data.hasOwnProperty('style')) {
			    d3.select(this)
				      .style('stroke', function() {
						 if (data.style.stroke){
						     return data.style.stroke;	
						 }		
						 return  d3.select(this).style('stroke');
					     })
				      .style('fill', function() {
						 if (data.style.fill){				
						     return data.style.fill;
						  }
						 return  d3.select(this).style('fill');
						 
					     })
				      .style('stroke-width', function() {
						 if (data.style['stroke-width']){
						     return data.style['stroke-width'];
						 }
						 return  d3.select(this).style('stroke-width');						
					     });
			      }			     
			  });
		    
			    
		var bubbleLoopStamp = setInterval(function() {
						      self._bubbleCycleStep(node,{ rmax : rmax, rmin : rmin});
						  }, 550);	    
		self.bubblingNodes.push({name : nodeName, stamp : bubbleLoopStamp});
	    } else if(type === 'stop') {
		self._bubbleCycleStop(node);
		
		d3.select(node).each(function(d){if (d.glow) self._glowToggle([this],{ type : "forced" });});
	    }
	    
	},
	registerCom : function (data) { /* register the component to communicate with as jquery selector DOM ELEMENT*/
	    if ('tabular' in data)
		this.targetCom['tabular'] = data.tabular;
	    if ('filter' in data)
		this.targetCom['filter'] = data.filter;
			   
	},
	_getFilterCom : function (){
	    return this.targetCom['filter']  ? this.targetCom['filter']  : null;
	},
	resize : function () {
	    /*Maybe not needed*/
	},
	unfreeze : function () {
	    console.log("Unfreezing all nodes");
	    var nodes = this.force.nodes();
	    this.svg.selectAll(".node").each (function (d){d.fixed = false;});
	    
	},
	_setExpressionTag : function () {
	    this.expressionTag = {};
	    this.expressionTagLess = [];
	    var nodes = this.force.nodes();
	    for (var iNode = 0; iNode < nodes.length; iNode++) {
		var node = nodes[iNode];
		var eData=false
		if(node.location.expressionLevels &&node.location.expressionLevels.data){
			//console.dir('new Data')
			var eData = getPropByKey(node, "location.expressionLevels.data");
		};
		//console.dir(node);
		if(!eData) {
		    this.expressionTagLess.push(node);
		    continue;
		}
		
		for (var key in eData.data) {
		    for (var iTag = 0; iTag < eData.data[key].length; iTag++) {
			var cTag = eData.data[key][iTag][2];
			var value = eData.data[key][iTag][0] /eData.data[key][iTag][1] * 1000000;
			if(this.expressionTag[cTag]) {
			    this.expressionTag[cTag].push({ node : node, value : value });
			} else {
			    this.expressionTag[cTag] = [{ node : node, value : value }];
			}
		    }
		}
	    }
	},
	dispatchNodeData : function () {
		this._comExpressionTagDistribution();
	},
	dispatchLinkData : function () {
	    this._setLinkData();
	    
	    var filterComponent = this._getFilterCom();
	    if(!filterComponent) {
		console.log("No filter component registred for com");
		return;
	    }
	    var data = {};	    
	    for (var tag in this.detectionMethod) {
		data[tag] = this.detectionMethod[tag].length;
	    }
	    filterComponent.update({type : "detectionMethod", data : data, action : "init"});		    
	},
	_setLinkData : function (){
	    this.detectionMethod = {};
	    this.detectionMethodLess = [];
	    var self = this;

		var linkNamePerMethodMemory = {};

	
	    d3.selectAll('.link').each(
		function(d){
		    var link = this;
		    if (getPropByKey(d, 'details.Experiments')) {
			d.details.Experiments.forEach(
			    function(experiment) {
				if(!experiment.hasOwnProperty('Interaction_Detection_Method')){
				    this.detectionMethodLess.push(d);
				    return;
				};
				var method = experiment.Interaction_Detection_Method;
				if (self.detectionMethod[method]) {
				    	var isKnown = "no";
					self.detectionMethod[method].forEach(function (kLink){
						if (kLink.details.name === d.details.name) isKnown = "yes";
					});
					if(isKnown === "no")
						self.detectionMethod[method].push(d);
				} else {
				    self.detectionMethod[method] = [d];
				}
			    });
		    }
		});
	},
	_comExpressionTagDistribution : function () {
	    
	    this._setExpressionTag();
	    var filterComponent = this._getFilterCom();		
	    if(!filterComponent) {
		console.log("No filter component registred for com");
		return;
	    }
	    var data = {};	
	    //console.dir(this.expressionTag)  ;  
	    for (var tag in this.expressionTag) {
		data[tag] = this.expressionTag[tag].length;
	    }
	    //console.dir(data);
 	    filterComponent.update({type : "expressionLevels", data : data, action : "init"});	    
	},
	_storeElementStyle : function (node) {
	    var styleAttr = ['stroke', 'stroke-width', 'fill', 'r'];
	    d3.select(node).each(
		function(d) {
		    d.previousStyleZ = {};
		    styleAttr.forEach(function(attr){
					  d.previousStyleZ[attr] = d3.select(node).style(attr);
				      });
		});
	},
	_storeLinkStyle : function (node) {
	    var styleAttr = ['stroke', 'stroke-width', 'fill'];
	    d3.select(node).each(
		function(d) {
		    d.previousStyleZ = {};
		    styleAttr.forEach(function(attr){
					  d.previousStyleZ[attr] = d3.select(node).style(attr);
				      });
		});
	},
	cancelFilter : function () {
	    d3.selectAll('.node').each(function(d) {
					   d3.select(this).style(d.previousStyleZ); 
					   d.nearVanish = null;
				       });
	    d3.selectAll('.link').each(function(d) {
					   d3.select(this).style(d.previousStyleZ); 
					   d.nearVanish = null;
				       });
	},	
	applyFilter : function (strict) {
	    d3.selectAll('.node')
		.style('visibility', function(d) {					    
			   if (d.manualHide) return "hidden";
			   if (strict && d.nearVanish === "unk") {
			       return "hidden";
			   }
			   return d.nearVanish === "yes" ? "hidden" : "visible";
		       })
		.style(function(d){ return d.previousStyleZ; });

	    d3.selectAll('.link')
		.style('visibility', function(d) {
			   if (d.source.manualHide || d.target.manualHide) return "hidden";
					    
			   if (d.source.nearVanish === "yes" || 
			       d.target.nearVanish === "yes" || d.nearVanish === "yes") {
			       return "hidden";
			   }
			   if (strict) {
			       if (d.source.nearVanish === "unk" || 
				   d.target.nearVanish === "unk" || d.nearVanish === "unk")
				   return "hidden";
			   }			   			   
			   return "visible";
		       })
		.style(function(d){ return d.previousStyleZ; });
	    
	
	},
	// Hide Show node(s) and their related link(s)
	nodeVisibilityToggle : function (data, visibility) {
	    var self = this;	 
	    if (data.nodeNames) {
		data.nodeNames
		    .forEach(function(name){
				 var nSvg = self.nodeToSvg[name];
				 if (!nSvg) return;					   
				 d3.select(nSvg)
				     .style("visibility", visibility)
				     .each(function(d){d.manualHide = visibility === "hidden" ? true : false;});
				 var test = d3.select(nSvg).style("visibility");
				 if(d3.select(nSvg).style("visibility") === "hidden"){
				     $(nSvg).tooltip('hide');
				 } 
				 
			     });
		data.nodeNames
		    .forEach(function(name){
				 self.nodeToLinks[name]
				     .forEach(function(obj){
						  var linkName =  obj.linkRef.source.name 
						      + "--"
						      + obj.linkRef.target.name;
						  var lSvg = self.linkToSvg[linkName];
						  if (!lSvg) return;						  
						  d3.select(lSvg)
						      .style("visibility", function (d){								 
								 var sNode = self.nodeToSvg[d.source.name];
								 var tNode = self.nodeToSvg[d.target.name];
								 if (d3.select(sNode).style("visibility") === "hidden") return "hidden";
								 if (d3.select(tNode).style("visibility") === "hidden") return "hidden";
								 return "visible";
							     });
					      });
			     });
		
	    } else if (data.nodes) {
	  // ????	
	    }	    
	},
	_nrNewNode : function (nodeList) {
		if (isEmpty(this.nodeToSvg)) return nodeList;
		var buffer = [];
		var self = this;
		
		nodeList.forEach(function(elem){
			if(!self.nodeToSvg.hasOwnProperty(elem.name)) {
				buffer.push(elem);
			} else {
				//console.log(elem.name + " already in network");
			}
		});	
		console.log("Nodes: Made NR from " + nodeList.length + " to " + buffer.length);
		return buffer;
	},	
	_nrNewLink : function (linkList) {
		if (isEmpty(this.linkToSvg)) return linkList;
		var buffer = [];
		var self = this;
		
		linkList.forEach(function(elem){
			if(!self.linkToSvg.hasOwnProperty(elem.name)) {
				buffer.push(elem);
			} else {
				console.log(elem.name + " already in network");
			}
		});	
		console.log("Links: Made NR from " + linkList.length + " to " + buffer.length);
		return buffer;
	},	
	add : function (datum, options) { /* add node(s) to a empty/not-empty graph 
					    options for later development needs
					   */

	if (datum.nodeData.length == 0 && datum.linksData.length == 0) return false;

	/* Custom network startup patch 
	Check that all nodes and links are not already part of the network
	*/	
	
	var nodeData = this._nrNewNode(datum.nodeData);
	var linksData = this._nrNewLink(datum.linksData);

	

	    var nodes = this.force.nodes(),
	    links = this.force.links();
	    /*freeze all previous*/
	    this.svg.selectAll(".node").each (function (d){d.fixed = true;});
	    nodes.push.apply(nodes, nodeData);	    
	    for (var iLink = 0; iLink < datum.linksData.length; iLink++) {
		if (!linksData[iLink].details) {
		    console.log("Attempting to enter an invalid link element in core selection");
		    console.dir(datum.linksData[iLink]);
		    continue;
		}
		var singleLink = {
		    source :  linksData[iLink].source,
		    target :  linksData[iLink].target,		    
		    details : linksData[iLink].details,
		    type : linksData[iLink].type
		};
		links.push(singleLink);					  
	    }
	    var newNetworkElem = this._drawNetwork(nodes, links, options);
	    
	    if (this.targetCom.hasOwnProperty('tabular'))
		$(this.targetCom['tabular']).trigger('add', newNetworkElem);

	    $(this.target).trigger('startMonitor', { nodes : newNetworkElem.nodeData.length,
						     links : newNetworkElem.linksData.length });
	    return newNetworkElem;	    
	},
	/*
	 *  remove node and link element from a pre existant force.nodes/links selection
	 * append specify node to deletedNodeList attribute 	 
	 */
	remove : function (nodeNameList) {
	    var self = this;
	    var links = this.force.links();
	    var nodes = this.force.nodes();
	    
	    for (var i = 0; i < nodeNameList.length; i++) {
		var name = nodeNameList[i];
		var node = this.nodeToSvg[name];
		var data = d3.select(node).data();//node.__data__;
		this.delElements.nodes.obj.push(node);	
		this.delElements.nodes.name.push(data[0].name);		
		var index = nodes.indexOf(data[0]);
		
		self.nodeToLinks[data[0].name].forEach(function(link){
							   console.log(link);
							   var linkObj = link.linkRef;
							   console.log(linkObj);
							   // delete link reference for current node
							   var iLink = links.indexOf(linkObj);
							   links.splice(iLink, 1);
							   // delete link reference for its partnair							   
							   var oRole = link.role === "target" ? "source" : "target";
							   var oNode = linkObj[oRole];
							   console.log("the other partnair is");
							   console.dir(oNode);
							   var jLink = self.nodeToLinks[oNode.name].indexOf(linkObj);
							   self.nodeToLinks[oNode.name].splice(jLink, 1);
						       });

		delete (self.nodeToLinks[data[0].name]);		
		nodes.splice(index,1);
	    }	    
	    self._drawNetwork(nodes, links, { type : 'removal'});	    
	},
	_drawNetwork : function (nodes, links, options) {
	    var self = this;

	    
	    var newNodes = [],
	    newLinks = [];

	    var node_drag = d3.behavior.drag()
		.on("dragstart", dragstart)
		.on("drag", dragmove)
		.on("dragend", dragend);
	    
	    function dragstart(d, i) {
//		console.log("drag me up be4 you gogo");
		self.force.stop(); // stops the force auto positioning before you start dragging
	    }
	    
	    function dragmove(d, i) {
		d.px += d3.event.dx;
		d.py += d3.event.dy;
		d.x += d3.event.dx;
		d.y += d3.event.dy; 

		/*console.dir(d3.event);
		console.dir(d);*/

		self.svg.selectAll(".node").each(function(d){
						     if (!d.glow)
							 return;						    
						     d.px += d3.event.dx;
						     d.py += d3.event.dy;
						     d.x += d3.event.dx;
						     d.y += d3.event.dy; 
						 });
		
		tick(); // this is the key to make it work together with updating both px,py,x,y on d !
	    }
	    
	    function dragend(d, i) {
		d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
		tick();
		self.force.resume();
	    }
	    
	    var node = this.svg.selectAll(".node").data(nodes, function(d) {return d.name;});  
	    node.enter().append('path')	    
		.attr("class", function(d) {return "node node_" + d.name;})
	    	.call(node_drag)
		.each(
		    function (d){		
			if (options === 'static') {
			    d.x = parseFloat(d.x);
			    d.px = parseFloat(d.px);
			    d.y = parseFloat(d.y);
			    d.py = parseFloat(d.py);
			}
			self.shapeCreator[d.type](this, "regular");
			newNodes.push(d);
			var node = this;
			d.pView = 'normal';
			d.cView = 'normal';		
			d['previousStyle'] = { r : '8', 
					       stroke : function(){ return d3.select(node).style('stroke');}(),
					       'stroke-width' : function(){ return d3.select(node).style('stroke-width');}()
					     };
			d['unBubbleStyle'] = {};
			d['glow'] = false; 
			d['manualHide'] = false;
			self.nodeToSvg[d.name] = this;			
			self.nodeToLinks[d.name] = [];
			d.linkStore = self.nodeToLinks[d.name];
			if (! d.hasOwnProperty('central')) {
			    d.central = false;			    
			} 		

			self._storeElementStyle(this); // IMPORTANT
		    }
		).each(function (d) {
			   $(self.target).trigger('nodeDataToFetch',d);			   
			   var node = this;
			   $(this).tooltip({
					       title : function (){
						   var htmlString;
						   var datum = d3.select(this).datum();
						   var nList = getPropByKey(datum, 'common.anyNames');
						   if ($.isArray(nList)) {
						       if (nList.length > 0)
							   htmlString = '<div class="head">'+ nList[0] + '</div>';
						   }
						   if (!htmlString)
						       htmlString = '<div class="head">'+ datum.name + '</div>';
						   var gName = getPropByKey(datum, 'GeneName');
						  /* if (gName)
						       htmlString += '<div class="row-fluid">'
						       + '<div class="span3">gene:</div>'
						       + '<div class="span9" style="color:yellow;">' + gName + '</div>'
						       + '</div>';*/
						   var species = getPropByKey(datum, 'specie.names');
						   var specie;
						   if ($.isArray(species)) {
						       if (species.length > 0)
							   specie = species[0];
/*							   htmlString += '<div class="row-fluid">'
							   + '<div class="span3">specie:</div>'
							   + '<div class="span9" style="color:blue;">' 
							   + species[0] + '</div>'
							   + '</div>';*/
						   }
						   if (specie || gName){
						       if(specie)
							   htmlString += '<div class="tooltipAttr"><span>Species</span>'
							   + '<span>:   ' + specie + '</span></br>';
						       if(gName)
							   htmlString += '<div class="tooltipAttr"><span>Gene</span>'
							   + '<span>:   ' + gName + '</span>';
						   }
						   
						   return '<div class="nodeTooltipInner">' + htmlString + '</div>'; 
					       },
					       template: '<div class="tooltip nodeTooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
					       html : true,
					       animation: true,
					       container: 'body',
					       trigger : 'manual'
					   });

			   $(this).hoverIntent( {
						    over : function () {
							if(d3.select(node).style("visibily") === "hidden"){return;}
							if ('tabular' in self.targetCom) {
								
							    $(self.targetCom.tabular).trigger('nodeScroll', [d3.select(node).datum()]);
							}
							if (!self.tooltipForced) {
							    $(node).tooltip('show');
							}
							$(self.target).trigger('mouseOverElement', d);
						    },
						    timeout : 500,
						    out : function (){
							if (!self.tooltipForced) {
							    $(node).tooltip('hide');
							}
						    }
						});			   
		       })
		.style("visibility", "visible");
	    
	/*console.dir("NEW NODE SELECTION");
	console.dir(newNodes);*/

	    node.exit().remove();   
	    node.on('mouseover',function (d) {	
			//setFocusNode(this);
		    })
		.on('mouseout', function (d) {/*setUnFocusNode(this);*/})
		.on('mousedown', function() {
			$(this).tooltip('hide');
			d3.event.stopPropagation();
		    })
		.on('dblclick', function(d) {					
			self._glowToggle(this, null);
			$(self.target).trigger('glowingTouch', { data : [d], setToGlow : d.glow });
			d3.event.stopPropagation();
		    })
		.on('click',function (d) {
			d3.event.stopPropagation();		
		    })
		.on ('mouseup', function(d){
			 if (self.tooltipForced) {
			     $(this).tooltip('show');
			 }
		//	 d3.event.stopPropagation();		
		     });
	    
	    /* Send them to the layout */
	    this.force.nodes(nodes);	    
	    
	    // Link visibility is conditional to both its node being visible

	    var link = this.svg.selectAll(".link")
		.data(links, function(d) {
			  var sNode,sData;
			  if (d.source.hasOwnProperty('name')) {
			      sData = d.source;
			  } else { 
			      sNode = self.nodeToSvg[d.source];
			      sData = d3.select(sNode).data()[0];
			  }
			  var tNode, tData;
			  if (d.target.hasOwnProperty('name')) {			    
			      tData = d.target;
			  } else {			
			      tNode = self.nodeToSvg[d.target];
			      tData = d3.select(tNode).data()[0];
			  }			  
			  
			  if (!sData || !tData) {
			      console.log("not found source/target for following link object ");
			      console.dir(d);
			      return '';
			  } else {
			      d.source = sData;
			      d.target = tData;
			      //console.log("found" + string);
			  }
			  return d.source.name + "--" + d.target.name;
		      });
	    link.enter().insert("svg:path", ".node").attr("class", "link")
		.style("stroke-width", function(d) {
			   /*console.log (Math.sqrt(d.value));*/
			   return "2px"; })
		.style("stroke-dasharray", "5,5")
		.style("fill","none")
    		.on('mousedown', function() { d3.event.stopPropagation(); })
		.style("stroke", "grey")
		.style('cursor', 'pointer')
		.style('visibility', function (d){
			   var sNode = self.nodeToSvg[d.source.name];
			   var tNode = self.nodeToSvg[d.target.name];			   
			   if (d3.select(sNode).style("visibility") === "hidden") return "hidden";
			   if (d3.select(tNode).style("visibility") === "hidden") return "hidden";
			   return "visible";
		       })
		.each(function (d){
		      newLinks.push(d);		      
		      if (!self.nodeToLinks[d.source.name] || 
			  ! self.nodeToLinks[d.target.name] ){			      			  
			      console.log ('Error undeclared node in association ' 
					   +d.source.name + ' ' + d.target.name);
			      return;
			  }
		      self.nodeToLinks[d.source.name].push ({linkRef : d, role : 'source'/*, crossRef : null*/});
		      self.nodeToLinks[d.target.name].push ({linkRef : d, role : 'target'/*, crossRef : null*/});		     
		      self.linkToSvg[d.source.name + "--" + d.target.name] = this;		      
		      $(self.target).trigger('linkDataToFetch', d);		      
		  })
		  .each(function(d){
		  	    $(this).hoverIntent(
				{
				    over : function () {
					if ('tabular' in self.targetCom) {
					    //    $(self.targetCom.tabular).trigger('nodeScroll', [d3.select(node).datum()]);
					}						
					$(self.target).trigger('mouseOverElement', d);
				    },
				    timeout : 500,
				    out : function (){}
				});	
			})
		.on('click',function () {
			var d = d3.select(this).datum();
			$(self.target).trigger('linkClick', d);
		    });
	    //.attr('display', 'none');				      
	    link.exit().remove();				     
	    
	    this.svg.selectAll(".link")
		.on('dblclick', function (d) {	
			//
		    }
		   )
		.on('mouseover',function (d) {
		    }
		   )
		.on('mouseout', function (d) {	
		    }
		   );/*
		.each(function(d){
			  var sNode = self.nodeToSvg[d.source.name];
			  var tNode = self.nodeToSvg[d.target.name];
			  console.log(d3.select(sNode).style("visibiliy"));
			  console.log(d3.select(tNode).style("visibiliy"));
		      });*/
	    

	    function tick() {
	
		    link.attr("d", function (d) {
			      var path = self._drawLink(d);
			      return path;
			  });
	
/*
		link.attr("x1", function(d) { return d.source.x; })
		    .attr("y1", function(d) { return d.source.y; })
		    .attr("x2", function(d) { return d.target.x; })
		    .attr("y2", function(d) { return d.target.y; });
 */
			
		node.attr("transform", function(d) {/*console.log(d.name + " " + d.x + " " + d.y);*/return "translate(" + d.x + "," + d.y + ")"; });
	     };
	    


	    var baryX = 0, baryY = 0, cnt = 0;   	  
	    /* Configure the simulation */
	    this.force
		.on("tick", function() {
		
			link.attr("d", function (d) {
				      var path = self._drawLink(d);
				      return path;
				  });
		
			/*
			 link.attr("x1", function(d) { return d.source.x; })
			 .attr("y1", function(d) { return d.source.y; })
			 .attr("x2", function(d) { return d.target.x; })
			 .attr("y2", function(d) { return d.target.y; });
			 */
			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });		    		 		    
		    })
		.on('start', function(){
		//	alert("start");
		//	$('.node').hide();
			//console.log(">>>>>>STARTTTTINNGFGGG<<<<<");
		    })
		.on('end',
		    function(){
			$('.node,.link').show();
			self.svg.selectAll('image').remove();		
			self.svg.selectAll('.node').attr('display','')
			    .each (function (d){ 
				     //  console.log(d.x + " <>" + d.y);				       
				       cnt++;baryX += d.x; baryY += d.y;d.fixed = true;});
			baryX /= cnt;
			baryY /= cnt;
		//	self.vpController.setViewPoint({x : baryX, y : baryY, view : 'global', data : node });	
		
			$(self.target).trigger('networkEnd');
		    });
	   // $('.node,.link').hide();
	  	    
	    /*var max = 1000;
	    var i = 0;
	    var alpha = 0.0005;
	    this.force.start();
	    while(self.force.alpha() > alpha && i++ < max) self.force.tick();
	    this.force.stop();*/
	    //	    this.force.start();      

	    
	    if (options) {
		if(options.hasOwnProperty('type')) {
		    if(options.type === 'removal') {
			this.force.start();
			return null;
		    } else if (options.type === 'static') {
			this.force.tick();
			return { nodeData : newNodes, linksData : newLinks };
		    }
		}
	    }
	    
	    // hide orphans

	    newNodes.forEach(function(datum) {
				 var node = self.nodeToSvg[datum.name];
				 
				 d3.select(node)
				     .style("visibility", function(d){
						return self._isOrphan(d) ? "hidden" : "visible";
					    });				 
			     });
//	    d3.selectAll(".node")
//		.style("visibility", function(d) {
//			   return self._isOrphan(d) ? "hidden" : "visible";
//		       });
	    

	    // Run Layout	    
	    $(this.target).trigger('networkRendering');
	    this.force.friction(0.75).start();            	 	    
	    return {
		nodeData : newNodes,
		linksData : newLinks
	    };

//	    self.forwardAlpha(self.force(), 0.5, 500);
	},
/*	forwardAlpha : function (layout, alpha, max) {
	    alpha = alpha || 0;
	    max = max || 1000;
	    var i = 0;
	    while(layout.alpha() > alpha && i++ < max) layout.tick();
	},*/
	centrum : function(){
		// appel on click centre le rÃ©seaux
		var self = this;
		
		
		//first step recup barycentre
		var moyX = 0;
		var moyY = 0;
		var nodesList = [];
		d3.selectAll(".node").each(function (d){
			
			if (d3.select(this).style('visibility') === "visible" && d) {
				
				moyX += d.x;
				moyY += d.y;
				nodesList.push(d);
			}
		});
		if(nodesList.length === 0){return;}
		
		var moyX = moyX / nodesList.length;
		var moyY = moyY /nodesList.length;
		//centre du svg par translation
		var start = $('div#networkWindow svg ').offset();
		var width = $('div#networkWindow svg ').width();
		var height = $('div#networkWindow svg ').height();
		var box = {top : start, dim : {width : width, height : height}}
		
		var xCentre = (width )/2;
		var yCentre = (height )/2;
		var diffX = xCentre - moyX;
		var diffY = yCentre - moyY;
		var matrix = [1,0,0,1,diffX,diffY];
		var newMatrix = "matrix(" +  matrix.join(' ') + ")";
		
		//$('div#networkWindow svg g#network').attr("transform",newMatrix);
		//recherche du zoom idÃ©al
		var zFactorUp = 0.9;
		var zFactorDown = 1.1;
		var zStep = 1;
		
		if(self._allIn(matrix, nodesList, box, zStep)){
			while (true){
				var tempMatrix = self._applyZ(zFactorDown,matrix,width,height);
				zStep *= zFactorDown;
				if(!self._allIn(tempMatrix, nodesList, box, zStep)){
					newMatrix = "matrix(" +  matrix.join(' ') + ")";
					break;
				}
				matrix = tempMatrix
			}
		}else{
			while (true){
				matrix = self._applyZ(zFactorUp,matrix, width, height);
				zStep *= zFactorUp;
				if(self._allIn(matrix, nodesList, box, zStep)){
					newMatrix = "matrix(" +  matrix.join(' ') + ")";
					break;
				}
			}
		}
		$('div#networkWindow svg g#network').attr("transform",newMatrix);

	},
	_applyZ : function(zLevel,matrix,docWidth,docHeight){
		
			for (var i=0; i< matrix.length; i++)
			{
			    
			    matrix[i] *= zLevel;
			  	//console.log('to ' +  this.transMatrix[i]);
			}
			matrix[4] += (1-zLevel)*docWidth/2;
			matrix[5] += (1-zLevel)*docHeight/2;
			return matrix;
			
	},
	_allIn : function(matrix,nodes,box,zStep){
	
		var xTop = 0 ;
		var yTop = 0 ;
		var xBot = box.dim.width ;
		var yBot = box.dim.height ;
		var margin = 50 * zStep;
		

		for (var i=0; i < nodes.length; i++) {
			var coor = this._testMatrixToNode(nodes[i], matrix);
	

			if(margin > coor.x ){
				return false;
			}
			if(xBot - margin < coor.x){
				return false;
			}
			if(margin > coor.y){
				return false;
			}
			if(yBot -margin < coor.y){
				return false;
			}
		
		};
		return true;
	},
	_testMatrixToNode : function (node,matrix){

		var tempX =  node.x * matrix[0] + node.y * matrix[2] + matrix[4];
		var tempY =  node.x * matrix[1] + node.y * matrix[3] + matrix[5];
		return {
			x : tempX,
			y : tempY
			};
	},
	_setDrawDragBox : function () {
	    var self = this;
	    /* d3 get local svg coordinates
	     * unable to make it work
	     $(self.target + ' #networkWindow svg')
	     .each(function (){
	     var coordinates = [0, 0];
	     coordinates = d3.mouse(this);
	     console.log(localCoor);
	     });
	     USing parentOffset jquery method
	      THIS MAY NOT BREAK AT WINDOW RESIZING, because navbar is the only offset cause (y axis)
	     and it remains static at resize
	     */
	    var $container = $(this.target + ' #networkWindow');
	    var $selection = $('<div>').addClass('selection-box');
	    $container.on('mousedown', function(e) {	
			      //console.log("--->" + e.target);
			     // console.dir(e.target);
			     // console.dir(e);
			      if ($(e.target).parents('g#controler').length > 0)  
				  return;
			      
			      var $element = $(this).find('g#network');
			      /*   
			      var parentOffset = $(this).parent().offset();			      
			      var click_y = e.pageY - parentOffset.top;
			      var click_x = e.pageX - parentOffset.left;
			      */
			      //var parentOffset = $element.parent().offset();			      
			      var click_y = e.pageY ;
			      var click_x = e.pageX;

			      $selection.css({
						 'top':    click_y,
						 'left':   click_x,
						 'width':  0,
						 'height': 0
					     });
			      var oX = click_x ;
			      var oY = click_y - 62;
			      $selection.appendTo($container);			

			      $container
				  .on('mousemove', function(e) {			
					  var move_x = e.pageX, //- parentOffset.left,
					  move_y = e.pageY, //- parentOffset.top,
					  width  = Math.abs(move_x - click_x),
					  height = Math.abs(move_y - click_y),
					  new_x, new_y;
					  
					  new_x = (move_x < click_x) ? (click_x - width) : click_x;
					  new_y = (move_y < click_y) ? (click_y - height) : click_y;
					  
					  $selection.css({
							     'width': width,
							     'height': height,
							     'top': new_y,
							     'left': new_x
							 });
				      }).on('mouseup', function(e) {
						
						var parentOffset = $element.parent().offset();						
						var clickUp_y = e.pageY - 62;
						var clickUp_x = e.pageX ;
						//console.dir(e);
						//console.log("get from" + oX + ' ' + oY + " to " +
							//    clickUp_x + ' ' + clickUp_y);
				
						$container.off('mousemove');
						$container.off('mouseup');
						$selection.remove();
						
						var Xlo = oX < clickUp_x ? oX : clickUp_x,
						Ylo = oY < clickUp_y ? oY : clickUp_y,
						Xhi = oX > clickUp_x ? oX : clickUp_x,
						Yhi = oY > clickUp_y ? oY : clickUp_y;
						
						
						/*Single, or double click unglow all*/
						if (
						    oX == clickUp_x  &&
							oY == clickUp_y  
						) {						   
						    self._unglowAll();
						    $(self.target).trigger('glowingTouch', {data : [], setToGlow : false});
						    return;
						} 
						/* a drawn rectable triggers glowing */
						var nodeArrayGlow = [];
						var data = [];
						//here transform
						var actualTrans = self._getTransformMatrice();

						//console.dir("here the select no modif " + Xhi + " , " + Yhi + " : " + Xlo + " , " + Ylo);
						/*transform of corner selection*/
						/*Xhi = Xhi * actualTrans[0][0] + Yhi * actualTrans[0][1] + actualTrans[0][2];
						Yhi = Xhi * actualTrans[1][0] + Yhi * actualTrans[1][1] + actualTrans[1][2];
						Xlo = Xlo * actualTrans[0][0] + Ylo * actualTrans[0][1] + actualTrans[0][2];
						Ylo = Xlo * actualTrans[1][0] + Ylo * actualTrans[1][1] + actualTrans[1][2];
						console.dir("here the select modif " + Xhi + " , " + Yhi + " : " + Xlo + " , " + Ylo);*/
						self.svg.selectAll(".node")
						    .each(function (d){							      
							      var node = this;
							      var tempX =  d.x * actualTrans[0][0] + d.y * actualTrans[0][1] + actualTrans[0][2];
							      var tempY =  d.x * actualTrans[1][0] + d.y * actualTrans[1][1] + actualTrans[1][2];
							      //console.log( d.x + " , " + d.y);
							      //console.log( tempX + " , " + tempY);
							      if (tempX > Xhi) return;
							      if (tempX < Xlo) return;
							      if (tempY> Yhi) return;
							      if (tempY < Ylo) return;
							      nodeArrayGlow.push(this);
							      data.push(d);
							  });	
						if (nodeArrayGlow.length > 0) {
						    self._glowToggle(nodeArrayGlow, {type : "forced"});
						    $(self.target).trigger('glowingTouch', {data : data, setToGlow : true});
						}
					    });
			      
			  });
	    
	},
	setGlowyNodes : function(data) {
	    var self = this;
	    this._unglowAll();
	    var nodes = data.nodeNameList.map(function(elem, i, array) {
						  return self.nodeToSvg[elem];
					      }); 
	    self._glowToggle(nodes, {type : "forced"});
	},
	getGlowyNodes : function () { /* Testing with javascript motor*/
	    var self = this;
	    var array = [];
	    this.svg.selectAll('.node').each(function (d) {
						 if (d.glow) array.push(d);
			 		     });
	    return array;	    
	},
	getDeletedNodeList : function () {
	    return this.delElements.nodes.obj;	    
	},
	getCentralNodeList : function (opt) {
	    var array = [];
	    var type = "long";
	    if (opt) {
		type = opt.size ? opt.size : type;		
	    }
	    d3.selectAll('.node').each(function(d){
				//	console.dir(d);
					   if (d.central) {					    					
					       var value = type === "short" ? { name : d.name, central : d.central } : d;
					       array.push(value);					       
					   }
				    });
//	    console.dir(array);
	    return array;	    
	},
	/* node that were present in previous graph instance are discarded in returned data
	 * we have to mention them explicitely as central
	 * using the additional network attribute newCenters returned by server
	 *  */
	addCenter : function (nodeList) {
	    var self = this;	    
	    nodeList.forEach(function (name) {
				 var node = self.nodeToSvg[name];
				 d3.select(node).each(function(d){ d.central = true; });
			     });
	},
	setAllCenter : function () {
		d3.selectAll(".node").each(function(d) { d.central = true ;});    
	},
	/*Dynamic filtering of the network elements -> preview tobe-deleted elements as shady nodes
	 data = { 
	 *         type : "expressionTag" OR "detectionMethod", 
	 *         criterions : { 
	 *                        "monTissu" : value, ... }
	 * } */
	_setNodeBasedPreviewFilter : function (filterData, strict) {
	    var nodes = this.force.nodes();
	    if (isEmpty(filterData.expressionLevel)) {
		nodes.forEach(function(node) {node.nearVanish = "no";});
		d3.selectAll('.node').style("visibility", function(d) { 
						return "visible";});
		d3.selectAll('.link').style("visibility", function (d){
						return "visible"; 
					    });
		return;
	    } 		    		
		
	    nodes.forEach(function(node) {node.nearVanish = "yes";node.fCount = 0;});
	  //  if (strict)
	    this.expressionTagLess.forEach(function(node) {node.nearVanish = "unk";});
	    var eTagTot = 0;
	    for (var eTag in filterData.expressionLevel) {
		eTagTot++;
		//console.dir(filterData.expressionLevel);
		var treshold = filterData.expressionLevel[eTag];		    
		if (!this.expressionTag[eTag]) {
		    console.log(eTag + "<----NOT FOUND IN CORE EXPRESSION TAGS");
		}
		this.expressionTag[eTag].forEach(
		    function(nodeLitt){
			//			    console.dir(nodeLitt);
			if (nodeLitt.value < treshold) return;
			nodeLitt.node.fCount++;
		    });		    
	    }
	    nodes.forEach(function(node) {
			      if(node.nearVanish === "unk") return;
			 //     console.log(node.fCount + " " + eTagTot);
			      node.nearVanish = node.fCount === eTagTot
				  ? "no" : "yes";
			  });
	},
	_setLinkBasedPreviewFilter : function (filterData, strict) {
//	    console.dir(filterData);
	    var links = this.force.links();
	    if (isEmpty(filterData.detectionMethod)) {
		links.forEach(function(link) {link.nearVanish = "no";});
		d3.selectAll('.link').style({ "visibility" : "visible" });
		return;
	    }
	    links.forEach(function(link) {link.nearVanish = "yes";link.fCount = 0;});
	    if (strict)
		this.detectionMethodLess.forEach(function(link) {link.nearVanish = "unk";});
	    var dTagTot = 0;
	    for (var dTag in filterData.detectionMethod) {
		dTagTot++;
		if (!this.detectionMethod[dTag]) {
		    console.log(dTag + "<----NOT FOUND IN CORE DETECTION METHODS");
		}
		this.detectionMethod[dTag].forEach(
		    function(linkLitt){
			linkLitt.fCount++;
		    });	
	    }
	    links.forEach(function(link) {
			      if(link.nearVanish === "unk") return;
			     
			      link.nearVanish = link.fCount >= dTagTot
				  ? "no" : "yes";
			      
			 /*     console.log(link.source.aceAccessor + " --" + link.target.name + " ; " + link.fCount + " >= " 
				  + dTagTot + " --> " + link.nearVanish);*/
			  });
	},
	previewFilter : function (filterData, strict) {
	    var self = this;

	    if (filterData.hasOwnProperty('expressionLevel')) 
		this._setNodeBasedPreviewFilter(filterData, strict);
	    if (filterData.hasOwnProperty('detectionMethod')) 
		this._setLinkBasedPreviewFilter(filterData, strict);
	    
	    d3.selectAll('.node')
		.style('fill', function(d) { 			 
			   if (d.nearVanish === "yes") return "red";
			   if (d.nearVanish === "no") return "green";			 
			   return "rgb(131, 241, 237)";
		       })
		.style('visibility', function(d){			 
			   if(d.nearVanish === "no") return "visible";
			   var cViz = d3.select(this).style("visibility");
			   return cViz;
		       });

	    d3.selectAll('.link').style("stroke", function (d){					    
					    if (d.nearVanish === "unk") return "rgb(131, 241, 237)";
					    if (d.nearVanish === "yes") return "red";
					    if (d.nearVanish === "no") return "green";
					    return d3.select(this).style("stroke");
					});  
	    d3.selectAll('.node').style("visibility",function(d){
					   if(d.manualHide) return "hidden"; 
					   return d3.select(this).style("visibility");
				       });
	    d3.selectAll('.link').style("visibility", function(d){
					   if(d.source.manualHide) return "hidden";
					   if(d.target.manualHide) return "hidden";
					   return d3.select(this).style("visibility");
				       });	    
	},
	colorGlowyNodes : function (hexCode) {
	    var self = this;
	    this.svg.selectAll('.node')
		.each(function (d) {
			  if (d.glow) {			      			  
			      d3.select(this).style('fill', hexCode);
			      d.userColor = hexCode;
			      self._storeElementStyle(this); 
			  }
		      });	    	    
	},
	_unglowAll : function () {
	    var nodes = [];
	    this.gNodes = [];
	    this.svg.selectAll(".node").each(function(d){d.glow = true; nodes.push(this);});
	    this._glowToggle(nodes, null);
	},
	_getTransformMatrice : function(){
		var self = this;
		var defaultMatrix = [[1,0,0],[0,1,0],[0,0,1]];
		var matrix = $('div#networkWindow svg g#network').attr('transform');
		//console.log(matrix)
		if(matrix){
			/*here parsing of matrix*/
			var reg = /-?[0-9]+(\.[0-9]*)?/gi
			var numberList = matrix.match(reg);
			defaultMatrix[0][0] = parseFloat(numberList[0]);
			defaultMatrix[1][0] = parseFloat(numberList[1]);
			defaultMatrix[0][1] = parseFloat(numberList[2]);
			defaultMatrix[1][1] = parseFloat(numberList[3]);
			defaultMatrix[0][2] = parseFloat(numberList[4]);
			defaultMatrix[1][2] = parseFloat(numberList[5]);
		}
		return defaultMatrix;
		
	},
	_glowToggle : function (data, opt) {
	    var self = this;
	    var array = $.isArray(data) ? data : [data];
	    var type = opt ? opt.type : "nice";
	    for (var i = 0; i < array.length; i++) {
		var datum = array[i];
		d3.select(datum).each(
		    function(d) {
			var node = this;
			if (d.glow) {
			    if (type === "forced") {
				var specs = self.shapeCreator[d.type](node, "glowy", "getShapeSpecs");
				d3.select(this).transition()
				    .attr('d', d3.svg.symbol()
					  .size(specs.size)
					  .type(specs.shape))		    			  
				    .style("stroke", '#9ecaed')
				    .style("fill", specs.fill)/*'#9ecaed')*/
				    .style("stroke-width", '3px')
				    .attr("filter",'url(#blur)');
				return;
			    }			    
			    d.glow = false;
			    var specs = self.shapeCreator[d.type](node, "regular","getShapeSpecs");
			    d3.select(this).transition().attr('d', d3.svg.symbol()
							      .size(specs.size)
							      .type(specs.shape))
				.attr("filter",null)
 				.style("stroke", specs.stroke)
				.style("stroke-width", '1px');
			} else {			   
			    d.glow = true;
			    var specs = self.shapeCreator[d.type](node, "glowy", "getShapeSpecs");
			    d3.select(this).transition()
				.attr('d', d3.svg.symbol()
				      .size(specs.size)
				      .type(specs.shape))	
	    			.attr("filter",'url(#blur)')
				.style("stroke", '#9ecaed')
				.style("stroke-width", '3px');
			}					  
		    });	   
 	    }
	},	
	_nodeDefault : function (d) {
	    
	},
	_nodeBubbled : function (d) {
	    
	},
	_nodeSelected : function (d) {
	    
	},
	_drawLink : function (d) {
	    var x1 = d.source.x,
	    y1 = d.source.y,
	    x2 = d.target.x,
	    y2 = d.target.y,
	    dx = x2 - x1,
	    dy = y2 - y1,
	    dr = Math.sqrt(dx * dx + dy * dy),
	    

	   
	    // Defaults for normal edge.
	    drx = dr,
	    dry = dr,
	    xRotation = 0, // degrees
	    largeArc = 0, // 1 or 0
	    sweep = 1; // 1 or 0

	    if (this.linkAs === "line") {			    
		if (d.target.name != d.source.name) {
		    return "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
		}
	    }
	    // Self edge.
	    if ( x1 === x2 && y1 === y2 ) {
		// Fiddle with this angle to get loop oriented.
		xRotation = -45;
		
		// Needs to be 1.
		largeArc = 1;
		
		// Change sweep to change orientation of loop. 
		//sweep = 0;
		
		// Make drx and dry different to get an ellipse
		// instead of a circle.
		drx = 30;
		dry = 20;
		
		// For whatever reason the arc collapses to a point if the beginning
		// and ending points of the arc are the same, so kludge it.
		x2 = x2 + 1;
		y2 = y2 + 1;
	    } 
	    return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " 
		+ xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;    
	},
	shapeCreator : {
	    protein : function (node,level,opt) {	
		var shape = "square";
		var defSize = 256;
		var glowSize = defSize * 1.5;
		var size = level === "regular" ? defSize : glowSize;
		var stroke = '#4682B4',
		fill = '#4682B4';
		if(opt)
		    if (opt === "getShapeSpecs")
			return {shape : shape, size : size, stroke : stroke, fill : fill};

		d3.select(node)		
		    .attr("d", d3.svg.symbol()
			  .size(size)
			  .type(shape)
			 )
		    .style('fill', fill)
		    .style('stroke', stroke);
		return null;
	    },
	    multimer : function (node, level, opt) {	
		var shape = 'diamond';
		var defSize = 600;
		var glowSize = defSize * 1.5;
		var size = level === "regular" ? defSize : glowSize;
		var stroke = '#4682B4',
		fill = '#FFCC66';
		
		if(opt)
		    if (opt === "getShapeSpecs")
			return {shape : shape, size : size, stroke : stroke, fill : fill};

		d3.select(node)		
		    .attr("d", d3.svg.symbol()
			  .size(size)
			  .type(shape)
			 )
		    .style('fill', function (d){return fill;})
		    .style('stroke', stroke);
		return null;
	    },
	    cation : function (node, level, opt) {	
		var shape = 'triangle-down';
		var defSize = 128;
		var glowSize = defSize * 1.5;
		var size = level === "regular" ? defSize : glowSize;	
		var stroke = '#003399',
		fill = '#CC0000';
		if(opt)
		    if (opt === "getShapeSpecs")
			return {shape : shape, size : size, stroke : stroke, fill : fill};
		d3.select(node)		
		    .attr("d", d3.svg.symbol()
			  .size(size)
			  .type(shape)
			 )
		    .style('fill', fill)
		    .style('stroke', stroke);
		return null;
	    },
	    fragment : function (node, level, opt) {
		var shape = "cross";
		var defSize = 128;
		var glowSize = defSize * 1.5;
		var size = level === "regular" ? defSize : glowSize;
		var stroke = '#003399',
		fill = '#4682B4';
		if(opt)
		    if (opt === "getShapeSpecs")
			return {shape : shape, size : size, stroke : stroke, fill : fill};
		d3.select(node)		
		    .attr("d", d3.svg.symbol()
			  .size(size)
			  .type(shape)
			 )
		    .style('fill', fill)
		    .style('stroke', stroke);
		return null;
	    },
	    lipid : function (node, level, opt) {
		var shape = 'triangle-up';
		var defSize = 128;
		var glowSize = defSize * 1.5;
		var size = level === "regular" ? defSize : glowSize;	
		var stroke = '#003399',
		fill = '#FFFFD8';
		if(opt)
		    if (opt === "getShapeSpecs")
			return {shape : shape, size : size, stroke : stroke, fill : fill};
		d3.select(node)		
		    .attr("d", d3.svg.symbol()
			  .size(size)
			  .type(shape)
			 )
		    .style('fill', fill)
		    .style('stroke', stroke);
		return null;
	    }, 
	    glycosaminoglycan : function (node, level, opt) {
		var shape = 'circle';
		var defSize = 128;
		var glowSize = defSize * 1.5;
		var size = level === "regular" ? defSize : glowSize;
		var stroke = '#003399',
		fill = '#339933';
		if(opt)
		    if (opt === "getShapeSpecs")
			return {shape : shape, size : size, stroke : stroke, fill : fill};
		d3.select(node)		
		    .attr("d", d3.svg.symbol()
			  .size(size)
			  .type(shape)
			 )
		    .style('fill', fill)
		    .style('stroke', stroke);
		return null;
	    },
	    biomolecule : function (node, level, opt) {
		var shape = 'triangle-down';
		var defSize = 128;
		var glowSize = defSize * 1.5;
		var size = level === "regular" ? defSize : glowSize;	
		var stroke = '#003399',
		fill = '#DA40D5';
		if(opt)
		    if (opt === "getShapeSpecs")
			return {shape : shape, size : size, stroke : stroke, fill : fill};
		d3.select(node)		
		    .attr("d", d3.svg.symbol()
			  .size(size)
			  .type(shape)
			 )
		    .style('fill', fill)
		    .style('stroke', stroke);
		return null;
	    }
	},
	generateSymbolLegend : function (opt) {
	    $(opt.target).append('<div id="legend"><table><tbody></tbody></table></div>');
	    var list = [];
	    var cnt = 1;
	    for (var symbol in this.shapeCreator) {	
		if(isOdd(cnt)) 
		    $('#legend tbody').append('<tr><td><svg width="20px" height="20px"></svg><div class="legendText"></div></td>'
					      + '<td><svg width="20px" height="20px"></svg><div class="legendText"></div></td></tr>');
		cnt++;
		list.push(symbol);
	    }
	    
	    var inner = 0,
	    self = this;
	    
	    d3.selectAll( "div#legend tbody td svg" ).each(
		function (){
		    var symbol = list[inner];
		    if (!symbol) return;	
		    var specs = self.shapeCreator[symbol](null, "regular", "getShapeSpecs");
		    d3.select(this)
			.append("path")
			.attr("transform", 
			      function(d) { 
				  return symbol === "multimer" ?  "matrix(0.5,0,0,0.5,10,10)" : "translate(10, 10)";
			      })
			.attr("d", 
			      d3.svg.symbol().size(specs.size).type(specs.shape))
			.style("fill", specs.fill)
			.style("stroke", specs.stroke);
		    inner++;
		});
	    inner = 0;
	    d3.selectAll( "#legend td div.legendText" ).each(
		function() {
		    var symbol = list[inner];
		    if (!symbol) return;
		    var text = symbol === "biomolecule" ? "others" : symbol;
		    text = text.replace(/^./, function (letter) {
					    return letter.toUpperCase();
					});
		    d3.select(this).html(function(){
			var content = text;
			if (text === "Others") {
	//			content += '</br> <span style="padding-left:15px;font-size:0.7em" >(synthetic peptides and inorganic compounds)</span>';
			}
			return content;
			}); 
		    inner++;
		});	    
	    $('#legend').append('<div class="legendFooter"><span class="legendSwitch">Hide</span></div>');
	    $('.legendFooter span')
		.on('click',function (){
			$('#legend table').toggle();
			if( $('#legend table').css("display") == "none" ){
			    $('#legend').removeClass("full");
			    $('#legend').addClass("label");
			    $('div.legendFooter span').text("Show legend");
			}
			else {
			    $('#legend').removeClass("label");
			    $('#legend').addClass("full");
			    $('div.legendFooter span').text("Hide");
			}
		    });

		$('#legend div.legendText')
			.each(function(){
			if($(this).text() == "Others"){
				var anchorPos = $(this).position();  
				var offset = $(this).width();   
				var scaff = '<div class="othersAddOn">(synthetic peptides and inorganic compounds)</div>';
				$('#legend').append(scaff);	
				$('#legend div.othersAddOn').css('position', 'absolute').css({
					top : anchorPos.top + 'px',
					left : (anchorPos.left + offset + 15) + 'px',
					"font-size" : '0.6em'
				})
				
			}})
	},
	serialize : function (opt) {
	    var data = {
		nodes : null,
		links : []
	    };
	    
	    var tmp = this.force.nodes();
	    data.nodes = tmp.map(function(elem, i, array) {
				     elem.linkStore = null;
				     return elem;
				 });
	    var links = this.force.links();
	    for (var i = 0; i < links.length; i++){
		var link = {
		    source : links[i].source.name,
		    target : links[i].target.name,
		    details : { Experiments:[],
				name :  links[i].details.name 
			      },		
		    type : links[i].type
		};
		data.links.push(link);
	    }  	    
	    
	    return data;
	},
	toggleNodeLabel : function (data) {
	   // var nodes = this.force.nodes();
	    //console.dir(nodes);
	    if (data === "show") {
		this.tooltipForced = true;
		d3.selectAll('.node').each(function(d){ 
					       $(this).tooltip('show');
						   //.tooltip('disable');
					   });
	    }
	    else if (data === "hide") {
		this.tooltipForced = false;
		d3.selectAll('.node').each(function(d){
					       $(this).tooltip('hide');
					      // $(this).tooltip('enable');
					   });		
	    } else {
		console.log("Error unknown toggle label status \"" + data + "\"");
	    }
	},
	exportNodes : function () {
	    var nodes = {};
	    d3.selectAll('.node').each(function(d){
					   nodes[d.name] = {
					       common : d.common.anyNames[0],
					       type : d.type
					   };				       
				       });
	    return nodes;
	},
	getKeywordDistribution : function () {
		var distrib = {};
		this.force.nodes().forEach(function (node) {
			if (!node.uniprotKW) return;
			node.uniprotKW.forEach(function(keyword){
				if (distrib[keyword]) { distrib[keyword].push(node.name); }
				else {
					distrib[keyword] = [node.name];
					}
			});
		});
		//console.dir(distrib);
		return distrib;
	},
	//  Biomolecule not specifiyng taxon are positive
	// Any undefined specie object aka "wait for remote fetching"
	// triggers early exit w/ empty selection,
	getNodePerSpecie : function (taxid) { 
	    if (!taxid) return []; 
	    if (typeof taxid ==' string') return [];
	    
	    var nodeNames = [];
	    var loadCompleteBool = true;
	    d3.selectAll(".node")
		.each(function (d) {			  
			  if (!d.specie) {			      
			      console.log("-->" + d.specie);
			      loadCompleteBool = false;			     
			  }			
			  var value = getPropByKey(d, "specie.value");		
			  if (!value){
			      nodeNames.push(d.name);
			  } else if (value === taxid){
			      nodeNames.push(d.name);
			  }
		      });
	    
	    if (loadCompleteBool) {
		return nodeNames;		
	    } else {
		return [];
	    }	    
	},
	getOrphanNodes : function () {
	    var nodeName = [];
	    var self = this;
	    this.force.nodes().forEach(function (node) {
					   if (!self._isOrphan(node)) return;
					   nodeName.push(node.name);
				       });

	    return nodeName;
	},
	// To be orphan a node must be hidden itself or not be connected 
	// to any visible node, or have no connection at all
	_isOrphan : function (node) {
	    if (!node) return false; // ????    

	    var svg = this.nodeToSvg[node.name];
	    var status = d3.select(svg).style("visibility");
	    if (status === "hidden") return false;

	    var neighbourhood = this._getNeighbourhood(node.name);
	    if(neighbourhood.length === 0) return true;
	    for (var i = 0 ; i < neighbourhood.length ; i++) {
		var iName = neighbourhood[i];
		svg = this.nodeToSvg[iName];
		status = d3.select(svg).style("visibility");
		if (status === "visible") return false;
	    }
	    
	    return true;
	}
    };
    
}

