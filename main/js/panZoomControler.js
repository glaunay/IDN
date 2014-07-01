function startPanZoomControler(opt) {

 // if ('svgElement' in opt) {
      d3.select(opt['svgElement']).append('svg:g').attr("id","controler");
      
      d3.select(opt['svgElement'] + ' #controler').append("circle")
	  .attr("cx", 50)      
	  .attr("cy", 50)
	  .attr("r", 42)
	  .style("opacity", 0.25)
	  .style("fill","rgb(139, 133, 139)"); // purple
      // North
       d3.select(opt['svgElement'] + ' #controler').append("svg:path")
	  .attr("d", "M50 10 l12 20 a40,70 0 0,0 -24,0z")
	  .attr("class", "button");
      // West
      d3.select(opt['svgElement'] + ' #controler').append("svg:path")
	  .attr("d", "M10 50 l20 -12 a70,40 0 0,0 0,24z")
	  .attr("class", "button");
      // South
      d3.select(opt['svgElement'] + ' #controler').append("svg:path")
	  .attr("d", "M50 90 l12 -20 a40,70 0 0,1 -24,0z")
	  .attr("class", "button");
      // East
      d3.select(opt['svgElement'] + ' #controler').append("svg:path")
	  .attr("d", "M90 50 l-20 -12 a70,40 0 0,1 0,24z")
	  .attr("class", "button");

      d3.select(opt['svgElement'] + ' #controler').append("circle")
	  .attr("cx", 50).attr("cy", 50).attr("r", 20)
	  .attr("class", "compass");
      
      d3.select(opt['svgElement'] + ' #controler').append("circle")
	  .attr("cx", 50).attr("cy", 41).attr("r", 8)
	  .attr("class", "button");

       d3.select(opt['svgElement'] + ' #controler').append("circle")
	  .attr("cx", 50).attr("cy", 59).attr("r", 8)
	  .attr("class", "button");
 
      d3.select(opt['svgElement'] + ' #controler').append("rect")
	  .attr("x", 46).attr("y", 39.5).attr("width", 8).attr("height", 3)
	  .attr("class", "plus-minus");

      d3.select(opt['svgElement'] + ' #controler').append("rect")
	  .attr("x", 46).attr("y", 57.5).attr("width", 8).attr("height", 3)
	  .attr("class", "plus-minus");
     
      d3.select(opt['svgElement'] + ' #controler').append("rect")
	  .attr("x", 48.5).attr("y", 55).attr("width", 3).attr("height", 8)
	  .attr("class", "plus-minus");
    
    var svgHost = $(opt['svgElement'])[0];
    var w =  d3.select(svgHost).attr('width'),
    h =  d3.select(svgHost).attr('height');
    
   // var autofocusScaffold = '<g id="autofocus"><rect></rect><text></text></g>';
     d3.select(opt['svgElement'] + ' #controler').append("svg:g").attr("id", "autofocus").append("svg:rect");
     d3.select(opt['svgElement'] + ' #controler g#autofocus').append("svg:text");
     d3.select(opt['svgElement'] + ' #controler g#autofocus').style("cursor", 'pointer');
     d3.select(opt['svgElement'] + ' #controler g#autofocus rect')
	  .attr("x", 10).attr("y", 100).attr("width", 84).attr("height", 20).attr("rx",5).attr("ry",5)
	  .style("fill","rgba(139, 133, 139, 0.25)"); // rgb(128, 0, 128)
	  
	 d3.select(opt['svgElement'] + ' #controler g#autofocus text')
	    .append("tspan")
    	.attr("x",20)
	    .attr("y", 115)
	    .style("cursor", 'pointer')
	    .style("fill","#225EA8")
	    .text("autofocus");
    //vizObject.core.centrum();
    //console.log("PanZoom Component init");      
    var self = function ()
    {	  
	return {	    	
	    svgElement : opt.svgElement,
	    docWidth : w,
	    docHeight : h,
	    transMatrix : [1,0,0,1,0,0],
	    scale : 1.0,
	    _releaseMatrix : function(){
	    var matrix = $(this.svgElement + ' g#network').attr("transform");
	    if(!matrix){
	    	matrix = [1,0,0,1,0,0];
	    }else{
	    	var reg = /-?[0-9]+(\.[0-9]*)?/gi;
	    	var matrix = matrix.match(reg);
	    	for (var i=0; i < matrix.length; i++) {
			  matrix[i] = parseFloat(matrix[i]);
			};
	    }
		this.transMatrix =  matrix;	
	    },
	    pan : function (dx, dy)
	    {
	    this._releaseMatrix();
		this.transMatrix[4] += dx;
		this.transMatrix[5] += dy;
		
		var newMatrix = "matrix(" +  this.transMatrix.join(' ') + ")";
		
		$(this.svgElement + ' g#network').attr("transform", newMatrix);	      
	    },
	    zoom : function (scale)
		{
		    this._releaseMatrix();
		    //console.log('from ' +  this.transMatrix);
			for (var i=0; i<this.transMatrix.length; i++)
			{
			    
			    this.transMatrix[i] *= scale;
			  	//console.log('to ' +  this.transMatrix[i]);
			}
			//console.log((1-scale)*this.docWidth/2 + " " + (1-scale)*this.docHeight/2);
			this.transMatrix[4] += (1-scale)*this.docWidth/2;
			this.transMatrix[5] += (1-scale)*this.docHeight/2;
			//console.log('to ' +  this.transMatrix);
			var newMatrix = "matrix(" +  this.transMatrix.join(' ') + ")";
			$(this.svgElement + ' g#network').attr("transform", newMatrix);	   	      
		}, 
		setViewPoint : function (data) { // x,y coor and an option to encompass all displayed element
			var xOffset = this.docWidth / 2 - data.x,
			yOffset = this.docHeight / 2 - data.y;
			//console.log(this.docWidth + " x "  + this.docHeight);
			//console.log("bary : " + data.x + "  " + data.y);
			this.pan(xOffset, yOffset);
			//console.log(xOffset, yOffset);
	    }
	};
    } ();
    

    var ctrl = $(opt['svgElement'] + ' #controler .button');

    $(opt['svgElement'] + ' #controler g#autofocus')
    	.on('click', function (event) {
		      
		      vizObject.core.centrum();
		      event.stopPropagation();
		  });
    $(ctrl[0]).on('click', function (event) {		      
		      self.pan(0,50);
		      event.stopPropagation();
		  });
    $(ctrl[1]).on('click', function (event){
		      self.pan(50,0);
		      event.stopPropagation();
		  });
    $(ctrl[2]).on('click', function (event){ 
		      self.pan(0,-50);
		      event.stopPropagation();
		  });
    $(ctrl[3]).on('click', function (event){
		      self.pan(-50,0);
		      event.stopPropagation();
		  });
    $(ctrl[4]).on('click', function (event){
		      self.zoom(0.9);
		      event.stopPropagation();
		  });
    $(ctrl[5]).on('click', function (event){	
		      self.zoom(1.1);
		      event.stopPropagation();
		  });	          

    return self;
}

    