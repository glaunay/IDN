/*
 * A Component to display current search criterion and trigger or set search
 * 
 * 
 */

function testCartController (opt){
    var cart = initCartCtrl (opt);    

    return cart;
}



function initCartCtrl (opt) {
    
    if ( $(opt.target).length == 0) {
	alert ("Unable to find target div " + opt.target);
	return null;
    }
    
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
    
    return {
//	notified : false,
	computeBookmarkPosition : opt.computeBookmarkPosition,
	positionSettings: positionSettings,
	size : size,
	miniSel : null,
	maxiSel : null,
	callback : opt.callback,
	target : opt.target,
	width : width,
	jsScrollApi : null,
	opt : opt,
	criterionList : [],
	defaultCriterionDiv : '<div class="defaultCriterion">No search criterion<span>.</span><span>.</span><span>.</span></div>',
	draw : function () {
	    var self = this;
	    
	    var scaffold = '<div id="cartLargeWrapper"><div class="cartHeader"><i class="fa fa-question-circle pull-right fa-2x helpMe"></i></div>'
		+ '<div class="cartBody"></div>'
		+ '<div class="cartFooter"></div></div>'
		+ '<div id="cartBookmarkWrapper"><i class="fa fa-shopping-cart fa-4x"></i><div class="plusNotification" style="display:none"><i class="fa fa-plus"></i></div></div>';
	    
	    $(this.target).append(scaffold);
	    $(this.target + ' i.helpMe').popover({ 
	    	   html : true,
	    	   placement : 'right', 
			   title : 'For advanced usage see our <a target = "_blank" href = "http://youtube.com" >help</a>', 
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
	    $(this.target + ' #cartLargeWrapper').css({'min-width' : this.width, 'max-width' : this.width});	
	    
	    this.miniSel = this.target + ' div#cartBookmarkWrapper';
	    this.maxiSel = this.target + ' div#cartLargeWrapper';
	    var defaultCss = self.computeBookmarkPosition();	 
	 //   console.log(defaultCss);
	    $(this.miniSel).css(defaultCss);
	    $(this.maxiSel).css(defaultCss);
	    
	    $( window ).resize(function() {
				   var newWindowCss = self.computeBookmarkPosition();	    
				   $(self.miniSel).css(newWindowCss);
			       });
	    
	    if (this.size === "minified")
		$(this.maxiSel).hide();
	    else
		$(this.miniSel).hide();
	 
	    $(this.miniSel).on('click', function (event) { 
				   this.style.webkitAnimationName = '';		
				   $(this).css({'animation-name' : ''});				
				   self._togglePanel();
				   event.stopPropagation();
			       });
	    if (opt.hasOwnProperty('draggable')) {
		if (opt.draggable)
		    $(this.maxiSel).drags({handle : ".cartHeader"});
	    }
	  
	    
	 			  
	    
	    // set Header
	    var headerContent = '<i class="fa fa-minus-square-o fa-2x pull-left"></i>';
 	//	+ '<div class="btn-group" data-toggle="buttons-checkbox">'
	/*
	 * 	+ '<button class="btn btn-success setExp"><i class="fa fa-flask fa-large"></i></button>'
		+ '<button class="btn btn-danger setPrd"><i class="fa fa-laptop fa-large"></i></button>
	 */
	//	+ '</div>'
	//	+ '<i class="fa fa-question-sign fa-2x pull-right"></i>';
		
	    $(this.target + ' .cartHeader').append(headerContent);

	    $(this.target + ' .cartHeader .fa fa-question-sign')
		.tooltip(
		    {
			title : function () { 
			    var html = '<div class="helpTooltip"><h6>Interaction database query settings</h6>'
				+ '<div><i class="fa fa-flask pull-left"></i><span> Query experimental databases</span></div>'
			      	+ '<div><i class="fa fa-desktop pull-left"></i><span> Query prediction-based databases</span></div>'
				+ '<h6>Available search criterions</h6>'
				+ '<div><i class="fa fa-spinner pull-left"></i><span>Biomolecule</span></div>' 	
			  	+ '<div><i class="fa fa-book pull-left"></i><span>Scientific publication</span></div>'
			        + '<div><i class="fa fa-font pull-left"></i><span>Functional keyword</span></div>'		 
				+ '</div>';
			    return html;
			},
			html : true,
			animation : true,
			container : 'body',
			placement : 'right'
		    });
	    	    
	    $(this.target + ' .cartBody').append(self.defaultCriterionDiv);
	    
	    // set Footer
	    var footerContent = '<div class="btn-group"><button class="btn btn-primary goBut">'
		+ '<i class="fa fa-empire"></i><span> Get Interactom</span></button>'
		+'<button class ="btn btn-danger flush"><i class="fa fa-times-circle"></i><span> Clear</span></button></div>';
	    
	    $(this.target + ' .cartFooter').append(footerContent);
	    $(this.target + ' .cartFooter').addClass('pagination-centered');
	    
	  
	    $(this.target + ' .cartHeader .fa-minus-square-o')
		.on('click', function () {
			self._togglePanel();
		    });
	    $(this.target + ' .cartFooter button.goBut').on('click',function(){self.searchTrigger();});
	    $(this.target + ' .cartFooter button.flush').on('click',function(){
	    	self._setDefaultCriterion();
	    });	    
	    
	},
	notify : function (data) { // glow modification shortcut to add to selection
	    if (! data.setToGlow || data.data.length === 0) {
		$(this.miniSel + " .plusNotification").hide();
		return;
	    };
	    var self = this;
	    if (this.size === "minified") {
		$(this.miniSel + " .plusNotification").show();
		$(this.miniSel + " .plusNotification")
		    .on('click', function(event){							      
			    console.dir(event.currentTarget);
			    var critObjList = self.callback.getGlowyAsCriterionList();
			    self.addCriterion(critObjList);							      
			    event.stopPropagation();
			    $(this).hide();			    
			});
		//    .css({'animation-name' : 'notify', webkitAnimationName : 'notify'});		
	    }
	    
	},
	searchTrigger : function () {
	    console.dir(this.criterionList);	    
	    $(this.target).trigger('databaseQuery', {criterionList : this.criterionList});
	    this.callback.ajaxSearch(this.criterionList);
	},
	/*
	 * jsScroll plugin cant be properly initialized on hidden div correctly
	 * it is thus called only at first magnified call
	 */
	
	_startJsScroll : function () {
	    $(this.target + ' .cartBody').jScrollPane({
								  showArrows: true,
								  hGutter: 0
							      });		    
	    this.jsScrollApi = $(this.target + ' .cartBody').data('jsp');
	},
	_togglePanel : function () {
	    if (this.size === "minified") {

		$(this.miniSel).hide();	
		$(this.maxiSel).show();
		var xOffset = $(this.maxiSel).css("left");
	
		if(!xOffset)
		    $(this.maxiSel).css({ left : '50px'});
		else if(xOffset === "auto")
		$(this.maxiSel).css({ left : '150px'});
		
		this.size = "magnified";
	/*	this._startJsScroll();
		if (!this.jsScrollApi) this._startJsScroll();
		else
		    this.jsScrollApi.reinitialise();*/					
	    } else {
		$(this.maxiSel).hide();		
		$(this.miniSel).show();		
		this.size = "minified";
	    }
	},
	addCriterion : function (data) {
	 /*   console.log("adding criterion");
	    console.log(data);*/
	    var symbolTable = {
		biomolecule : {
		    icon : '<i class="fa fa-li fa-spinner"></i>',
		    comment : function (opt) {
			return 'This is the uniprot entry <a href="www.uniprot.org/' + opt + '.xml"</a>';
		    }
		},
		keyword : { 
		    icon : '<i class="fa-li fa fa-file-text-alt"></i>',
		    comment : function (opt) {
			return 'This is a <a href="http://www.uniprot.org/keywords/">uniprot keyword</a>';
		    }
		},
		publication : { 
		    icon : '<i class="fa-li fa fa-book"></i>',
		    comment : function (opt) {
			return '';
		    }
		},
		freeTextSearch : { 
		    icon : '<i class="fa-li fa fa-pencil"></i>',
		    comment : function (opt) {
			return '';
		    }
		},
		subCellularLocation : {
		    icon : '<i class="fa-li fa fa-fullscreen"></i>',
		    comment : function (opt) {
			return '';
		    }
		}
	    };
	    
	    var array;
	    if (Object.prototype.toString.call(data) === '[object Array]')		
		array = data;
	    else
		array = [data];
	    for (var i = 0; i < array.length; i++) {
		console.log(array[i]);
		if (this._isKnownCriterion(array[i]))
		    continue;
		this.addOneCriterion(array[i], symbolTable);
	    }	    
	},
	_isKnownCriterion : function (critObj) {
	    var bool = false;
	    var string = critObj.name.replace("Free text search on ", "");
	    var objID = "testSearch_" + string;
	    $(this.target + ' .cartBody ul li').each(function (){
								 var id = $(this).attr('id');
								 if ( id === objID) {
								     bool = true;
								     return false; // break jquery selection loop over
								 }
							     });
	    return bool;
	},
	addOneCriterion : function (data, symbolTable) { 	 	    
	    if (this.size === "minified" /*&& !this.notified*/) {
		$(this.miniSel).css({'webkitAnimationName': 'glowing','animation-name': 'glowing'});			
	    }
	    if (this.criterionList.length == 0) {
		$(this.target + ' .cartBody').empty().append('<ul class="fa-ul"></ul>');
		/*if (this.size === "magnified")
		    //if (!this.jsScrollApi) this._startJsScroll();*/
	    }

	    var string = data.name.replace("Free text search on ", "");
	    var scaffold = '<li class="cartCriterion" id="testSearch_' + string + '">' + symbolTable[data.type].icon 
		+ '<div class="row-fluid"><div class="span10 litteral">' + string + '</div>'
		+ '<div class="span2"><i class="fa fa-times-circle"></i>' + '</div></div></li>';
	    this.criterionList.push(data);
	    
	    $(this.target + ' .cartBody ul').append(scaffold);	
	    var self = this;
	    
	    $(this.target + ' .cartBody ul li:last')
		.on('mouseover',
		    function () { 
			$(this).find('i.fa fa-times-circle')
			    .addClass('fa-large')
			    .css({color : 'rgba(204,51,0,1)'});
		    } 
		   )
		.on('mouseout',
		    function () { 
			$(this).find('i')
			    .removeClass('fa-large')
			    .css({'background-color': '',color : 'rgba(0,0,0,1)'});				   
		    } 
		   );

	    $(this.target + ' .cartBody ul li:last i:last')
		.on('click', function (){ 
			var li = $(this).closest("li").each(
			    function() {
				self._deleteCriterion(this);
				//self.jsScrollApi.reinitialise();					
			    }
			);				
		    });
	    //if (this.jsScrollApi)
		//this.jsScrollApi.reinitialise();	
	    
	},
	close : function () { // hide and set back to default position
	    
	},
	_setDefaultCriterion : function () {
		this.criterionList = [];
	    $(this.target + ' .cartBody').empty().append(this.defaultCriterionDiv);
	},
	_deleteCriterion : function (liElem) {
	    var n = $(liElem).index();
	    console.log("index is " + n);
	    this.criterionList.splice(n, 1);
	    $(liElem).remove();
	    if (this.criterionList.length == 0) {
		this._setDefaultCriterion();
	    }
	    

	    //var string = name.replace("Free text seach on ","");
/*	    for (var i = 0;  i < this.criterionList.length ; i++) {
		if (this.criterionList[i].name === string) {
		    this.criterionList.splice (i,1);
		    $(this.target + ' .cartBody ul li')[i].remove();
		   	    
		    if (this.criterionList.length == 0) {
			this._setDefaultCriterion();
		    }
		    return;
		}
	    }
	    
	    alert ('following name " ' + name  + ' " not found in search widget litteral');*/
	}
	
    };

}