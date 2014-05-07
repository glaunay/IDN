/*
 * Network related ajax functions
 * 
 */


/*
 * settings : 
 *          - host defines the DOM element hosting network
 *          
 * request :
 * 
 * 
 * interactomAce, cgi script 
 * 
 * event trigger networkExpandError , networkExpandFetchDone attached to body
 * successfull call callback is coreNetwork.add function
 * 
 */

window.CGI_PREFIX = "/cgi-bin/current/";

function networkExpand (data, callback) {        
    
    //    var parent = settings.parent;

    console.dir(data);
    var requestObject = {
	completeAnnotation : "no",
	providers : vizObject.getProviderList(),
	data : {            
	    centralNodes : vizObject.core.getCentralNodeList({ size : 'short' }), //vizObject.seedNodeList,
	    delNodes : vizObject.core.getDeletedNodeList(), //vizObject.delElements,	    
	    searchCrit : data
	}
    };
    
    var JSONText = JSON.stringify(requestObject);
    
    var httpRequest =  $.ajax(
	{
	    url: CGI_PREFIX + "interactomAce",
	    data : JSONText,
	    type: 'POST',
	    contentType: 'application/json',
	    processData: false,
	    dataType: 'json',
	    
	    complete : function () {
		$('body').trigger('networkExpandFetchDone');
	    },
	    error: function (request, type, errorThrown){  //timeout", "error", "abort", and "parsererror".
		ajaxErrorDecode(request, type, errorThrown);
		$('body').trigger('networkExpandError');
	    }, 
	    success : function (data, textStatus, jqXHR){
		vizObject.networkID = data.id;
		callback(data,requestObject);
		//callback(data);
	    }
	});	
}


function cytoscapeExporter (opt) {
    var idleDiv = '<div class="exporterIdle"><span class="fa-stack">'
    	+ '<i class="fa fa-folder-open fa-stack-1x" style="font-size:0.6em"></i>'
	+ '<i class="fa fa-spinner fa-spin fa-stack-2x"></i>'
	+ '</span></div>';
    $('body').append(idleDiv);    

    var JSONText = JSON.stringify(opt.networkState);  
    $.ajax({ type : "POST",
	     url : CGI_PREFIX + "csConverter",
             data : JSONText,
             contentType: 'application/json',
             dataType : "json",
             id: "networkState",
             cache : false,
             error : function (jqXHR, textStatus, errorThrown ) {
                 console.log("error");
                 console.log(textStatus);
                 console.log(errorThrown);
                 console.dir(jqXHR);                     
             },
             success : function (data) {
                 console.dir(data);
                 
                 generateDownloadModal (data.fileLocation);             
             },
             complete : function (resp){
		 $(".exporterIdle").remove();
                 console.log ("complete") ;
                 console.log(resp.getAllResponseHeaders()); 
             }
             
           }    
          );
    return;       
}




function graphicExporter (){

    var idleDiv ='<div class="exporterIdle"><span class="fa-stack">'
    	+ '<i class="fa fa-camera fa-stack-1x" style="font-size:0.7em"></i>'
	+ '<i class="fa fa-spinner fa-spin fa-stack-2x"></i>'
    	+ '</span></div>';
    $('body').append(idleDiv);
 

    console.log("graphicExporter routine " + vizObject.networkWindow);         
    var sel = d3.select("#networkWindow" + ' svg');
    console.dir(sel);
    var html = sel.node()
        .parentNode.innerHTML;
    var str = html.replace(/<defs>.*<\/defs>/g, "").replace(/<g id="controler">.*<\/g>/g, "")
	.replace(/data-original-title=""/g, "")
	.replace(/title=""/g,"")
	.replace(/display=""/g,"")
	.replace(/(<svg[^>]+>)/,"$1" + ' <rect width="100%" height="100%" fill="white"></rect>');
    console.log(str);
    $.ajax({ type : "POST",
             url : CGI_PREFIX + "exporter",
             data : escape(str),
             dataType : "json",
             id: "svgContent",
             cache : false,
             error : function (jqXHR, textStatus, errorThrown ) {
                 console.log("error");
                 console.log(textStatus);
                 console.log(errorThrown);
                 console.dir(jqXHR);
                 
		 
             },
             success : function (data) {
                 console.dir(data);
                 
                 generateDownloadModal (data.fileLocation);
                 /*      console.log("export successfull");
                  console.dir(data);    
                  if (data.status === "OK") {                        
                  $('#downloadFrame').attr('src', data.fileLocation);
                  } else {
                  alert ("unable to export graphics");
                  }
                  */
             },
             complete : function (resp){
		 $(".exporterIdle").remove();
                 console.log ("complete") ;
                 console.log(resp.getAllResponseHeaders()); 
             }
             
           }    
          );
    
}

function storeNetwork (data) {
     var idleDiv = '<div class="exporterIdle"><span class="fa-stack">'
    	+ '<i class="fa fa-cloud-upload fa-stack-1x" style="font-size:0.6em"></i>'
	+ '<i class="fa fa-spinner fa-spin fa-stack-2x"></i>'
	+ '</span></div>';
    $('body').append(idleDiv);    
    
    data.type = "write";    
    var JSONText = JSON.stringify(data);  
    $.ajax({ type : "POST",
	     url : CGI_PREFIX + "storeNetwork",
             data : JSONText,
             contentType: 'application/json',
             dataType : "json",          
             cache : false,
             error : function (jqXHR, textStatus, errorThrown ) {
                 console.log("error");
                 console.log(textStatus);
                 console.log(errorThrown);
                 console.dir(jqXHR);                     
             },
             success : function (data) {
		 console.log("success");
                 console.dir(data);        
         	 $('body').append('<div id="loaderBack"></div>');
		 $('#loaderBack').append('<div class="cacheInOk"><div class="cacheInOk-header"><i class="fa fa-cloud-upload"></i><span> Export successfull!</span><i class="fa fa-times-circle pull-right"></i></div><div>'
					 + ' <input style="width:300px;" type="text" value="' + data.uid  + '" class="input-medium search-query">'
					 + '<div class="cacheInOk-footer">Please copy and paste above key for further reload </div></div>');
		 $('.cacheInOk').css({top : $(window).height() *0.25, right : $(window).width()*0.33});
		 $('.cacheInOk fa .fa-times-circle').on('click',function(){
							    $('#loaderBack').animate({
											 opacity: 0.0
										     }, 500, function() {
											 // Animation complete.
											 $('#loaderBack').remove();
										     });
							});

             },
             complete : function (resp){
		 $(".exporterIdle").remove();
                 console.log ("complete") ;
                 console.log(resp.getAllResponseHeaders()); 
             }
             
           }    
          );
    return;  
}


function cacheOutNetwork (opt) {
    $('body').append('<div id="loaderBack"></div>');
    var html = '<div class="modal-loader"><div class="ml-header"><i class="pull-right fa fa-times-circle fa-2x"></i></div>'
	+ '<div class="ml-body">'
	+ ' <input style="width:300px;" type="text" placeholder="Enter a valid network identifier" class="input-medium search-query">'
	+ ' <button type=submit class="btn">Load</button>'
	+ '</div>'       
	+ '<div class="ml-footer"></div>'
	+ '</div>';
    $('#loaderBack').append(html);
    $('#loaderBack i.fa-times-circle').on('click', function (){$('#loaderBack').remove();});
    $('#loaderBack button').on('click',function(){
				   var string = $('#loaderBack input').val();
				   if (!string) return;
				   loadNetwork(string, opt.callback);
			       });
    $(".modal-loader").css({top : $(window).height() *0.25, right : $(window).width()*0.33});
}

function loadNetwork (uidString, callback) {
    //28FD36B2-3667-11E3-9ECE-ABFFC0330D27    
   // alert(uidString);
    $('#loaderBack').remove();
    $('body').append('<div class="exporterIdle"><i class="fa fa-spin fa-refresh"></i></div>');
//    var string = "28FD36B2-3667-11E3-9ECE-ABFFC0330D27";   

    var JSONText = JSON.stringify({type:"read", userKey : uidString});  
    $.ajax({ type : "POST",
	     url : CGI_PREFIX + "storeNetwork",
             data : JSONText,
             contentType: 'application/json',
             dataType : "json",          
             cache : false,
             error : function (jqXHR, textStatus, errorThrown ) {
                 console.log("error");
                 console.log(textStatus);
                 console.log(errorThrown);
                 console.dir(jqXHR);        
             },
             success : function (data) {
		 console.log("success");
                 console.dir(data);                 
		 callback({nodeData : data.nodes, linksData : data.links});		 
             },
             complete : function (resp){
		 $(".exporterIdle").animate({
						opacity: 0.0
					    }, 500, function() {
						// Animation complete.
						$('.exporterIdle').remove();
					    });
                 console.log ("complete") ;
                 console.log(resp.getAllResponseHeaders()); 
             }
             
           }    
          );  
    

}

function generateDownloadModal (fileLocation) {
    var html = '<div class="DLbox">'
        + '<div class="modal-body"><span class="label label-success">Export successfull</span></div>' 
        + '<div class="modal-footer"><a href="#" class="btn DLdismiss">Dismiss</a>'
        + '<a href="' + fileLocation + '" class="btn btn-primary">Download</a></div></div>';        

    $('body').append(html);

    $('.DLbox').addClass('modal fade');
    $('.DLbox').attr('aria-hidden', 'true');
    
    $('.DLbox').modal({"static":false, "backdrop":false, "keyboard":true, "show":false});
    $('.DLbox').modal('show');
    $('.DLbox')
        .on ('shown', function (){
             });
    $('.DLbox .DLdismiss,.btn-primary')
        .on('click', function () {
                $('.DLbox').modal('hide');
            });
    
    $('.DLbox')
        .on('hidden', function () {                   
                $(this).remove();
            });
}
