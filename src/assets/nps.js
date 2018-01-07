const router = require("express").Router();
const db = require("./db/db_sssdata");
const groupByTime = require('group-by-time');

function formatDate(date) {
	var day = date.getDate();
	var monthIndex = date.getMonth() + 1;
	var year = date.getFullYear();
	return monthIndex  + "/" +  day + '/' + year;
}


function paseData(rawData){
	var returnResult = [];
	Object.keys(rawData).forEach(function(key,index) {
	    // key: the name of the object key
	    // index: the ordinal position of the key within the object 
	    //console.log(new Date(eval(key)));
	    var mondayString = new Date(eval(key));
	    var groupScore = rawData[key];
	    var totolVal = 0;
	    groupScore.forEach((d) => {
	  		totolVal += d.score;
	  	});
	  	var averageVal = (totolVal / groupScore.length).toFixed(2);
	  	returnResult.push({
	  		"timeStamp": formatDate(mondayString),
	  		"average": averageVal,
	  		"scoreNm": groupScore.length
	  	});
	});
	return returnResult;
}

function getLastWeekScore(req,res,next){

	function getPriorSevenDay(d) {
	  var d = new Date(d);
	  var day = d.getDay(),
	      diff = d.getDate() - 7;
	  
	  //Use this one to return this format: 25-Jan-2016
	  monday=new Date(d.setDate(diff));
	  var curr_date = monday.getDate();
	  var curr_month = monday.getMonth() + 1;
	  var curr_year = monday.getFullYear();
	  return  curr_year + "-" + curr_month + "-" + curr_date;
	}

	function occurrence(score,arr) {
	    var result = 0;
	    for ( var i = 0; i < arr.length; i++ ) {
	    	if(arr[i] == score) result++;
	    }
	    return result;

	}

	var lastMonday = getPriorSevenDay(new Date()) + " 00:00:01";
	//console.log(lastMonday);
	var query = db.from("npsData")
	  .select('*')
	  query
	  	.whereRaw("insertDT >= ?", lastMonday)
	  	//.whereNotNull("score");
	  /* conditional query building 
	  if ( eventID > 0 ) {
	  	query.where('eventID', eventID);
	  }
	  if ( startDate != "" ) {
	  	
	  }
	  if ( startDate != "" ) {
	  	query.whereRaw("insertDate <= ?", endDate);
	  }*/

	  // console.log(query.toSQL());

	  query.then((data) => {

	  	var submitedScores = data.filter((d) =>{
	  		return d.score
	  	});	  

	  	var scoreMap = submitedScores.map((d) =>{
	  		return d.score;
	  	});

	  	var result=[];
	  	for(var i=0; i < 11; i++){
	  		result.push(occurrence(i,scoreMap))
	  	};

	  	let count = submitedScores.length;
	  	let totolVal = 0;

	  	submitedScores.forEach((d) => {
	  		totolVal += d.score;
	  	});

	  	let averageVal = (totolVal / count).toFixed(2);	  
	  	
	  	var dismissedScores = data.filter((d) =>{
	  		return d.bDismissed
	  	});

	  	var response_rate = ((submitedScores.length / data.length) * 100).toFixed(2);
	  	
	  	var jsonResult = {
  			aveage: averageVal,
  			scored: submitedScores.length,
  			dimissed: dismissedScores.length,
  			response_rate:response_rate,
  			scores_histogram : result
	  	}

	  	res.json(jsonResult);

	  });
}

function getScoreReportByClient(req,res,next){
	var clientName = req.params.clientName;
	var query = db.from("npsData").select('*')
	var nps_launch_date = "9/16/2017";
	query.whereRaw("insertDT >= ?", nps_launch_date)
		.whereRaw("clientName = ?", clientName);
	query.then((data) => {
		res.json(data);
	});
}

function getAverage(req,res,next){

	var query = db.from("npsData").select('score',"feedback",'insertDT',"clientName","eventID","eventName","clientID", "staffIDs","userName")
	var nps_launch_date = "9/16/2017";
	query.whereRaw("insertDT >= ?", nps_launch_date)
		//.whereRaw("insertDT < ?", "9/28/2017")
		.whereNotNull("score");

	query.then((data) => {
		//console.log(data.length);
		let count = data.length;
	  	let totolVal = 0;

	  	data.forEach((d) => {
	  		totolVal += d.score;
	  	});

	  	let averageVal = (totolVal / count).toFixed(2);	
	  	var groupedByWeek = groupByTime(data, 'insertDT', 'week');
	  	var groupedByMonth = groupByTime(data, 'insertDT', 'month');
	  	var groupedByQuarter = groupByTime(data, 'insertDT', 'quarter');

	  	res.json({
	  		"weeklyData": paseData(groupedByWeek),
	  		"monthlyData": paseData(groupedByMonth),
	  		"QuarterlyData":  paseData(groupedByQuarter),
	  		"rawData": data
	  	});

	});
}

function getAllClientsFromNps(req,res,next){
	var query = db.from("npsData").distinct('clientName').select()
	var nps_launch_date = "9/16/2017";
	query.whereRaw("insertDT >= ?", nps_launch_date)
		.whereNotNull("clientName")
		.whereNotNull("score");
	query.then((data) => {
		res.json(data);
	});
}



router
	.get('/api/photosite/nps/',getLastWeekScore)
	.get('/api/photosite/npsReportByClient/:clientName/',getScoreReportByClient)
	.get("/api/photosite/npsAverage/",getAverage)
	.get('/api/photosite/allclients/',getAllClientsFromNps);

module.exports = router  	