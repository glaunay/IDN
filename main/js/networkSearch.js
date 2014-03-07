/* A simple component to search the network*/

function initNetworkSearch (opt) {
    
    if ( $(opt.target).length == 0) {
	alert ("Unable to find target div " + opt.target);
	return null;
    }
    
    $(opt.target).addClass('searchWidgetWrapper');    
    
    var size = "minified";
    if ("iState" in opt)
	size = opt.iState;

    var positionSettings = {};
    if ('position' in opt.location) {
	positionSettings = opt.location;
    }  
    
    var focusOutGlobal = [];
    if ('focusOutGlobal' in opt)
	focusOutGlobal = opt.focusOutGlobal;
    return {
	computeBookmarkPosition : opt.computeBookmarkPosition,
	positionSettings: positionSettings,
	focusOutGlobal :focusOutGlobal, // apply and event on all siblings for widget close
	target : opt.target,
	size : size,
	miniSel : null,
	maxiSel : null,
	draw : function () {
	    var self = this;	    

	    var test = '<div class="input-prepend">'
		+ '<div class="btn-group">'
		+ '<button class="btn dropdown-toggle" data-toggle="dropdown">'
		+ 'Terms'
		+ '<span class="caret"></span>'
		+ '</button>'
		+ '<ul class="dropdown-menu">'
		+ '<li etype="name" >Node name</li>'
	    	+ '<li etype="common">Common name</li>'	    
		+ '<li etype="go">Go term</li>'
		+ '</ul>'
		+ '</div>'
		+ '<input class="span2" type="text" placeholder="look in network">'
		+ '<button class="btn go"><i class="icon-search icon-large"></i></button>'
		+ '<button class="btn btn-info add"><i class="icon-signout icon-large"></i></button>'
		+ '</div>';
	    
	    var scaffold =  '<div id="loopLargeWrapper">'
		+ '<span class="closeCall"><i class="icon-double-angle-left icon-2x"></i></span>'
		+ test
		+ '</div>'		
		+ '<div id="loopBookmarkWrapper"><i class="icon-search icon-4x"></i></div>';		    
	    $(this.target).append(scaffold);
	    this.miniSel = this.target + ' #loopBookmarkWrapper';
	    this.maxiSel = this.target + ' #loopLargeWrapper';
	    var defaultCss = self.computeBookmarkPosition();	 
	  //  console.log(defaultCss);
	    $(this.miniSel).css(defaultCss);
	    $(this.maxiSel).css(defaultCss);
	    
	    
	    $( window ).resize(function() {
				   var newWindowCss = self.computeBookmarkPosition();	    
				   $(self.miniSel).css(newWindowCss);
				   $(self.maxiSel).css(newWindowCss);
			       });
	    $(this.target).on('click', function (event){
				  // event.stopPropagation();
			      });
	    
	    $(this.maxiSel + ' li').on('click', function (event){
					   event.stopPropagation();
					   if ($(this).find('i').length > 0) {
					       $(this).find('i').remove();					      
					       return;
					   }
					   $(this).siblings().find('i').remove();
					   $(this).append('<i class="icon-check-sign pull-right"></i>');					 
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
	  
	   $(self.target + ' .go').popover({
					       title : 'Invalid search request <i class="icon-remove-circle pull-right icon-large"></i>',
					       container: self.target + ' .go',
					       content: '<ol><li>Choose an item in Terms list</li>'
					       + '<li>Enter a valid string</li></ol>',
					       animation:true,
					       html : true,
					       trigger : 'manual'
					   });
	    
	  
					 

	    $(this.maxiSel + ' .go').on('click', function (e) {					   
					    var type = null;
					    
					    $(self.maxiSel + ' li i')
						.each(function (){
							  console.log("one here");
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
	    
	},
	_togglePanel : function () {	  
	    if (this.size === "minified") {
		$(this.miniSel).hide();	
		$(this.maxiSel).show();		
		this.size = "magnified";	
	    } else {
		this._closePanel();
	    }
	},
	_closePanel : function () {
	    $(this.maxiSel).hide();		
	    $(this.miniSel).show();		
	    this.size = "minified";
	}
	
    };
    

}