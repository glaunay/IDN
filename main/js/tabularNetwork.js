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
	computeBookmarkPosition : opt.computeBookmarkPosition,
	positionSettings: positionSettings,
	callback : opt.callback,
	width : width,
	target : opt.target, 
	draggable : draggable,
	size : size,	
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
	draw : function () {
	    var self = this;
	    $(this.target).append('<div id="tabularLargeWrapper"></div>'
				  + '<div id="tabularBookmarkWrapper"><i class="fa fa-list-alt fa-4x"></i></div>');
	    var headerHtml = '<div class="tabularNetworkHeader">'
		+ '<i class="fa fa-minus-square-o fa-3x pull-left"></i>'
		+ '<div class="btn-group pull-right actionTrigger">'
		+ '<a class="btn dropdown-toggle operatorToggler" data-toggle="dropdown" href="#">'
		+ '<span class="fa fa-caret-down fa-large"></span></a>'
		+ '<ul class="dropdown-menu" id="operator" role="menu">'
    		+ '<li><h6>Operate on Selection</h6></li>'
		+ '<li class="divider"></li>'
		+ '<li class="action"><a href="#"><i class="fa-fixed-width fa fa-shopping-cart"></i>Add to search</a></li>'
		+ '<li class="action"><a href="#"><i class="fa-fixed-width fa fa-eraser"></i>Clear</a></li>'
		+ '<li class="action"><a href="#"><i class="fa-fixed-width fa fa-ban-circle"></i> Delete </a></li>'
		+ '</ul>'
		+ '</div>'
		+ '</div>';
	    
	    $(this.target + ' div#tabularLargeWrapper').append(headerHtml);
	    
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
		+ '<table  class="table table-stripped"><thead><th id="checkAll"><i class="fa fa-check fa-large"></i></th><th>Name</th><th>Common name</th><th>Comments</th><th><i class="fa fa-certificate"></i></th></thead>'    
		+ '<tbody></tbody></table>'
		+ '</div>'
		+ '<div class="tabularNetworkBodyLinkTable" style="display:none">'
		+ '<table class="table table-stripped"><thead><th>type</th><th>partner "A"</th><th>partner "B"</th><th>Data</th></thead>'
		+ '<tbody></tbody></table>'
		+ '</div></div></div>'
		+ '<div class="tabularNetworkFooter"></div>';
	    $(this.target + ' div#tabularLargeWrapper').append(bodyHtml);
    
	    
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
				  console.log("hophohp");
				  if (self.size === "minified")
				      return;
				  self.scrollFocus({type : "node", name : param1.name});				  
			      });

	    $(this.maxiSel).on('add', function (event, param1) {
				   self.add(param1);
			       });
	    $(this.maxiSel).on('dataFecthDone', function (event) {
				   self._removeIdle();
				   if(self.activePanel === "linkf")
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
			
			var setState = $(this).find('i').first().hasClass('fa fa-check') ? 'check' : 'uncheck';
			$(nodeTable).find('tr').each(function () {
							 self._tickToggle(this, {setTo : setState});
						     });			    
			$(this).find('i').toggleClass('fa fa-check').toggleClass('fa fa-check-empty');			
		    })
		.on('mouseover', function() { 
			$(this).toggleClass('fa-large').toggleClass('fa-2x');
		    })
		.on('mouseout', function() { 
			$(this).toggleClass('fa-2x').toggleClass('fa-large');
		    });
	    
	    if (this.size === "magnified")
		this._toggleToNodeTab();  

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
	},
	tickNodes : function (data) { 
	    /* receive the d3 data array, untick all, tick rows of glowy nodes set main Ticker accordingly*/
	    // When nodeDT is not contructed we skip the ticcking procedure
	    // we could store the tickstatus in nodeRawData
	    var self = this;	    
	    
	    var setState = data.setToGlow ? 'check' : 'uncheck';
	    
	    if (!this.nodeDT) {
		return; 
	    }
	    
	    /* Empty datum list means all network*/
	    if (data.data.length == 0) {	
		$(this.target + ' .tabularNetworkBodyNodeTable tbody tr')
		    .each(function() {
			      self._tickToggle(this,{setTo : setState});
			  });		
		return;
	    }
	    
	    for (var i = 0; i <  data.data.length; i++) {
		var datum = data.data[i];
//	 	var nRow = self._get({type : 'nodeIndex', name : datum.name});
		self._tickToggle(datum.name, {setTo : setState});
	    }
	    
	},
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
		iconElement = $(this.target + ' .tabularNetworkBodyNodeTable tr[extID=' + element + '] i')[0];
		console.log("got string" + element);
		console.dir(iconElement);
	    } 
	    if (!iconElement) { 
		alert("input element does not allow for tick assignement");
		console.dir(element);		
		return;
	    }
	    //console.dir(iconElement);
	    //console.dir(opt);
	    
	    // opt-Force tick state
	    if (opt) {
		if(opt.hasOwnProperty('setTo')) {
		    if (opt['setTo'] === 'check') {			
			$(iconElement).removeClass().addClass('fa fa-check').addClass('fa-large');
			return;
		    } else {
			$(iconElement).removeClass().addClass('fa fa-check-empty').addClass('fa-large');
			return;			
		    }
		    alert("missing setTo property");
		}
	    }
	    
	    // classic toggling
	    $(iconElement).toggleClass('fa fa-check-empty').toggleClass('fa fa-check');
	    
	    return;
	},
	_getTickedNodes : function (opt) { //    {type: "biomolecule", name: "P98063"};
	    var self = this;
	    var tArray = [];

	    $(self.maxiSel + ' .tabularNetworkBodyContent td i.fa.fa-check')
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
	    	    
	    // activate the add to cart operator
	    var link = $(this.target + ' .tabularNetworkHeader li.action')[0];
	    $(link).show();
	    $(this.target + ' #linkTab').removeClass('active');
	    $(this.target + ' #nodeTab').addClass('active');					     
	    $(this.target + ' .tabularNetworkBodyLinkTable').hide();
	    $(this.target + ' .tabularNetworkBodyNodeTable').show();
	    
	    /*
	     *    if (!this.linkTabIsReady) {			    
	     this._showIdle();
	     return;
	     }
	     */ 
	    
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
	addNode : function (data) { // append node list to current content
	    var self = this;
	    
	    //this._displayWaitMsg();
	    var nodeData = data.nodeData;
            //console.dir(data);
	    for (var i = 0; i < nodeData.length; i++) {
		if (this.nodeRawData[nodeData[i].name])
		    continue;
		this.nodeRawData[nodeData[i].name] = nodeData[i];		
		var name = this._generateHyperLink(nodeData[i].name);	
		var common = nodeData[i].common ? function() { 
		    return '<span href="#" rel="tooltip" title="' + nodeData[i].common +   '" data-placement="left" data-container="body">' + nodeData[i].common + '</span>'; }() : " ";		
		var biofunc = nodeData[i].biofunc ? function() { 
		    return '<span href="#" rel="tooltip" title="' + nodeData[i].biofunc +   '" data-placement="left" data-container="body">' + nodeData[i].biofunc + '</span>'; }() : " ";
		var centrality = '<a href="cgi-bin/report?name=' + nodeData[i].name  + '" target="_blank">' + nodeData[i].betweenness + '</a>';	
		self.nodeTableData.push(['<i class="fa fa-check-empty fa-large">', name, common, biofunc, centrality]);			
	    }	  	   	   
        },
	unFocus : function () {	 
	    //console.log('unfocus');
	    $(this.target +  ' tr.rowFocus').removeClass('rowFocus'); 
	},
	togglePanel : function () {
	    // var new = $('#' + this.target + )
	    /* BE CAREFULL in prod stage, passed objects could be reference to node object */
	},
	add : function (data) {
	//    console.log("Adding elements");
	    this.addNode(data);
	 //   console.log("node added");
	    this.addLink(data);
	 //   console.log("link added");
	    /* Displaying new nodes tab by default */
	    this.clearDataTables();
	    if (this.size === "magnified")
		this._toggleToNodeTab();  
	},
	_createLinkTable : function () {
	    var self = this;
	    console.log("create link table for " + self.linkTableData.length + " elements");
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
				   console.log("fnComplete");
			       	   this.$('tr').each(function(){ // Warning aaSorting is mandatory, otherwise row order differ
							 var id = $(this).find('td:nth-child(2)').text();
							 id += "--" + $(this).find('td:nth-child(3)').text();
							 console.log("looking for " + id);
							 $(this).attr('extID', id)
							     .addClass('s_'+self.linkRawData[id].source)
							     .addClass('t_'+self.linkRawData[id].target);
						     });
			       }			       				   
			   });
	    $(this.target + ' .tabularNetworkBodyLinkTable')
		.tooltip({selector: "span[rel=tooltip]"});

	    console.dir(this.linkDT);
	    
	},
	_createNodeTable : function () {
	    var self = this;
//	    console.log("create node table for " + self.nodeTableData.length + " elements");
	    this.nodeDT = $(this.target + ' .tabularNetworkBodyNodeTable table')
		.dataTable({
			       aaData : self.nodeTableData,
			       aaSorting: [], 
			       bDeferRender : true, // useless when using fnAddData
			       sDom : "tS",
			       "iDisplayLength": -1,
			       "sScrollY": "300px",
			       "fnDrawCallback": function( oSettings ) {},			       
			       "fnInitComplete": function( oSettings ) {					   
				   var cnt = 0;
			       	   this.$('tr')
				       .each(function(){
						 var nodeName = $(this).find('td:nth-child(2) a').text();
						 $(this).attr('extID', nodeName);
						 $(this)
						     .on('mouseenter',function (event){								   
							     //    console.log("you enter");								    
							     $(self.target).trigger('nodeRowMouseOver', {name : nodeName}); 					   
							 });
						 
						 var parent = $(this).get()[0];	
						 //console.dir(parent);
						 parent
						     .addEventListener('mouseout',
								       makeMouseOutFn(parent, function(){
											  $(self.target).trigger('nodeRowMouseOut', {name : nodeName});
											}),true);
						 cnt++;
			   		     });				  
			       }
			   });
	    $(this.target + ' .tabularNetworkBodyNodeTable')
		.tooltip({ selector: "span[rel=tooltip]"});
	    
 
	    $(this.target + ' .tabularNetworkBodyContent table td:nth-child(1) i')
		.on('click', function (){
			self._tickToggle(this);
			if($(this).hasClass('fa fa-check-empty') ) {
			    var mainIcon = $(self.target + ' .tabularNetworkBodyNodeTable th i')[0];
			    self._tickToggle(mainIcon, { setTo : 'check'});
			}
		    });	    
	},	
	clearDataTables : function () {	    
	    console.log ("clearing datatables");
	    if (this.nodeDT)
		$(this.nodeDT).dataTable().fnDestroy();
	    this.nodeDT = null;
	    if (this.linkDT)		
		$(this.linkDT).dataTable().fnDestroy();
	    this.linkDT = null;
	},
	_createExperimentDetailsCellHtml : function (data) {
	    var dbSource = {
		matrixdb : 0,
		intact : 0,
		others : 0
	    };
	    var detectMethod = {};
	    
	    var htmlTooltip = '<div><div><h6>Source database</h6><ul>';
	    var nExp = 0;
	    if (!data.details) {
		console.log("error current link does not have any detail attribute");
		console.dir(data);
	    } else {
		nExp = data.details.Experiments.length;
		for (var i = 0; i < data.details.Experiments.length; i++) {
		    var expObj = data.details.Experiments[i];
		    
		    //detectMethod.push(expObj.Interaction_Detection_Method);
		    if (dbSource[expObj.source]) 
			dbSource[expObj.source]++;
		    else
			dbSource.others++;
		}	
	    }    
	    for (var key in dbSource) {
		if (dbSource[key] == 0) continue;
		htmlTooltip += "<li>"  + key + ' ' + dbSource[key]  + "</li>";
	    }
	    htmlTooltip += '</ul><h6>Detection Methods</h6><ul>';
	    
	    for (var i = 0; i < detectMethod.length; i++) {
		htmlTooltip += '<li>' +   + '</li>';
	    }
	    
	    htmlTooltip += '</ul></div>';
	    //console.log("<span href=\"#\"  data-container=\"#" + this.target + "\" data-html=\"true\" rel=\"tooltip\" title=\"" +   htmlTooltip + "\">" +  data.details.Experiments.length + "</span>");
	    return "<span href=\"#\"  data-container=\"" + this.target + "\" data-html=\"true\" rel=\"tooltip\" title=\"" +   htmlTooltip + "\">" + nExp + "</span>";
	},
	_createProofTypeCellHtml : function (data) {
	    var gen = 0, inf = 0; 
	    if (!data.details) {
		console.log("error current link does not have any detail attribute");
		console.dir(data);
	    } else {			    
		// console.dir(data);
		for (var i = 0; i < data.details.Experiments.length; i++) {
		    if (! data.details.Experiments[i].knowledgeSupport) {
			console.log("no knwoledge support");
		    }
		    if (data.details.Experiments[i].knowledgeSupport === "actual") gen++;
		    else inf++;
		}
		var icon = "fa fa-smile-o";
		if (gen == 0) icon = 'fa fa-frown-o';
	    }
	    
	    return '<span href="#" data-container="body'
		+ '" data-html="true" rel="tooltip" title="<h6>Knowledge support</h6><ul>' 
		+ '<li>' + gen + ' actual evidences</li><li>' + inf + ' inferred evidences</li>'
		+ '</ul>"><i class="' + icon  + ' fa-large"></i><span>';
	    
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
		self._processLinkDatum (linkData[i]);		
            }		    	  
	},
	/*
	 * Alter the row of a link	  
	 */
	touchLink : function (linkDatum) {
	    var sNode = linkDatum.source,
	    tNode = linkDatum.target;
	    this._processLinkDatum(linkDatum);
	    if(this.linkDT) {	
		
		var target = tNode.name.replace(":", "\\:"),
		source = sNode.name.replace(":", "\\:");
		console.log(target);
		console.log(source);
		var sel = this.linkDT.$('tr.t_' + target + '.s_' + source);
	    }
	},
	_processLinkDatum : function (linkDatum) { 	//register link OR try to alter linkTableData
/*	    console.log("link processing");
	    console.dir(linkDatum);*/
	    /* Referencing the link */
	    
	    var linkStringID = linkDatum.source.name + '--' +  linkDatum.target.name;
	    if (! this.linkRawData[linkStringID]) {   // then we may have to fnAddData instead of redraw ?
		this.linkRawData[linkStringID] = linkDatum;		
		this.linkTableData.push([]);  
		this.linkTableDataIndex[linkStringID] = this.linkTableData.length - 1;
		// copies value arghh 
		// push object into linkTableData
		// try this one ----> store index
	    }

 	    var linkTableDataElem;
	    var sNode = linkDatum.source,
	    tNode = linkDatum.target;
	    
	    if (! getPropByKey(linkDatum, 'details')) {
		console.log("Error abnormal link object at");
		console.dir(linkDatum);
		linkTableDataElem = ['<i clas ="fa fa-exclamation"></i>',sNode.name, tNode.name,0];
	    } else if (linkDatum.details.Experiments.length == 0) {
		linkTableDataElem = ['<i class="fa fa-spinner fa-spin fa-large"></i>',
							sNode.name, tNode.name,0];	
	    } else {
		var tdProofTypeHtml = this._createProofTypeCellHtml(linkDatum);
		var tdExperimentDetailsHtml = this._createExperimentDetailsCellHtml(linkDatum);
		linkTableDataElem = [tdProofTypeHtml, sNode.name, tNode.name, tdExperimentDetailsHtml];
	    }
	    
	    this.linkTableData[this.linkTableDataIndex[linkStringID]] = linkTableDataElem;
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
		console.dir(data);
		var string = new String(data.name);
		var name = string.replace(":", "\\:");	
		selector = this.target + 
		    ' .tabularNetworkBodyNodeTable .dataTables_scrollBody tbody tr[extID=' 
		    + name + ']';
		scroller = $(this.nodeDT.dataTable().fnSettings().nTable.parentNode);
		console.log("ok??");
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
	    console.log("<>" + selector);
	    $(selector).addClass("rowFocus");	  
	    var scrollTo = $(selector);
	    
	    console.log("<><>");
	    $(scroller)
		.animate({
			     scrollTop: scrollTo.offset().top - scroller.offset().top + scroller.scrollTop()},
			 {
			     complete : function () {								
				 $(self.target +  ' .tabularNetworkBodyContent .dataTables_scrollBody')
				     .on('click', function () {
					     self.unFocus();
					 });	        	    
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
				 console.log("splicing out element " + elem);
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
	}

    };        

}