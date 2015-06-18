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
			 //  $('#toggleThree').addClass('blockOneAccordeonBottom');
			 // $('#toggleSeven').addClass('blockTwoAccordeonBottom');
			  // $('#toggleNine').addClass('accordion-base');
		       });
    
    $('#toggleTwo').on('click',function(){
			   $('.mainContent:not(#contentTwo)').hide();
			   $('.mainContent#contentTwo').show();
			   
			   //$('#toggleThree').addClass('blockOneAccordeonBottom');
			 //  $('#toggleSeven').addClass('blockTwoAccordeonBottom');
			//   $('#toggleNine').addClass('accordion-base');
		       });
    
    $('#toggleThree').on('click',function(){
			     $('.mainContent:not(#contentThree)').hide();
			     $('.mainContent#contentThree').show();
			     //$('#toggleThree').removeClass('blockOneAccordeonBottom');

			//     $('#toggleSeven').addClass('blockTwoAccordeonBottom');
			//     if (isSelected(this))
			//	 $('#toggleThree').addClass('blockOneAccordeonBottom');
			 //    $('#toggleNine').addClass('accordion-base');
			 });
    
    $('#toggleFour').on('click',function(){
			    $('.mainContent:not(#contentFour)').hide();
			    $('.mainContent#contentFour').show();

			    //$('#toggleThree').addClass('blockOneAccordeonBottom');
			//    $('#toggleSeven').addClass('blockTwoAccordeonBottom');
			 //   $('#toggleNine').addClass('accordion-base');
			});
    
    $('#toggleFive').on('click',function(){
			    $('.mainContent:not(#contentFive)').hide();
			    $('.mainContent#contentFive').show();
			 //   $('#toggleNine').addClass('accordion-base');
			});
    
    $('#toggleSix').on('click',function(){
			   $('.mainContent:not(#contentSix)').hide();
			   $('.mainContent#contentSix').show();

			   //$('#toggleThree').addClass('blockOneAccordeonBottom');
			 //  $('#toggleSeven').addClass('blockTwoAccordeonBottom'); 
			 //  $('#toggleNine').addClass('accordion-base');
		       });
    
    $('#toggleSeven').on('click',function(){
			     $('.mainContent:not(#contentSeven)').hide();
			     $('.mainContent#contentSeven').show();
			   
			  //   if(!isSelected(this))
			//	 $('#toggleSeven').removeClass('blockTwoAccordeonBottom');
			  //   else 
			//	 $('#toggleSeven').addClass('blockTwoAccordeonBottom');

			     //$('#toggleThree').addClass('blockOneAccordeonBottom');
			   //  $('#toggleNine').addClass('accordion-base');
			 });
    
    $('#toggleEight').on('click',function(){
			     $('.mainContent:not(#contentEight)').hide();
			     $('.mainContent#contentEight').show();

			     
			    // $('#toggleThree').addClass('blockOneAccordeonBottom');
			   //  $('#toggleSeven').addClass('blockTwoAccordeonBottom');
			   //  $('#toggleNine').addClass('accordion-base');			     
			 });
 
   $('#toggleNine').on('click',function(){
			     $('.mainContent:not(#contentNine)').hide();
			     $('.mainContent#contentNine').show();

			     
			     //$('#toggleThree').addClass('blockOneAccordeonBottom');
			   //  $('#toggleSeven').addClass('blockTwoAccordeonBottom');
			   //  $(this).toggleClass('accordion-base');

			 });

    
    
}
