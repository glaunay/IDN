/*
 *  Scheduler Object
 * 
 * 
 * 
 */

function schedulerInit (opt) {
    
    if (!opt.hasOwnProperty('jobMaker')) {
	console.log("no job template function provided");
	return null;
    }
    
    var period = opt.period ? opt.period : 3000;
    var chunkSize = opt.chunkSize ? opt.chunkSize : 5;
    var nThread = opt.nThread ? opt.nThread : 1;
    
    return {
	period : period,
	nThread : nThread,
	jobMaker : opt.jobMaker,
	threadStatus : [], //"listening", // "deaf", // waiting
	chunkSize : chunkSize,
	inputList : [],
	add : function (data, options) { // add one input to list
/*	    console.dir("adding");
	    console.dir(data);*/
	    this.inputList.push(data);
	},
	delete : function (data) {
	    
	},
	pump : function (nThread) {
	    var self = this;	 
	    var status = self.threadStatus[nThread];
	    if (self.inputList.length === 0) {
		if (! status.mode === "listening") {
		    console.log("thread " + nThread + " nothing to pump, listening ...");			
		    status.mode = "listening";		
		}
		return;
	    }
	    if (status.mode === "waiting") {
		console.log("thread " + nThread + " is waiting for last ajax request");
		return;
	    }
//	    console.log("thread " + nThread + " pumping on " + this.inputList.length + " elements");	    
	    status.mode = "waiting";	    
	    var cnt = 0;	 
	    var array = [];
	    var referer = [];

	    while (self.inputList.length > 0) {
		if (cnt === self.chunkSize) 
		    break;
		var elem = self.inputList[0];		
		var name;
		
		if (elem.hasOwnProperty('details')) 
		    if (elem.details)
			name = elem.details.name;		    
		
		
		if (!name) {
		    console.log("error following object does not allow for job sumission");
		    console.dir(self.inputList[0]);
		    self.inputList.shift();
		    continue;
		}
		
		array.push({type : "association", name : name});
		referer.push(elem);		    		
		cnt++;
		self.inputList.shift();
	    }
	    
	    var requestObject = self.jobMaker.template(array);
	    
	    requestObject['complete'] = function () {
		status.mode = "listening";
	    };
	    requestObject['error'] = function (request, type, errorThrown){
		ajaxErrorDecode(request, type, errorThrown);	
		console.log("following referer set is involved");
		console.dir(referer);
		status.mode = "listening";
	    }, 
	    requestObject['success'] = function (data, textThreadStatus, jqXHR){
		status.mode = "listening"; // useless
		self.jobMaker.callback.success(referer, data);
	    };
	    /*console.log("casting on pump slot " + status.ID);
	    console.dir(requestObject);*/
	    var httpRequest =  $.ajax(requestObject);	
//	    console.dir("input elements left in queue " + this.inputList.length);
	},
	/*Initialize the threads pool*/
	start : function () { // start and listen 
	    var self = this;
	    console.log("Starting pool of " + this.nThread + " threads");	    
	    for (var iThread = 0; iThread < this.nThread; iThread++) {		
		var fn = function (iThread) {
		    var thread = {
			ID : null,
			mode : "listening"
		    };
		    self.threadStatus.push(thread);
		    self.threadStatus[iThread].ID = setInterval(function () {
 							 self.pump(iThread);
						     }, self.period);				
		} (iThread);
	    }  
	},
	/*Clear all timers*/
	stop : function (opt) {
	    for (var i = 0; i < this.threadStatus.length; i++) {
		clearInterval(this.threadStatus[i].ID);
	    }
	    
	    this.threadStatus = [];
	    if (opt)
		if(opt.hasOwnProperty('purge'))
		    if (opt.purge) 
			this.inputList = [];
	},
	/* Send a one time ajax call spliting the corresponding job from inputList */
	_hijack : function (data) {

	}	
    };
}