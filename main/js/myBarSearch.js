/*
 
 
 */
function initMyBarSearch (options){
	
	$('#searchBar').tooltip();
	
	
	if (! options.hasOwnProperty('targetDiv')) {
		alert("Cant start component w/out targetDiv");
		return;
	}
	
	var elem = $(options.targetDiv)[0]; 
	
	if (!elem) {
		alert("Cant get targetDiv element in document");
		return;
	}
	var mapperCollection = initBarSearchMapper();

	var clickOnListElement = function () {}; // default callback on list element click override it using listElementClick contructor arguments
	
	var specifyHref = function(){};
	if(options.hasOwnProperty('staticHref')){
	    specifyHref = function (elem) {   // this is the whole component
		console.log("painting href");
		elem.attr('href', options.staticHref + '?type=' + elem.attr('data-type') + '&value=' + elem.attr('data-value'))
		    .attr('target',"_blank");
		
	    };	
	}
	
	if(options.hasOwnProperty('listElementClick')){
		 clickOnListElement = options.listElementClick;
	}
    
    return {
	specifyHref : specifyHref,
	targetDomElem : elem, //permet de selectionner la targetdiv
	barClass : 'mySearchBar', // la class de la div cible
	barSel : '.mySearchBar', // le selecteur
	history : [], //mémoire des recherces
	mappers : mapperCollection, //arrangement des sorties
	indexNav : -1, // nombre de recherche
	clickOnListElement : clickOnListElement, //callback sur un click d'un élément de la liste
	stopTime : undefined,
	
	generate : function(string){  // fonction de séléction : test si la recherche à déjà été effectué ou si il faut faire une requéte serveur
	    var self = this;
	    if(string.length < 3){
		self._stopSpin();
    		return;
    	    }
  	    $(self.targetDomElem).find('div.input-prepend>a>i').removeClass('icon-search');
	    $(self.targetDomElem).find('div.input-prepend>a>i').addClass('icon-spinner icon-spin');	
	    $(self.targetDomElem).find('div.afficheResult').remove();//détruit la recherche précédente
	    var data = self._getHistory (string); // get JSON datastructure in history 
	    
	    if (!data) {//si les données n'existent pas => l 38
		if (self.testWaiter(string)) { 
		    return;
		} else {
		    self.addWaiter(string);
		}
		self.loadFromServer(string);// récupération des données depuis le serveur
	    } else {
		self._drawResult(data); //sinon rappel des données
	    }
	},
	hideResult : function(){  //on cache la fenêtre de résultat
	    var self = this;
	    $(self.targetDomElem).find('div.afficheResult[prov="true"]').remove();
	    $(self.targetDomElem).find('div.afficheResult').hide();
	},	
	showResult : function(){ //on affiche la fenêtre résultat
	    var self = this;
	    if($(self.targetDomElem).find('div.afficheResult[prov="true"]').is(':visible')){
		return;
	    }
	    $(self.targetDomElem).find('div.afficheResult').show();	
	},
	_stopSpin : function(){
	    var self = this;
	    $(self.targetDomElem).find('div.input-prepend>a>i').removeClass('icon-spinner icon-spin');
	    $(self.targetDomElem).find('div.input-prepend>a>i').addClass('icon-search');
	},
	_setHistory : function (string, data) {// rajouter une recherche dans history
	    this.history.push ({ key : string, results : data });
	},
	_getHistory : function (string) { // recupérer les données dans history
	    for (var i = 0 ; i < this.history.length ; i++) {
		if (this.history[i].key === string) {
		    return this.history[i];					
		}
	    }
	    return false;
	},	
	_clickHistory : function(){ // devoile la liste history du groupes de boutons
	    var self = this;
	    $(self.targetDomElem).find('div.input-prepend>div.btn-group>ul').toggle('slow');
	    $(self.targetDomElem).find('div.input-prepend>div').toggleClass('open');
	    
	},
	loadFromServer : function (string) {
	    // downlaod json table conten
			var self = this;
	    var jqxhr = $.ajax({
        			   type: 'GET',
        			   dataType: 'json',
        			   data: { },
        			   url: 'cgi-bin/current/barSearch?key=' + string,
        		       })
        	.success (function (data) {
           		      self._setHistory(data.searchString, data.results);
    			      var currentString = $(self.targetDomElem).find('input').val();
    			      if (currentString === data.searchString) {// si l'input n'a pas changé
    				  var resData = self._getHistory(data.searchString);
    				  self.indexNav += 1;
    				  console.dir(data);
    				  self._drawResult(resData);
    			      }
      			  })
		.error(function (xhr, status, error) {
			   var err = eval("(" + xhr.responseText + ")");
			   alert(err.Message);
			});
   	},
	waitingString : {},
	addWaiter : function (string) { this.waitingString[string] = "AJAX_CALLED";},
	delWaiter : function (string) { delete this.waitingString[string];},  // inutile pour l'instant
	testWaiter : function (string) { return this.waitingString.hasOwnProperty(string) ?  true : false;},
	draw : function(){// barre de recherche on load
	    var self = this;
 	    
	    $(self.targetDomElem).addClass(self.barClass);
	    $(self.targetDomElem).append('<div class="input-prepend">'+
   					 '<span class="add-on"><i class="icon-search"></i></span>'+
   					 '<input class="inputBar" type="text" placeholder="Molecule Name or Id or Author...">'+
    					 '<a class="btn btn-small btn-info add-on " >'+
 					 '<i class="icon-search"></i></a>'+
  					 '</div>')
  	    var previousSearch ='<br>';
  	    
  	    $(self.targetDomElem).find('div.input-prepend').append(previousSearch);	
	    var elem = $(self.targetDomElem).find('input');
			
	    // Save current value of element
	    
	    
	    // Look for changes in the value
	    elem.bind("propertychange  input paste", function(event){ //recherche effectuer	
			  var string = elem.val();
			  clearTimeout(self.stopTime) //si il n'y a pas d'input pendant 1000 ms 
    			  stopTime = setTimeout(function(){self.generate(elem.val())},1000); 	//	on génére la page de résultat
			  
		      });
	    $(self.targetDomElem).click(function(event){// gestion de l'apparition ou disparition de affiche result
    					    event.stopPropagation();
					});
	    $('html').click(function() {// idem
				self.hideResult();
			    });
	    $(self.targetDomElem).find("input").focusin(function() {//idem
							    self.showResult(self);
							});  	
			
	},
	_drawResult : function(data){// affichage des résultats
	    var self = this;
	    $('input.inputBar').val(data.key); //data.key
	    var dropbox = '<div class="btn-group "><a class="btn btn-mini naviguePre" href="#"  name = "previous"><i class="icon-caret-left"></i> previous</a><a class="btn btn-mini more dropdown-toggle " data-toggle="dropdown">history (' + self.history.length + ')<span class="icon-caret-down"></span></a><a class="btn btn-mini navigueSuiv"  href="#" name="next">next <i class="icon-caret-right"></i></a><ul class="dropdown-menu "></ul></div>';
	    $(self.targetDomElem).find('div.input-prepend>div').remove();
	    $(self.targetDomElem).find('div.input-prepend').append(dropbox);
			for(i = 0 ; i < self.history.length ; i++){
			    $(self.targetDomElem).find('div.input-prepend>div.btn-group>ul').append('<li class="historySearch"><a class=" btn-link btn-mini" index="' + i + '" name="' + self.history[i].key + '">' + self.history[i].key + '</a></li');
			}	
	    $(self.targetDomElem).find('div.afficheResult').remove();
	    // setup a local results objects storing mapper results
	    var listeMapper ={}
	    jQuery.each(data.results,function(i,val){// appel au composant mapper pour la mise en forme des résultat
			    listeMapper[i] = self.mappers[i](val, { key : i, strict : true,  string : data.key, size : 100 })
			})
	    
	    self._stopSpin();
	    $(self.targetDomElem).append('<div class = "afficheResult" ></div>');
	    var widjet = $(self.targetDomElem).find('div.afficheResult');
	    widjet.css('position','absolute');
	    jQuery.each(listeMapper,function(i,liste){
			    var arrayitem = liste.length;
				if(arrayitem>0){
				    widjet.append('<div class = "afficheElem" name="' + i +'"><h4 class = "nomListe">'+ i +'</h4></div>');
				    var divSelector = 'div.afficheResult>div[name="'+i+'"]';	
				    if (arrayitem < 5){
					self._listeCreator(liste,$(self.targetDomElem).find(divSelector))	
				    }else{
					self._listeCreator(liste.slice(0,5),$(self.targetDomElem).find(divSelector))
					$(self.targetDomElem).find(divSelector).find('ul:last').append('<button type="button" class="btn btn-link btn-mini" name ="'+i+'">more</button>');
				    }
				    
				}
			});
	    
	    widjet.append('<button type="button" class="btn btn-link closer">Close</button>');
	    widjet.find('button.closer').click(function(){self.hideResult(widjet);});//bouton close
	    widjet.find('button.btn-mini').click(function(){self._drawSpeci(this.name,listeMapper);});//bouton more
	    $(self.targetDomElem).find('div.input-prepend>div>a').click(function(){// groupe de bouton
									    if($( this ).hasClass( 'dropdown-toggle' )){
										self._clickHistory();
									    }
									    if($(this).hasClass('naviguePre')){
										if (self.indexNav > 0){
										    self.indexNav -= 1
										    self._drawResult(self.history[self.indexNav]);	
										    
										}
									    }if($(this).hasClass('navigueSuiv')){
										if (self.indexNav < self.history.length-1){
										    self.indexNav += 1	
										    self._drawResult(self.history[self.indexNav]);						
										}
									    }
									    
									})
	    //click sur liste
	    widjet.find("div>ul>li>a").click(function(){
						 self.clickOnListElement();
					     });
	    
	    //tooltip
	    widjet.find("div>ul>li>a").tooltip();
	    
	    //bouton disable
	    if (self.indexNav == 0){
		$(self.targetDomElem).find('div.input-prepend>div>a.naviguePre').addClass("disabled");
	    }
	    if (self.indexNav == self.history.length -1){
		$(self.targetDomElem).find('div.input-prepend>div>a.navigueSuiv').addClass("disabled")
	    }
	    $(self.targetDomElem).find('div.input-prepend>div>ul>li>a').click(function(event){// liste history du groupe de boutons
										  self._clickHistory();
										  self.indexNav = $( this ).attr('index');
										  self.generate($( this ).attr('name'));
										  
									      })	
	    
	},
	_drawSpeci : function(name,data){// affiche la suite de la colonne
	    var self = this;
	    self.hideResult(); // on cache les résultat généraux
	    var key = data.key;
	    jQuery.each(data,function(i,val){
			    if(i === name){
				$(self.targetDomElem).append('<div class = "afficheResult" prov="true"><h4 class = "nomListe">'+ i +'</h3></div>');
				if (val.length < 20){ // gestion de l'affichage des résultats
				    self._listeCreator(val,$(self.targetDomElem).find('div.afficheResult[prov="true"]'))	
				}else{//on affiche 100 resultat max a raison de 20 item par colonne
				    var ncolonne = Math.floor(val.length/20);
				    var reste = val.length%20;
				    var compteur = 0;
				    if (ncolonne < 5){
							for(i = 0 ; i < ncolonne ; i++){
							    self._listeCreator(val.slice(i+compteur,i+compteur+20),$(self.targetDomElem).find('div.afficheResult[prov="true"]'))
							    compteur += 19;
							}
					self._listeCreator(val.slice(i+compteur,i+compteur+reste),$(self.targetDomElem).find('div.afficheResult[prov="true"]'))//self.key pour le name
				    }else{
					for(i = 0 ; i < 5 ; i++){
					    self._listeCreator(val.slice(i+compteur,i+compteur+20),$(self.targetDomElem).find('div.afficheResult[prov="true"]'))
					    compteur += 19;
					}
					$(self.targetDomElem).find('div.afficheResult[prov="true"]>ul:last').append('<button type="button" class="btn btn-link btn-mini">too many match find all</button>')
				    }
				}
				
				$(self.targetDomElem).find('div.afficheResult[prov="true"]>ul:last').append('<button type="button" class="btn btn-link closer btn-mini">less</button>');
				
			    }
			})
	    $(self.targetDomElem).find('div.afficheResult[prov="true"]>ul').css('width','17%');
	    $(self.targetDomElem).find('div.afficheResult[prov="true"]').append('<button type="button" class="btn btn-link closer">Close</button>')
			$(self.targetDomElem).find('div.afficheResult>ul>button').click(function(){//bouton less
											    self.hideResult();
											    self.showResult();
											})
	    $(self.targetDomElem).find('div.afficheResult>button.closer').click(function(){// bouton close
										    self.hideResult();
										})	
	    $(self.targetDomElem).find("div.afficheResult>ul>li>a").tooltip();	//tooltip
	    $(self.targetDomElem).find("div.afficheResult>ul>li>a").click(function(){
									      self.clickOnListElement();
									  });
	},
	_listeCreator : function(listeElement,divCible,name){
	    var self = this;
	    divCible.append('<ul class="resultMore"></ul>');
	    for (i = 0 ; i < listeElement.length ; i++){
		
				divCible.find('ul:last').append('<li class="historySearch">'+listeElement[i]+'</li>');
		var listElem = divCible.find('ul:last > li:last a');
		self.specifyHref(listElem);						
		//divCible.find('ul:last > li:last').each(function() {
		//self.clickOnResultCallback(this, this.attr('data-type'), this.attr('data-value'));
		//});
	    }
	}
    }
}