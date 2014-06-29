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
	
	var graphSearchCallback =function(){
		console.dir("here")
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
    graphSearchCallback : options.graphSearchCallback ? options.graphSearchCallback : graphSearchCallback,
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
	grapheSearch : false,
	currentStringForGraphSearch : false,
	clickOnListElement : clickOnListElement, //callback sur un click d'un élément de la liste
	stopTime : undefined,//utile pour la latence entre frappe et recherche
	humanOnly : true,
	nameColumn : {
		"biomolecule" : {
			id: "Biomolecule",
			tooltip : "<div class = 'postitSearchContent'><div class='postitTitle'>List of biomolecule(s) found in Matrixdb</div>" +
					  "<p>Biomolecule can be protein, bioactive fragment, complex, glycosaminoglycan, ion, lipid or inorganic.</p>"+
					  "<ul class ='fa-ul'><li><i class='fa fa-hand-o-right'></i>"+
					  " Hits are ranked according to their number of known interactions within the database.</li>"+
					  "<li><v"+
					  " For each hit, gene name(s) and specie as a logo are provided.</li>"+
					  "<li><i class='fa fa-hand-o-right'></i>"+
					  " Please note the check box to restrict hits to human only.</li></div>"

			},
		"keywrd" : {
			id:"UniProtKB keyword",
			tooltip : "<div class = 'postitSearchContent'><div class='postitTitle'>List of annotation terms found in Matrixdb</div>"+
					  "<p>Annotation terms are part of <a target='_blank' href='help uni'>UniprotKB controlled vocabulary</a></p></div>"

			},
		"publication" : {
			id:"Publication",
			tooltip : '<div class = "postitSearchContent"><div class="postitTitle">List of publication(s) found in Matrixdb</div>'+
					  '<p>Yellow stars highlight publications with an imex identifier</p><p><i class="fa fa-hand-o-right"></i> The number of interactions reported in each publication is also mentioned</p></div>'
			},
		"author" : {
			id:"Author",
			tooltip : "<div class = 'postitSearchContent'><div class='postitTitle'>List of publication author(s) found in Matrixdb</div>"+
					  "<p>For each author, a number indicates the total of interactions reported in all his/her publication(s)</p></div>"
			},
	},
	
	generate : function(string){  // fonction de séléction : test si la recherche à déjà été effectué ou si il faut faire une requéte serveur
	    var self = this;
	    
	    if(string.length < 3){
			self._stopSpin();
    		return;
    	    }
    	    
    	self.currentStringForGraphSearch = string
    	
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
		    		//console.dir(data)
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
	    self._dbGraphChoise();
	},
	_stopSpin : function(){
	    var self = this;
	    $(self.targetDomElem).find('div.input-prepend span.add-on i').removeClass('fa-spinner fa-spin');
	    $(self.targetDomElem).find('div.input-prepend span.add-on i').addClass('fa-search');
	    $(self.targetDomElem).find('div.input-prepend span.add-on ').removeClass("search");
	    $(self.targetDomElem).find('div.input-prepend span.add-on').css("background-color","rgb(238, 238, 238)");
	},
	_startSpin : function(){
		var self = this
		$(self.targetDomElem).find('div.input-prepend span.add-on i').removeClass('fa-search');
	    $(self.targetDomElem).find('div.input-prepend span.add-on i').addClass('fa-spinner fa-spin');	
	    $(self.targetDomElem).find('div.input-prepend span.add-on ').addClass("search");
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
		//console.log(self.rootUrl + 'cgi-bin/current/barSearch?key=' + string)
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
    				  //console.dir(data);
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
	    
	    var drawBarsearch =  '<div class="input-prepend">'+
		   					 '<span class="add-on"><i class="fa fa-search"></i></span>'+
		   					 '<input class="inputBar" type="text" placeholder="Search For ...">';
		
		if(self.iNavContext){
			drawBarsearch += '<a class="btn btn-small add-on matrixdb active">MatrixDB</a>'+
							 '<a class="btn btn-small add-on graph">network</a>';
		}
		drawBarsearch += '</div>';
	    $(self.targetDomElem).append(drawBarsearch);
	 	if(!self.iNavContext){
	 		$(self.targetDomElem)
			.find("input.inputBar")
			.attr("placeholder","Search for a biomolecule, annotation term, author, publication or IMeX identifier");
	 	}
	    var elem = $(self.targetDomElem).find('input');
		$(self.targetDomElem).find("a").tooltip();
	    // Save current value of element
	    
	    
	    // Look for changes in the value
	    elem.bind("propertychange  input paste", function(event){ //recherche effectuer	
			  var string = elem.val().toLowerCase();
			  
			  if(self.iNavContext){
			  	vizObject.core.bubbleNodeClear();
			  }
			  
			  clearTimeout(self.stopTime); //si il n'y a pas d'input pendant 1000 ms 
    		  self.stopTime = setTimeout(function(){elem.val(string.toLowerCase());self.generate(elem.val())},1000); 	//	on génére la page de résultat
			  
		      });
	    $(self.targetDomElem).click(function(event){// gestion de l'apparition ou disparition de affiche result
    					    event.stopPropagation();
					});
	    $('html').click(function() {// idem
				self.hideResult();
		});
		$(self.targetDomElem).find('a.graph').click(function() {// graphSearch on
				self.grapheSearch = true;
				vizObject.core.bubbleNodeClear();
				var listOfResult = self.graphSearchCallback(self.currentStringForGraphSearch);
				self.addGraphResult(listOfResult);
				self._dbGraphChoise();
		});
		$(self.targetDomElem).find('a.matrixdb').click(function() {// graphSearch off
				self.grapheSearch = false;
				self._dbGraphChoise();
				vizObject.core.bubbleNodeClear();
		});
	    $(self.targetDomElem).find("input").focusin(function() {//idem
							    
							    self.showResult(self);
							});  	
			
	},
	addGraphResult : function(results){
		var self = this;
		//console.dir(results)
		var nbHitgraph = results.length;
	    var plural = " hit";
	    if(nbHitgraph > 1){plural = " hits"};
		
		$(self.targetDomElem).find('div.afficheResult.graphStyle div.headerTab').text('');
		var headOfGraphRes = 'This search in current network returned ' + nbHitgraph + plural;
		$(self.targetDomElem).find('div.afficheResult.graphStyle div.headerTab').append(headOfGraphRes);
		$(self.targetDomElem).find('div.afficheResult.graphStyle table').remove();
		$(self.targetDomElem).find('div.afficheResult.graphStyle span').remove();
		if(!results[0]){
			var returnString = '<span><i class="fa fa-warning"></i> No match found</span>';
		}else{
			var returnString = "<table class = 'inTab'>"
			for (var i=0; i < results.length; i++) {
				var name = results[i].aceAccessor?results[i].aceAccessor : results[i].name;
				returnString += "<tr><td><a class = 'addCart'><i class='fa fa-shopping-cart'></i></a>"+
		 						"</td><td>" + results[i].name + "</td><td class = 'infoCart'>" +
		 						"<a data-value = '" + name + "' data-type = 'biomolecule' target = '_blank' "+
		 						"href ='/cgi-bin/current/newPort?type=biomolecule&value=" + name + "'>" +
		 						results[i].common.anyNames[0] + "</a></td></tr>";
			};
			returnString += "</table>";
		}
		$(self.targetDomElem).find("div.afficheResult.graphStyle").append(returnString);
		$("td a.addCart").click(function(){
 			var critObj = {};
 			if($(this).attr("data-original-title")){critObj.description = $(this).attr("data-original-title");}
 			else{critObj.description = $(this).text();}
			critObj.name = $(this).parent().parent().find("td.infoCart a").attr("data-value");
			critObj.type = $(this).parent().parent().find("td.infoCart a").attr("data-type"); 			
 			self.addCartNavCallback(critObj);
 		})
		
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
	    $(self.targetDomElem).append('<div class = "afficheResult dbStyle"></div><div class = "afficheResult graphStyle"></div>');
	    
	    $(self.targetDomElem).find('div.afficheResult').css('position','absolute');
	    self._dbGraphChoise();
	    
		var tab = '<div class = "headerTab"></div><ul style = "width:100%;" class="nav nav-tabs" id="myTab">' +
				  '<div  class=" closer navCloser"><i class="fa fa-angle-double-up" style = "margin-top:-15px;"></i></div></ul>'+
				  '<div class="tab-content">'+
				  '</div>';
		
		
		
		$(self.targetDomElem).find('div.afficheResult').append(tab);
		
		if(self.grapheSearch){
			self.addGraphResult(self.graphSearchCallback(self.currentStringForGraphSearch));
		}
		var nbHitmdb = listeMapper.biomolecule.length + listeMapper.publication.length;
	    var plural = " hit";
	    if(nbHitmdb > 1){plural = " hits"};
	    
		var headOfMdbRes = 'This MatrixDB search returned ' + nbHitmdb + plural;
		
		$(self.targetDomElem).find('div.afficheResult.dbStyle div.headerTab').append(headOfMdbRes);
		
		/* Rajout des tab si contenu*/
			var widjet = $(self.targetDomElem).find('div.afficheResult.dbStyle');
			if(listeMapper.biomolecule.length > 0){
				var listeBio = self._tableHtmlCreator(listeMapper.biomolecule)
				widjet.find('ul.nav').append(' <li class="active"><a href="#biomol">Biomolecule (' + listeMapper.biomolecule.length+ ')</a></li>')
				widjet.find('div.tab-content').append('<div class="tab-pane active" id="biomol">' + listeBio + '</div>')
			}
	 		if(listeMapper.publication.length > 0){
	 			var active = '';
	 			if(listeMapper.biomolecule.length ==0){
	 				active = 'active'
	 			}
	 			var listePubli = self._tableHtmlCreator(listeMapper.publication)
	 			widjet.find('ul.nav').append(' <li class = "' + active + '"><a href="#publi">Publication (' + listeMapper.publication.length+ ')</a></li>');
	 			widjet.find('div.tab-content').append('<div class="tab-pane ' + active + '" id="publi">' + listePubli + '</div>')
	 		}
	 		if(listeMapper.publication.length == 0 && listeMapper.biomolecule.length == 0){
	 			widjet.append(' <li><i class="fa fa-warning"></i> No match found</li>');
	 		}
			$('#myTab a').click(function (e) {
	  			e.preventDefault();
	  			$(this).tab('show');
			})
			var widjet = $(self.targetDomElem).find('div.afficheResult');
			var taille = $(self.targetDomElem).find('div.input-prepend input').width()
			var resize = $(self.targetDomElem).find('table.inTab tr').width()
			if(taille > 305){widjet.width(taille);}
	 		widjet.find("div.tooltipContent").tooltip();
	 		$( window ).resize(function() {
	 			taille = $(self.targetDomElem).find('div.input-prepend input').width()
	  			if(taille > 305){widjet.width(taille);}
			});
		
		self._dbGraphChoise();
 		$("td a.addCart").click(function(){
 			var critObj = {};
 			if($(this).attr("data-original-title")){critObj.description = $(this).attr("data-original-title");}
 			else{critObj.description = $(this).text();}
			critObj.name = $(this).parent().parent().find("td.infoCart a").attr("data-value");
			critObj.type = $(this).parent().parent().find("td.infoCart a").attr("data-type"); 			
 			self.addCartNavCallback(critObj);
 		});
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
		var url = "/cgi-bin/current/newPort?type=" + type + '&value=' + data.id 
		newString= '<a ' + dataAttr + ' href ="'+ url +	'" target = "_blank">' + longText + '</a>';
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
		var returnString = "<table class = 'inTab'>";
		var addRow = function (liste){
			for (var i=0; i < liste.length; i++) {
		 		returnString += "<tr><td><a class = 'addCart'><i class='fa fa-shopping-cart'></i></a>"+
		 						"</td><td>" + liste[i] + "</td><td class = 'infoCart'>" + littSortable[liste[i]] + "</td></tr>";
			};
		};
		addRow(listeMult);
		addRow(listeGag);
		addRow(listePfrag);
		addRow(listeLip);
		addRow(listeOther);
		returnString += "</table>";
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
	    
	    $(self.targetDomElem).append('<div class = "afficheResult" ></div>');
	    var widjet = $(self.targetDomElem).find('div.afficheResult');
	    widjet.css('position','absolute');
	    widjet.append('<span class = "noRes"><i class="fa fa-warning"></i> No match found</span>');
	    jQuery.each(listeMapper,function(i,liste){
			    var arrayItem = liste.length;
			     if(arrayItem>0 && i != "biomolecule"){//si ya de l'info on créer 
					
						widjet.find("span.noRes").remove();
						var plural = '';
						if(arrayItem>1){plural = 's'}
				    	widjet.append('<div class = "afficheElem" name="' + i +'">'+
				    				  '<h4 class = "nomListe">'+ self.nameColumn[i].id + plural + ' (' + arrayItem + ')'+
				    				 
				    				  '<i class="fa fa-question-circle pull-right" style = "margin-right: 20px;"></i>' +
				    				  '</h4></div>');
				    	widjet.find('i.fa-question-circle').popover({html : true,container : 'body', title: self.nameColumn[i].tooltip, placement : "bottom",trigger : "manual"})
				    				.on("mouseenter", function () {
									        var _this = this;
									        $(_this).popover('show');
									        $(".popover").on("mouseleave", function () {
									           $(_this).popover('hide');
									        });
									    }).on("mouseleave", function () {
									        var _this = this;
									        setTimeout(function () {
									            if (!$(".popover:hover").length) {
									               $(_this).popover("hide")
									            }
									        }, 100);
									    });
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
						console.dir(i)
						widjet.append('<div class = "afficheBiom" name="' + i +'">'+
									  '<h4 class = "nomListe"> <div class ="humanOnly">' + checkBox + ' Human only</div>'+ 
									  self.nameColumn[i].id + plural + ' (' + arrayItem + ')'+
				    				  '<i class="fa fa-question-circle pull-right" style = "margin-right: 20px;"></i>' +
				    				  '</h4></div>');
				    				  widjet.find('i.fa-question-circle')
				    				  		.popover({html : true,container : 'body', title: self.nameColumn[i].tooltip, placement : "bottom",trigger : "manual"})
						    				.on("mouseenter", function () {
											        var _this = this;
											        $(_this).popover('show');
											        $(".popover").on("mouseleave", function () {
											            $(_this).popover('hide');
											        });
											    }).on("mouseleave", function () {
											        var _this = this;
											        setTimeout(function () {
											            if (!$(".popover:hover").length) {
											                $(_this).popover("hide")
											            }
											        }, 100);
											    });
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
										    self.indexNav -- 
										    self._drawResult(self.history[self.indexNav]);	
										    
										}
									    }if($(this).hasClass('navigueSuiv')){
										if (self.indexNav < self.history.length-1){
										    self.indexNav ++ ;
										    self._drawResult(self.history[self.indexNav]);						
										}
									    }
									    
									})
	    //click sur liste
	    widjet.find("div>ul>li a").click(function(){
						 self.clickOnListElement();
					     });
	
		
		//human only
	    $(self.targetDomElem).find('div.humanOnly').click(function(){
	    	self._clickHuman(data,"classique");
	    })
	    //tooltip
	    widjet.find("div>ul>li div").tooltip();
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
				    $(self.targetDomElem).find('i.fa-question-circle').popover({html : true,container : 'body', title: self.nameColumn[i].tooltip, placement : "bottom",trigger : "manual"})
				    				.on("mouseenter", function () {
									        var _this = this;
									        $(_this).popover('show');
									        $(".popover").on("mouseleave", function () {
									            $(_this).popover('hide');
									        });
									    }).on("mouseleave", function () {
									        var _this = this;
									        setTimeout(function () {
									            if (!$(".popover:hover").length) {
									              $(_this).popover("hide")
									            }
									        }, 100);
									    });
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
	},
	_dbGraphChoise : function(){
		var self = this;
		if(self.iNavContext){
			if (self.grapheSearch){
				$(self.targetDomElem).find("div.afficheResult.dbStyle").hide();
				$(self.targetDomElem).find("div.afficheResult.graphStyle").show();
				$(self.targetDomElem).find('a.graph').addClass('active');
				$(self.targetDomElem).find('a.matrixdb').removeClass('active');
			}else{
				$(self.targetDomElem).find("div.afficheResult.dbStyle").show();
				$(self.targetDomElem).find("div.afficheResult.graphStyle").hide();
				$(self.targetDomElem).find('a.graph').removeClass('active');
				$(self.targetDomElem).find('a.matrixdb').addClass('active');
			}
		}else{
			$(self.targetDomElem).find("div.afficheResult").show();
		}
	}
    }//fin du return
}