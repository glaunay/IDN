/*
 * Color Picker widget
 * 
 */


function initPalette (opt) {
//    console.log(opt);
    var width = opt.width ? opt.width : '260px';
    var height = opt.height ? opt.height : '200px';
    
    if (opt.width)
        width = opt.width;
    var size = "minified";
    if ("iState" in opt)
        size = opt.iState;
    
    var draggable = false;
    if (opt.draggable) {
	if (opt.draggable === "true")
	    draggable = true;
    }
    var positionSettings = {};
    if ('position' in opt.location) {
	positionSettings = opt.location;
    } 
    
    return {
	computeBookmarkPosition : opt.computeBookmarkPosition,
	positionSettings: positionSettings,
	draggable : draggable,
	size : size,
	target : opt.target,
	miniSel : null,
	maxiSel : null,
	width : width,
	height : height,
	draggable : draggable,
	callback : opt.callback,
	draw : function() {
	    var self = this;
	    
	    var miniHTML = '<div id="paletteMiniWrapper" class="bookmarkWrapper"><i class="fa fa-tint fa-4x"></i></div>';	    
	    var maxiHTML = '<div id="paletteMaxiWrapper" class="cp-default">'
		+ '<div class="picker-header"><i class="closeBut fa fa-minus-square-o fa-2x pull-left"></i></div>'
		+            '<div class="picker-wrapper">'
		+            '<div id="picker" class="picker"></div>'
		+            '<div id="picker-indicator" class="picker-indicator"></div>'
		+            '</div>'
		+            '<div class="slide-wrapper">'
		+            '<div id="slide" class="slide"></div>'
		+                '<div id="slide-indicator" class="slide-indicator"></div>'
		+            '</div>'
		+        '</div>';
	    
	    
	    $(this.target).append(miniHTML);
	    $(this.target).append(maxiHTML);
	    this.miniSel = opt.target + ' div#paletteMiniWrapper';
	    this.maxiSel = opt.target + ' div#paletteMaxiWrapper';
	 //   $(this.maxiSel).css({width : this.width, height : this.height});
	    this.color =  ColorPicker(document.getElementById('slide'), document.getElementById('picker'), 
				      function(hex, hsv, rgb, mousePicker, mouseSlide) {
					  ColorPicker.positionIndicators(
					      document.getElementById('slide-indicator'),
					      document.getElementById('picker-indicator'),
					      mouseSlide, mousePicker
					  );
					  //document.body.style.backgroundColor = hex;
					  self.callback.onColorChange(hex);
				      });
	    var defaultCss = self.computeBookmarkPosition();	 
	 //   console.log(defaultCss);
	    $(this.miniSel).css(defaultCss);
	    $(this.maxiSel).css(defaultCss);
	    
	    $( window ).resize(function() {
				   var newWindowCss = self.computeBookmarkPosition();	    
				   $(self.miniSel).css(newWindowCss);
			       });
	    
	    
	    $(this.miniSel).on('click',function(){self.magnigy();});
	    $(this.maxiSel + ' .closeBut').on('click',function(){self.minify();});
	    
	    if(this.draggable)
		$(this.maxiSel).drags({handle : ".picker-header"});

	    if(size === "minified")
		this.minify();
	    else
		this.magnify();

	},
	magnigy : function () {
	    this.size = "magnified";
	    $(this.miniSel).hide();
	    $(this.maxiSel).show();
	   
	},
	minify : function () {
	    this.size = "minified";
	    $(this.miniSel).show();
	    $(this.maxiSel).hide();	    
	},

	echoRGB : function () {	  
	 //   return [this.color.rgb[0], this.color.rgb[1], this.color.rgb[2]];
	}	    		
    };
}