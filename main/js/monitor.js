/* Widget to monitor the asynchronous fetching of link/node data */
function initMonitor (opt) {
        
    return {
	width : opt.width ? opt.width : 200,
	height : opt.height ? opt.height : 200,
	target : opt.target	? opt.target : "body",
	selector : "svg.monitor #load",
	completeReload : true,
	total : {
	    nodes : 0,
	    links : 0
	},
	count : {
	    nodes : 0,
	    links : 0	    
	},
	svg : null,
	draw : function () {
	    var self = this;
	    
	    var divMon = '<div class = "divMon"><div class = "forSVG"></div><div class = "message"></div></div>';
	    $(self.target).append(divMon);
	    this.svg = d3.select("div.divMon div.forSVG").append('svg').attr("class",'monitor')
	    .attr("width", self.width)
		.attr("height", self.height*0.8)
		.style("margin-top","10%")
		.append('g').attr('id','load')
		;
		//console.log("draw monitor")

		d3.select(self.selector).append("text").text("50%").attr("x",0).attr("y",self.height * 0.66 /2 + 20);
		
		d3.select(self.selector).append("line").attr("x1", 30).attr("y1", (self.height *0.66)*0.75 + 20)
			.attr("x2", 40).attr("y2",(self.height *0.66)*0.75 + 20).style("stroke-width",2).style("stroke","black");
		
		d3.select(self.selector).append("line").attr("x1",30 ).attr("y1", (self.height *0.66)/4 +20)
			.attr("x2", 40).attr("y2",(self.height *0.66)/4 +20).style("stroke-width",2).style("stroke","black");
		
		d3.select(self.selector).append("line").attr("x1",30 ).attr("y1", (self.height *0.66)/2 +20)
			.attr("x2", 40).attr("y2",(self.height *0.66)/2 +20).style("stroke-width",2).style("stroke","black");
		
		d3.select(self.selector).append("line").attr("x1",35).attr("y1", 20)
			.attr("x2", 35).attr("y2",self.height *0.66 + 20).style("stroke-width",2).style("stroke","black");
			
		d3.select(self.selector).append("text").text("nodes").attr('width',50).attr("x",self.width * 0.33 + 5)
	        .attr("y", 10);
	        
	   	d3.select(self.selector).append("text").text("links").attr('width',50).attr("x",self.width * 0.66 + 10)
	    	.attr("y", 10);
	    	
	    d3.select(self.selector).append("rect").attr("id","nodeStack")
	    	.attr('transform', function(){
								return "translate(" + 
										   self.width * 0.33 
								    + ",20)";
									   })
			.style("fill","rgba(31, 51, 249, 0.2)")
			.attr("width",50)
			.attr("height",self.height *0.66); 
			
	    d3.select(self.selector).append("rect")
	    	.attr("id","linkStack").attr('transform', function(){
									       return "translate(" + 
										   self.width * 0.66 
										   + ",20)";
									   })
			.style("fill","rgba(68, 249, 31, 0.2)")
			.attr("width",50)
			.attr("height",self.height *0.66);
		
		d3.select(self.selector).append("rect").attr("id","nodeComplete")
	    	.attr('transform', function(){
								return "translate(" + 
										   self.width * 0.33 
								    + ","+self.height *0.66+20+")";
									   })
			.style("fill","rgba(31, 51, 249, 1)")
			.attr("width",50)
			.attr("height",0); 
			
	    d3.select(self.selector).append("rect")
	    	.attr("id","linkComplete").attr('transform', function(){
									       return "translate(" + 
										   self.width * 0.66 
										   + ","+self.height *0.66+20+")";
									   })
			.style("fill","rgba(68, 249, 31, 1)")
			.attr("width",50)
			.attr("height",0) 
			
	$("div.divMon").css("width",self.width).css("height",self.height)
		/*d3.select(self.selector).append("text").text("Loading...").attr("x",self.width /2 -30)
			.attr("y",self.height - 20).style("font-size","1.8em"); */
 
	},
	reset : function (){
		console.log('reset')
	    this.count.nodes = 0;
	    this.count.links = 0;
	    this.total.nodes = 0;
	    this.total.links = 0;
	    var nHeightNode = (this.count.nodes / this.total.nodes)*(this.height*0.66);
	    var nHeightLinks = (this.count.links / this.total.links)*(this.height *0.66);
	   
	    //alor pour la transition penser a diminue le translation
	    d3.select(self.selector + " #nodeComplete").transition()
    				  .duration(500)
    				  .ease("quad")
			          .attr("height", nHeightNode)
			          .attr("transform", function(d,i) {
			          	
           				    return "translate(" 
						+ [self.width * 0.33,  self.height *0.66 - nHeightNode + 20 ] + ")";
      				  });
      				  
      	d3.select(self.selector + " #linkComplete").transition()
    				  .duration(500)
    				  .ease("quad")
			          .attr("height", nHeightLinks)
			          .attr("transform", function(d,i) {
			          	if(nHeightLinks  > self.height *0.66 ){
			          		return "translate(" + [self.width * 0.66,   20 ] + ")"
			          	}
           				 return "translate(" + [self.width * 0.66,  self.height *0.66 - nHeightLinks + 20 ] + ")"
      				  })
	},
	stop : function () {
		var self = this;
		$("div.divMon div.message").text("Load Complete");
		$("div.divMon div.message").addClass("complete");
	    this.reset();
	    setTimeout(function(){self.hide()},3000);
	   
	},

	start : function (data) {
		console.log("start")
		var self = this;
   		self.completeReload = true;
	    self.total.nodes += data.nodes;
	    self.total.links += data.links;
	    if(self.total.nodes == 0 || self.total.links == 0){
	    	self.stop();
	    }
	    setTimeout(function(){
	    	console.dir("timeOut")
	    	if(self.completeReload){
	    		console.dir("stop this shit")
	    		self.stop();
	    		}
	    	
	    },15000);
	    this.show();
	},
	show : function (){
		
		$("div.divMon div.message").html('Loading Data <i class="fa fa-spinner fa-spin"></i>')
		$("div.divMon div.message").removeClass("complete")
		$("div.divMon").slideDown(3000);
	},
	hide : function (){
		$("div.divMon").slideUp(3000);
	},
	update : function (data) {
		var self = this;
		console.log("update")
		console.dir(data);
		this.completeReload = false;
	    this.count.nodes += data.nodes;
	    this.count.links += data.links;

	    var nHeightNode = (this.count.nodes / this.total.nodes)*(this.height*0.66);
	    var nHeightLinks = (this.count.links / this.total.links)*(this.height *0.66);
	    if(nHeightLinks > this.height *0.66){
	    	nHeightLinks = this.height *0.66;
	    }
	    //alor pour la transition penser a diminue le translation
	    d3.select(self.selector + " #nodeComplete").transition()
    				  .duration(500)
    				  .ease("quad")
			          .attr("height", nHeightNode)
			          .attr("transform", function(d,i) {
			          	
           				    return "translate(" 
						+ [self.width * 0.33,  self.height *0.66 - nHeightNode + 20 ] + ")";
      				  });
      				  
      	d3.select(self.selector + " #linkComplete").transition()
    				  .duration(500)
    				  .ease("quad")
			          .attr("height", nHeightLinks)
			          .attr("transform", function(d,i) {
			          	if(nHeightLinks  > self.height *0.66 ){
			          		return "translate(" + [self.width * 0.66,   20 ] + ")"
			          	}
           				 return "translate(" + [self.width * 0.66,  self.height *0.66 - nHeightLinks + 20 ] + ")"
      				  })
	    
	}
    };
    
}