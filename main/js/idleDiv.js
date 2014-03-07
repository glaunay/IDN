function startIdle (opt) {
    console.log('starting MSG component');
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
		$(this.target).append('<div class="idleDiv rendererMsg">'
				      + 'Rendering network please wait<span>.</span><span>.</span><span>.</span></div>');
		//<img src="../img/psicquic_loading.gif" ></img>
		$(this.target + ' .idleDiv')
		    .css({
			     position : 'absolute', 
			     top : oT + 'px',left : oL + 'px',			  
			     /*		     'background-position' : '50% 50%', 
			     'background-repeat' : 'no-repeat',
			     'background-attachment' : 'fixed',
			     'background-image' : 'url(../img/psicquic_loading_tsp.gif)',*/
			     'width'  : '400px',
			     'height' : '50px'
			 });
	    } 
	    else if (data.type === "databaseQuery") {			    	    
		$(this.target).append('<div class="idleDiv queryMsg">'
				      + 'Querying databases please wait<span>.</span><span>.</span><span>.</span></div>');
		//<img src="../img/psicquic_loading.gif" ></img>
		$(this.target + ' .idleDiv')
		    .css({
			     position : 'absolute', 
			     top : oT + 'px',left : oL + 'px',			  
			     /*		     'background-position' : '50% 50%', 
			     'background-repeat' : 'no-repeat',
			     'background-attachment' : 'fixed',
			     'background-image' : 'url(../img/psicquic_loading_tsp.gif)',*/
			     'width'  : '400px',
			     'height' : '50px'
			 });
	    }	

	    if(data.opt === 'blocker') {
		$(this.target).append('<div id="blocker"></div>');
		$('div#blocker').css({height : h, width : w,top : oT});
	    }
	},
	erase : function () {
	    $(this.target + ' div.idleDiv,div#blocker').remove();	    
	}
    };
}


