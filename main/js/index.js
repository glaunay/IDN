function isSelected (domElem) {
    var  arr = $(domElem).siblings('.accordion-body.in');			  
    if (arr.length > 0)
//	event.stopPropagation();
	return true;
 //   }

    return false;
}

function mainPageSet (){
    $('.mainContent').hide();
    $('#contentOne').show();
 
    $('#toggleOne').on('click',function(event){	   
			   $('.mainContent:not(#contentOne)').hide();
			   $('.mainContent#contentOne').show();
		       });
    
    $('#toggleTwo').on('click',function(){
			   $('.mainContent:not(#contentTwo)').hide();
			   $('.mainContent#contentTwo').show();
		       });
    
    $('#toggleThree').on('click',function(){
			     $('.mainContent:not(#contentThree)').hide();
			     $('.mainContent#contentThree').show();
			 });
    
    $('#toggleFour').on('click',function(){
			    $('.mainContent:not(#contentFour)').hide();
			    $('.mainContent#contentFour').show();
			});
    
    $('#toggleFive').on('click',function(){
			    $('.mainContent:not(#contentFive)').hide();
			    $('.mainContent#contentFive').show();
			});
    
    $('#toggleSix').on('click',function(){
			   $('.mainContent:not(#contentSix)').hide();
			   $('.mainContent#contentSix').show();
		       });
    
    $('#toggleSeven').on('click',function(){
			     $('.mainContent:not(#contentSeven)').hide();
			     $('.mainContent#contentSeven').show();
			 });
    
    $('#toggleEight').on('click',function(){
			     $('.mainContent:not(#contentEight)').hide();
			     $('.mainContent#contentEight').show();
			     
			 });
 
   $('#toggleNine').on('click',function(){
			     $('.mainContent:not(#contentNine)').hide();
			     $('.mainContent#contentNine').show();

			 });

    
    
}
