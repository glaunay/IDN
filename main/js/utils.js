jQuery.fn.justtext = function() {
   
    return $(this)  .clone()
            .children()
            .remove()
            .end()
            .text();
 
};


/**
 * Performs a deep search looking for the existence of a property in a 
 * nested object. Supports namespaced search: Passing a string with
 * a parent sub-object where the property key may exist speeds up
 * search, for instance: Say you have a nested object and you know for 
 * certain the property/literal you're looking for is within a certain
 * sub-object, you can speed the search up by passing "level2Obj.targetProp"
 * @param {object} obj Object to search
 * @param {object} key Key to search for
 * @return {*} Returns the value (if any) located at the key
 */
getPropByKey = function( obj, key ) {
   /* console.dir(this);
    console.dir(obj);
    console.log(key);*/

    var ret = false, ns = key.split("."),
        args = arguments,
        alen = args.length;

    // Search starting with provided namespace
    if ( ns.length > 1 ) {
        obj = getPropByKey( obj, ns[0] );
        key = ns[1];
    }

    // Look for a property in the object
    if ( key in obj ) {
        return obj[key];
    } else {
        for ( var o in obj ) {
            if ( $.isPlainObject ( obj[o] ) ) {
                ret = getPropByKey( obj[o], key );
                if ( ret === 0 || ret === undefined || ret ) {
                    return ret;
                }
            }
        }
    }

    return false;
}



function unique(arr) {
    var hash = {}, result = [];
    for ( var i = 0, l = arr.length; i < l; ++i ) {
        if ( !hash.hasOwnProperty(arr[i]) ) { //it works with objects! in FF, at least
            hash[ arr[i] ] = true;
            result.push(arr[i]);
        }
    }
    return result;
}


function isOdd(num) { return num % 2;}



/*
 * 
 * 
 * 
 * 
 * 
 * 
 */



function sortAlphaNum(a,b) {
	var reA = /[^a-zA-Z_]/g;
	var reN = /[^0-9]/g;
    var aA = a.replace(reA, "");
    var bA = b.replace(reA, "");
    if(aA === bA) {
        var aN = parseInt(a.replace(reN, ""), 10);
        var bN = parseInt(b.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
        return aA > bA ? 1 : -1;
    }
}



function hyperTextWraper (rawText) {
    
    if (arguments.length > 1) {
//	console.log('ouohu' + arguments[1]);
	if (arguments[1] === 'pmid') {
	    return '<a href="http://www.ncbi.nlm.nih.gov/pubmed/' + rawText + '" target="_blank">' + rawText + '</a>'; 
	} 
	if (arguments[2] === 'imex') {
	    return '<a href="http://www.imexconsortium.org target="_blank">'  + rawText + '</a>';
	} 
    }

    var ressourceMapper = {	
	MI:"http://www.ebi.ac.uk/ontology-lookup/?termId=MI:"
    };
    /*  rawText = "[MI:0099]" + rawText;
     rawText += "[MI:0007]toto";*/
    
  //  console.dir(rawText);
    /*extract external refernce*/    
    var myRegexp = /(\w+)\[([A-Z0-9]+):([A-Z0-9]+)\]/ig;
   /* console.log(rawText);
    console.log("regExp --> " + myRegexp);*/
    var match;
    var matches = [];
    while((match = myRegexp.exec(rawText)) != null) {
/*	console.log("capture->" + match[1]);
	console.log("scanning remains:" + rawText);*/
	var source = match[2];
	var data = match[3];
	if (source in ressourceMapper) {
	    var oldString = match[1] + '[' + source + ':' + data + ']';
	    var newString = ressourceMapper[source] + data;
	    newString = '<a href="' + newString + '" target="_blank">'
	    + match[1]  +'</a>';
	    matches.push ({ oldStr : oldString , newStr : newString});
	  //  console.log('rprawText.replace('+oldString+','+ newString+')');
	}
    }

    //console.log(matches.length + " wrap to perfom");

    /*interpro wrapper*/
    myRegexp = /IPR[\d]+/ig;
    //    'http://www.ebi.ac.uk/interpro/entry/IPR008154'
    
    while((match = myRegexp.exec(rawText)) != null) {
	var oldString = match[0];
//	console.log("old " + oldString);
	var newString = '<a href="http://www.ebi.ac.uk/interpro/entry/' + match[0] + '" target="_blank">'
	    + oldString + '</a>';
//	console.log("->" + newString);
	matches.push ({ oldStr : oldString , newStr : newString});
	
    }
    
   /* console.log(matches.length + " wrap to perfom including ipr");
    console.log("final:" + rawText);*/

    for (var i = 0; i < matches.length ; i++) {
	rawText = rawText.replace(matches[i].oldStr, matches[i].newStr);    
    }
    return rawText;
}


// Extract scale and tr
// just return tr for now but set container for later use
function getTranslationSystem (svgElement) {
    var string = $(svgElement).attr('transform');

 
    var regExp = /(translate.+)\s*(scale.+)$/;
    
    var match =  regExp.exec(string);
    if (match != null) {
	var list =  getTranslationCoordinates (match[1]);

	var container = { 'trList': list};
	return container;
    }

    
}


function getTranslationCoordinates (string) {
    console.log('Extracting coordinate from---->' + string);
    var myRegexp = /translate\(([^,]+),([^,]+)\)/;
    var match = myRegexp.exec(string);
   // console.dir(match);
    var coordinates = [parseFloat(match[1]), parseFloat(match[2])];
    
    return coordinates;
}


/*
 * from http://javascript.crockford.com/remedial.html
 * */

function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (Object.prototype.toString.call(value) == '[object Array]') {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}


function isEmpty(o) {
    var i, v;
    if (typeOf(o) === 'object') {
        for (i in o) {
            v = o[i];
            if (v !== undefined && typeOf(v) !== 'function') {
                return false;
            }
        }
    }
    return true;
}

if (!String.prototype.entityify) {
    String.prototype.entityify = function () {
        return this.replace(/&/g, "&amp;").replace(/</g,
            "&lt;").replace(/>/g, "&gt;");
    };
}

if (!String.prototype.quote) {
    String.prototype.quote = function () {
        var c, i, l = this.length, o = '"';
        for (i = 0; i < l; i += 1) {
            c = this.charAt(i);
            if (c >= ' ') {
                if (c === '\\' || c === '"') {
                    o += '\\';
                }
                o += c;
            } else {
                switch (c) {
                case '\b':
                    o += '\\b';
                    break;
                case '\f':
                    o += '\\f';
                    break;
                case '\n':
                    o += '\\n';
                    break;
                case '\r':
                    o += '\\r';
                    break;
                case '\t':
                    o += '\\t';
                    break;
                default:
                    c = c.charCodeAt();
                    o += '\\u00' + Math.floor(c / 16).toString(16) +
                        (c % 16).toString(16);
                }
            }
        }
        return o + '"';
    };
}

if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(
            /\{([^{}]*)\}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
    };
}





function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


function isRGB   (string) {
    var matchColors = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
    var match = matchColors.exec(string);
    if (match !== null) {
    //document.write('Red: ' + match[1] + ' Green: ' + match[2] + ' Blue: ' + match[3]);
	return true;
    }   
    
    return false;
}

function ajaxErrorDecode (request, type, errorThrown) {
    var message = "There was an error with the AJAX request.\n";
    switch (type) {
    case 'timeout':
	message += "The request timed out.";
	break;
    case 'notmodified':
	message += "The request was not modified but was not retrieved from the cache.";
	break;
    case 'parseerror':
	message += "XML/Json format is bad.";
	break;
    default:
	message += "HTTP Error (" + request.status + " " + request.statusText + ").";
    }
    message += "\n";
    console.log (message);
    
}



(function($) {
    $.fn.drags = function(opt) {

        opt = $.extend({handle:"",cursor:"move"}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                $('.draggable').offset({
                    top:e.pageY + pos_y - drg_h,
                    left:e.pageX + pos_x - drg_w
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', z_idx);
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
            }
        });

    }
})(jQuery);

function makeMouseOutFn(elem, callback){
    var list = [];
    $(elem).find("*").each(function() {
			       var elem = $(this).get();
			       list.push(elem);			       
			   });
    
    return function onMouseOut(event) {
	var e = event.toElement || event.relatedTarget;

	if ($(e).isChildOf(elem))
	    return;
	
	/*console.dir(list);
	console.dir(e);*/
	if (!!~list.indexOf(e)) {
	    return;
	}
	callback();
	// handle mouse event here!
    };
}


  
(function($) {  
    $.fn.extend({  
        isChildOf: function (filter) {  
            return $(filter).find(this).length > 0;  
        }  
    });  
})(jQuery);   
  


function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}


function isEven(n) 
{
   return isNumber(n) && (n % 2 == 0);
}

function isOdd(n)
{
   return isNumber(n) && (n % 2 == 1);
}

function isNumber(n)
{
   return n == parseFloat(n);
}
function cleanArray(array) {
  var i, j, len = array.length, out = [], obj = {};
  for (i = 0; i < len; i++) {
    obj[array[i]] = 0;
  }
  for (j in obj) {
    out.push(j);
  }
  return out;
}
mapperSpecie = [			
							{"name":"Flavobacterium","img":"flavobacterium_bullet.png","id":"984"},
							{"name":"Slime mold","img":"slime_bullet.png","id":"44689"},
							{"name":"Zebrafish","img":"fish_bullet.png","id":"7955"},
							{"name":"Chicken","img":"chicken_bullet.png","id":"9031"},
							{"name":"Human","img":"human_bullet.png","id":"9606"},
							{"name":"Dog","img":"dog_bullet.png","id":"9615"},
							{"name":"Pig","img":"pig_bullet.png","id":"9823"},
							{"name":"Bovine","img":"bovine_bullet.png","id":"9913"},
							{"name":"Sheep","img":"sheep_bullet.png","id":"9940"},
							{"name":"Rabbit","img":"rabbit_bullet.png","id":"9986"},
							{"name":"Mouse","img":"mouse_bullet.png","id":"10090"},
							{"name":"Rat","img":"rat_bullet.png","id":"10116"},
							{"name":"Guinea pig","img":"guineapig_bullet.png","id":"10144"},
							{"name":"HIV-1","img":"hiv_bullet.png","id":"11686"},
							{"name":"HIV-1","img":"hiv_bullet.png","id":"11696"},
							{"name":"none","img":"universal_bullet.png","id":"none"},
						];
speciUrl = function (speci,rootUrl){
			var self = this;
			var urlRoot = rootUrl ? rootUrl + "/img/" :"./img/";
			if(!speci){
				speci = 'none';
			}
			for (var i=0; i < mapperSpecie.length; i++) {
				if (mapperSpecie[i].id == speci){
					return "src ='" + urlRoot + mapperSpecie[i].img + "'";
				}
			};
			return "alt ='.'";
			
	}
_linkMi = function(string){
			var self = this;
			var regExpMi = /\[MI:[0-9]{4}\]/;
			var debutUrl = "https://www.ebi.ac.uk/ontology-lookup/?termId=";
			if (regExpMi.test(string)) {
				var listeString = string.split("[");
				var name = listeString[0];
				var finUrl = listeString[1].substring(0,listeString[1].length - 1);
				var returnString = "<a target = '_blank' href = '" + debutUrl + finUrl + "'>" + name + "</a>";
				return returnString;
			}else{
				return string;
			}
		}