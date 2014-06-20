/*
 *
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * */


function initMyStatWidjet (options){
	if (! options.hasOwnProperty('target')) {
		alert("Cant start component w/out targetDiv");
		return;
	}
	
	var elem = $(options.target)[0]; 
	
	if (!elem) {
		alert("Cant get targetDiv element in document");
		return;
	}
	var cartCallback = function(nodeSelect){
		console.dir("default cart callback")
	};
	
	var hideCallback = function(nodeSelect){
		console.dir("default hide callback")
	};
	
	var delCallback = function(nodeSelect){
		console.dir("default del callback")
	};
	var draggable = false;
    if ('draggable' in options){
		draggable = options.draggable;     
	}
	
	return{
		targetDomElem : elem,
		data : null,
		numberOfUniKw : 0 ,
		draggable : draggable,
		delCallback : options.delCallback ? options.delCallback : delCallback,
		cartCallback : options.cartCallback ? options.cartCallback : cartCallback,
		hideCallback :options.hideCallback ? options.hideCallback : hideCallback,
		selectedNode : null,
		rootUrl : options.rootUrl,
		treeOfData : null,
		draw : function (){
			
		},
		makeStatUniprotKeywrd : function(data){
			var self = this;
			self.closeWindows();
			
			//$("div.container").find("button.prototype").remove();
			var buttonStatTemp ='<button type="button" class="btn btn-default prototype disabled" >prototype</button>'
			//$("div.container").append(buttonStatTemp)
			if(data){
				self.data = data;
				self._recursiveParcour(self.treeOfData);
				$('div.container button.prototype').removeClass('disabled').click(function(){
					self._divStatDraw();
				})
				
			}
			
			
		},
		loadRessource : function(){
			var self = this;
			var jqxhr = $.ajax({
	        		data: {},
					dataType : "json",	
					url: self.rootUrl + "/data/upKeywordTree.json",// url a passer en argument

				})
  				.done(function(data) {
    				self.treeOfData = data;
    				self.makeStatUniprotKeywrd(self.data);
    				
  				})
  				.error(function (xhr, status, error) {
				   var err = eval("(" + xhr.responseText + ")");
				   alert(err.Message);
			});
		},
		_divStatDraw : function(){
			var self = this;
			$("div.uniprotDiv").remove();
			var table = '<div style = "width:100%">Nodes</div><div class = "scroll"><table class = "table uniTable"></table></div>'
			
			var title = "In this graph we have " + self.treeOfData.nodeList.length + " nodes annoted by " + self.numberOfUniKw +
						" UniProt Keyword"
			
			var buttonGroup = '<div class="btn-group-vertical" ><button class="btn btnUni btnCart" type="button"'+
							  'data-original-title="" title="" ><i class="fa fa-shopping-cart fa-lg" ></i></button>'+
							  '<button class="btn btnUni btnDel" type="button" data-original-title="" title="" >'+
							  '<i class="fa fa-minus-circle fa-lg"></i></button>'+
							  '<button class="btn btnUni btnHide" type="button" data-original-title="" title="">'+
							  '<i class="fa fa-eye-slash fa-lg"></i></button></div>'
			
			var div ='<div class = "uniprotDiv" ><div class = "hearder"><i class="fa fa-minus-square-o fa-2x"></i>'+
					 '<div class = "titleOfWidjet">' + title + '</div></div>'+
					 '<div class = "svgContainer"></div><div class = "footer"> '+
					 '<div class = "tempMess"> select a part to view associated node </div>' + table + buttonGroup + '</div>' +
					 '</div>';
			$("div#vizContainer").append(div);
			
			self._constructGraph();
			console.dir(self.numberOfUniKw)
			/* Méthode et callback associe a la grande fenétre*/
			$("div.uniprotDiv div.btn-group-vertical button").on("click", function(){
				if($(this).hasClass("btnCart")){
					self.cartCallback(self.selectedNode)
				}
				if($(this).hasClass("btnHide")){
					self.hideCallback(self.selectedNode)
				}
				if($(this).hasClass("btnDel")){
					self.delCallback(self.selectedNode)
				}
			});
			if (this.draggable) {
		//		console.log("setting as draggable");
				$('div.uniprotDiv').drags({handle : ".hearder"});
			}
			$("div.uniprotDiv i.fa-minus-square-o").on("click" , function(){
				self.closeWindows();
			});
			
		},
		_recursiveParcour : function (actualTree){
			var self = this;
			var nodeList = [];
			
			if(actualTree.AC){
				actualTree.nodeList = self.data[actualTree.AC];
				if(self.data[actualTree.AC]){
					actualTree.size = self.data[actualTree.AC].length;
					nodeList = self.data[actualTree.AC];
					if(nodeList){
						
						self.numberOfUniKw ++

					}
				}
				
				
				return nodeList;
			}
			else if(actualTree.children ){
				for (var child=0; child < actualTree.children.length; child++) {
				 var tempList = self._recursiveParcour(actualTree.children[child]);
				 if(tempList){
				 	$.merge(nodeList,tempList);
				 }
				};
			}
			
			nodeList = cleanArray(nodeList);
			actualTree.nodeList = nodeList;
			return nodeList;
			
			
		},
		_tableRefresh : function (data){
			var self = this;
			
			self.selectedNode = data.nodeList
			var text = data.ID ? "<div>Name : " + data.HI + "</div>": data.name;
			if(data.DE){
				text += "<div class = 'def'><div>Definition : " + data.DE + "</div>";
			}
			if(data.GO){
				text += "<div class = 'goTerm'> GO Term associated : " + data.GO + "</div>";
			}
			if(data.SY){
				text += "<div class = 'synonym'>Synonym :" + data.SY + "</div>";
			}
			text += "</div>";
			$('div.tempMess').html(text);
			$('table.uniTable').find('tbody').remove();
			
			if(data.nodeList){
				var tbody = '<tbody><tr>';
				for (var node=0; node < data.nodeList.length; node++) {
				  if(node % 2 == 0 && node > 0){
				  	tbody += '</tr><tr>'
				  }
				  tbody += "<td>" + data.nodeList[node] + "</td>";
				};
				tbody+="</tr></tbody>";
				$('table.uniTable').append(tbody);
			}
		},
		_constructGraph : function(){
			var self = this;
						
			var margin = {top: 200, right: 200, bottom: 200, left: 200},
		    radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 10;
		
			var hue = d3.scale.category10();
			
			var luminance = d3.scale.sqrt()
			    .domain([0, 1e6])
			    .clamp(true)
			    .range([100, 10]);
			
			var svg = d3.select("div.uniprotDiv div.svgContainer").append("svg")
			    .attr("width", margin.left + margin.right)
			    .attr("height", margin.top + margin.bottom)
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
			var partition = d3.layout.partition()
			    .sort(function(a, b) { return d3.ascending(a.name, b.name); })
			    .size([2 * Math.PI, radius]);
			
			var arc = d3.svg.arc()
			    .startAngle(function(d) { return d.x; })
			    .endAngle(function(d) { return d.x + d.dx - .01 / (d.depth + .5); })
			    .innerRadius(function(d) { return radius / 3 * d.depth; })
			    .outerRadius(function(d) { return radius / 3 * (d.depth + 1) - 1; });
			
			var root = self.treeOfData;
			
			  // Compute the initial layout on the entire tree to sum sizes.
			  // Also compute the full name and fill color for each node,
			  // and stash the children so they can be restored as we descend.
			  partition
			      .value(function(d) { return d.size; })
			      .nodes(root)
			      .forEach(function(d) {
			        d._children = d.children;
			        d.sum = d.value;
			        d.key = key(d);
			        d.fill = fill(d);
			      });
			
			  // Now redefine the value function to use the previously-computed sum.
			  partition
			      .children(function(d, depth) { return depth < 2 ? d._children : null; })
			      .value(function(d) { return d.sum; });
			
			  var center = svg.append("circle")
			      .attr("r", radius / 3)
			      .attr("fill","white");
			      
			/*  svg.append("svg:a")
			      .attr("dx", function(d){return -50})
			      .attr("xlink:href","http://www.uniprot.org/keywords/" )
			      .attr("target", "_blank")
			    .append("text")
			      .attr("dx", function(d){return -50})
			      .text('&#xf08e');*/
  			
  				
			  
			  var path = svg.selectAll("path")
			      .data(partition.nodes(root).slice(1))
			    .enter().append("path")
			      .attr("d", arc)
			      .style("fill", function(d) { return d.fill; })
			      .each(function(d) { this._current = updateArc(d); })
			      .on("click", afficheInfo);
			      
			      
			
			function afficheInfo(d){
				$('div.uniprotDiv path').attr("class",'');
				$(this).attr("class",'selected');
				self._tableRefresh(d);
			}
			
			function key(d) {
			  var k = [], p = d;
			  while (p.depth) k.push(p.name), p = p.parent;
			  return k.reverse().join(".");
			}
			
			function fill(d) {
			  var p = d;
			  while (p.depth > 1) p = p.parent;
			  var c = d3.lab(hue(p.name));
			  c.l = luminance(d.sum);
			  return c;
			}
			
			function arcTween(b) {
			  var i = d3.interpolate(this._current, b);
			  this._current = i(0);
			  return function(t) {
			    return arc(i(t));
			  };
			}
			
			function updateArc(d) {
			  return {depth: d.depth, x: d.x, dx: d.dx};
			}
			
			d3.select(self.frameElement).style("height", margin.top + margin.bottom + "px");
		},
		closeWindows : function(){
			this.selectedNode = null;
			this.numberOfKw = 0;
			$('div.uniprotDiv').remove();
		}
	}//fin du return
}
