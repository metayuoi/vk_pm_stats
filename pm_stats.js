var inputOnlyInbox = document.createElement("input");
inputOnlyInbox.setAttribute("type", "checkbox");
inputOnlyInbox.setAttribute("id", "onlyInbox");
inputOnlyInbox.setAttribute("checked", "checked");

var onlyInboxContainer = document.createElement("label");
document.querySelector("#ui_rmenu_unread").replaceWith(onlyInboxContainer);
onlyInboxContainer.appendChild(inputOnlyInbox);
onlyInboxContainer.innerHTML = onlyInboxContainer.innerHTML + "только входящие";

var inputIncludeConfs = document.createElement("input");
inputIncludeConfs.setAttribute("type", "checkbox");
inputIncludeConfs.setAttribute("id", "includeConfs");

var includeConfsContainer = document.createElement("label");
document.querySelector("#ui_rmenu_fav").replaceWith(includeConfsContainer);
includeConfsContainer.appendChild(inputIncludeConfs);
includeConfsContainer.innerHTML = includeConfsContainer.innerHTML + "включать конференции";

var calculate = document.createElement("button");
calculate.innerHTML = "пересчитать";
calculate.setAttribute("id", "calculate");
document.querySelector("#ui_rmenu_all").replaceWith(calculate);

document.querySelector("#calculate").addEventListener("click", displayResult);


onlyInboxContainer.style.display = "block";
includeConfsContainer.style.display = "block";

calculate.parentElement.style.textAlign = "center";
onlyInboxContainer.style.textAlign = "left";
includeConfsContainer.style.textAlign = "left";



var container = document.querySelector("#im_dialogs").cloneNode(true);
container.setAttribute("id", "container");
document.querySelector("#im_dialogs").replaceWith(container);


var s_ajaxListener = new Object();
s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;
s_ajaxListener.callback = function () {
	if (s_ajaxListener.data) {
		XMLHttpRequest.prototype.open = s_ajaxListener.tempOpen;
		XMLHttpRequest.prototype.send = s_ajaxListener.tempSend;
		var input = document.createElement("input");
		input.setAttribute("type", "text");
		input.setAttribute("id", "input");
		input.style.position = "relative";
		input.style.top = "-25px";
		input.style.width = "200px";
		input.value = document.querySelector("#im_dialogs_search").value;
		document.querySelector(".im-page--header").replaceWith(input);
		setTimeout(document.querySelector("#container").innerHTML = "");
		document.querySelector(".im-page--dialogs._im_page_dialogs.page_block").style.textAlign = "center";
		input.focus();
		document.querySelector("#input").addEventListener("keydown", function(e) {
			if (e.key === "Enter") {
				getData(e.target.value, 0, s_ajaxListener.data.match(/\&hash\=\w*/));
			};
		})
	}
}

XMLHttpRequest.prototype.open = function(a,b) {
  if (!a) var a='';
  if (!b) var b='';
	if (a.toLowerCase() == "post" && b == "/al_im.php") {
  s_ajaxListener.tempOpen.apply(this, arguments);
  s_ajaxListener.method = a;  
  s_ajaxListener.url = b;
    }
}

XMLHttpRequest.prototype.send = function(a,b) {
  if (!a) var a='';
  if (!b) var b='';
  s_ajaxListener.tempSend.apply(this, arguments);
  if(s_ajaxListener.method.toLowerCase() == 'post' && a.substr(0,12) === "act=a_search") s_ajaxListener.data = a;
  s_ajaxListener.callback();
}

document.querySelector("#im_dialogs_search").setAttribute("placeholder", "Начните вводить текст для запуска скрипта");
document.querySelector("#container").innerHTML ="<canvas id='myCanvas'></canvas><div id='myLegend'></div>";


var myLegend = document.getElementById("myLegend");
var myCanvas = document.getElementById("myCanvas");
myCanvas.width = 300;
myCanvas.height = 300;
var ctx = myCanvas.getContext("2d");

var ids;
var myStore = {};
var ordered = {};
var total;
var filteredIds;

var p_inbox = []
var p_sent = []
var conf_inbox = []
var conf_sent = []
var autors = {}

function getData(string, offset, hash) {

	
	
	if (offset === 0) {
		p_inbox = []
		p_sent = []
		conf_inbox = []
		conf_sent = []
		autors = {}
	}
	
	var req = new XMLHttpRequest;
	req.open("POST", "https://vk.com/al_im.php?act=a_search&al=1&from=all&gid=0" + hash + "&im_v=2&offset=" + offset + "&q=" + encodeURIComponent(string), false); 
	req.send(); 
	var response = req.response;
	response = response.replace(/.*?\<\!json\>/, "");
	response = response.replace(/\<\!\>\<\!\int\>.*\<\!\>\<\!bool\>/, "");

	var json1 = response.replace(/(\<\!json\>\[|\<\!\>\[?).*/g, "");
	json1 = JSON.parse(json1);
	autors = Object.assign(autors, json1);
	//console.log(json1);
	
	var json2 = response.replace(/.*(\<\!json\>\[|\<\!\>\[?)/g, "");
	json2 = "[" + json2;
	if (json2[json2.length-1] === "1") {json2 = json2.slice(0, -1)};
	json2 = JSON.parse(json2);
	
	//console.log(json2);
	
	console.log(offset / 30 + 1);

	if ((json2.length>0) && ((offset / 30) < 100)) {
		for (i=0; i<json2.length; i++) {
			if (json2[i][5]["from"]) {
				if (json2[i][7] === 0) {
					conf_inbox.push(json2[i]);
				}
				else {conf_sent.push(json2[i]);}
			}
			else {
				if (json2[i][7] === 0) {
					p_inbox.push(json2[i]);
				}
				else {p_sent.push(json2[i]);}
			}
		}
		
		getData(string, offset+30, hash);
	}
	
	else {displayResult()};

}

function displayResult() {
	
	var onlyInbox = document.querySelector("#onlyInbox").checked;
	var includeConfs = document.querySelector("#includeConfs").checked;
	
	document.querySelector("#container").innerHTML ="<canvas id='myCanvas'></canvas><div id='myLegend'></div>";

	var myLegend = document.getElementById("myLegend");
	var myCanvas = document.getElementById("myCanvas");
	myCanvas.width = 300;
	myCanvas.height = 300;
	var ctx = myCanvas.getContext("2d");
	
	myStore = {};
	ordered = {};
	total = 0;
	filteredIds = {};
	
	ids = p_inbox.map(function(item) {return item[2]});
	
	if (!onlyInbox) {
		ids = ids.concat(p_sent.map(function(item) {return item[2]}));
	}
	
	if (includeConfs) {
		ids = ids.concat(conf_inbox.map(function(item) {return item[2]}));
	}
	
	if (!onlyInbox && includeConfs) {
		ids = ids.concat(conf_sent.map(function(item) {return item[2]}));
	}

	for (var i = 0; i < ids.length; i++) {
	  var key = ids[i]; 
	  myStore[key] = true;
	}
	
	for(i=0; i<Object.keys(myStore).length; i++) {
		console.log("Осталось: " + String(Object.keys(myStore).length - i));
		var count = 0;
		for (j = 0; j < ids.length; j++){
			if(ids[j] == Object.keys(myStore)[i]) {count++}
		}
		myStore[Object.keys(myStore)[i]] = count;
	} 

	filteredIds = Object.keys(myStore).sort(function(a,b){return myStore[b] - myStore[a]});
	
	for (i=0; i<filteredIds.length && i<9; i++) {
		ordered[autors[filteredIds[i]].tab] = myStore[filteredIds[i]]
	}
	
	
	total = filteredIds.reduce(function(sum, key) {return sum + myStore[key]}, 0);
	if (filteredIds.length > 9) {
		ordered["остальные"] = total - filteredIds.reduce(function(sum, key, i) {if (i<9) {return sum + myStore[key]} else {return sum}}, 0);
	}
	
	var myDougnutChart = new Piechart(
    {
        canvas:myCanvas,
        data:ordered,
        colors:["#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
        legend:myLegend
    });
	myDougnutChart.draw();
	
}


function drawLine(ctx, startX, startY, endX, endY){
    ctx.beginPath();
    ctx.moveTo(startX,startY);
    ctx.lineTo(endX,endY);
    ctx.stroke();
}

function drawArc(ctx, centerX, centerY, radius, startAngle, endAngle){
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();
}
	
function drawPieSlice(ctx,centerX, centerY, radius, startAngle, endAngle, color ){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX,centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
}
	
var Piechart = function(options){
    this.options = options;
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.colors = options.colors;
 
    this.draw = function(){
        var total_value = 0;
        var color_index = 0;
        for (var categ in this.options.data){
            var val = this.options.data[categ];
            total_value += val;
        }
 
        var start_angle = 0;
        for (categ in this.options.data){
            val = this.options.data[categ];
            var slice_angle = 2 * Math.PI * val / total_value;
 
            drawPieSlice(
                this.ctx,
                this.canvas.width/2,
                this.canvas.height/2,
                Math.min(this.canvas.width/2,this.canvas.height/2),
                start_angle,
                start_angle+slice_angle,
                this.colors[color_index%this.colors.length]
            );
 
            start_angle += slice_angle;
            color_index++;
        }
		
		/*	start_angle = 0;
			for (categ in this.options.data){
			val = this.options.data[categ];
			slice_angle = 2 * Math.PI * val / total_value;
			var pieRadius = Math.min(this.canvas.width/2,this.canvas.height/2);
			var labelX = this.canvas.width/2 + (pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
			var labelY = this.canvas.height/2 + (pieRadius / 2) * Math.sin(start_angle + slice_angle/2);

			var labelText = Math.round(100 * val / total_value);
			this.ctx.fillStyle = "white";
			this.ctx.font = "bold 20px Arial";
			this.ctx.fillText(labelText+"%", labelX,labelY);
			start_angle += slice_angle;
		} */
		
		if (this.options.legend){
            color_index = 0;
            var legendHTML = "";
            for (categ in this.options.data){
                legendHTML += "<div style='width: 300px;margin-left:auto;margin-right:auto;text-align:left;'><span style='display:inline-block;width:20px;background-color:"+this.colors[color_index++]+";'>&nbsp;</span> "+categ+"<span class='sum' style='font-weight: bold; float: right;'>" + Math.round(100 * this.options.data[categ] / total_value) + "%</span></div>";
            }
            this.options.legend.innerHTML = legendHTML;
        }
    }
	
}