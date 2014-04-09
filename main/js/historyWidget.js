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
		historicData : [] ,
		eInfoMore : null,
		startBubbling : options.callbackBubbleStart ? options.callbackBubbleStart : startBubble,
		stopBubbling : options.callbackBubbleStop ? options.callbackBubbleStop : stopBubble,
		callbackInfo : options.callbackInfo? options.callbackInfo : callbackInfo,
		add : function (data){
			var self = this;
			if(data.type =="association"){
				if(self._verifAssoc(data)){return}
			}else{
				if(self._verifBiom(data)){return}
			}
			self.historicData.unshift(data);
			self.draw();
			
		},
		draw : function (){
			var self = this;
			console.log('lets draw');
			for (var i=0; i < self.historicData.length; i++) {
			  self.stopBubbling(self.historicData[i]) 
			};
			$(self.targetDomElem).find("div.historyWidjet").remove();
			$(self.targetDomElem).append("<div class ='historyWidjet " + self.status + "'>");
			self._constructHtml();
			$(self.targetDomElem).find(".toggle").click(function (){
				self._toggleStatus();
				self.draw();
			})
			$(self.targetDomElem).find("div.historyWidjet ul li").click(function (){
				self.eInfoMore = self.historicData[$(this).attr("index")]
				self.callbackInfo(self.eInfoMore);
				self.startBubbling(self.eInfoMore)
				
			})
			$("body").find('i.fa-remove-circle').on('click', function (){
				self.stopBubbling(self.eInfoMore);
				self.eInfoMore = null;
			});
			$(self.targetDomElem).find("div.historyWidjet ul li").hover(
				function (){
					self.startBubbling(self.historicData[$(this).attr("index")])
				},function (){
					self.stopBubbling(self.historicData[$(this).attr("index")]);
				}
			)
		},
		_verifAssoc : function(data){
			var self = this;
			for (var i=0; i < self.historicData.length; i++) {
				if(self.historicData[i].type == "association"){
			  		if(self.historicData[i].details.name == data.details.name){return true;}
				}
			};
			return false
		},
		_verifBiom : function(data){
			var self = this;
			for (var i=0; i < self.historicData.length; i++) {
				if(self.historicData[i].type != "association"){
			  		if(self.historicData[i].name == data.name){return true;}
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
		_constructHtml : function(){
			var self = this;
			var divCible = $(self.targetDomElem).find("div.historyWidjet");
			if(self.status == "mignified"){
				/* juste la taille qui nous interresse */
				var taille = self.historicData.length;
				if(taille == 0){divCible.hide()}
				divCible.addClass("toggle")
				divCible.append("Show more info  (" + taille + ")");
			}else{
				/* on affiche les info si il y en a */
				var content = "<div class = 'header'> Element info </div><ul class='fa-ul'>";
				for (var i=0; i < self.historicData.length; i++) {
					var name = self.historicData[i].name? self.historicData[i].name : self.historicData[i].details.name;
				  	content += "<li index = '" + i + "'><i class='fa fa-info-circle'></i>" + name + "</li>";
				};
				content += "</ul>";
				divCible.append(content);
				divCible.append("<div class = 'footer'><span class = 'toggle hideDiv'> Hide </span></div>");
			}
			
		},
	}
}