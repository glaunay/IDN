/*
 
 
 */
function envoi() {
	var question = window.document.formu.question.value;
 	var reMail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  	if(reMail.test(window.document.formu.inputEmail3.value)){
  		//need php pour envoi du mail!!! demande guillaume
  	}else{
  		alert("email invalide")
  	}


}