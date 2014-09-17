function setBanner () {
var scaffold = '<div class="topBanner"><div class="bannerBox">'
	+ 'During <b>20 September</b>, our services be will shut down for infrastructure maintenance purposes.'
	+ ' We apologize for the inconvenience.'
	+ '<button class="btn btnTopBanner" type="button"><i class="fa fa-times"></i></button>'
	+ '</div>';
$('body').append(scaffold);
$('div.bannerBox').css({
			//position : 'absolute', width : '100%', 
			//'top' : '0px',
			'background-color' : 'red', 
			'font-size' : '1.2em',
			'max-width' : '250px',
			'padding' : '10px 10px 20px 10px',		
			'min-height' : '100px'
			});
$('div .btnTopBanner').css({'float' : 'right' , 'margin' : '5px 5px 5px 5px'});
$('div.topBanner').css({'background-color' : 'rgba(29, 29, 29, 0.7)',
	'width' : '100%',
	'position' : 'absolute',
	'top' : '0px',
	'padding-left' : '40%'
	});

$('div.topBanner button').on('click', function(){$('div.topBanner').remove();});
}