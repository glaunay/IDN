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
    $('#toggleOne').addClass('CurrentToggle');
 
    $('#toggleOne').on('click',function(event){	   
			   $('.mainContent:not(#contentOne)').hide();
			   $('.mainContent#contentOne').show();
			   $('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			   $('#toggleOne').addClass('CurrentToggle');
		       });
    
    $('#toggleTwo').on('click',function(){
			   $('.mainContent:not(#contentTwo)').hide();
			   $('.mainContent#contentTwo').show();
			   $('#toggleOne').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			   $('#toggleTwo').addClass('CurrentToggle');
		       });
    
    $('#toggleThree').on('click',function(){
			     $('.mainContent:not(#contentThree)').hide();
			     $('.mainContent#contentThree').show();
			     $('#toggleOne').removeClass('CurrentToggle');$('#toggleTwo').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			     $('#toggleThree').addClass('CurrentToggle');
			 });
    
    $('#toggleFour').on('click',function(){
			    $('.mainContent:not(#contentFour)').hide();
			    $('.mainContent#contentFour').show();
			    $('#toggleOne').removeClass('CurrentToggle');$('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			    $('#toggleFour').addClass('CurrentToggle');
			});
    
    $('#toggleFive').on('click',function(){
			    $('.mainContent:not(#contentFive)').hide();
			    $('.mainContent#contentFive').show();
			    $('#toggleOne').removeClass('CurrentToggle');$('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			    $('#toggleFive').addClass('CurrentToggle');
			});
    
    $('#toggleSix').on('click',function(){
			   $('.mainContent:not(#contentSix)').hide();
			   $('.mainContent#contentSix').show();
			   $('#toggleOne').removeClass('CurrentToggle');$('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			   $('#toggleSix').addClass('CurrentToggle');
		       });
    
    $('#toggleSeven').on('click',function(){
			     $('.mainContent:not(#contentSeven)').hide();
			     $('.mainContent#contentSeven').show();
			     $('#toggleOne').removeClass('CurrentToggle');$('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			     $('#toggleSeven').addClass('CurrentToggle');
			 });
    
    $('#toggleEight').on('click',function(){
			     $('.mainContent:not(#contentEight)').hide();
			     $('.mainContent#contentEight').show();
			     $('#toggleOne').removeClass('CurrentToggle');$('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle');	
			     $('#toggleEight').addClass('CurrentToggle');		     
			 });
 
   $('#toggleNine').on('click',function(){
			     $('.mainContent:not(#contentNine)').hide();
			     $('.mainContent#contentNine').show();
			     $('#toggleOne').removeClass('CurrentToggle');$('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');
			     $('#toggleNine').addClass('CurrentToggle');
			 });

    
    
}
