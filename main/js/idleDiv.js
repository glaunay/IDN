function startIdle (opt) {
    return {
	register : [],
	parent : opt.parent,
	target : opt.target,
	draw : function (data) {
	    this.erase();
	    //console.log("drawing");
	    var offset = this.parent.position();
	    var w = this.parent.width(),
	    h = this.parent.height();
	    //console.dir(offset);
	    //console.dir(w + ' ' + h);
	    var oT = offset.top ;
	    var oL = offset.left + w / 3;
	    //console.log(oT + ' ' + oL);
	    if (data.type === "networkRenderer") {			    	    
		$(this.target).append('<div class="idleDiv queryMsg">'
				      + '<div class = "message">Building the network <i class="fa fa-cog fa-spin"></i></div></div>');
		//<img src="../img/psicquic_loading.gif" ></img>
		$(this.target + ' .idleDiv')
		    .css({
				 position : 'absolute', 
			     top : oT + 'px',left : oL + 'px',			  
			     /*		     'background-position' : '50% 50%', 
			     'background-repeat' : 'no-repeat',
			     'background-attachment' : 'fixed',
			     'background-image' : 'url(../img/psicquic_loading_tsp.gif)',*/
			     'width'  : '100%',
			     'height' : '100%',
			     'top'    : '0',
			     'left'   : '0'
			 });
	    } 
	    else if (data.type === "databaseQuery") {			    	    
		$(this.target).append('<div class="idleDiv queryMsg">'
				      + '<div class = "message">Querying databases please wait <i class="fa fa-cog fa-spin"></i></div></div>');
		//<img src="../img/psicquic_loading.gif" ></img>
		$(this.target + ' .idleDiv')
		    .css({
			     position : 'absolute', 
			     top : oT + 'px',left : oL + 'px',			  
			     /*		     'background-position' : '50% 50%', 
			     'background-repeat' : 'no-repeat',
			     'background-attachment' : 'fixed',
			     'background-image' : 'url(../img/psicquic_loading_tsp.gif)',*/
			     'width'  : '100%',
			     'height' : '100%',
			     'top'    : '0',
			     'left'   : '0'
			 });
	    }	

	    if(data.opt === 'blocker') {
			$(this.target).append('<div id="blocker"></div>');
			$('div#blocker').css({height : '100%', width :"100%",top : oT});
	    }
	},
	erase : function () {
	    $(this.target + ' div.idleDiv,div#blocker').remove();	    
	}
    };
}


