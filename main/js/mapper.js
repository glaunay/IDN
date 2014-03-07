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
			var charMax = 28 ;
			var newString = "";
			if(count>0){charMax -= 4; newString = "(" + count + ")";}
			if(count>100){charMax -= 2;}
			regExpression = new RegExp("\\w*" + data.stringSearch + "\\w*",'i');
			regGras = new RegExp(data.stringSearch,'i');
			var matchReg = data.longText.match(regExpression);
			var dataAttr = 'data-type="' + data.type + '" data-value="' + data.id + '"';
			
			charMax -= matchReg[0].length ;
			
			if(charMax > data.longText.length - 6 ){
				newString = '<a ' + dataAttr + '>' + data.longText + newString + '</a>';
				newString = newString.replace(regGras,"<b>" + data.stringSearch + "</b>");
				return newString;
			}
			
			if(charMax > matchReg.index + matchReg[0].length){
				newString = data.longText.substring(0,charMax + matchReg[0].length -8) + '...' + newString;
				newString = newString.replace(regGras,"<b>" + data.stringSearch + "</b>");
				newString= '<a data-toggle="tooltip" ' + dataAttr + ' data-delay=\'{"show":"1000", "hide":"1000"}\' title="' + data.longText + '">' + newString + '</a>';
				return newString;
			}else{

				newString = data.longText.substring(0,charMax-10) + '...' + data.longText.substring(matchReg.index,matchReg.index + matchReg[0].length) + '...' + newString;
				newString = newString.replace(regGras,"<b>" + data.stringSearch + "</b>");
				newString= '<a data-toggle="tooltip" ' + dataAttr + ' data-delay=\'{"show":"1000", "hide":"1000"}\' title="' + data.longText + '">' + newString + '</a>';
				return newString;
				
			}
				
			 
			return;
		},
		"GO" : function(data, options) {

			var self = this;
			var tableData = [];
			var sizeLimit =  options.size || data.length ;
			if (options.strict){
				regExp= new RegExp(options.string,"g")
				for( i=0 ; i<data.length ; i++ ){
					
					if (data[i].Term.match(regExp)){
						tableData.push(self._grasInput({ stringSearch : options.string, longText : data[i].Term, type : "GO", id : data[i].id}));
						
						if(tableData.length===sizeLimit){
							return tableData;
						}				
					}
				}
			}else{
				for( i=0 ; i<data.length ; i++ ){
						tableData.push(data[i].Term);
						if(tableData.length===sizeLimit){
							return tableData;
						}						
				}
			}
			return tableData;
		},
		"IMEX-ID" : function(data, options) {
			if (options.key!=="IMEX-ID"){return;}
			var self = this;
			var tableData=[];
			var sizeLimit =  options.size || data.length ;
			if (options.strict){
				regExp= new RegExp(options.string,"g")
				for( i=0 ; i<data.length ; i++ ){
					if (data[i].Title.match(regExp)){
					//	tableData.push(self._grasInput(options.string,data[i].Title,data[i].count));
						tableData.push(self._grasInput( {stringSearch : options.string, longText : data[i].Title, type : "IMEX-ID", id : data[i].id, count : data[i].count}));
						if (tableData.length===sizeLimit){
							return tableData;
						}							
					}
				}
			}else{
				for( i=0 ; i<data.length ; i++ ){
						tableData.push(data[i].Title);
						if(tableData.length===sizeLimit){
							return tableData;
						}						
				}
			}
			return tableData;
		},
		"biomolecule" : function(data, options) {
			if (options.key !== "biomolecule"){return;}
			var self = this;
			var tableData=[];
			var sizeLimit =  options.size || data.length ;
			if (options.strict){
				regExp= new RegExp(options.string,"g")
				for( i = 0 ; i < data.length ; i++ ){
					if (data[i].name.match(regExp)){
					//	tableData.push(self._grasInput(options.string,data[i].id+' '+data[i].name,data[i].count));
					tableData.push(self._grasInput( {stringSearch : options.string, longText : data[i].name, type : "biomolecule", id : data[i].id, count : data[i].count}));
						if(tableData.length === sizeLimit){
							return tableData;
							}				
					}
				}
			}else{
				for( i = 0 ; i < data.length ; i++ ){
						tableData.push(data[i].name);
						if(tableData.length === sizeLimit){
							return tableData;
							}					
				}
			}
			return tableData;
		},
		"keywrd" : function(data, options) {
			if (options.key!=="keywrd"){return;}
						var self = this;
			var tableData=[];
			var sizeLimit =  options.size || data.length ;
			if (options.strict){
				regExp= new RegExp(options.string,"g")
				for( i=0 ; i<data.length ; i++ ){
					if (data[i].name.match(regExp)){
						//tableData.push(self._grasInput(options.string,data[i].Identifier,data[i].count));
						tableData.push(self._grasInput( {stringSearch : options.string, longText : data[i].name, type : "keywrd", id : data[i].id, count : data[i].count}));
						if(tableData.length===sizeLimit){
							return tableData;
						}							
					}
				}
			}else{
				for( i=0 ; i<data.length ; i++ ){
						tableData.push(data[i].Identifier);
						if(tableData.length === sizeLimit){
							return tableData;
							}					
				}
			}
			return tableData;
		},
		"publication" : function(data, options) {
			if (options.key!=="publication"){return;}
			var self = this;
			var sizeLimit =  options.size || data.length ;
			var tableData=[];
			if (options.strict){
				regExp= new RegExp(options.string,"g")
				for( i = 0 ; i < data.length ; i++ ){
					if (data[i].Title.match(regExp)){
						//tableData.push(self._grasInput(options.string,data[i].Title,data[i].count));
						tableData.push(self._grasInput( {stringSearch : options.string, longText : data[i].Title, type : "publication", id : data[i].id, count : data[i].count}));	
						if(tableData.length===sizeLimit){
							return tableData;
							}				
					}
				}
			}else{
				for( i=0 ; i < data.length ; i++ ){
						tableData.push(data[i].Title);	
						if(tableData.length === sizeLimit){
							return tableData;
						}						
				}
			}
			return tableData;	
		},
		"author" : function(data, options) {
			if (options.key!=="author"){return;}
			var self = this;
			var sizeLimit =  options.size || data.length ;
			var tableData=[];
			if (options.strict){
				regExp= new RegExp(options.string,"g")
				for( i = 0 ; i < data.length ; i++ ){
					if (data[i].id.match(regExp)){
						//tableData.push(self._grasInput(options.string,data[i].id,data[i].count));
						tableData.push(self._grasInput( {stringSearch : options.string, longText : data[i].id, type : "author", id : data[i].id, count : data[i].count}));		
						if(tableData.length===sizeLimit){
							return tableData;
						}						
					}
				}
			}else{
				for( i = 0 ; i < data.length ; i++ ){
						tableData.push(data[i].id);	
						if(tableData.length===sizeLimit){
							return tableData;
						}						
				}
			}
			return tableData;
		},
		"gene" : function(data, options) {
			var self = this;
			var sizeLimit =  options.size || data.length ;
			var tableData=[];
			if (options.strict){
				regExp= new RegExp(options.string,"g")
				for( i=0 ; i<data.length ; i++ ){
					if (data[i].id.match(regExp)){
						//tableData.push(self._grasInput(options.string,data[i].id,data[i].count));
						tableData.push(self._grasInput( {stringSearch : options.string, longText : data[i].id, type : "biomolecule", id : data[i].id, count : data[i].count}));		
						if(tableData.length===sizeLimit){
							return tableData;
						}						
					}
				}
			}else{
				for( i = 0 ; i < data.length ; i++ ){
						tableData.push(data[i].id);	
						if(tableData.length===sizeLimit){
							return tableData;
						}						
				}
			}
			return tableData;
		}
	}	
}