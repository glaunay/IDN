function initBarChart (options){
	
	if (! options.hasOwnProperty('barChartDiv')) {
		alert("Cant start component w/out targetDiv");
		return;
	}
	
	var elem = $(options.barChartDiv)[0]; 
	
	if (!elem) {
		alert("Cant get targetDiv element in document");
		return;
	}


/*fin intialisation
 * -----------------------------------------------------------------
 */
	return {
		targetDomElem : elem, //permet de selectionner la targetdiv
		data : options.data,
		color : d3.scale.category20(),
		dataChartObject : {},
		
		draw : function(){
			var self = this;
			if (!self.data){return false;}
			self._barChartDivOrganisator();
			$(self.targetDomElem).find('select').change(function(){
				var str = "";
   				$( "select.barChart option:selected" ).each(function() {
      				str = $( this ).text() ;
      				var svg = d3.select("div.svg");
      				svg.selectAll(".bar")
					  .transition()
    				  .duration(700)
    				  .ease("quad")
			          .attr("height", 0)
			          .attr("transform", function(d,i) {
			          	//{var value = 450 - y(d.ppm);return "translate(0," + value + ")";}
           				 return "translate(" + [0, 400] + ")"
      				  })
        
   				 });
   				 $.each(self.dataChartObject, function(name, data){
   				 	if(name == str){setTimeout(function(){self._barChartGenerator(data)},800);}
   				 })
			});
			return true;
		},
		_barChartDivOrganisator : function(){
			var self = this; 
			
			var divBarChart = $(self.targetDomElem);
			var line = '<div class = "row-fluid"><div class = "span3 offset1"><div class= "divTitre">Unigene transcriptome data</div><dl>'
			var expressionLevel = self.data.expressionLevels;
			var compartiment = self.data.compartiment;
			if(expressionLevel.data){
				line += "<div><b>Select expression dataset</b><select class='form-control barChart'>";
				$.each(expressionLevel.data, function(name, info){
				    line += "<option name = '" + name + "'>" + name + "</option>";
				});
				line += "</select></div>";
			}
			$.each(expressionLevel, function(name, info){
				if(name != "data"){
					line += '<dt class = "hReport"><b>' + name + '</b>:</dt><dd> ' + info +'</dd>' ;
				}else{
					$.each(info, function(statue, dataInChart){
						self.dataChartObject[statue] = self._dataChartOrganisator(dataInChart);
					})
			
				}
			});
			line += "</dl></div><div class = 'span8 chartExp'><div class = 'divTitre'>Expression data chart</div></div></div>"
			
			divBarChart.append(line);
			self._barChartGenerator(self.dataChartObject.Body_Sites);
 			
		},
		_dataChartOrganisator : function(data){
			var self = this;

			var dataForChartTemp = [];
			var dataForChartFinal = [];
			
			for (var i=0; i < data.length; i++) {
				if((data[i][0]/data[i][1])*1000000==0){}
				else{
			 		dataForChartTemp.push([(data[i][0]/data[i][1])*1000000, data[i][2]])
			 	}
			};
			dataForChartTemp.sort(function(a,b){return b[0] - a[0]})
			for (var i=0; i < dataForChartTemp.length; i++) {
			  dataForChartFinal.push({ppm : dataForChartTemp[i][0], tissue : dataForChartTemp[i][1]})
			};
			return dataForChartFinal;
		},
		_barChartGenerator : function(data){
			var self = this;
			
			var divBarChart = $(self.targetDomElem).find("div.chartExp")
			divBarChart.find("div.svg").remove()
			divBarChart.append("<div class = 'svg'></div>")
			
			var margin = {top: 20, right: 20, bottom: 100, left: 50},
    			width = 750
  			 	height = 400

			var x = d3.scale.ordinal()
    			.rangeRoundBands([0, width], .1);

			var y = d3.scale.linear()
    			.range([height, 0]);
    			
			var yBack = d3.scale.linear()
    			.range([0, height]);
		
			var xAxis = d3.svg.axis()
    			.scale(x)
    			.orient("bottom")
    			

			var yAxis = d3.svg.axis()
    			.scale(y)
    			.orient("left");
    			
    			

			var svg = d3.select("div.svg").append("svg")
    			.attr("width", width + margin.left + margin.right)
    			.attr("height", height + margin.top + margin.bottom)
  			 	.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 			
 			x.domain(data.map(function(d) { return d.tissue; }));
  			y.domain([0, d3.max(data, function(d) { return d.ppm*1.1; })]);
			yBack.domain( [0, d3.max(data, function(d) { return d.ppm*1.1; })] );
  			svg.append("g")
       			 .attr("class", "x axis")
       			 .attr("transform", "translate(0," + height + ")")
        	 	 .call(xAxis)
       		 	 .selectAll("text")  
          		 .style("text-anchor", "end")
            	 .attr("dx", "-.8em")
           		 .attr("dy", ".15em")
            	 .attr("transform", function(d) {
               		 return "rotate(-30)" 
               	  })
               	  .style("overflow","visible");
      			
  			svg.append("g")
      			.attr("class", "y axis")
      			.call(yAxis)
    		    .append("text")
      			.attr("transform", "rotate(-90)")
      			.attr("y", 6)
      			.attr("dy", ".71em")
      			.style("text-anchor", "end")
      			.text("ppm");
			
			
			svg.selectAll(".bar")
      			.data(data)
    		  .enter().append("rect")
      			.attr("class", "bar")
      			.attr("x", function(d) { return x(d.tissue); })
     			.attr("width", x.rangeBand())
      			.attr("y", function(d) { return 0; })
      			.attr("height", 0)
      			.attr("transform", function(d,i) {
			          	//{var value = 450 - y(d.ppm);return "translate(0," + value + ")";}
           				 return "translate(0, " + height + ")";
           			})
           		.style("fill", function(d) { return self.color(d.tissue)})
				.transition()
    				  .duration(700)
    				  .ease("quad")
			          .attr("height", function(d) { return  height - y(d.ppm) ; })
			          .attr("transform", function(d,i) {
			          	//{var value = 450 - y(d.ppm);return "translate(0," + value + ")";}
           				 return "translate(" + [0,  height - yBack(d.ppm)] + ")"
      				  })
			
			
/*  		workin chart input
 	svg.selectAll(".bar")
      			.data(data)
    		  .enter().append("rect")
      			.attr("class", "bar")
      			.attr("x", function(d) { return x(d.tissue); })
     			.attr("width", x.rangeBand())
      			.attr("y", function(d) { return 0; })
      			.attr("height", function(d) { return  450 - y(d.ppm) ; })      			
				.style("fill", function(d) { return self.color(d.tissue)})
				.attr("transform", function(d){
						console.log(d.ppm +'  '+ yBack(d.ppm) + ' ' + y(d.ppm));
						var value = height - yBack(d.ppm);
						
						return "translate(0," + value + ")";
						});
*/


			function type(d) {
  				d.ppm = +d.ppm;
 				return d;
			}
		}
	}
}