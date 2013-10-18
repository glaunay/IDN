/*
 * HTML Ace browser report mashup 
 * 
 * http://matrixdb-new.ibcp.fr/cgi-bin/report/default?name=P39060&class=BioMolecule#proteinDbAnchor
 */
 
function mashup (reportType) {   
    if (reportType === "BioMolecule") formatBiomoleculeReport();
    
}

function formatBiomoleculeReport() {
    var proteinDbContent = [];
    $('table').each(function() {
			var myTable = this;
			$(this).find('th:first-child').each (function () {
								 console.log($(this).text());
								 if ($(this).text() === 'Interaction(s): ?') formatInterTable(myTable);
								 if ($(this).text() === 'Gene Ontology: ?') formatGoTable(myTable);
								 if ($(this).text() === 'Protein Data Bank: ?') proteinDbContent.push(myTable); 
								 if ($(this).text() === 'InterPro: ?') proteinDbContent.push(myTable); 
								 if ($(this).text() === 'Pfam: ?') proteinDbContent.push(myTable); 
							     });
		    });
    formatProteinDbContent(proteinDbContent);
}

function formatProteinDbContent(dbArray) {
    
    var scaffold = '<div class="anchor" id="proteinDbAnchor"></div><div id="ProteinDiv"><h3>Protein databases references</h2><div id="proteinDatabaseContent" class="row"></div>';
    var navRef =  '<li><a href="#proteinDbAnchor">Protein databases</a></li>';    


    var nameMap = {
	'Protein Data Bank: ?' : { head : 'Protein Data Bank', format: function (table){
				       var htmlString;
				       console.log(table);
				       var matrixdbOldRef = splitTdBr(table, 0);
				       console.log(matrixdbOldRef);
				       var matrixdbTmpRef = matrixdbOldRef.map(updateAceBrowserURL);
				       var nameArray =  matrixdbTmpRef.map(function(element) { 
									       var rx = />(.+)<\/a>/;
									       var match = rx.exec(element);
									       console.log(match[1]);
									       return match[1];
									   });				
				       var matrixdbNewRef = matrixdbTmpRef.map(function(element) { 
										   return element.replace(/>.+<\/a>/, '>matrixDB Link</a>');										   
									       });
				       var rcsbRef = matrixdbTmpRef.map(function(element) { 
									       var rx = />(.+)<\/a>/;
									       var match = rx.exec(element);
									       return '<a target="_blank" href="http://rcsb.org/pdb/explore/explore.do?structureId=' +  match[1] + '">PDB Link</a>';
									   });
				       
				       for (var i = 0; i < matrixdbOldRef.length; i++) {
					   htmlString += '<div class="row"><div class="span4">' +  nameArray[i] +'</div>' + '<div class="span4">' +  matrixdbNewRef[i] +'</div>' +'<div class="span4">' +  rcsbRef[i] +'</div></div>'; 
				       }
				       return htmlString;
				   }
				 },
	'InterPro: ?' : { head : 'InterPro', format : function (table) {
			      var htmlString;
			      return htmlString;      
			  }
			},
	'Pfam: ?' : { head : 'Pfam', format : function (table) {
			  var htmlString;
			  return htmlString;  
		      }
		    }
    };

    if (dbArray.length == 0) return;
    

    $('body').append(scaffold);
    $('#navItemList').append(navRef);
    
    dbArray.forEach(function (n,i) {		
			var cTable = n;
			var name;
			$(cTable).find('th').each (function (){name = $(this).text();});
			console.log("--->" + name + " --- " + nameMap[name]);
			var row = '<div class="span12 innerHeader">' + nameMap[name].head + '</div>';
			$('#proteinDatabaseContent').append(row);
			row = nameMap[name].format(cTable);
			$('#proteinDatabaseContent').append(row);
		    });
    

}

function formatInterTable (table) {
  
    var scaffold = '<div class="anchor" id="interAnchor"></div><div id="interDiv"><h3>Interaction registred in matrixdb</h2></div>';
    var navRef =  '<li><a href="#interAnchor">Interaction(s)</a></li>';
    
    $('body').append(scaffold);
    $('#navItemList').append(navRef);
    var nTable = '<table class="table table-bordered"><theader><th>Link to description</th><th>Partnair name</th><th>Number of experimental evidences</th><tbody></tbody></table>';
    $('#interDiv').append(nTable);

    //Extract data
    var descTD = $(table).find('td').get(0);
    var descArray = [];
    $(descTD).find('a').each(function(){
				 var rx = /name=([^&]+)&/g;
				 var match = rx.exec(this);
				 var string = '<a href="' + this  + '" target="_blank">'+ match[1] +'</a>'; 
				 //console.log(string);
				 descArray.push(string);
			     });
    
    /*
    var partnairTD= $(table).find('td').get(1);
    var partnairArray = [];
    var rawText = $(partnairTD).find('address').html();
    partnairArray = rawText.split("<br>");
    */
    var partnairArray = splitTdBr(table, 1);

    var eTD= $(table).find('td').get(2);
    var eText =  $(eTD).find('address').html();
    var eArray = [];
    var rx = new RegExp('<b>([0-9]+)<\/b>','g');
    var match = rx.exec(eText);
    while (match != null) {
	eArray.push(match[1]);
	match = rx.exec(eText);
    }
    
    
    //Fill the table
    for (var i = 0; i< descArray.length; i++) {
	$('#interDiv table tbody').append('<tr><td>' + descArray[i] + '</td>' + '<td>' +  partnairArray[i] + '</td>' + '<td>' + eArray[i] + '</td></tr>');
    }
    
}


function formatGoTable (table) {
    var scaffold = '<div class="anchor" id="goAnchor"></div><div id="goDiv"><h3>Associated GO annotation</h2></div>';
    var navRef =  '<li><a href="#goAnchor">GO annotation</a></li>';
    
    $('body').append(scaffold);
    $('#navItemList').append(navRef);
    var nTable = '<table class="table table-bordered"><theader><th>GO term</th><th>Term name</th><th>GO evidence</th><th>annotation author</th></theader><tbody></tbody></table>';
    $('#goDiv').append(nTable);

    // extract informations     
    var termTD = $(table).find('td').get(0);
    var termArray = [];
    $(termTD).find('a').each(function(){
				 var oHref = $(this).attr('href');
				 var string = $(this).text();
				 var href = updateAceBrowserURL(oHref);

				 var goHref = 'http://amigo.geneontology.org/cgi-bin/amigo/term_details?term=' + string;
				 termArray.push('<a href="' + goHref + '" target="_blank">' + string + '</a>');
			     });

    var nameArray = splitTdBr (table, 1);    
    var eArray = splitTdBr (table, 2);   
    var aArray = splitTdBr (table, 3);   
    
    // Fill table    
    
    for (var i = 0; i< termArray.length; i++) {
	$('#goDiv table tbody').append('<tr><td>' + termArray[i] + '</td>' + '<td>' +  nameArray[i] + '</td>' + '<td>' + eArray[i] + '</td><td>' + aArray[i] +  '</td></tr>');
    }
    
}

function splitTdBr (table, indexTD) {
    var TD = $(table).find('td').get(indexTD);
    var text = $(TD).find('address').html();
    var array = text.split("<br>");
    
    return array;
}

function updateAceBrowserURL (stringUrl) {
    
    var nUrl = stringUrl.replace(/cgi-bin(.+)default\?/,  function (match, content) {				  
				     //console.log("content:" + content + "<<");
				     if (content === '/generic/tree/') return 'cgi-bin/tree/default?';
				     if (content === '/model/report/') return 'cgi-bin/report/default?';
				     return content;
				 });
    //console.log("-->" + nUrl);
    
    return nUrl;
}