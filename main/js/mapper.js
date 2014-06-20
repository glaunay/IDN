/*
  ça retourne une liste de string code html
  utiliser par liste créator avec un min de modif ds listeCreator
  mapper(tableauObjet,options)
  options = key, la chaine de caractére input
  strict booléen match dans l'objet de la key obligatoire ou non
 */


function initBarSearchMapper (){
	return {
		
		_grasInput : function(data){  // { stringSearch : options.string, longText : data[i].Term, type : "GO", id : data[i].id, count : 0 }			

			var count = data.hasOwnProperty('count') ? data.count : 0;

			var newString = "";
			if(count>0){ newString = "(" + count + ")";}
			var dataAttr = 'data-type="' + data.type + '" data-value="' + data.id + '"';
			var tooltip = ""
			if(!data.longText){return "error bug"}
			if(data.longText.length > 20){
				tooltip = data.longText
			}
			newString= '<div class = "tooltipContent" data-toggle="tooltip" data-delay=\'{"show":"1000", "hide":"1000"}\' data-title="' + tooltip + '" >'+
			'<i class="fa fa-circle"></i><a ' + dataAttr + '>' + data.longText +'</a></div><span style = "float:right;">' + newString + "</span>";
			return newString;			
			 
		},
		_grasInputAuthor : function(data){  // { stringSearch : options.string, longText : data[i].Term, type : "GO", id : data[i].id, count : 0 }			

			var count = data.hasOwnProperty('count') ? data.count : 0;

			var newString = "";
			if(count>0){ newString = count;}
			var dataAttr = 'data-type="author" data-value="' + data.id + '"';
			var tooltip = "";
			if(!data.id){return "error bug"}
			if(data.id.length > 20){
				tooltip = data.id
			}
			newString= '<div class = "tooltipContent" data-toggle="tooltip" data-delay=\'{"show":"1000", "hide":"1000"}\' data-title="' + tooltip + '" >'+
			'<i class="fa fa-circle"></i><a ' + dataAttr + '>' + data.id +'</a></div><span style = "float:right;">' + newString + "</span>";
			return newString;			
			 
		},
		_grasInputBiom : function(data,humanOnly){  			
			var self = this;
			var count = data.count
			var specie  = '';
			var logoBullet = '<div class = "bulletSpecie"><i class="fa fa-ban"></i></div>';
			if(data.specie){
				specie = data.specie.name;
				logoBullet = '<div class = "bulletSpecie"><img ' + speciUrl(data.specie.taxon) + ' width = "15px"></img></div>';
			}
			var newString = "";
			if(count>0){ newString =  count;}
			var dataAttr = 'data-type="biomolecule" data-value="' + data.id + '"';
			var tooltip = '<div  class =inTooltip>Id : ' + data.id + '</div><div class =inTooltip>Name : ' + data.name + '</div>';
			if(data.specie){
				tooltip += '<div class =inTooltip>Specie : ' + specie + '</div>';
			}
			var geneName = '';
			
			geneName = geneName.substring(0,geneName.length-2)
			newString = '<div specie ="' + specie + '" class = "tooltipContent" data-html = "true" data-toggle="tooltip" data-delay=\'{"show":"1000", "hide":"1000"}\' data-title = "' + tooltip + '" >'+
					   logoBullet +
					   '<a ' + dataAttr + '>' + data.name +'</a></div><span style = "float:right;">' + newString + "</span>";
			if(data.geneName.length > 0){
				geneName = 'Gene :';
				data.geneName.forEach(function(gene){
					geneName += gene + ', ';
				});
				geneName = geneName.substring(0,geneName.length - 2);
				newString += '<div class = "geneName">' + geneName + '</div>';

			}
			if(humanOnly){
				if( !data.specie){
					return newString;
				}
				if(data.specie.name ==='Human'){
					return newString;
				}else{
					return false;
				}
			}else{
				return newString;	
			}		
			 
		},
		_grasInputPubli: function(data){  			
			var count = data.count
			var newString = "";
			if(count>0){ newString = count;}
			var dataAttr = 'data-type="publication" data-value="' + data.id + '"';
			var tooltip = '<div class = inTooltip>' + data.Title + '</div><div  class =inTooltip>PubMed Id : ' + data.id + '</div>';
			var icone = '<i class="fa fa-star-o"></i>';
			if(data.imexID){
				tooltip += '<div class =inTooltip>Imex-ID : ' + data.imexID + '</div>';
				icone = '<i class="fa fa-star" style = "color:rgb(206, 206, 17);"></i>';
			}
			newString = '<div class = "tooltipContent tooltipPubli" data-html = "true" data-toggle="tooltip" data-delay=\'{"show":"1000", "hide":"1000"}\' '+
						'data-title = "' + tooltip + '" >'+
					    icone +'<a ' + dataAttr + '>' + data.Title +'</a></div><span style = "float:right;">' + newString + "</span>";

			return newString;			
		},
		"biomolecule" : function(data, options) {
			if (options.key !== "biomolecule"){return;}
			var self = this;
			var sizeLimit =  options.size || data.length ;
			
			var tableData = self._ordArray(data,"Biom");
			return tableData;
		},
		"publication" : function(data, options) {
			if (options.key!=="publication"){return;}
			var self = this;

			var ImexId=[];
			var Pmid=[];
			var tableDataSolo=[];
			var sizeLimit =  options.size || data.length ;
			
			for( i=0 ; i<data.length ; i++ ){
				if (data[i].imexID){
					ImexId.push(data[i]);
				}else if(data[i].count > 0){
					Pmid.push(data[i]);
				}else{
					tableDataSolo.push(self._grasInputPubli(data[i]));
				}
					
			}
			
			var tableDataImex = self._ordArray(ImexId,"publi");
			var tableDataPmid = self._ordArray(Pmid,"publi");
			var returnTable = $.merge(tableDataImex,tableDataPmid);
			if(returnTable.length == 0){
				returnTable = tableDataSolo;
			}
			return returnTable;
		},
		"keywrd" : function(data, options) {
			if (options.key!=="keywrd"){return;}
			var self = this;
			var sizeLimit =  options.size || data.length ;
			var tableData=[];
			
			for( i=0 ; i < data.length ; i++ ){
				tableData.push(self._grasInput( {stringSearch : options.string, longText : data[i].name, type : "keywrd", id : data[i].id, count : data[i].count}));	
				if(tableData.length === sizeLimit){
					return tableData;
				}						
			}
		
			return tableData;	
		},
		"author" : function(data, options) {
			if (options.key!=="author"){return;}
			var self = this;
			var sizeLimit =  options.size || data.length ;
			var tableData=[];
			
			var tableData = self._ordArray(data,"author");
			return tableData;
		},
		_ordArray : function(data,type){
			var self = this;
			 if(type === "Biom"){var tableHuman = [];}
			var maxCount = 0;
	    	data.forEach(function (elem){
	   			var count = parseInt(elem.count);
	    		if (count <= maxCount) return;
	    		maxCount = count;
	    	});
	    	var tmpTableData = [];
	    	var tmpTableHuman = [];
	    	for (var i = 0; i <= maxCount; i++) {
	    		tmpTableData.push([]);
	    		tmpTableHuman.push([]);
	    	}
	    	for( i = 0 ; i < data.length ; i++ ){
				var count = parseInt(data[i].count);
				if(type === "publi"){
					var string = self._grasInputPubli( data[i]);
				}else if(type === "Biom"){
					var string = self._grasInputBiom( data[i]);
					var humanString = self._grasInputBiom( data[i],true);
					if (humanString){tmpTableHuman[count].push(humanString);}
				}else if(type === "author"){
					var string = self._grasInputAuthor( data[i]);
				}
				
				tmpTableData[count].push(string);
			}
			tmpTableData.reverse();
			tmpTableHuman.reverse();
			
			var tableData=[];
			var tableHuman = [];
			tmpTableData.forEach(function(elem){
				elem.forEach(function(string) {
					tableData.push(string);		
				});
			});
			if(type === "Biom"){
				tmpTableHuman.forEach(function(elem){
				elem.forEach(function(string) {
					tableHuman.push(string);		
				});
			});
				return [tableData , tableHuman];
			}else{
				return tableData;
			}
	    	
		}
	
	}	
}