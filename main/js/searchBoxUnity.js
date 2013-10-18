/*
 * A Component to display 
 *  callback function to search controller
 */

function testSearchBoxUnity (opt){
    opt['callback'] = function () {
	console.log("callback");	
    };
    var widget = initUnityBar (opt);    
    
    return widget;
}



function initUnityBar (opt) {

    var targetType = "div";
    var targetSel;
    if ('target' in opt) {
	if ('type' in opt.target) {	    	
	    targetType = opt.target.type;
	    targetSel = opt.target.sel;
	}
    }

    $(targetSel).addClass('.searchBoxWrapper');
    $(targetSel + ' input').attr('autocomplete', "off")
	.attr('placeholder', "Search tissue, molecule, publication...     ex : P98160").addClass("unity");

    var customHighlighter = {
	freeTextSearch : function (item, query) {
	    return '<div class="highlight"><i class="icon-pencil" style="margin-right:10px;"></i>' + item.name  + '</div>';
	},
	biomolecule : function (item, query) {
	    var html = this._commonHighlighter(item, query);
	    return '<div class="highlight"><i class="icon-spinner" style="margin-right:10px;"></i>' + html  + '</div>';
	},
	publication : function (item, query) {
	    var html = this._commonHighlighter(item, query);
	    var imexField = "";
	    if (item.imex) {
		imexField = item.imex.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
						  return '<strong>' + match + '</strong>';
					      });
		imexField =  '<span class="comments">' + imexField  + '</span>';
	    }
	    return '<div class="highlight"><i class="icon-book" style="margin-right:10px;"></i>' + imexField + html + '</div>';
	},
	subCellularLocation : function (item, query) {
	    var html = this._commonHighlighter(item, query);
	    return '<div class="highlight"><i class="icon-fullscreen" style="margin-right:10px;"></i>' + html  + '</div>';
	},
	keyword : function (item, query) {
	    var html = this._commonHighlighter(item, query);
	    return '<div class="highlight"><i class="icon-comments" style="margin-right:10px;"></i>' + html  + '</div>';
	},
	_commonHighlighter : function (item, query) {

	    var identifier = item.name.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
					       return '<strong>' + match + '</strong>';
					       });
	    var comments = "";
	    if (item.description) {
		comments = item.description.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
						 return '<strong>' + match + '</strong>';
					     });
	    }
	    return '<span class="identifier">' + identifier + '</span><span class="comments">' + comments + '</span>';	    
	}

    };
    
     var customMatcher = {
	biomolecule : function (item, query) {
	    var value = this._commonMatch(item,query);
	    return value;
	},
	 publication : function (item, query) {
	     var value = this._commonMatch(item,query);
	     if (value != 0) return value;
	     if (item.imex) {
		 value = ~item.imex.toLowerCase().indexOf(query.toLowerCase());
	     }
	     return value;
	 },
	 subCellularLocation : function (item, query) {
	       var value = this._commonMatch(item,query);
	    return value;
	},
	 keyword : function (item, query) {
	     var value = this._commonMatch(item,query);
	    return value;
	},
	 _commonMatch : function (item,query) { 
	     var value;
	     value = ~item.name.toLowerCase().indexOf(query.toLowerCase());
	     if (value != 0) return value;
	     if (item.description) {
		 value = ~item.description.toLowerCase().indexOf(query.toLowerCase());
		 if (value != 0) return value;		 
	     }	     

	     return 0;
	 }
     };
       
    
    var minLength = 3;
    $(targetSel +  ' input').on('keyup', function () {
					   if ($(this).val().length >= minLength) {
					       
					   }
				       });
    

    $(targetSel + ' ' + 'input')
	.typeahead({
		       minLength : minLength,
		       items : 999,
		       source: function (query, process) {
			  // show loading button
			   var self = this;
			   
			   return $.ajax({
//					     url: '/cgi-bin/current/typeaheadHelper',
//					     type: 'post',
//					     data: { query: query },

					     url: '/data/typeaheadHelper.json',
					     type: 'get',
					     dataType: 'json',
					     success: function (result) {	
						 var resultList = result.map(function (item) {
										 var aItem  =  { type: item.type, name: item.name, description : item.description};
										 if (item.type === "publication") {
										     aItem.imex = item.IMEx_ID;
										 }
										 return JSON.stringify(aItem);
									     });
					
						 return process(resultList);
					     }
					 });
		       },
		       
		       matcher: function (obj) {
			 
			   var item = JSON.parse(obj);
			   /*
			    var value = ~item.name.toLowerCase().indexOf(this.query.toLowerCase());
			    if (value != 0) {
			    console.log("testing To " + value + " " + item.name);
			    return ~item.name.toLowerCase().indexOf(this.query.toLowerCase());
			    }*/
			   var value = customMatcher[item.type](item, this.query);
			   
			   return value;
			   
		       },
		       sorter: function (items) {          
			   var beginswith = [], caseSensitive = [], caseInsensitive = [], item;

			   beginswith.push(JSON.stringify({ type : "freeTextSearch", name : 'Free text search on "' + this.query + '"'}));

			   while (aItem = items.shift()) {
			       var item = JSON.parse(aItem);
			       if (!item.name.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(JSON.stringify(item));
			       else if (~item.name.indexOf(this.query)) caseSensitive.push(JSON.stringify(item));
			       else caseInsensitive.push(JSON.stringify(item));
			   }

//			   $(opt.target +  ' input').removeClass('loadinggif');
			   return beginswith.concat(caseSensitive, caseInsensitive);					     
		       },
		       // Style the dropdown elements
		       highlighter: function (obj) {
			   var item = JSON.parse(obj);
			   var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
			   var droppedDiv = customHighlighter[item.type](item, query);
			   
			   return droppedDiv;
		       },
		       updater: function (obj) { 
			   //var item = JSON.parse(obj);
			   // return item.name;
			   var item = JSON.parse(obj);
			   opt.callback(item);
			   return '';
		       }
		   });        
}