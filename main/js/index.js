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
			   $('#toggleOne').addClass('CurrentToggle');
		       });
    
    $('#toggleTwo').on('click',function(){
			   $('.mainContent:not(#contentTwo)').hide();
			   $('.mainContent#contentTwo').show();
			   $('#toggleTwo').addClass('CurrentToggle');
		       });
    
    $('#toggleThree').on('click',function(){
			     $('.mainContent:not(#contentThree)').hide();
			     $('.mainContent#contentThree').show();
			     $('#toggleThree').addClass('CurrentToggle');
			 });
    
    $('#toggleFour').on('click',function(){
			    $('.mainContent:not(#contentFour)').hide();
			    $('.mainContent#contentFour').show();
			    $('#toggleFour').addClass('CurrentToggle');
			});
    
    $('#toggleFive').on('click',function(){
			    $('.mainContent:not(#contentFive)').hide();
			    $('.mainContent#contentFive').show();
			    $('#toggleFive').addClass('CurrentToggle');
			});
    
    $('#toggleSix').on('click',function(){
			   $('.mainContent:not(#contentSix)').hide();
			   $('.mainContent#contentSix').show();
			   $('#toggleSix').addClass('CurrentToggle');
		       });
    
    $('#toggleSeven').on('click',function(){
			     $('.mainContent:not(#contentSeven)').hide();
			     $('.mainContent#contentSeven').show();
			     $('#toggleSeven').addClass('CurrentToggle');
			 });
    
    $('#toggleEight').on('click',function(){
			     $('.mainContent:not(#contentEight)').hide();
			     $('.mainContent#contentEight').show();
			     $('#toggleEight').addClass('CurrentToggle');
			     
			 });
 
   $('#toggleNine').on('click',function(){
			     $('.mainContent:not(#contentNine)').hide();
			     $('.mainContent#contentNine').show();
			     $('#toggleNine').addClass('CurrentToggle');

			 });

    
    
}
