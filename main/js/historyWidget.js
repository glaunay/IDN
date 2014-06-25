/*
  vizObject.historicHover = initHistoricHover({target : 'body'});
  vizObject.historicHover.draw();
  vizObject.historicHover.add(d);
*/
function initHistoricHover (options){
	if (! options.hasOwnProperty('target')) {
		alert("Cant start component w/out targetDiv");
		return;
	}
	var elem = $(options.target)[0]; 
	if (!elem) {
		alert("Cant get targetDiv element in document");
		return;
	}
	var startBubble = function(data){
		console.log("defaultBubble");
		console.dir(data);
	}
	var stopBubble = function (){
		console.log('stop bubbling');
	}  
	var callbackInfo = function (data){
		console.log("click");
		console.dir(data);
	}
	return {
		targetDomElem : elem, //permet de selectionner la targetdiv
		historicClass : 'historicDiv', // la class de la div cible
		status : "mignified" ,// "magnified"/"mignified"
		historicDataNode : [] ,
		historicDataLink : [] ,
		eInfoMore : null,
		startBubbling : options.callbackBubbleStart ? options.callbackBubbleStart : startBubble,
		stopBubbling : options.callbackBubbleStop ? options.callbackBubbleStop : stopBubble,
		callbackInfo : options.callbackInfo? options.callbackInfo : callbackInfo,
		add : function (data){
			var self = this;
			if(data.type =="association"){
				self._verifAssoc(data)
				self.historicDataLink.unshift(data);
			}else{
				self._verifBiom(data)
				self.historicDataNode.unshift(data);
			}
			self.draw();
			
		},
		draw : function (){
			var self = this;
			for (var i=0; i < self.historicDataLink.length; i++) {
			  self.stopBubbling(self.historicDataLink[i]) 
			};
			for (var i=0; i < self.historicDataNode.length; i++) {
			  self.stopBubbling(self.historicDataNode[i]) 
			};
			
			var active = "node";
			if($(self.targetDomElem).find("div.historyWidjet div#link").hasClass("active")){
				active ="link";
			}
			$(self.targetDomElem).find("div.historyWidjet").remove();
			$(self.targetDomElem).append("<div id = 'historic' class ='historyWidjet " + self.status + "'>");
			self._constructHtml(active);
			
			$(self.targetDomElem).find(".toggle").click(function (){
				self._toggleStatus();
				self.draw();
			});
			$(self.targetDomElem).find("div.historyWidjet div#node ul li").click(function (){
				self.eInfoMore = self.historicDataNode[$(this).attr("index")]
				self.callbackInfo(self.eInfoMore);
				self.startBubbling(self.eInfoMore)
				
			});
			$(self.targetDomElem).find("div.historyWidjet div#link ul li").click(function (){
				self.eInfoMore = self.historicDataLink[$(this).attr("index")]
				self.callbackInfo(self.eInfoMore);
				self.startBubbling(self.eInfoMore)
			});	
			$("body").find('i.fa-remove-circle').on('click', function (){
				self.stopBubbling(self.eInfoMore);
				self.eInfoMore = null;
			});
			$(self.targetDomElem).find("div.historyWidjet div#link ul li").hover(
				function (){
					self.startBubbling(self.historicDataLink[$(this).attr("index")])
				},function (){
					self.stopBubbling(self.historicDataLink[$(this).attr("index")]);
				}
			);
			$(self.targetDomElem).find("div.historyWidjet div#link ul li").hover(
				function (){
					self.startBubbling(self.historicDataLink[$(this).attr("index")])
				},function (){
					self.stopBubbling(self.historicDataLink[$(this).attr("index")]);
				}
			);
			$(self.targetDomElem).find("div.historyWidjet div#node ul li").hover(
				function (){
					self.startBubbling(self.historicDataNode[$(this).attr("index")])
				},function (){
					self.stopBubbling(self.historicDataNode[$(this).attr("index")]);
				}
			)
		},
		_verifAssoc : function(data){
			var self = this;
			for (var i=0; i < self.historicDataLink.length; i++) {
				
			  	if(self.historicDataLink[i].details.name == data.details.name){
			  		self.historicDataLink.splice(i,1);
			  		return; 
			  	}
				
			};
			return ;
		},
		_verifBiom : function(data){
			var self = this;
			for (var i=0; i < self.historicDataNode.length; i++) {
		  		if(self.historicDataNode[i].name == data.name){
		  			self.historicDataNode.splice(i,1);
		  			return ;
		  		}
			};
			return false
		},
		_toggleStatus : function(){
			var self = this;
			if(self.status == "mignified"){
				self.status = "magnified"
			}else{
				self.status = "mignified"
			}
		},
		_constructHtml : function(tabActive){
			var self = this;
			var activeNode = ""
			var activeLink = ""
			if(tabActive === "node"){
				activeNode = 'active';
			}else{
				activeLink = 'active';
			}
			var tailleNode = self.historicDataNode.length;
			var tailleLink = self.historicDataLink.length
			var tailleTot = tailleNode + tailleLink;
			var divCible = $(self.targetDomElem).find("div.historyWidjet");
			if(self.status == "mignified"){
				/* juste la taille qui nous interresse */
				
				if(tailleTot == 0){divCible.hide()}
				divCible.addClass("toggle")
				divCible.append("<i class='fa fa-search-plus fa-4x pull-left'></i> <div class = 'compteurGen'>" + tailleTot + "</div>");
			}else{
				/* on affiche les info si il y en a */
				var content = '<div class = "header"> Recently visited elements </div><ul class="nav nav-tabs">'
									+'<li class="' + activeNode + '"><a href="#node" data-toggle="tab">Node (' + tailleNode + ')</a></li>'
							  		+'<li class="' + activeLink + '"><a href="#link" data-toggle="tab">Link (' + tailleLink +')</a></li>'
								+'</ul>'
								+'<div class="tab-content">'
						  			+'<div class="tab-pane ' + activeNode + '" id="node"><ul class="fa-ul node"></ul></div>'
						  			+'<div class="tab-pane ' + activeLink + '" id="link"><ul class="fa-ul link"></ul></div>'
					  			+'</div>';
				divCible.append(content);
				var linkList = '';
				for (var i=0; i < self.historicDataLink.length; i++) {
					var name = self.historicDataLink[i].name? self.historicDataLink[i].name : self.historicDataLink[i].details.name;
				  	linkList += "<li index = '" + i + "'><i class='fa fa-search'></i>" + name + "</li>";
				};
				var nodeList = '';
				for (var i=0; i < self.historicDataNode.length; i++) {
					var name = self.historicDataNode[i].name? self.historicDataNode[i].name : self.historicDataNode[i].details.name;
				  	nodeList += "<li index = '" + i + "'><i class='fa fa-search'></i>" + name + "</li>";
				};
				
				divCible.find("div#node ul.node").append(nodeList)
				divCible.find("div#link ul.link").append(linkList)
				divCible.append("<div class = 'footer'><span class = 'toggle hideDiv'> Hide </span></div>");
			}
			
		},
		getSelectors : function(){
	    	return {maxi : "#historic", mini:  "#historic"};
    }	   
	}
}