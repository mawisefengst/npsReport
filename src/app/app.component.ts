import { Component,ElementRef } from '@angular/core';
import { AppServiceService } from './app-service.service';
declare var d3:any;
declare var jQuery:any;
declare var _:any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [AppServiceService]
})
export class AppComponent{
  title: string;
  npsData : any;
  allClients : any;
  frequence : string;
  svg: any;
  startDate:string;
  endDate:string;
  filteredData :any;
  currentClient: any;
  currentClientData: any;

  constructor(private appservice : AppServiceService,private elementRef:ElementRef){
    this.frequence = "week";
    this.startDate = "09/16/2017";
    var today = new Date();
    this.endDate = (today.getMonth() + 1) + "/" + today.getDate()+ "/" + today.getFullYear();
  	this.appservice.getUrl().subscribe(data=>{
  		 this.npsData = data;
       this.initLineChart(this.npsData[this.frequence +"lyData"], this.frequence);
  	})

    this.appservice.getAllClients().subscribe(data => {
      this.allClients = data;
    });
  }

  ngOnInit() {
    jQuery(".datepicker_startDate").datepicker({
        onSelect: (dateText) => {
          this.changeRangeStartDate(dateText);
        }
    });
    jQuery(".datepicker_endDate").datepicker({
        onSelect: (dateText) => {
          this.changeRangeEndDate(dateText);
        }
    });
  }

  changeFrenquence(value){
    this.frequence = value;
    this.initLineChart(this.npsData[this.frequence +"lyData"], this.frequence);
  }

  changeRangeStartDate(value){
    this.startDate = value;
    this.filterData();
  }

  changeRangeEndDate(value){
    this.endDate = value;
    this.filterData();
  }

  changeClient(client){

    function formatDate(date) {
      var day = date.getDate();
      var monthIndex = date.getMonth() + 1;
      var year = date.getFullYear();
      var hour = date.getHours();
      var minute = date.getMinutes();
      var amPM = (hour > 11) ? "pm" : "am";
      if(hour > 12) {
        hour -= 12;
      } else if(hour == 0) {
        hour = "12";
      }
      if(minute < 10) {
        minute = "0" + minute;
      }
      return monthIndex  + "/" +  day + '/' + year + " " + hour + ":" + minute + amPM;
    }

    var rawData = this.npsData.rawData;
    this.currentClientData = rawData.filter((data) =>{
       data.insertDTShow = formatDate(new Date(data.insertDT));
       return data.clientName ==  client;
    });

    function compare(a,b) {
      if (new Date(a.insertDT).valueOf() < new Date(b.insertDT).valueOf())
        return 1;
      if (new Date(a.insertDT).valueOf() > new Date(b.insertDT).valueOf())
        return -1;
      return 0;
    }

    this.currentClientData.sort(compare);

  }

  filterData(){
     var rawData = this.npsData.rawData;
     var validatedData = rawData.filter((data) =>{
         return new Date(data.insertDT).getTime() >= new Date(this.startDate).getTime() && new Date(data.insertDT).getTime() <= new Date(this.endDate).getTime()
     });
     var filtedData = this.groupByTime(validatedData,"insertDT", this.frequence);
     this.initLineChart(filtedData, this.frequence);
  }

  initLineChart(lineData,frenquence){
      this.filteredData = lineData;
      var WIDTH = 500,
          HEIGHT = 420,
          MARGINS = {top: 15,right: 20, bottom:70,left: 50};

      function numberWithCommas(x) {
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      if(typeof this.svg === "undefined"){
        this.svg = d3.select("#svgWrapper").append("svg").attr("class","svgWrapper_revised_class").style("height",HEIGHT - MARGINS.top - MARGINS.bottom).style("width", WIDTH + MARGINS.right);
      }
      this.svg.selectAll("*").remove();

      lineData.forEach(function(d) {
          d.x = new Date(d.timeStamp);
          d.y = parseFloat(d.average);
      });

      var xRange =d3.time.scale()
        .range([MARGINS.left, WIDTH - MARGINS.right])
        .domain([new Date(lineData[0].x), d3.time.day.offset(new Date(lineData[lineData.length - 1].x), 1)])
      ;

      var yRange = d3.scale.linear()
        .range([HEIGHT - MARGINS.top, MARGINS.bottom])
        .domain([d3.min(lineData, function (d) {return d.y;})* 0.99,
        d3.max(lineData, function (d) {return d.y;})* 1.01
      ]),

      xAxis = d3.svg.axis() 
      .scale(xRange) 
      .orient('bottom')
      .tickSize(1)
      .tickFormat(d3.time.format("%m/%d/%Y"))
      .ticks(d3.time.monday); 

      if(frenquence == "week" )  xAxis.ticks(d3.time.monday); 
      if(frenquence == "month" )   xAxis.ticks(d3.time.month);
      if(frenquence == "quarter" )  xAxis.ticks(d3.time.month,3);

      var yAxis = d3.svg.axis()
      .scale(yRange)
      .tickSize(1)
      .orient("left")
      .tickSubdivide(true); 

     this.svg.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom - MARGINS.top) + ")")
      .call(xAxis) 
      .selectAll("text")  
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", function(d) {
                return "rotate(-65)" 
       });

      d3.selectAll(".x")
      .selectAll("line") 
      .attr("y2", "6");

     this.svg.append("svg:g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + (MARGINS.left) + ","+ (-1) * MARGINS.bottom +")")
      .call(yAxis)
      .selectAll("line") 
      .attr("x2", "0")
      .attr("x1", WIDTH - MARGINS.right - MARGINS.left)
      .attr("stroke", "gray")
      .attr('stroke-width', 1);

      this.svg.selectAll(".y").selectAll("text").attr("x", "-10").attr("y", "0").text(function(val){
            return val.toFixed(2);
      });

      var lineFunc = d3.svg.line()
      .x(function (d) { return xRange(new Date(d.x));})
      .y(function (d) { return yRange(d.y);})
      .interpolate('linear');

      var focus  = this.svg.append("g").attr("class","focusClass");

      focus.append("text")
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("class","focusClassVal");

      var focusTxt  = this.svg.append("g").attr("class","focusClassTxt");

      focusTxt.append("text").attr("class","focusClassTxtField");

      focusTxt.select(".focusClassTxtField").append("tspan").attr("class","yVal");

      focusTxt.select(".focusClassTxtField").append("tspan").attr("class","yTime");

     var verticalLineNew = this.svg.append('line')
      // .attr('transform', 'translate(100, 50)')
      .attr({'x1': 0,'y1': 0 ,'x2': 0,'y2': HEIGHT - MARGINS.bottom - MARGINS.top })
      .attr("opacity", 0)
      .attr("stroke-dasharray","5,1") 
      .attr("stroke", "rgb(44,39,32)").attr('class', 'verticalLineNew');

      var verticalLineNewXaxis = this.svg.append('line')
      // .attr('transform', 'translate(100, 50)')
      .attr('x1', MARGINS.left)
      .attr("opacity", 0)
      .attr("stroke", "rgb(193,184,170)").attr('class', 'verticalLineNewXaxis');

      this.svg.append("svg:path")
        .attr("d", lineFunc(lineData))
        .attr("stroke", "rgb(214, 56, 104)")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("transform", "translate(0," + (-1) * MARGINS.bottom + ")")
        .append("title");  


        var datePoints = this.svg.selectAll(".line-chart__date-point");
        datePoints = datePoints.data(lineData);
        datePoints.exit().remove();
        datePoints.enter().append("circle").attr("class", "line-chart__date-point").attr("r", 3);
        datePoints.attr("cx", function(d) {
            return xRange(new Date(d.x))
        }).attr("cy", function(d) {
            return  yRange(d.y)  - MARGINS.bottom
        }).attr("r", 4.5)
        .attr("fill", "rgb(255,255,255)")
        .attr("opacity", 1)
        .attr("stroke", "rgb(214, 56, 104)")
        .attr("stroke-width", "1px)");

  }

  groupByTime(arr, key, group) {

      function formatDate(date) {
        var day = date.getDate();
        var monthIndex = date.getMonth() + 1;
        var year = date.getFullYear();
        return monthIndex  + "/" +  day + '/' + year;
      }

      function paseData(rawData){
        var returnResult = [];
        Object.keys(rawData).forEach(function(key,index) {
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

      function getMonday(d) {
        var day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6:1) // adjust when day is sunday
        return new Date(d.setDate(diff))
      }
   
      var groupings = {
          day: function (obj) {
            var date = new Date(obj[key])
            date.setHours(0, 0, 0, 0)
            return date.valueOf()
          }, 
          week: function (obj) {
            var date = new Date(obj[key])
            date.setHours(0, 0, 0, 0)
            return getMonday(date).valueOf()
          }, 
          month: function (obj) {
            var date = new Date(obj[key])
            return new Date(date.getFullYear(), date.getMonth(), 1).valueOf()
          },
          quarter: function(obj){
            var date = new Date(obj[key])
            return new Date(date.getFullYear(), Math.floor(date.getMonth()/3) * 3, 1).valueOf()
          }
      }
      if (!group) group == 'day'
      return paseData(_.groupBy(arr, groupings[group]));
  }

  mMove(event: MouseEvent): void {
        //this.event = event;

        var bisectDate = d3.bisector(function(d) { return d.x; }).left;

        //var m = d3.mouse(event.currentTarget);
        
        var m = [event.offsetX, event.offsetY];

        var WIDTH = 500,
            HEIGHT = 420,
            MARGINS = {top: 10,right: 20, bottom:70,left: 50}; 

       var lineData = this.filteredData;

       var xRange =d3.time.scale()
          .range([MARGINS.left, WIDTH - MARGINS.right])
          .domain([new Date(lineData[0].x), d3.time.day.offset(new Date(lineData[lineData.length - 1].x), 1)])
        ;

         var yRange = d3.scale.linear()
            .range([HEIGHT - MARGINS.top, MARGINS.bottom])
            .domain([d3.min(lineData, function (d) {
              return d.y;
            })* 0.99,
            d3.max(lineData, function (d) {
              return d.y;
            })* 1.01
         ]); 

         var xVal = xRange.invert(m[0]); // 25
         var yVal = yRange.invert(m[1]); // 25

         var i= bisectDate(lineData,xVal,1),
         d0 = lineData[i - 1],
         d1 = lineData[i];

         var xValPosDisplay = function(xValPos){
           var result = xValPos;
           if(result > 300) result = 300;
           if(result < 55 ) result = 60;
           return result - 5;
         }

          var decimalPlaces = function(num) {
            var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
            if (!match) { return 0; }
            return Math.max(
                 0,
                 // Number of digits right of decimal point.
                 (match[1] ? match[1].length : 0)
                 // Adjust for scientific notation.
                 - (match[2] ? +match[2] : 0));
          }


          var displayChartVal = function(val){
            //if(metal != "ni") return parseFloat(val);
            //else return val;
            var result = val;
            if(decimalPlaces(val) > 4)  result = result.toFixed(4);
            return result
          }

           if(typeof d1 != "undefined" && typeof d0 != "undefined") {
             var d = xVal - d0.x > d1.x - xVal ? d1 : d0;
             //jQuery(".yValue").html(d.y);
              var xValPos = xRange(new Date(d.x)) ,
              yValPos = yRange(d.y)  - MARGINS.bottom;
             //tooltip.attr({"transform": "translate("+ xValPos + "," + yValPos+ ")"});
             //tooltip.attr({"opacity": 1});
             //tooltip.text(yValPos);


              d3.select(event.currentTarget).select(".verticalLineNew").attr("opacity", 1)
              /*.attr("y1", yValPos)*/
              .attr("transform", function () {
                    return "translate(" + xValPos + ",0)";
              });

             /* d3.select(this).select(".verticalLineNewXaxis").attr("opacity", 1)
              .attr("y1", yValPos)
              .attr("x2", xValPos)
              .attr("y2", yValPos);*/


              d3.select(event.currentTarget).select(".focusClass").attr({"opacity":"1","transform":"translate(" + xValPos + "," + yValPos + ")"});
              var dataFormate = " (" + d.timeStamp + ") " + d.scoreNm + " Scores";
              var showVal ="Average: "+ d.y ;
             // if(metal == "ni") showVal = (showVal * 1000).toLocaleString();
             // d3.select(this).select(".focusClass").select(".focusClassVal").attr({"transform":"translate("+ (xValPos -40 ) +",20)"}).html(showVal);
              d3.select(event.currentTarget).select(".focusClassTxt").attr({"opacity":"1","transform":"translate(" + xValPosDisplay(xValPos) + ",-9)"});
              //d3.select(this).select(".focusClassTxt").select(".focusClassTxtField").html(showVal + dataFormate);
              d3.select(event.currentTarget).select(".focusClassTxt").select(".focusClassTxtField").select(".yVal").text(showVal);
              d3.select(event.currentTarget).select(".focusClassTxt").select(".focusClassTxtField").select(".yTime").text(dataFormate);
              d3.select(event.currentTarget).select(".focusClass").select("circle").attr({"opacity":"1"});
             // d3.select(this).select(".focusClassTxt").select(".focusClassTxtField").attr("fill","gray");
              //d3.select(this).select(".circleClass").attr("opacity", 1).attr("cx", xValPos).attr("cy", yValPos);
          } 

  }

  mMoveLeave(event: MouseEvent): void {
      d3.select(event.currentTarget).select(".verticalLineNew").attr("opacity", 0).attr("transform", function () {
            return "translate(0,0)";
      });
      d3.select(event.currentTarget).select(".verticalLineNewXaxis").attr("opacity", 0).attr("transform", function () {
            return "translate(0,0)";
      });
      d3.select(event.currentTarget).select(".circleClass").attr("opacity", 0).attr("cx", 0).attr("cy", 0);
      d3.select(event.currentTarget).select(".focusClass").attr({"transform":"translate(0,0)","opacity":0});
      d3.select(event.currentTarget).select(".focusClassTxt").attr({"transform":"translate(0,0)","opacity":0});
  }



}
