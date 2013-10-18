/*
 * 
 * Component for svg network managment
 * 
 * 
 * */

function coreInit (opt) {
   
    

    return {
	hotNodes : [],
	bubblingNodes : [],
	delElements : {
	    nodes : {
		name : [],
		obj : []
	    },
	    links : []
	},
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
	draw : function () {
	    
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
			this.width = $(window).width() * 0.95;
			this.height = $(window).height() * 0.95;
			d3.select(this.target + ' #networkWindow svg')
			    .attr("width", this.width)
			    .attr("height", this.height);
			console.log ("resizing network window to " + this.width + ' / ' + this.height);
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

	    this.vpController = startPanZoomControler ({svgElement : '#networkWindow svg'});
	    
	    return;
	},

	activateLink : function (d) {
	    var name = d.source.name + "--" + d.target.name;
	    var link = this.linkToSvg[name];
	    d3.select(link).style('stroke', "yellow")
		.style('stroke-width','3px');
	},
	bubbleNodeClear : function () {
	    this.bubblingNodes = [];
	    //console.log("clearing All");
	},
	_bubbleCycleStep : function (node, animationSettings) {
	    var nodeName;
	    var d = d3.select(node).data()[0];
	    //console.log("it is a bubble cycle step of " + nodeName);
	    
	    var specLow = this.shapeCreator[d.type](node, "regular", "getShapeSpecs");
	    var specBig = this.shapeCreator[d.type](node, "glowy", "getShapeSpecs");

	  /*  d3.select(node).transition().attr('r', animationSettings.rmax).duration(250);
	    d3.select(node).transition().attr('r', animationSettings.rmin).delay(250);*/
	    
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
	bubbleCriterionNodes : function (data, type) {
	    var self = this;
	    if (type === "start") {
		console.log("bubbling node digger");
		self.hotNodes = [];		
		console.dir(data);
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
					  console.log("stopping node");
					  console.dir(node);
					  var nodeName;
					  d3.select(node).each(function(d){nodeName = d.name;});
					  self.bubbleNode ({name : nodeName}, "stop");
				      });
		self.hotNodes = [];
	    }
	
	    
	},
	bubbleNode : function (data, type) {	  
	    var self = this;
	    var node;
	    if (data.hasOwnProperty('name'))
		node = this.nodeToSvg[data.name];
//	    console.log("node to bubble " + type + "  is");
//	    console.dir(node);
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
			      if (data.hasOwnProperty('rFactor'))
				  rmax = rmin * data.rFactor;
			      if (data.hasOwnProperty('style')) {
				  d3.select(this)
				      .style('stroke', function() {
						 if (data.style.stroke)
						     return data.style.stroke;								       
						 return  d3.select(this).style('stroke');
					     })
				      .style('fill', function() {
						 if (data.style.fill)
						     return data.style.fill;								       
						 return  d3.select(this).style('fill');
					     })
				      .style('stroke-width', function() {
						 if (data.style['stroke-width'])
						     return data.style['stroke-width'];
						 return  d3.select(this).style('stroke-width');
					     });					     					     
			      }
			      
			  });
		    
/*		console.log('Adding bubbling effect to '+ nodeName +
			    ' boundary a current animation step ' + rmin + ' ' + rmax);	    */
		var bubbleLoopStamp = setInterval(function() {
						      self._bubbleCycleStep(node,{ rmax : rmax, rmin : rmin});
						  }, 550);	    
		self.bubblingNodes.push({name : nodeName, stamp : bubbleLoopStamp});
	    } else if(type === 'stop') {
		self._bubbleCycleStop(node);
	    }
	    
	},
	registerCom : function (data) { /* register the component to communicate with as jquery selector DOM ELEMENT*/
	    if ('tabular' in data)
		this.targetCom['tabular'] = data.tabular;	    	    
	},
	resize : function () {
	    /*Maybe not needed*/
	},
	add : function (datum, options) { /* add node(s) to a empty/not-empty graph 
					    options for later development needs
					   */
	    var nodes = this.force.nodes(),
	    links = this.force.links();
	/*freeze all previous*/
	    this.svg.selectAll(".node").each (function (d){d.fixed = true;});
	    nodes.push.apply(nodes, datum.nodeData);    	    
	    
	    /*
	     *  Overall source/target node reference process must be speeded up using updated hashTable referncing nodes
	     * 
	     */
	    console.log("-->" + datum.linksData.length);
	    for (var iLink = 0; iLink < datum.linksData.length; iLink++) {
		if (!datum.linksData[iLink].details) {
		    console.log("Attempting to enter an invalid link element in core selection");
		    console.dir(datum.linksData[iLink]);
		    continue;
		}
		var singleLink = {
		    source :  datum.linksData[iLink].source,
		    target :  datum.linksData[iLink].target,		    
		    details : datum.linksData[iLink].details		    
		};
		links.push(singleLink);					  
	    }
	    var newNetworkElem = this._drawNetwork(nodes, links, options);
	    
	    if (this.targetCom.hasOwnProperty('tabular'))
		$(this.targetCom['tabular']).trigger('add', newNetworkElem);	    
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

		console.dir(d3.event);
		console.dir(d);

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
	    
	   
	 
	    var node =  this.svg.selectAll(".node").data(nodes, function(d) {return d.name;});  
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
			d['previousStyle'] = { r : '8', 
					       stroke : function(){ return d3.select(node).style('stroke');}(),
					       'stroke-width' : function(){ return d3.select(node).style('stroke-width');}()
					     };
			d['unBubbleStyle'] = {};
			d['glow'] = false; 
			self.nodeToSvg[d.name] = this;			
			self.nodeToLinks[d.name] = [];
			if (! d.hasOwnProperty('central')) {
			    d.central = false;			    
			} 			
			//console.log("trying to access to svg reference"); // self.nodeToSvg[d.id] = $( .node...);
			//console.dir(this);						
		    }
		).each(function (d) {
			 
			   var node = this;
			   $(this).tooltip({
					       title : function (){ 
						   var text = d3.select(this).datum().name;						   
						   return text;
					       },							 
					       animation: true,
					       container: 'body'
					   });
			   $(this).hoverIntent( {
						    over : function () {
							if ('tabular' in self.targetCom) {
							    $(self.targetCom.tabular).trigger('nodeScroll', [d3.select(node).datum()]);
							}											
						    },
						    timeout : 500,
						    out : function (){}
						});			   
		       });
	    node.exit().remove();   
	    node.on('mouseover',function (d) {	
			//setFocusNode(this);
		    })
		.on('mouseout', function (d) {/*setUnFocusNode(this);*/})
		.on('mousedown', function() {
			d3.event.stopPropagation();
		    })
		.on('dblclick', function(d) {					
			self._glowToggle(this, null);
			$(self.target).trigger('glowingTouch', { data : [d], setToGlow : d.glow });
			d3.event.stopPropagation();
		    })
		.on('click',function (d) {
			d3.event.stopPropagation();		
		    });
	    
	    /* Send them to the layout */
	    this.force.nodes(nodes);	    
	    
	   var link = this.svg.selectAll("line.link")
		.data(links, function(d) {
			  console.log("adding link");
			  var sNode,sData;
			  if (d.source.hasOwnProperty('name')) {
			      sData = d.source;
			 //     console.log("SOURCE link spec is an object");
			  } else {
			      sNode = self.nodeToSvg[d.source];
			      sData = d3.select(sNode).data()[0];
			  }

			  //var string = d.source + " " + d.target;			 
			  var tNode, tData;
			  if (d.target.hasOwnProperty('name')) {			    
			      tData = d.target;
			   //   console.log("TARGET link spec is an object");   
			  } else {			
			      tNode = self.nodeToSvg[d.target];
			      tData = d3.select(tNode).data()[0];
			  }			  
			  
			  if (!sData || !tData) {
			      console.log("not found source/target for following linkj object");
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
		.style("fill","none")
    		.on('mousedown', function() { d3.event.stopPropagation(); })
		.style("stroke", "grey")
		.style('cursor', 'pointer')
	    .each(function (d){
		      newLinks.push(d);		      
		      if (!self.nodeToLinks[d.source.name] || 
			  ! self.nodeToLinks[d.target.name] ){			      			  
			      console.log ('Error undeclared node in association ' 
					   +d.source.name + ' ' + d.target.name);
			      return;
			  }
		      self.nodeToLinks[d.source.name].push ({linkRef : d, role : 'source', crossRef : null});
		      self.nodeToLinks[d.target.name].push ({linkRef : d, role : 'target', crossRef : null});
		      var iTarget = self.nodeToLinks[d.target.name].length - 1;
		      var iSource = self.nodeToLinks[d.source.name].length - 1;
		      self.nodeToLinks[d.source.name][iSource].crossRef = self.nodeToLinks[d.target.name][iTarget];
		      self.nodeToLinks[d.target.name][iTarget].crossRef = self.nodeToLinks[d.source.name][iSource];
		      self.linkToSvg[d.source.name + "--" + d.target.name] = this;
		      
		      $(self.target).trigger('linkDataToFetch',d);
		  });
	    //.attr('display', 'none');				      
	    link.exit().remove();				     
	    
	    this.svg.selectAll("line.link")
		.on('dblclick', function (d) {	
			//
		    }
		   )
		.on('mouseover',function (d) {
		    }
		   )
		.on('mouseout', function (d) {	
		    }
		   );
	    

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
			
		node.attr("transform", function(d) { 	console.log(d.name + " " + d.x + " " + d.y);return "translate(" + d.x + "," + d.y + ")"; });
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
	    
	    // Run Layout
	    
	    $(this.target).trigger('networkRendering');
	    this.force.start();            	 
	   
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
	    
	    //var $container = $(this.target + ' #networkWindow g[id=network]');
	    var $container = $(this.target + ' #networkWindow');
	    var $selection = $('<div>').addClass('selection-box');
	    
//	    console.log("setting drag box");
	    $container.on('mousedown', function(e) {	
			      //console.log("--->" + e.target);
			      //console.dir(e.target);
			      if ($(e.target).parents('g#controler').length > 0)  
				  return;
			      
			      var $element = $(this).find('g#network');
			      /*   
			      var parentOffset = $(this).parent().offset();			      
			      var click_y = e.pageY - parentOffset.top;
			      var click_x = e.pageX - parentOffset.left;
			      */
			      //var parentOffset = $element.parent().offset();			      
			      var click_y = e.pageY;
			      var click_x = e.pageX;

			      $selection.css({
						 'top':    click_y,
						 'left':   click_x,
						 'width':  0,
						 'height': 0
					     });
			      var oX = click_x;
			      var oY = click_y;
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
						var clickUp_y = e.pageY - parentOffset.top;
						var clickUp_x = e.pageX - parentOffset.left;
						//console.dir(e);
						/*console.log("get from" + oX + ' ' + oY + " to" +
							    clickUp_x + ' ' + clickUp_y);*/
						
						$container.off('mousemove');
						$container.off('mouseup');
						$selection.remove();
						var Xlo = oX < clickUp_x ? oX : clickUp_x,
						Ylo = oY < clickUp_y ? oY : clickUp_y,
						Xhi = oX > clickUp_x ? oX : clickUp_x,
						Yhi = oY > clickUp_y ? oY : clickUp_y;
						
						
						/*Single, or double click unglow all*/
						if (
						    oX == (clickUp_x + parentOffset.left) &&
							oY == (clickUp_y + parentOffset.top) 
						) {						   
						    self._unglowAll();
						    $(self.target).trigger('glowingTouch', {data : [], setToGlow : false});
						    return;
						} 
						/* a drawn rectable triggers glowing */
						var nodeArrayGlow = [];
						var data = [];
						self.svg.selectAll(".node")
						    .each(function (d){							      
							      var node = this;
							      //console.log( d.x + " , " + d.y);
							      if (d.x > Xhi) return;
							      if (d.x < Xlo) return;
							      if (d.y > Yhi) return;
							      if (d.y < Ylo) return;
							      nodeArrayGlow.push(this);
							      data.push(d);
							  });
						self._glowToggle(nodeArrayGlow, {type : "forced"});
						$(self.target).trigger('glowingTouch', {data : data, setToGlow : true});
					    });
			      
			  });
	    
	},
	getGlowyNodes: function () { /* Testing with javascript motor*/
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
	getCentralNodeList : function () {
	    var array = [];
	    d3.selectAll('.node').each(function(d){
				//	console.dir(d);
					if (d.central)
					    array.push(d);
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
	    console.log(nodeList);
	    nodeList.forEach(function (name) {
				 var node = self.nodeToSvg[name];
				 d3.select(node).each(function(d){ d.central = true; });
			     });
	},
	colorGlowyNodes : function (hexCode) {
	    var gNodes;
	    this.svg.selectAll('.node')
		.each(function (d) {
			  if (d.glow) {			      			  
			      d3.select(this).style('fill', hexCode);
			      d.userColor = hexCode;
			  }
		      });	    	    
	},
	_unglowAll : function () {
	    //console.log("unglownig all");
	    var nodes = [];
	    this.gNodes = [];
	    this.svg.selectAll(".node").each(function(d){d.glow = true; nodes.push(this);});
	    this._glowToggle(nodes, null);
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
			    if (type === "forced") 
				return;
			    d.glow = false;
			    var specs = self.shapeCreator[d.type](node, "regular","getShapeSpecs");
			    d3.select(this).transition().attr('d', d3.svg.symbol()
							      .size(specs.size)
							      .type(specs.shape))
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
		    .style('stroke', stroke)
		    .attr("transform", function(d) { return "rotate(90" + d.x + " " + d.y + ")"; });
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
		    .style('stroke', stroke)
		    .attr("transform", function(d) { return "rotate(90" + d.x + " " + d.y + ")"; });// Doesnot seem to work
		return null;
	    },
	    biomolecule : function (node, level, opt) {
		var d = d3.select(node).data()[0];
		
	    }
	},
	generateSymbolLegend : function (opt) {
	    $(opt.target).append('<div id="legend"><table><tbody></tbody></table></div>');
	    var list = [];
	    var cnt = 1;
	    for (var symbol in this.shapeCreator) {	
		if (symbol === "biomolecule") continue;
		//var colSel = isOdd(cnt) ? "> div:nth-child(odd)" : "> div:nth-child(even)";
		if(isOdd(cnt)) 
		    $('#legend tbody').append('<tr><td><svg width="20px" height="20px"></svg><div class="legendText"></div></td>'
					      + '<td><svg width="20px" height="20px"></svg><div class="legendText"></div></td></tr>');
		cnt++;
		list.push(symbol);
	    }
	    
	    var inner = 0,
	    self = this;
	    
	    d3.selectAll( "div#legend tbody td svg" ).each(function (){							       
							       var symbol = list[inner];
							       var specs = self.shapeCreator[symbol](null, "regular", "getShapeSpecs");
							       d3.select(this).append("path").attr("transform", function(d) { return "translate(10, 10)"; })
								   .attr("d", d3.svg.symbol().size(specs.size).type(specs.shape))
								   .style("fill", specs.fill)
								   .style("stroke", specs.stroke);
							       inner++;								       
							   });
	    inner = 0;
	    d3.selectAll( "#legend td div.legendText" ).each(function() {
								 var symbol = list[inner];
								 d3.select(this).text(symbol); 
								 inner++;									 
							     });	    
	    $('#legend').append('<div class="legendFooter"><span class="legendSwitch">Hide</span></div>');
	    $('.legendFooter span').on('click',function (){
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
	},
	serialize : function (opt) {
	    var data = {
		nodes : null,
		links : []
	    };
	    
	    data.nodes = this.force.nodes();
	    var links = this.force.links();
	    for (var i = 0; i < links.length; i++){
		var link = {
		    source : links[i].source.name,
		    target : links[i].target.name,
		    details : { Experiments:[],
				name :  links[i].details.name 
			      }		
		};
		data.links.push(link);
	    }  	    
	    
	    return data;
	}
    };
    
}

