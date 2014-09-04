/**
 * composant permettant d'avoir un cart à jour sur plusieur page report en même temps via le cookie "cartCookie"
 * initialisation
 * var obj = initCart(options) => renvoi un objet qui contient toutes les méthodes du composant ainsi que les valeurs du cookie
 * options => {targetDiv : targetDiv}
 * pour dessiner le composant dans la div passer en option => obj.draw()
 * méthode publique: 
 * addItem(listeItem) => ajoute une liste d'item au cart
 * draw() => dessine le composant et ajoute les boutons dans la target div passer en options
 * @author Dorian Multedo
 */
function initCart (options){
	//Declare json stringify and initialize if needed
	$.cookie.json = true;
	if (! $.cookie('cartCookie') ) {
		$.cookie('cartCookie', {type : "cartCookie", data : []}, { path: '/' });
	}
	var defaultEaten =  $.cookie("cartCookie");
	if (! options.hasOwnProperty('targetDiv')) {
		alert("Cant start component w/out targetDiv");
		return;
	}
	
	var elem = $(options.targetDiv)[0]; // element du DOM matchant le selecteur  

	if (!elem) {
		alert("Cant get targetDiv element in document");
		return;
	}
	
    return {
	targetDomElem : elem,
	wrapperClass : 'mycart',
	wrapperSel : '.mycart',	
	data : defaultEaten.data,//data générer depuis le cookie
	tick : undefined,//clock
	rootUrl : options.rootUrl,
	rootUrlForNetwork : options.rootUrl + "/cgi-bin/current/iNavigatorGateWay",
	registerItem : {
	    'biomolecule' : '<i class="fa fa-spinner"></i>',
	    'publication' : '<i class="fa fa-book"></i>',
	    'goTerm' : '<i class="fa fa-pencil"></i>',
	    'keyword' : '<i class="fa fa-pencil"></i>'
	},
	_startTick : function () {//demarre le refresh
	    var self = this;
	    this.tick = window.setInterval(function(){self._tickPulse(self.data)},1000);
	},
	_stopTick : function () {//stop le refresh
	    var self = this;
	    window.clearInterval(self.tick);
	    self.tick = undefined;
	},		
	_isDataChanged : function () {//test chagement dans data
	    var eaten = $.cookie('cartCookie');
	    
	    var dataToCompare = eaten.data;
	    if (dataToCompare.length != this.data.length) { return dataToCompare;}
	    // Complete comprarison process here
	    return false;
	},
	_tickPulse : function(){//refresh
	    var self = this;
	     if(this.data.length > 0) {
		 this.setAlert("on");
	     }
	    //	self._hrefNetWork()
	    var newData = this._isDataChanged();
	    if (!newData) {
		return;
	    }
	    this.data = newData;
	    self.draw();
	    
	},
	_refreshCount : function (alert) {//alert booléen true or undef => change la pastille
	    var self = this;
	    $(self.targetDomElem).find('div>div.ico:first>div').remove();
	    $(self.targetDomElem).find('div>div.ico:first').append('<div id= "pastille" >' + self.data.length + '</div>');
	    if( self.data.length < 1){
		$(self.targetDomElem).find('div>div.ico:first>div').addClass('noData');
		$(self.targetDomElem).find('div.leftThing').removeClass("active")		
	    }else{
		$(self.targetDomElem).find('div.leftThing').addClass("active")
	    }
	},
	addItem : function(item){//ajoute un item au cart item {type : "type" :value : "name"}
	    var self = this;
	    
	    for (var i=0; i < self.data.length; i++) {
		if(self.data[i].value == item.value){return;}
	    };
	    var eaten = $.cookie('cartCookie');
	    self.data = eaten ? eaten.data : self.data;
	    self.data.push(item);
	    $.cookie('cartCookie',{type : 'cartCookie',  data : self.data});
	    self._refreshCount(true);
	    if($(self.targetDomElem).find('div>div.drop>ul').is(':visible')){self._clickDrop();}
	    $(self.targetDomElem).find('div>div.drop>ul').remove();		
	    $(self.targetDomElem).find('div>div.drop').append('<ul class="dropdown-menu liste "></ul>');
	    self._ajoutListe(self.data);			
			$(self.targetDomElem).find('div.cartDraw>div>div.drop>ul>li>div>div:last-child').click(function(){
														   self.delItem({value : $(this).parent().parent().attr('name')},true);
														   $(this).parent().remove();
														   event.stopPropagation();
													       });
			$(self.targetDomElem).find('div.cartDraw>div>div.drop>ul').click(function(){event.stopPropagation();});
	    
	    //			self._hrefNetWork()	    
	    self.setAlert("on");
	},
	setAlert : function (status) {
	  if (status === "on")
	      $(this.targetDomElem).find('i.fa-share-alt').addClass('alertNetwork');
	    if (status === "off") {
	      $(this.targetDomElem).find('i.fa-share-alt').removeClass('alertNetwork');
	  }
	},
	delItem : function(item,icoclick){//supprime un item du cart
	    var self = this;
	    
	    var valueList = [];
	    for (var i=0; i < self.data.length; i++) {
			  valueList.push(self.data[i].value);
	    };
	    var indexItem = valueList.indexOf(item.value);
	    if(indexItem<0){return}
            self.data.splice(indexItem,1);
    	    $.cookie('cartCookie',{type : 'cartCookie', data : self.data});
	    self.draw();
	    if(icoclick){self._clickDrop();}
	    //self._hrefNetWork()
	    if(this.data.length === 0) {
		this.setAlert("off");
	    }
	},
	_clear : function(){// supprime tout les items
	    var self = this;
	    $.cookie("cartCookie",{type : "cartCookie", data : []});
	    self.data = [];
	    self.draw();
	    //self._hrefNetWork()
	    return ;
	},
	draw : function(){// dessine le composant cart
	    var self = this ;
	    $(self.targetDomElem).find('div.cartDraw').remove();//ligne du dessous a la fin rajouter le link ver le constructeur
	    $(self.targetDomElem).append('<div class = "cartDraw"><div class = "clearDiv ">' 
					 + '<a class ="drop cog" data-toggle="dropdown ">'
					 // + '<div class="butWrap"><div class="networkBut"></div></div>'+ '<ul class="dropdown-menu liste">'+
					 //+ '<img id="networkBut" src="' + self.rootUrl + '/img/networkFont.png"></img>'  + '<ul class="dropdown-menu liste">'
					  + '<i class="fa fa-share-alt  fa-2x"></i></a><ul class="dropdown-menu liste">'
					 + '<li class = "liCart"><a class = "leftalign linkToNetwork" target = "_blank"><i class="fa fa-gavel"></i> Build items interactions network</a></li>'+
					 '<li class="liCart clearClick"><a class = "leftalign"><i class="fa fa-power-off"></i> Clear items list</a></li>'+
										 '<li class="divider"></li><li class="liCart"><a class = "leftalign" href = "https://www.youtube.com/channel/UCIVhIpz93GZkbWvSlK8KeWg"><i class ="fa fa-question"></i> Help</a></li></ul></div>'+
										 '<div class = "leftThing"><div class = "ico"><div id= "pastille" >' + self.data.length + '</div></div><div class = "drop ">'+
										 ' <a class ="drop" data-toggle="dropdown "><i class="fa fa-shopping-cart fa-2x icon-white dropArrow"></i></a>'+
										 '<ul class="dropdown-menu liste "></ul></div></div></div>');
			self._refreshCount(true)	
//			self._hrefNetWork()
			self._ajoutListe(self.data);
						$(self.targetDomElem).find('div.cartDraw>div>div.drop>ul>li>div>div:last-child').click(function(){
				self.delItem({value : $(this).parent().parent().attr('name')},true);
				$(this).parent().remove();
				event.stopPropagation();
				});
			$(self.targetDomElem).find('div.cartDraw>div>div.drop>ul').click(function(){event.stopPropagation();});
			$(self.targetDomElem).find('div.cartDraw > div.clearDiv > ul > li.clearClick').click(function(){self._clear()});
			$(self.targetDomElem).find('div>div.leftThing').click(function(){self._clickDrop()});
			$(self.targetDomElem).find('div>div.clearDiv').click(function(){self._clickMenu(this)});
			$(self.targetDomElem).click(function(event){
    			event.stopPropagation();
				});
			$('html').click(function() {
					if($(self.targetDomElem).find('div.cartDraw > div.clearDiv > ul').is(":visible")){self._clickMenu()};
					if($(self.targetDomElem).find('div.cartDraw > div.leftThing > div > ul').is(":visible")){self._clickDrop()};
				});
			//Starting clock
			if (!this.tick) {
				this._startTick();
			}

			$(self.targetDomElem).find('a.linkToNetwork')
				.on('click', function(event){
					self._doCartPost();
					event.preventDefault();
				});
			
		},
		_clickDrop : function(){ // devoile la liste
			var self = this;
			if(self.data.length == 0){return;}
			$.fx.off = true;
			$(self.targetDomElem).find('div>div.clearDiv').removeClass('tabSel');
			$(self.targetDomElem).find('div.cartDraw > div.clearDiv > a > i').removeClass('tabSel');
			$(self.targetDomElem).find('div>div.ico:first>div').removeClass('newAlert');
			$(self.targetDomElem).find('div>div.leftThing').toggleClass('tabSel')
			if($(self.targetDomElem).find('div.cartDraw > div.clearDiv > ul').is(':visible')){
				$(self.targetDomElem).find('div.cartDraw > div.clearDiv > ul').toggle();
			}
			$(self.targetDomElem).find('div.cartDraw > div > div.drop > a > i').toggleClass('tabSel');
			$(self.targetDomElem).find('div.cartDraw > div > div.ico').toggleClass('tabSel');
			$(self.targetDomElem).find('div.cartDraw > div > div.drop > ul').toggle();
			$.fx.off = false;
		},
		_ajoutListe : function(listeItem){// ajoute la liste d'item a la liste déroulante
			var self = this;
			var listeHide = $(self.targetDomElem).find('div.cartDraw > div > div.drop > ul.liste');
			for( i = 0 ; i < listeItem.length ; i++){
				var type = self._testType(listeItem[i].type);
				var item = "<li name = " + listeItem[i].value + " class = 'liCart'><div class = 'row-fluid'><div class= 'span2'>" + type + "</div><div class='span8 leftalign'>" + listeItem[i].value + "</div><div class='span2 lastDiv'><i class ='fa fa-times-circle pull-left' style='font-size:1.3em; color: rgb(187, 38, 38);'></i></div> </div></li>";
				listeHide.append(item);
			}
		},
		_testType : function(type){
			var self = this;
			var icone =""
			$.each(self.registerItem, function(name,line){
				if(name==type){icone = line;}
			});
			return icone;	
		},
		_clickMenu : function(){
			var self = this;
			$.fx.off = true;
			$(self.targetDomElem).find('div.cartDraw > div.clearDiv').toggleClass('tabSel');
			$(self.targetDomElem).find('div.cartDraw > div.clearDiv > a > i').toggleClass('tabSel');
			$(self.targetDomElem).find('div>div>div.drop').removeClass('tabSel');
			$(self.targetDomElem).find('div>div>div.ico').removeClass('tabSel');
			$(self.targetDomElem).find('div>div.leftThing').removeClass('tabSel')
			$(self.targetDomElem).find('div.cartDraw >div> div.drop > a > i').removeClass('tabSel');
			if ($(self.targetDomElem).find('div.cartDraw >div> div.drop > ul').is(':visible')){
				$(self.targetDomElem).find('div.cartDraw >div> div.drop > ul').toggle();}
			$(self.targetDomElem).find('div.cartDraw > div.clearDiv > ul').toggle();
			$.fx.off = false;
		},//following method is deprecated
		_hrefNetWork : function(){
			var self = this;
			var suiteOfUrl = "?"
			for (var i=0; i < self.data.length; i++) {
			  suiteOfUrl += self.data[i].type + "=" + self.data[i].value +"&";
			};
			suiteOfUrl = suiteOfUrl.substring(0,suiteOfUrl.length-1)		
		},
		_doCartPost : function (){
				if (!this.data) return;
				if (this.data.length === 0) return;				
				var self = this;
				var scaffold = '<form id="ghostCart" action="' + 
	                         self.rootUrlForNetwork
	                         + '" method="post" target="_blank">'
				 + '</form>';
    				 $(self.targetDomElem).find("#ghostCart").remove();
				 $(self.targetDomElem).append(scaffold);	
				 self.data.forEach(function(elem, i){
					 $(self.targetDomElem).find('#ghostCart')
					 .append('<input id="item_' + i + '" name="' + elem.type + '" type="hidden" ' + 
					         'value="' + elem.value  + '">');
				});
					$('#ghostCart').submit();
		}

	}
}


