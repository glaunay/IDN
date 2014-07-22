/*
 * 
 *  This is the bookmark based version with revised css
 * 
 */
function tabularInit (opt) {
    if ($(opt.target).length == 0)
	alert ("unable to initialize tabular component at location " + opt.target);
    
   // $(opt.target).addClass('tabularNetworkWidgetWrapper');
    
    var width = "260px";    
    if (opt.width)
	width = opt.width;

    var size = "minified";
    if ("iState" in opt)
	size = opt.iState;

    var positionSettings = {};
    if ('position' in opt.location) {
	positionSettings = opt.location;
    }  
  
    var draggable = false;
    if ('draggable' in opt)
	draggable = opt.draggable;      
    
    return {
	staticHref : opt.staticHref ? opt.staticHref : 'http://matrixdb.ibcp.fr:9999',
	computeBookmarkPosition : opt.computeBookmarkPosition,
	positionSettings: positionSettings,
	callback : opt.callback,
	width : width,
	target : opt.target, 
	draggable : draggable,
	size : size,
	nodeBuffer : null,	
	target : opt.target,
	activePanel : "node",
	nodeRawData : {},
	linkRawData : {},
	nodeTableData : [],
	linkTableData : [],
	linkTableDataIndex : {},
	nodeIndex : {}, // should be useless, as long as id remain coherent
	nodeDT : null,
	linkDT : null,
	miniSel : null,	
	maxiSel : null,
	linkTabIsReady : true,
	nodeTabIsReady : true,	
	getTabularSelector : function () {
	    return this.maxiSel;
	},
	draw : function (opt) {
	    var self = this;
	    $(this.target).append('<div id="tabularLargeWrapper"></div>'
				  + '<div id="tabularBookmarkWrapper"><i class="fa fa-list-alt fa-4x"></i></div>');
	    var headerHtml = '<div class="tabularNetworkHeader">'
		+ '<i class="fa fa-minus-square-o fa-3x pull-left"></i>'+
		'<button id="nodeLabelToggler" type="button" class="btn btn-info" data-toggle="button">Toggle node labels</button>'+
		'<i class="fa fa-question-circle pull-right fa-2x helpMe"></i></div>';
	    
	    $(this.target + ' div#tabularLargeWrapper').append(headerHtml);
	    /* LABEL TOGGLER*/
	    $(this.target + ' #nodeLabelToggler').on('click', function () {
							 var status =  $(this).hasClass('active') 
							     ? 'hide'
							     : 'show';						
							 $(self.target)					
							     .trigger('nodeLabelToggle', status);
						     });
							    
	    
	    this.maxiSel = this.target + ' #tabularLargeWrapper';
	    this.miniSel = this.target + ' #tabularBookmarkWrapper';
	    
	    var defaultCss = self.computeBookmarkPosition();	 
//	    console.log(defaultCss);
	    $(this.miniSel).css(defaultCss);
	    $(this.maxiSel).css(defaultCss);
	    
	    $( window ).resize(function() {
				   var newWindowCss = self.computeBookmarkPosition();	    
				   $(self.miniSel).css(newWindowCss);
			       });
	    
	    
	    

	    var link = $(this.target + ' li.action')[0];
	    $(link).on('click', function() {
			   var tickObj = self._getTickedNodes();			   
			   var array = [];
			   for (var i = 0; i < tickObj.length ; i++) {
			       array.push({ name : tickObj[i].asRawData.name,
					    type : 'biomolecule'
					  });
			   }
			   self.callback.addCriterion(array);
		       });
	    // Node deletion action 
	    var link = $(this.target + ' li.action')[2];
	    $(link).on('click', function() {
			   self._removeAction();
		       });

	    
	    var bodyHtml = '<div class="tabularNetworkBody">'
		+ '<div class="tabularNetworkBodyHead"><ul class="nav nav-pills">'
		+ '<li class="active" id="nodeTab">Nodes</li>'
		+ '<li id="linkTab">Links</li>'
	    //	+ '<li>Action<i class="fa fa-sort-down fa-large pull-right"></i></li>'
		+ '</ul></div>'
		+ '<div class="tabularNetworkBodyContent">'
    		+ '<div class="tabularNetworkBodyNodeTable">'
		+ '<table class="table table-stripped"><thead>'
		+ '<th id="checkAll"><i class="fa fa-square-o fa-large"  style="text-align:center; width:100%"></i></th>'
		+ '<th style="font-size:1.25em;" >Identifier</th>' 
		+ '<th style="font-size:1.25em;">Common name</th>'	
		+ '<th><i class="fa fa-group fa-large"></i></th>' 
		+ '</thead>'    
		+ '<tbody></tbody></table>'
		+ '</div>'
		+ '<div class="tabularNetworkBodyLinkTable" style="display:none">'
		+ '<table class="table table-stripped"><thead><th>Type</th><th>Partner "A"</th><th>Partner "B"</th><th>Data</th></thead>'
		+ '<tbody></tbody></table>'
		+ '</div></div></div>'
		+ '<div class="tabularNetworkFooter">'
		+ '<div class="selectionOperator">'
		+ '<div class="operateLabel">Operate on Selection</div>'
	     //   + '<div class="row-fluid selectionOperator">'
	     //   + '<div class="span12">Operate on Selection</div>'
	//	+ '<div class="span4">'
		+ '<div class="btn-group">'

	     //   + '</div>'
	//	+ '<div class="span4">'
		 //<span style="margin-left:5px">Delete</span>
	//	+ '</div>'
	//        + '<div class="span3">'
		+ '<button class="btn btnHide" type="button">'
	        + '<i class="fa fa-eraser fa-lg"></i>'
		+ '</button>' //<span style="margin-left:5px">Hide</span>
		+ '<button class="btn btnShow" type="button">'
	        + '<i class="fa fa-eye fa-lg"></i>'
		+ '</button>' //<span style="margin-left:5px">Hide</span>
	//	+ '</div>'
		+ '<button class="btn btnCart" type="button">'
		+ '<i class="fa fa-shopping-cart fa-lg"></i>'
		+ '</button>'
		+'<button type="button" class="btn btn-default listMe dropdown-toggle" data-toggle="dropdown">'
		+  '<i class="fa fa-caret-square-o-down fa-lg"></i>'
		+' </button>'
		+  '<ul class="dropdown-menu" role="menu">'
		+    '<li><a class = "btnInv"><i class="fa fa-adjust pull-left"></i>Inverse selection</a></li>'
		+	 '<li class="divider"></li>'
		+    '<li><a class = "btnHuman"><i class="fa fa-male pull-left"></i>Human nodes</a></li>'
		+    '<li><a class = "btnLonely"><i class="fa fa-circle pull-left"></i>Select orphan(s)</a></li>'
		+ ' </ul>'
		 //<span style="margin-left:5px">Add to Cart</span>
		+ '</div>'
		+ '</div>'
		+ '</div>';
	    $(this.target + ' div#tabularLargeWrapper').append(bodyHtml);
	    $(this.target + ' i.helpMe').popover({ 
	    	   html : true,
	    	   placement : 'right', 
			   title : 'For advanced usage see our <a target = "_blank" href = "https://www.youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg" >help</a>', 
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
	    $(this.target + ' a.btnHuman')//this event callback object method in maestro
		.on('click', function(){
			$(self.target).trigger('getCustomNodeSel', { type : "human" });
		});
		$(this.target + ' a.btnLonely')//this event callback object method in maestro
		.on('click', function(){
			$(self.target).trigger('getCustomNodeSel', { type : "orphans" });
		});
		
	    $(this.target + ' a.btnInv')
		.on('click', function(){
			var nodeTable = $(self.maxiSel + ' .tabularNetworkBodyNodeTable');
			$(nodeTable).find('tbody tr').each(function () {
							       self._tickToggle(this);
							   });
			var data = self._getTickedNodes();		 // All is set as clicked seems so
			var nodeList = data.map(function(elem, i, array){
					
						    return elem.extID;
						});	
			$(self.target).trigger("tickToggle", { nodeNameList : nodeList });		
		    });
	    
	     $(this.target + ' button.btnHide')
		.tooltip({ placement : 'bottom', 
			   title : 'Hide the current node selection from network', 
			   container : 'body'})
		.on('click', function(){
			var data = self._getTickedNodes();		
			var nodeList = data.map(function(elem, i, array){
						    return elem.extID;
						});
			$(self.target).trigger('nodeHideTabularAction', { nodeNameList : nodeList });
		    });
	     $(this.target + ' button.btnShow')
		.tooltip({ placement : 'bottom', 
			   title : 'Show the current node selection', 
			   container : 'body'})
		.on('click', function(){
			var data = self._getTickedNodes();
//			console.log(data);
			var nodeList = data.map(function(elem, i, array){
						    return elem.extID;
						});
			$(self.target).trigger('nodeShowTabularAction', { nodeNameList : nodeList });
		    });
	    $(this.target + ' button.btnCart')
		.tooltip({placement:'bottom', title:'Add the current node selection to the cart', container : 'body'})
		.on('click', function(){
			var t_nodes = self._getTickedNodes();
			var array =  t_nodes.map(function(elem, i, array){
						    return {
							type : "biomolecule",
							name : elem.extID
						    };
						});
			
			console.dir(array);
			self.callback.addCriterion(array);
		    });

            $(this.maxiSel).css({'min-width' : this.width, 'max-width' : this.width});    
    	    
	    if (this.draggable) {
//		console.log("setting as draggable");
		$(this.target + ' #tabularLargeWrapper').drags({handle : ".tabularNetworkHeader"});
	    }
    
	  
	    if (this.size === "magnified") { 
		$(this.miniSel + ' #tabularBookmarkWrapper,.tabularNetworkBodyLinkTable ').hide();	    
		$(this.maxiSel + ' :not(#tabularBookmarkWrapper,.dropdown-toggle,.dropdown-menu)').show();	    
	    } else {
		$(this.maxiSel + ' :not(#tabularBookmarkWrapper,.dropdown-toggle,.dropdown-menu )').hide();
		$(this.miniSel + ' #tabularBookmarkWrapper:not(.dropdown-toggle,.dropdown-menu)').show();	 
		$(this.miniSel + ' #tabularBookmarkWrapper *').show();
	    }    
	    
       
	    $(this.maxiSel + ' .tabularNetworkBodyContent').css({"min-height" : "335px"});
	    
	    $(this.maxiSel).on('nodeScroll', function (event, param1) { 
				  if (self.size === "minified")
				      return;
				  self.scrollFocus({type : "node", name : param1.name});				  
			      });

	    $(this.maxiSel).on('add', function (event, param1) {
				   self.add(param1);
			       });
	    $(this.maxiSel).on('dataFecthDone', function (event) {
				   self._removeIdle();
				   if(self.activePanel === "link")
				       self.toggleToLinkTab();
			       });

	    $(this.target + ' #tabularBookmarkWrapper')
		.on('click', function () {self.magnify();});
	    $(this.target + ' .tabularNetworkHeader i.fa.fa-minus-square-o')
		.on('click', function () {self.minify();});	    
	    
	    $(this.target + ' #nodeTab').on('click', function () {
						self._toggleToNodeTab();						     
					    });
	    $(this.target + ' #linkTab').on('click', function () {
						self._toggleToLinkTab();
					    });	    
	    
	    /* Set check behaviour */
	    var nodeTable = $(this.maxiSel + ' .tabularNetworkBodyNodeTable');
	    $(nodeTable).find('th#checkAll').first()
		.on('click', function(){
			var setState = $(this).find('i').first().hasClass('fa-check-square-o') ? 'uncheck' : 'check';
			
			$(nodeTable).find('tbody tr').each(function () {
							 self._tickToggle(this, {setTo : setState});
						     });			    
			$(this).find('i').toggleClass('fa fa-check-square-o').toggleClass('fa fa-square-o');			


			//var data = [];
			var data = self._getTickedNodes();		
			var nodeList = data.map(function(elem, i, array){
						    return elem.extID;
						});
			$(self.target).trigger("tickToggle", {  nodeNameList : nodeList });			
		    })
		.on('mouseover', function() { 
		//	$(this).toggleClass('fa-large').toggleClass('fa-2x');
		    })
		.on('mouseout', function() { 
		//	$(this).toggleClass('fa-2x').toggleClass('fa-large');
		    });
	    
	    if (this.size === "magnified")
		this._toggleToNodeTab();  

	    if (opt) {
		if (opt.tooltipContent)
		    $(this.miniSel).tooltip(opt.tooltipContent);
	    }

//	    console.log("tabular component drawn");
	},
	getSelector : function (opt) {
	    if (opt)
		if(opt === "maxi")
		    return this.maxiSel;
	    
	    return null;
	},
	minify : function () {	  
	    this.size = "minified";
	    $(this.target + ' #tabularLargeWrapper:not(.dropdown-toggle,.dropdown-menu )').hide();
//	    $(this.target + ' #tabularBookmarkWrapper:not(.dropdown-toggle,.dropdown-menu)').show();	 
	    $(this.target + ' #tabularBookmarkWrapper').show();
	},
	magnify : function () {
	    
	    this.size = "magnified";
	    $(this.target + ' #tabularBookmarkWrapper').hide();	    
		
	    var string = '.tabularNetworkBodyLinkTable';
	    if (this.activePanel === "link")
		string = '.tabularNetworkBodyNodeTable';

	  
	    $(this.target + ' #tabularLargeWrapper')
		.find('*').filter(function() { 
				      if ($(this).hasClass('dropdown-menu')) return false;
				      if ($(this).hasClass('dropdown-toggle')) return false;
				      if ($(this).hasClass(string)) return false;								
				      return true;								
				  }).show();
	    $(this.target).find(' #tabularLargeWrapper').show();

	    var maxiSel = this.target + ' #tabularLargeWrapper';
	    var xOffset = $(this.maxiSel).css("left");
	   
	    if(!xOffset)
		$(this.maxiSel).css({ left : '50px'});
	    else if(xOffset === "auto")
	    $(this.maxiSel).css({ left : '150px'});

	    if (this.activePanel === "link")
	    	this._toggleToLinkTab();
	    else
		this._toggleToNodeTab();
		
		if(this.nodeBuffer){
		    this.tickNodes(this.nodeBuffer);
		    this.nodeBuffer = null;
		}
			    
	},
	_getNeighbourNodes : function (nodeName) {
	    var list = [nodeName];
	    this.nodeRawData[nodeName].linkStore.forEach(
		function (linkCore){		    
		    if (linkCore.role === "source") {
			list.push(linkCore.linkRef.target.name);
		    } else {
			list.push(linkCore.linkRef.source.name);
		    }
		});	  
	    return list;
	},

	tickNeighbourNodes : function (nodeName){
	    var self = this;	    
	    if (!this.nodeDT) {
		return []; 
	    }	
	    /* Call internal to component */
	    var list = self._getNeighbourNodes(nodeName);
	    list.forEach(function(name){
			     self._tickToggle(name, {setTo : 'check'});			     
			 });
	    return list;
	},
	tickNodes : function (data) { // External CALL!!
	    var self = this;
	    if (!this.nodeDT && data.data.length > 0) { 
	    	this.nodeBuffer = data;
		return; 
	    }	    
	    /* receive the d3 data array, untick all, tick rows of glowy nodes set main Ticker accordingly*/
	    // When nodeDT is not contructed we skip the ticcking procedure
	    // we could store the tickstatus in nodeRawData
	    
	    var setState = data.setToGlow ? 'check' : 'uncheck';
	    
	    /* Empty datum list means all network*/
	    if (data.data.length == 0) {	
		$(this.target + ' .tabularNetworkBodyNodeTable tbody tr')
		    .each(function() {
			      self._tickToggle(this,{setTo : setState});
			  });		
		return;
	    }
	    for (var i = 0; i <  data.data.length; i++) {
		var datum = typeof data.data[i] == 'string' 
			? { name : data.data[i] }
			: data.data[i];
//	 	var nRow = self._get({type : 'nodeIndex', name : datum.name});
		self._tickToggle(datum.name, {setTo : setState});
	    }
	    
	},
	// Protection on ':' in case of string passed as selector should be more carefully applied 
	_tickToggle : function (element, opt) {
	    var iconElement;	   
	    // guess context
	    if (typeOf (element) === 'number') {
		var n = element + 1;
		iconElement = $(this.target + ' .tabularNetworkBodyNodeTable tr:nth-child(' + n + ') i')[0];		
	    } else if ($(element).is("tr")) {
		iconElement = $(element).find('td:nth-child(1) i')[0];
	    } else if ($(element).is("i")) {		
		iconElement = element;
	    } else if (typeOf(element) === 'string') {		 	     
		var string = element.replace(":", "\\:");		
		iconElement = $(this.target + ' .tabularNetworkBodyNodeTable tr[extID=' + string + '] i')[0];
	    } 
	    if (!iconElement) { 
		console.log("input element does not allow for tick assignement");
		console.log(element);		
		return;
	    }
	
	    // opt-Force tick state
	    if (opt) {
		if(opt.hasOwnProperty('setTo')) {
		    if (opt['setTo'] === 'check') {			
			$(iconElement).removeClass().addClass('fa fa-check-square-o');//.addClass('fa-large');
			return;
		    } else {
			$(iconElement).removeClass().addClass('fa fa-square-o');//.addClass('fa-large');
			return;			
		    }
		    console.log("missing setTo property");
		}
	    }
	    
	    // classic toggling
	    $(iconElement).toggleClass('fa fa-square-o').toggleClass('fa fa-check-square-o');
	    

	    return;
	},
	_getTickedNodes : function (opt) { //    {type: "biomolecule", name: "P98063"};
	    var self = this;
	    var tArray = [];

	    $(self.maxiSel + ' .tabularNetworkBodyContent td i.fa.fa-check-square-o')
		.each(function () {
			  $(this).parents('tr')
			      .each(function(){
					var n = $(this).attr('extID');				
					tArray.push({
							asRawData : self.nodeRawData[n] , 
							asTD : this,
							extID : n 
						    });					
					if (opt)
					    if (opt === "delete")
						self.nodeDT.fnDeleteRow(this);					    
				    });
		      });
	    
	    return tArray;
	},
	/*DT is unable to correctly styled a display none table thead are missaligned
	 * node and link tables are filled but datatable is not called
	 * later, first time we display each tab, datatable is called   
	 * */
	_toggleToLinkTab : function () {
	    var self = this;
//	    console.log("toggling to link tab");
	    this.activePanel = "link";
	    
	    // inactivate the add to cart operator
	    var link = $(this.target + ' .tabularNetworkHeader li.action')[0];
	    $(link).hide();
	    $(this.target + ' #nodeTab').removeClass('active');
	    $(this.target + ' #linkTab').addClass('active');
	    
	    $(this.target + ' .tabularNetworkBodyNodeTable').hide();
	    $(this.target + ' .tabularNetworkBodyLinkTable').show();
	    $(this.target + ' .selectionOperator').hide();
	    
	    
	    
	    
	    /*if (!this.linkTabIsReady) {			    
		this._showIdle();
		return;
	    }*/
	   	   
	    if (!this.linkDT) 
		this._createLinkTable();
		//alert("unni");
	    
	
	},
	_toggleToNodeTab : function () {
	    var self = this;
	  //  console.log("toggling to node tab");
	    this.activePanel = "node";
	    	    	   
	    $(this.target + ' #linkTab').removeClass('active');
	    $(this.target + ' #nodeTab').addClass('active');					     
	    $(this.target + ' .tabularNetworkBodyLinkTable').hide();
	    $(this.target + ' .tabularNetworkBodyNodeTable').show();
	    $(this.target + ' .selectionOperator').show();

	    if (!this.nodeDT) 
		this._createNodeTable();
	    
	},	
	_displayWaitMsg : function () {
	},
	_destroyWaitMsg : function () {
	 },
	_generateHyperLink : function(string) {
	    var mapper = {
		uniprot : {
		    patt : /^[A-N,R-Z]{1}[0-9]{1}[A-Z]{1}[A-Z,0-9]{1}[A-Z,0-9]{1}[0-9]{1}(-[\d]+){0,1}/,
		    prefix : "http://www.uniprot.org/uniprot/"
		},
		chebi : {
		    patt : /^CHEBI/,
		    prefix : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId="
		},
		trembl : {
		    patt : /^[O,P,Q]{1}[0-9]{1}[A-Z,0-9]{1}[A-Z,0-9]{1}[A-Z,0-9]{1}[0-9](-[\d]+){0,1}/,
		    prefix : "http://www.uniprot.org/uniprot/"
		},
		ebiRef : {
		    patt : /^EBI-/,
		    prefix : "http://www.ebi.ac.uk/intact/pages/interactions/interactions.xhtml?query="
		},
		matrixdb : {
		    patt : /^(MULT|PFRAG)/,
		    prefix : 'www.something.org'
		    
		}				
	    };
	    
	  for (var key in mapper) {
	      if (mapper[key].patt.test(string))
		  return '<a target="_blank" href="' +  mapper[key].prefix + string + '">' + string + '</a>';	      
	  }  	    
	    console.log('Error : unable to generate hyperlink for string "' + string + '"');

	    return string;
	},
	setNeighbourhoods : function () {
	for (var id in this.nodeRawData) {
			var string = this.nodeRawData[id].name;
			var neighbours = this._getNeighbourNodes(string);
			var name = string.replace(":", "\\:");	
			selector = this.target + 
			    ' .tabularNetworkBodyNodeTable .dataTables_scrollBody tbody tr[extID=' 
		    	+ name + '] td:nth-child(4) a';
			$(selector).text(neighbours.length);
		} 
	},	
	addNode : function (data) { // append node list to current content
	    var self = this;
	    //this._displayWaitMsg();
	    var nodeData = data.nodeData;
	    for (var i = 0; i < nodeData.length; i++) {
		if (this.nodeRawData[nodeData[i].name])
		    continue;
		this.nodeRawData[nodeData[i].name] = nodeData[i];
		var urlAccessor = nodeData[i].aceAccessor 
		    ? nodeData[i].aceAccessor 
		    : nodeData[i].name;
		var name = '<a href="' + self.staticHref + '/cgi-bin/current/newPort?type=biomolecule&value='
		    + urlAccessor + '" target="_blank">' + nodeData[i].name + '</a>';
		var common = function() { 
		    var comments;
		    if (nodeData[i].biofunc) {
			    comments = nodeData[i].biofunc;
		    } else if (nodeData[i].comments) {
			comments = nodeData[i].comments.data[0];
		    } else {
			comments = nodeData[i].common.anyNames.join(',');
		    }
		    return '<span href="#" rel="tooltip" data-title="<h2>' 
			+ nodeData[i].name +   '</h2>' + comments
			+ '" data-html="true" data-placement="left" data-container="body">' 
			+ nodeData[i].common.anyNames[0] + '</span>'; }();		
		//var biofunc = nodeData[i].biofunc ? function() { 
		//    return '<span href="#" rel="tooltip" title="' + nodeData[i].biofunc +   '" data-placement="left" data-container="body">' + nodeData[i].biofunc + '</span>'; }() : " ";
//		var centrality = nodeData[i].betweenness;	
		var neighbourhoodList = self._getNeighbourNodes(nodeData[i].name);	
		var tmp = neighbourhoodList.length - 1 > 0 ? neighbourhoodList.length - 1 : 0;
		self.nodeTableData.push(['<i class="fa fa-square-o fa-large" style="text-align:center; width:100%"></i>', name, common, '<a style="cursor:pointer;font-size:1.1em;">' + tmp.toString() + '</a>']);			
	    }	  	   	   
        },
	unFocus : function () {	 
	    //console.log('unfocus');
	    $(this.target +  ' tr td.rowFocusOdd').removeClass('rowFocusOdd'); 
	    $(this.target +  ' tr td.rowFocusEven').removeClass('rowFocusEven'); 

	},
	togglePanel : function () {
	    // var new = $('#' + this.target + )
	    /* BE CAREFULL in prod stage, passed objects could be reference to node object */
	},
	add : function (data) {
	    this.addNode(data);
	    this.addLink(data);
	    /* Displaying new nodes tab by default */
	    this.clearDataTables();
	    if (this.size === "magnified")
		this._toggleToNodeTab();  
	    // here refresh ticked selection
	   $(this.target).trigger('refreshTickForTabular');
	},
	_createLinkTable : function () {
	    var self = this;
//	    console.log("create link table for " + self.linkTableData.length + " elements");
//	    console.dir(self.linkTableData);
	    this.linkDT = $(this.target + ' .tabularNetworkBodyLinkTable table')
		.dataTable({
			       aaData : self.linkTableData,
			       aaSorting: [], 
			       bDeferRender : true, // useless when using fnAddData
			       sDom : "tS",
			       "iDisplayLength": -1,
			       "sScrollY": "300px",
			       "fnDrawCallback": function( oSettings ) {},			       
			       "fnInitComplete": function( oSettings ) {
//				   console.log("fnComplete");
			       	   this.$('tr').each(function(){ // Warning aaSorting is mandatory, otherwise row order differ
							 var id = $(this).find('td:nth-child(2)').text();
							 id += "--" + $(this).find('td:nth-child(3)').text();
	//						 console.log("looking for " + id);
							 $(this).attr('extID', id)
							     .addClass('s_'+ self.linkRawData[id].source.name)
							     .addClass('t_'+ self.linkRawData[id].target.name);
						     });
			       }			       				   
			   });
	    $(this.target + ' .tabularNetworkBodyLinkTable')
		.tooltip({selector: "span[rel=tooltip]"});

//	    console.dir(this.linkDT);
	    
	},
	_createNodeTable : function () {
	    var self = this;
//	    console.log("create node table for " + self.nodeTableData.length + " elements");
	    this.nodeDT = $(this.target + ' .tabularNetworkBodyNodeTable table')
		.dataTable({
			       aaData : self.nodeTableData,
			       aoColumnDefs : [
				   { bSortable : false, "aTargets": [ 0 ] }
			       ], 
			       bDeferRender : true, // useless when using fnAddData
			       sDom : "tS",
			       "iDisplayLength": -1,
			       "sScrollY": "300px",
			       "fnDrawCallback": function( oSettings ) {},			       
			       "fnInitComplete": function( oSettings ) {					   				 
			       	   this.$('tr')
				       .each(
					   function(){
					       var nodeName = $(this).find('td:nth-child(2) a').text();
					       $(this).attr('extID', nodeName);
					       $(this)
						   .on('mouseenter',function (event){
							   $(self.target).trigger('nodeRowMouseOver', {name : nodeName}); 					   
						       });
					       
					       var parent = $(this).get()[0];	
					       //console.dir(parent);
					       parent
						   .addEventListener('mouseout',
								     makeMouseOutFn(parent, function(){
											$(self.target).trigger('nodeRowMouseOut', {name : nodeName});
										    }),true);
					      
					       $(this).find('td:nth-child(4)').each(
						   function(){
						       $(this).on('mouseenter',function(event){
								      $(self.target).trigger('neighbourhoodCellMouseOver', {name : nodeName}); 
								  });
						       var Sparent = $(this).get()[0];	
						       Sparent
							   .addEventListener('mouseout',
									     makeMouseOutFn(Sparent, function(){
												$(self.target).trigger('neighbourhoodCellMouseOut', {name : nodeName});
											    }),true);
						  })
	.on('click', function(){
			var nodeList = self.tickNeighbourNodes(nodeName);
			$(self.target).trigger("tickToggle", {  nodeNameList : nodeList });
			});
					   });
			       }
			   });
	    $(this.target + ' .tabularNetworkBodyContent table td:nth-child(1) i')
		.on('click', function (){
			var setStatus = $(this).hasClass('fa fa-square-o') 
			    ? 'check' : 'uncheck';
			self._tickToggle(this, { setTo : setStatus });
			var data = self._getTickedNodes();		
			var nodeList = data.map(function(elem, i, array){
						    return elem.extID;
						});
			$(self.target).trigger("tickToggle", { nodeNameList : nodeList });
		    });	    
	},	
	clearDataTables : function () {	    
	    if (this.nodeDT)
		$(this.nodeDT).dataTable().fnDestroy();
	    this.nodeDT = null;
	    if (this.linkDT)		
		$(this.linkDT).dataTable().fnDestroy();
	    this.linkDT = null;
	},
	/*
	 * 
	 *  Because link data may be fetched from ajax call at undertimed timers
	 *  we check for link data element which is a reference to networkCore link element 
	 *  depending on the data attached to it to it we inform the user that we ahve to wait or
	 *  not for the data to be fetched
	 * 
	 */
        addLink : function (data) { // append new link to current content
	    var self = this;
	    var linkData = data.linksData;
	    for (var i = 0; i < linkData.length; i++) {
		//console.log("Creating link");
		self._processLinkDatum (linkData[i]);		
            }		    	  
	},
	/*
	 * Alter the row of a link	  
	 */
	touchLink : function (linkDatum) {
	    var self = this;

	    var sNode = linkDatum.source,
	    tNode = linkDatum.target;
//	    console.log("Touching link");
	    this._processLinkDatum(linkDatum);
	    if(this.linkDT) {	
		var target = tNode.name.replace(":", "\\:"),
		source = sNode.name.replace(":", "\\:");
//		console.log(target);
//		console.log(source);
		//var sel = this.linkDT.$('tr.t_' + target + '.s_' + source);
		var oTable = $(this.linkDT).DataTable();
		    oTable.$('tr[extID=' + source + '--' + target + ']')
		    .each(function(){ 
			      $(this).find('td:nth-child(1)').html(function(){
								       var content = self._getTypeHtmlTag(linkDatum);
								       return content;
								   });
			      $(this).find('td:nth-child(4)').html(function (){
								       var content = self._getExpAssoCellHtmlTag(linkDatum);
								       return content;
								   });
			      //var val = oTable.rows( this ).indexes();
//			      console.log("ABLE TO TOUCH AT");
//			      console.log(linkDatum);
			 //     oTable.cell( 0, 0 ).data( 'U' ).draw();
			  //    var tdElem = 
			   //   var cell = table.cell( this );
			      
			  });
	    }
	},
	_getTypeHtmlTag : function (linkDatum) {
	    if (! getPropByKey(linkDatum, 'details')) { // Error
		console.log("Error abnormal link object at");
		console.dir(linkDatum);
		return '<i clas ="fa fa-exclamation"></i>';
	    }
	    if (linkDatum.details.Experiments.length == 0) { // loader, wait
		return '<i class="fa fa-spinner fa-spin fa-large"></i>';
	    }
	    
	    return linkDatum.details.knowledge === "Genuine" //inferred, genuine status
		? '<img src="' + this.staticHref + '/img/genuine_bullet.png"></img>'
		: '<img src="' + this.staticHref + '/img/inferred_bullet.png"></img>';
	},
	_getExpAssoCellHtmlTag : function (linkDatum) {
	    var n = linkDatum.details.Experiments.length;
	  if ( n === 0) {
	      return '<i class="fa fa-spinner fa-spin fa-large"></i>';
	  }
	    return '<a href="' + this.staticHref + 
		'/cgi-bin/current/newPort?type=association&value=' 
		+ linkDatum.details.name + '" target="_blank">' + n + '</a>';
	    // Generates assoc link bind it to experiment nu=ber
	},
	_processLinkDatum : function (linkDatum) { 	//register link OR try to alter linkTableData
	    /* 
	 *    console.log("link processing");
	 console.dir(linkDatum);
	 */
	    /* Referencing the link */
	    var linkStringID = linkDatum.source.name + '--' +  linkDatum.target.name;
	//    console.log(linkStringID);
	    if (! this.linkRawData[linkStringID]) {   // then we may have to fnAddData instead of redraw ?
		this.linkRawData[linkStringID] = linkDatum;		
		this.linkTableData.push([]);  
		this.linkTableDataIndex[linkStringID] = this.linkTableData.length - 1;
		// copies value arghh 
		// push object into linkTableData
		// try this one ----> store index
	    }
	    var sNode = linkDatum.source,
	    tNode = linkDatum.target;
	    var tdTypeHtmlTag = this._getTypeHtmlTag(linkDatum);
 	    var tdExpNumAssocLink = this._getExpAssoCellHtmlTag(linkDatum);
	    this.linkTableData[this.linkTableDataIndex[linkStringID]] = [tdTypeHtmlTag, sNode.name, tNode.name, tdExpNumAssocLink];
	    return;	    
	},	
	highlight : function () {
	    
	},
	/*,
	_get : function (data) {
	    if (data.type === "node") {
		if ('name' in data) return this.nodeRawData[data.name];		
	    }
	    if (data.type === 'nodeIndex') {
		if ('name' in data) {
		    return this.nodeIndex[data.name];
		}
	    }
	    if (data.type === 'nodeIndex') {
		if ('name' in data) {
		    return this.nodeIndex[data.name];
		}
	    }	  
	    return null;
	},*/
	scrollFocus : function (data) {
	    var self = this;
	    self.unFocus();
	    var idRow;
	    var selector, scroller;
	    if (data.type === 'node') {
		var string = new String(data.name);
		var name = string.replace(":", "\\:");	
		selector = this.target + 
		    ' .tabularNetworkBodyNodeTable .dataTables_scrollBody tbody tr[extID=' 
		    + name + ']';
		scroller = $(this.nodeDT.dataTable().fnSettings().nTable.parentNode);
	    }
	    else if (data.type === 'link') {
		if (!this.linkDT) {
		    console.log("attempting to scroll on link failed, maybe you have not called datatable for this tab yet?");
		    return;
		}
	/*	var sName = data.name.replace(':','\:');  DO IT LATER
		var tName = data.name.replace(':','\:');*/
		idRow = data.sourceID + "_" + data.targetID;
		selector = this.target + ' .tabularNetworkBodyLinkTable .dataTables_scrollBody tbody tr[extID=' +idRow + ']';
		scroller = $(this.linkDT.dataTable().fnSettings().nTable.parentNode);
		//console.log("selector is " + selector);
		if($(selector).length == 0) {
		    console.log("Could not find row number in link tab for following object");
		    console.dir(data);
		    return;
		}
	    }
	    var scrollTo = $(selector);
	    $(scroller)
		.animate({
			     scrollTop: scrollTo.offset().top - scroller.offset().top + scroller.scrollTop()},
			 {
			     complete : function () {
//				 console.log(this);  // this is dataTAble_scrollBody we want the tr
		//		 console.log($(this).offset());
				 /*$(self.target +  ' .tabularNetworkBodyContent .dataTables_scrollBody')
				     .on('click', function () {
					     self.unFocus();
					 });*/
	//			console.log(selector);
	        		 $(selector + ' td').addClass(function(){
							 return $(this).hasClass('odd')
							      ? "rowFocusOdd" 
							      : "rowFocusEven"; 
						      });
			     },
			     start : function() {
				 self.unFocus();
			     }
			 });	 
	},
	_removeAction : function () {
	    /*link DT may not be constructed yet so we check the rawData array and splice it accordingly 
	     * implementaion could be better  
	     * */
	    var self = this;
	    
	    var tickObj = self._getTickedNodes("delete");
	    var nodeNameListToDelete = [];
	    var rawIndex = [];
	    
	    for (var i = 0; i < tickObj.length ; i++) {
		nodeNameListToDelete.push(tickObj[i].asRawData.name);	

		for (var j = 0; j < self.linkRawData.length; j++) {
		    var iTarget = self.linkRawData[j].target,
			iSource = self.linkRawData[j].source;
		    
		    if (self.nodeRawData[iTarget].name === tickObj[i].asRawData.name || 
			self.nodeRawData[iSource].name === tickObj[i].asRawData.name )
 			rawIndex.push(j);					       
		}		    		    
	    }

	    /* We cant simply redraw table, it messes the header styling ...*/
	    if (self.linkDT) {		    		
		if (self.activePanel != "link") {					    
		    self.linkDT.fnDestroy();
		    self.linkDT = null;
		} else {			    			
		    self.linkDT.$('tr.s_' + tickObj[i].extID + ',tr.t_' + tickObj[i].extID)
			.each(function(){
				  var out = self.linkDT.fnDeleteRow(this);			      
			      });
		}		    
		
	    }
	    // console.dir(rawIndex);
	    rawIndex.reverse();
	    rawIndex.forEach(function(elem) {
//				 console.log("splicing out element " + elem);
				 self.linkRawData.splice(elem,1);
				 self.linkTableData.splice(elem,1);
			     });
	    
	    self.callback.deleteNode(nodeNameListToDelete);	    	    
	},
	setWait : function (opt) {
	    if(opt.hasOwnProperty('nodeTab'))
		this.nodeTabIsReady = opt.nodeTab === "wait" ? false : true;
	    if(opt.hasOwnProperty('linkTab'))
		this.linkTabIsReady = opt.nodeTab === "wait" ? false : true;
	},
	_showIdle : function() {
	    /* Show wait div as son of current body */
	    var html = '<div class="tabularBlocker"><img src="../data/psq_smallball_loader.gif"></img>'
		+      'Please Wait</div>';
	    $(this.maxiSel + ' .tabularNetworkBodyContent').append(html);
	},
	_removeIdle : function () {
	    $(this.maxiSel + ' .tabularBlocker').remove();
	},
    getSelectors : function(){
    	return {maxi : this.maxiSel, mini: this.miniSel};
    }	
    };        

}