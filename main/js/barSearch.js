/*
 
 
 */
function initBarSearch (options){
	
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
	if(options.hasOwnProperty('staticHref')){/* here on a la generation du lien vers les report*/
	    specifyHref = function (elem) {   // this is the whole component
		elem.attr('href', options.staticHref + '?type=' + elem.attr('data-type') + '&value=' + elem.attr('data-value'))
		    .attr('target',"_blank");
	    };	
	}
	
	if(options.hasOwnProperty('listElementClick')){
		 clickOnListElement = options.listElementClick;
	}
    
    return {
	specifyHref : specifyHref,
	addCartNavCallback : options.addCartNavCallback ? options.addCartNavCallback : false,
	iNavContext : options.iNavContext ? true : false,
	rootUrl : options.rootUrl ? options.rootUrl :"",
	targetDomElem : elem, //permet de selectionner la targetdiv
	barClass : 'mySearchBar', // la class de la div cible
	barSel : '.mySearchBar', // le selecteur
	history : [], //mémoire des recherces
	mappers : mapperCollection, //arrangement des sorties
	indexNav : -1, // nombre de recherche
	clickOnListElement : clickOnListElement, //callback sur un click d'un élément de la liste
	stopTime : undefined,//utile pour la latence entre frappe et recherche
	humanOnly : true,
	nameColumn : {
		"biomolecule" : {
			id: "Biomolecule",
			tooltip : "coming Soon"
			},
		"keywrd" : {
			id:"UniProtKB",
			tooltip : "coming Soon"
			},
		"publication" : {
			id:"Publication",
			tooltip : '<div class = "postitSearchContent"><div class="postitTitle">Curation Level</div>'+
					  '<ul class="fa-ul">'+
					  '<li><i <i class="fa fa-star fa-li" style = "color:yellow"></i>IMEX</li>'+
					  '<li><i <i class="fa fa-star-o fa-li"></i>MIMIX</li></ul></div>'
			},
		"author" : {
			id:"Author",
			tooltip : 'Comming soon'
			},
	},
	
	generate : function(string){  // fonction de séléction : test si la recherche à déjà été effectué ou si il faut faire une requéte serveur
	    var self = this;
	    console.dir(string)
	    if(string.length < 3){
		self._stopSpin();
    		return;
    	    }
    	self._startSpin()  // debut de la rotation
  	    
	    $(self.targetDomElem).find('div.afficheResult').remove();//détruit la recherche précédente
	    var data = self._getHistory (string); // get JSON datastructure in history 
	    
	    if (!data) {//si les données n'existent pas
			if (self.testWaiter(string)) { 
		    	return;
			}else {
		    self.addWaiter(string);
			}
			self.loadFromServer(string);// récupération des données depuis le serveur
	    } else {
	    	if(self.iNavContext){
	    		self._drawNavResult(data)
	    	}else{
	    		self._drawResult(data); //sinon rappel des données
	    	}
			
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
	    $(self.targetDomElem).find('div.input-prepend>a>i').removeClass('fa-spinner fa-spin');
	    $(self.targetDomElem).find('div.input-prepend>a>i').addClass('fa-search');
	    $(self.targetDomElem).find('div.input-prepend>a').removeClass("search");
	    $(self.targetDomElem).find('div.input-prepend>a').addClass("btn-info btn");
	},
	_startSpin : function(){
		var self = this
		$(self.targetDomElem).find('div.input-prepend>a>i').removeClass('fa-search');
	    $(self.targetDomElem).find('div.input-prepend>a>i').addClass('fa-spinner fa-spin');	
	    $(self.targetDomElem).find('div.input-prepend>a').addClass("search");
	    $(self.targetDomElem).find('div.input-prepend>a').removeClass("btn-info btn");
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
	    // downlaod json table content
		var self = this;
		console.log(self.rootUrl + 'cgi-bin/current/barSearch?key=' + string)
	    var jqxhr = $.ajax({
        			   type: 'GET',
        			   dataType: 'json',
        			   data: { },
        			   url: self.rootUrl + '/cgi-bin/current/barSearch?key=' + string,
        		       })
        	.success (function (data) {
           		      self._setHistory(data.searchString, data.results);
    			      var currentString = $(self.targetDomElem).find('input').val();
    			      if (currentString.trim() === data.searchString) {// si l'input n'a pas changé
    				  var resData = self._getHistory(data.searchString);
    				  self.indexNav++;
    				  console.dir(data);
    				  if(self.iNavContext){self._drawNavResult(resData);}
    				  else{self._drawResult(resData);}
    			      }
      			  })
		.error(function (xhr, status, error) {
			   var err = eval("(" + xhr.responseText + ")");
			   alert(err.Message);
			});
   	},/*gestion ajax*/
	waitingString : {},
	addWaiter : function (string) { this.waitingString[string] = "AJAX_CALLED";},
	delWaiter : function (string) { delete this.waitingString[string];},  // inutile pour l'instant
	testWaiter : function (string) { return this.waitingString.hasOwnProperty(string) ?  true : false;},
	
	/*----------------barre de recherche-------------------*/
	draw : function(){// barre de recherche on load
	    var self = this;
	    
	    $(self.targetDomElem).addClass(self.barClass);
	    $(self.targetDomElem).append('<div class="input-prepend">'+
   					 '<span class="add-on"><i class="fa fa-search"></i></span>'+
   					 '<input class="inputBar" type="text" placeholder="Molecule Name or Id or Author...">'+
    					 '<a class="btn btn-small btn-info add-on " >'+
 					 '<i class="fa fa-search"></i></a>'+
  					 '</div>');
	    var elem = $(self.targetDomElem).find('input');
			
	    // Save current value of element
	    
	    
	    // Look for changes in the value
	    elem.bind("propertychange  input paste", function(event){ //recherche effectuer	
			  var string = elem.val();
			  console.dir(string);
			  clearTimeout(self.stopTime); //si il n'y a pas d'input pendant 1000 ms 
    		  self.stopTime = setTimeout(function(){self.generate(elem.val())},1000); 	//	on génére la page de résultat
			  
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
/*--------------------------------------------------------------------------
 partie navigateur*/
	_drawNavResult : function (data){
		var self = this;
		$(self.targetDomElem).find('div.afficheResult').remove();
	    // setup a local results objects storing mapper results
	    var listeMapper ={biomolecule : [], publication : []};
	    jQuery.each(data.results,function(type,val){// appel au composant mapper pour la mise en forme des résultat
	    		    if(type == "biomolecule" || type =="publication"){
	    			for (var i = 0; i < val.length; i++) {
				    if (val[i].count === "0") 
					continue;				    
				    listeMapper[type].push(self._resultNav(val[i]));
				}; 
			    }
			});
	    
	    self._stopSpin();
	    $(self.targetDomElem).append('<div class = "afficheResult" ></div>');
	    var widjet = $(self.targetDomElem).find('div.afficheResult');
	    widjet.css('position','absolute');
		var tab = '<ul style = "width:100%;" class="nav nav-tabs" id="myTab">' +
 				  
				  '<div  class=" closer navCloser"><i class="fa fa-minus-square-o"></i></div></ul>'+
				  '<div class="tab-content">'+
				  '</div>';
				  
		
		widjet.append(tab);
		/* Rajout des tab si contenu*/
		if(listeMapper.biomolecule.length > 0){
			var listeBio = self._tableHtmlCreator(listeMapper.biomolecule)
			widjet.find('ul.nav').append(' <li class="active"><a href="#biomol">Biomolecule (' + listeMapper.biomolecule.length+ ')</a></li>')
			widjet.find('div.tab-content').append('<div class="tab-pane active" id="biomol">' + listeBio + '</div>')
		}
 		if(listeMapper.publication.length > 0){
 			var listePubli = self._tableHtmlCreator(listeMapper.publication)
 			widjet.find('ul.nav').append(' <li><a href="#publi">Publication (' + listeMapper.publication.length+ ')</a></li>');
 			widjet.find('div.tab-content').append('<div class="tab-pane" id="publi">' + listePubli + '</div>')
 		}
 		if(listeMapper.publication.length == 0 && listeMapper.biomolecule.length == 0){
 			widjet.find('ul.nav').append(' <li><i class="fa fa-warning"></i> No match found</li>');
 		}
		$('#myTab a').click(function (e) {
  			e.preventDefault();
  			$(this).tab('show');
		})
		var taille = $(self.targetDomElem).find('div.input-prepend input').width()
		var resize = $(self.targetDomElem).find('table.inTab tr').width()
		if(taille > 305){widjet.width(taille);}
 		widjet.find("div.tooltipContent").tooltip();
 		$( window ).resize(function() {
 			taille = $(self.targetDomElem).find('div.input-prepend input').width()
  			if(taille > 305){widjet.width(taille);}
		});
 		widjet.find("div.tab-pane a").click(function(){
 			var critObj = {};
 			if($(this).attr("data-original-title")){critObj.description = $(this).attr("data-original-title");}
 			else{critObj.description = $(this).text();}
			critObj.name = $(this).attr("data-value");
			critObj.type = $(this).attr("data-type"); 			
 			self.addCartNavCallback(critObj);
 		})
 		widjet.find("div.navCloser").click(function(){
 			self.hideResult();
 		});
	},
	_resultNav: function(data){
		var newString = "";
		if(data.Title){
			var longText = data.Title
			var type = "publication"
		}
		if(data.name){
			var longText = data.name
			var type = "biomolecule"
		}
		if(data.count){
			if(data.count>0){ newString = "(" + data.count + ")";}
		}
		var dataAttr = 'data-type="' + type + '" data-value="' + data.id + '"';
		if(!longText){return "error bug"}
		newString= '<a ' + dataAttr + '>' + longText + '</a>';
		return newString;
		
	},
	_tableHtmlCreator : function(listeElem){
		var self = this;
		var littSortable = {}
		for (var i=0; i < listeElem.length; i++) {
		  littSortable[$(listeElem[i]).attr("data-value")] = listeElem[i];
		};
		var listeMult = [];
		var listeOther = [];
		var listeGag = [];
		var listeLip = [];
		var listePfrag = [];
		$.each(littSortable , function(name,desc){
 			if (name.indexOf("MULT") >= 0){ listeMult.push(name);}
            else if(name.indexOf("GAG") >= 0) {listeGag.push(name);}
  			else if(name.indexOf("PFRAG") >= 0) {listePfrag.push(name);}
  			else if(name.indexOf("LIP") >= 0) {listeLip.push(name);}
            else{listeOther.push(name);}
		});
		listeMult.sort(sortAlphaNum);
		listeGag.sort(sortAlphaNum);
		listeLip.sort(sortAlphaNum);
		listePfrag.sort(sortAlphaNum);
		listeOther.sort(sortAlphaNum);
		var returnString = "<table class = 'inTab'>"
		var addRow = function (liste){
			for (var i=0; i < liste.length; i++) {
		 		returnString += "<tr><td>" + liste[i] + "</td><td>" + littSortable[liste[i]] + "</td></tr>"
			};
		};
		addRow(listeMult);
		addRow(listeGag)
		addRow(listePfrag)
		addRow(listeLip)
		addRow(listeOther)
		returnString += "</table>"
		return returnString;
	},
/*fin navigateur
 -----------------------------------------------------------------------------------------------------------
	debut index 
 */
	_drawResult : function(data){// affichage des résultats
	    var self = this;
	    self._stopSpin();
	    $('input.inputBar').val(data.key); //data.key
	    var dropbox = '<div class="btn-group history">' + 
	    			  '<a class="btn btn-mini naviguePre" name = "previous"><i class="fa fa-caret-left"></i> previous</a>'+
	    			  '<a class="btn btn-mini more dropdown-toggle " data-toggle="dropdown">history (' + self.history.length + ')'+
	    			  '<span class="fa fa-caret-down"></span></a>'+
	    			  '<a class="btn btn-mini navigueSuiv" name="next">next <i class="fa fa-caret-right"></i></a>'+
	    			  '<ul class="dropdown-menu "></ul></div>';
	    $(self.targetDomElem).find('div.input-prepend>div').remove();
	    $(self.targetDomElem).find('div.input-prepend').append(dropbox);
			for(i = 0 ; i < self.history.length ; i++){
			    $(self.targetDomElem).find('div.input-prepend>div.btn-group>ul').append('<li class="historySearch">' +
			    																		'<a class=" btn-link btn-mini" index="' + i + '" name="' + self.history[i].key + '">' +
			    																		 self.history[i].key + '</a></li');
			}	
	    $(self.targetDomElem).find('div.afficheResult').remove();
	    // setup a local results objects storing mapper results
	    var listeMapper = {}
	    
	  
	    jQuery.each(data.results,function(i,val){// appel au composant mapper pour la mise en forme des résultat
				    listeMapper[i] = self.mappers[i](val, { key : i, strict : false,  string : data.key})
			});
	    console.dir(listeMapper.biomolecule);
	    
	    $(self.targetDomElem).append('<div class = "afficheResult" ></div>');
	    var widjet = $(self.targetDomElem).find('div.afficheResult');
	    widjet.css('position','absolute');
	    widjet.append('<span class = "noRes"><i class="fa fa-warning"></i> No match found</span>');
	    jQuery.each(listeMapper,function(i,liste){
			    var arrayItem = liste.length;
			    console.dir(self.nameColumn[i].id)
			     if(arrayItem>0 && i != "biomolecule"){//si ya de l'info on créer 
					
						widjet.find("span.noRes").remove();
						var plural = '';
						if(arrayItem>1){plural = 's'}
				    	widjet.append('<div class = "afficheElem" name="' + i +'">'+
				    				  '<h4 class = "nomListe">'+ self.nameColumn[i].id + plural + ' (' + arrayItem + ')'+
				    				  //'<div class = "pull-right tooltipContain" data-toggle="tooltip" data-html = "true" data-delay=\'{"show":"1000", "hide":"1000"}\' '+
				    				  //'data-title=' + self.nameColumn[i].tooltip + '>'+
				    				  '<i class="fa fa-question-circle pull-right" style = "margin-right: 20px;"></i>' +
				    				  '</h4></div>');
				    	widjet.find('i.fa-question-circle').tooltip({html : true, title: self.nameColumn[i].tooltip});
				    	var divSelector = 'div.afficheResult>div[name="'+i+'"]';
				    	if (arrayItem < 5){
							self._listeCreator(liste,$(self.targetDomElem).find(divSelector))	
				    	}else{
							self._listeCreator(liste.slice(0,5),$(self.targetDomElem).find(divSelector))
							$(self.targetDomElem).find(divSelector).find('ul:last').append('<button type="button" class="btn btn-link btn-mini" name ="'+i+'">more</button>');
				    	}
				    	
				}else if(i == "biomolecule" && liste[0].length > 0){
						widjet.find("span.noRes").remove();
						var numList = 0;
						var checkBox = '<i class = "fa fa-square-o"></i> ';
						if(self.humanOnly){
							numList = 1;
							checkBox = '<i class = "fa fa-check-square-o"></i> ';
						}
						arrayItem = liste[numList].length;
						var plural = '';
						if(arrayItem>1){plural = 's'}
						widjet.append('<div class = "afficheBiom" name="' + i +'">'+
									  '<h4 class = "nomListe"> <div class ="humanOnly">' + checkBox + ' Human only</div>'+ 
									  self.nameColumn[i].id + plural + ' (' + arrayItem + ')'+
				    				  '<div class = "pull-right tooltipContain" data-toggle="tooltip" data-html = "true" data-delay=\'{"show":"1000", "hide":"1000"}\' '+
				    				  'data-title="' + self.nameColumn[i].tooltip + '" >'+
				    				  '<i class="fa fa-question-circle pull-right" style = "margin-right: 20px;"></i>' +
				    				  '</h4></div>');
						if (arrayItem < 5){
							self._listeCreatorBiom(liste[numList],widjet.find("div.afficheBiom"));
				   		}else if(arrayItem <= 10){
				   			widjet.find("div.afficheBiom").append("<div class = 'ulContain left'></div><div class = 'ulContain right'></div>");
				   			self._listeCreatorBiom(liste[numList].slice(0,5),widjet.find("div.afficheBiom").find("div.left"));
				   			self._listeCreatorBiom(liste[numList].slice(5,liste[numList].length),widjet.find("div.afficheBiom").find("div.right"));
				   		}
				   		else{
				   			widjet.find("div.afficheBiom").append("<div class = 'ulContain left'></div><div class = 'ulContain right'></div>");
							self._listeCreatorBiom(liste[numList].slice(0,5),widjet.find("div.afficheBiom").find("div.left"));
				   			self._listeCreatorBiom(liste[numList].slice(5,10),widjet.find("div.afficheBiom").find("div.right"));
							widjet.find("div.afficheBiom").find('ul:last').append('<button type="button" class="btn btn-link btn-mini" name ="'+i+'">more</button>');
				    	}
					}
			});
	    
	    widjet.append('<button type="button" class="btn btn-link closer">Close</button>');
	    widjet.find('button.closer').click(function(){self.hideResult(widjet);});//bouton close
	    widjet.find('button.btn-mini').click(function(){;self._drawSpeci(this.name,listeMapper);});//bouton more
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
	    widjet.find("div>ul>li a").click(function(){
						 self.clickOnListElement();
					     });
	    $(self.targetDomElem).find('div.humanOnly').click(function(){
	    	self._clickHuman(data,"classique");
	    })
	    //tooltip
	    widjet.find("div>ul>li div").tooltip();
	    console.dir($(self.targetDomElem).find(".tooltipContain"))
		$(self.targetDomElem).find(".tooltipContain").tooltip();
	    
	    //bouton disable
	    if (self.indexNav == 0){
		$(self.targetDomElem).find('div.input-prepend>div>a.naviguePre').addClass("disabled");
	    }
	    if (self.indexNav == self.history.length -1){
		$(self.targetDomElem).find('div.input-prepend>div>a.navigueSuiv').addClass("disabled")
	    }
	    $(self.targetDomElem).find('div.input-prepend div ul li a').click(function(event){// liste history du groupe de boutons
										  self._clickHistory();
										  self.indexNav = $( this ).attr('index');
										  self.generate($( this ).attr('name'));
										  
									      })	
	    
	},
	_drawSpeci : function(name,data){// affiche la suite de la colonne
	    var self = this;
	    self.hideResult(); // on cache les résultat généraux
	    var key = data.key;
	    var button = '';
	    
	    if (name === 'biomolecule'){
	    	var checkBox = '<i class = "fa fa-square-o"></i>';
	    	var numListe = 0 
	    	if(self.humanOnly){
	    		numListe = 1
	    		checkBox = '<i class = "fa fa-check-square-o"></i>';
	    	} 
	    	button = '<div class ="humanOnly">' + checkBox + ' Human only</div>';
	    }
	    jQuery.each(data,function(i,val){
			    if(i === name){
			    	if (name === 'biomolecule'){
			    		val = val[numListe];
			    	}
			    	var plural = '';
						if(val.length>1){plural = 's'}
					$(self.targetDomElem).append('<div class = "afficheResult" prov="true"><h4 class = "nomListe">'+ button + self.nameColumn[i].id + plural + ' (' + val.length + ')'+
				    				  '<i class="fa fa-question-circle pull-right" style = "margin-right: 20px;"></i>' +
				    				  '</h4></div>');
				    $(self.targetDomElem).find('i.fa-question-circle').tooltip({html : true, title: self.nameColumn[i].tooltip});
					if (val.length < 20){ // gestion de l'affichage des résultats
					    self._listeCreator(val,$(self.targetDomElem).find('div.afficheResult[prov="true"]'))	
					}else{//on affiche 60 resultat max a raison de 20 item par colonne
				    	var ncolonne = Math.floor(val.length/20);
				   		var reste = val.length%20;
				  	 	var compteur = 0;
				    	if (ncolonne < 3){
							for(i = 0 ; i < ncolonne ; i++){
							    self._listeCreator(val.slice(i+compteur,i+compteur+20),$(self.targetDomElem).find('div.afficheResult[prov="true"]'))
							    compteur += 19;
							}
						self._listeCreator(val.slice(i+compteur,i+compteur+reste),$(self.targetDomElem).find('div.afficheResult[prov="true"]'))//self.key pour le name
				    	}else{
							for(i = 0 ; i < 3 ; i++){
					    		self._listeCreator(val.slice(i+compteur,i+compteur+20),$(self.targetDomElem).find('div.afficheResult[prov="true"]'))
					    		compteur += 19;
						}
						$(self.targetDomElem).find('div.afficheResult[prov="true"]>ul:last').append('<button type="button" class="btn btn-link btn-mini">too many match find all</button>')
				    }
				}
				
				$(self.targetDomElem).find('div.afficheResult[prov="true"]>ul:last').append('<button type="button" class="btn btn-link closer btn-mini">less</button>');
				
			    }
			})
	    $(self.targetDomElem).find('div.afficheResult[prov="true"]>ul').css('width','28%');
	    $(self.targetDomElem).find('div.afficheResult[prov="true"]').append('<button type="button" class="btn btn-link closer">Close</button>')
	    $(self.targetDomElem).find('div.afficheResult[prov="true"] div.humanOnly').click(function(){
	    	self._clickHuman(data,"speci",name);
	    })
		$(self.targetDomElem).find('div.afficheResult>ul>button').click(function(){//bouton less
											    self.hideResult();
											    self.showResult();
											})
	    $(self.targetDomElem).find('div.afficheResult>button.closer').click(function(){// bouton close
										    self.hideResult();
										})	
	    $(self.targetDomElem).find("div.afficheResult ul li div").tooltip();	//tooltip
	    $(self.targetDomElem).find("div.afficheResult>ul li a").click(function(){
									      self.clickOnListElement();
									  });
	},
	_listeCreator : function(listeElement,divCible){
	    var self = this;
	    divCible.append('<ul class="resultMore "></ul>');
	    for (i = 0 ; i < listeElement.length ; i++){
				divCible.find('ul:last').append('<li class="historySearch">'+listeElement[i]+'</li>');
		var listElem = divCible.find('ul:last > li:last a');
		self.specifyHref(listElem);						
		//divCible.find('ul:last > li:last').each(function() {
		//self.clickOnResultCallback(this, this.attr('data-type'), this.attr('data-value'));
		//});
	    }
	},
	_listeCreatorBiom : function(listeElement,divCible){
	    var self = this;
	    divCible.append('<ul class="resultMore "></ul>');
	    for (i = 0 ; i < listeElement.length ; i++){
			divCible.find('ul:last').append('<li class="historySearch">'+listeElement[i]+'</li>');
			var listElem = divCible.find('ul:last > li:last a');
			self.specifyHref(listElem);						
	    }
	},
	_clickHuman : function(data,typeOfDraw,name){
		var self = this;
		if (self.humanOnly){
			self.humanOnly = false;
		}else{
			self.humanOnly = true;
		}
		if(typeOfDraw ==='classique'){
			self._drawResult(data);
		}else{
			var searchString = $(self.targetDomElem).find("input.inputBar").val();
			var dataClass = self._getHistory (searchString);
			self._drawResult(dataClass);
			self._drawSpeci(name, data);
			
		}
	}
    }//fin du return
}