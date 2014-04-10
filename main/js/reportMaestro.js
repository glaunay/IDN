/**
 * se charge d'appeler les différent composant
 * @author Dorian Multedo
 */

	
function runReportMaestro (options) {
	//image de fond
	/*$( 'body' ).append('<div style="width:100%; height:100%; left:0px; top:0px; position: absolute; z-index: 0;"><img src="../../img/network.png" style="width: 100%; height: 100%;" /></div>')*/
	//run de report
    if(!options.hasOwnProperty('reportDiv')){
	alert('report div not defined');
	return;
    }
    
    options.addCartCallback = function(item){
	cart.addItem(item);
    }
    options.delCartCallback = function(item){
	cart.delItem(item);
    }
        
    report = initMyReport (options);
    report.start();
    
    if(options.cart){
	var optionsCart = {targetDiv :  '#testCart',
						rootUrl:options.rootUrl
					};
	cart = initCart(optionsCart);
	cart.draw();
    }
}