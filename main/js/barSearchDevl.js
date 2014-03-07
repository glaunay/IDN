function basicBind (targetDiv) {
    $(targetDiv).find('.searchTrigger')
	.on('click', function (event){
		var txt = $(this).siblings('input').val();		
		fnSearch(txt);		
	    });        
}

function fnSearch(txt) {    
    console.log(txt); 
    callback = function (data) {
	console.dir(data);
    };
    
    $.ajax({
	       type : 'GET',
	       dataType : "jsonp",
	       url: 'http://matrixdb-new.ibcp.fr:9999/cgi-bin/current/barSearchDevel?key=' +
		   txt + '?callback=callback',
	       data : {}	       
	       //	       url : 'cgi-bin/current/barSearchCached',
//	       data : txt
	   })
	.success(function(data){
		     //console.dir(data);
		 });
}