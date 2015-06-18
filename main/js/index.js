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
//Par default, "Overview selectionne qd on arrive sur la page
    $('#contentOne').show();
    $('#toggleOne').addClass('CurrentToggle');
 
    $('#toggleOne').on('click',function(event){	   //si on clique sur Overview
			   $('.mainContent:not(#contentOne)').hide(); //cache les autres pages
			   $('.mainContent#contentOne').show(); //affiche Overview
			   $('#toggleTwo').removeClass('CurrentToggle');$('#toggleThree').removeClass('CurrentToggle');$('#toggleFour').removeClass('CurrentToggle');$('#toggleFive').removeClass('CurrentToggle');$('#toggleSix').removeClass('CurrentToggle');$('#toggleSeven').removeClass('CurrentToggle');$('#toggleEight').removeClass('CurrentToggle');$('#toggleNine').removeClass('CurrentToggle'); //le menu d'avant n'est plus colore en bleu
			   $('#toggleOne').addClass('CurrentToggle'); //le menu overview est colore - permet de savoir où on est dans la navig du site
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
