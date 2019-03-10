var user =[];

var rate = [];
var count;
var histories = [];
var tableJQ = $('#rate');
var tweetplace = $('#tweetbutton');
var MaxRate = 3000;
var MinRate = 1000;

$(function() {

    let m = new Map();
    let xs = location.search.substring(1).split('&');
    for (let x of xs) {
      let p = x.split('=');
      m.set(p[0], decodeURIComponent(p[1]));
    }
    if (m.has('q')) document.getElementById("handle").value = m.get('q');

    getData();

    $('#handle').on('keypress', function(ev) {
        if (ev.keyCode == 13) getData();
    })
});

function getData(){
    MaxRate = 3000;
    MinRate = 1000;
    count = 0;
    user.length = 0;
    rate.length = 0;
    histories.length = 0;
    while( $('table tr').length > 1) {
      $('table tr:last').remove();
    }
    var str = document.getElementById("handle").value;
    //var str = "rika0384 rsk0315";
    history.replaceState('', '', `?q=${str}`);
    user = str.split(/\s+/);
    console.log(user.length);
    for(var i = 0; i < user.length; i++){
      getCodeforcesRating(user[i]);
    }
}

function getCodeforcesRating(handle){
    //handle = "rika0384";
    console.log(handle);
    var url = "https://codeforces.com/api/user.rating?handle=" + handle;
    $.ajax(
	      {
		        type     : 'GET',
		        url      : url,
		        dataType : 'json',
		        timeout  : 10000,
		        cache    : false,
	      }).done(function(data){
              //console.log(data.result);
              var highest = 0;
              var lowest = MaxRate;
              for(i = 0; i < data.result.length; i++){
                  highest = Math.max(highest, Number(data.result[i].newRating));
                  lowest = Math.min(lowest, Number(data.result[i].newRating));
              }
              if(highest > MaxRate) MaxRate = highest + 400;
              if(lowest < MinRate) MinRate = lowest - 400;
              //console.log(MaxRate);
              rate.push([handle,Number(data.result[data.result.length-1].newRating),highest]);
              histories.push([handle,data.result]);
	      }).fail(function(data){
              //console.log(data);
              if(handle != "" && data.result == null){
                  alert("'" + handle + "' is not found");
              }
	      }).always(function(data){
              //console.log(data);
              count++;
              console.log(count,handle);
              if(count === user.length){
                  console.log(histories);
                  console.log(rate);
                  histories.sort(function(a,b){ //userをレートでソート
                      return Number(b[1][b[1].length - 1].newRating) - Number(a[1][a[1].length - 1].newRating);
                    });
                  rate.sort(function(a,b){ //userをレートでソート
                        return b[1] - a[1];
                    });
                  makeTable();
                  makeGraph();
              }
	      });

}

function makeTable(){

      var tweet = "";
      tweet += "Codeforces Rate Ranking\n"

        var colors = ['gray', 'lime', 'green', 'blue', 'purple', 'orange', 'red'];
        var colorNum = [1200, 1400, 1600, 1900, 2100, 2400];

            for (var r = 0; r < histories.length; r++) {

                    if(r < 5){
                        var trJQ_r = $('<tr></tr>').addClass('top').appendTo(tableJQ);
                    }else{
                        var trJQ_r = $('<tr></tr>').appendTo(tableJQ);
                    }
                    $('<td></td>').text(r+1).appendTo(trJQ_r); //順位
                    var url = 'https://codeforces.com/profile/';
                    url += rate[r][0];
                    var rateColor = colors.length - 1;
                    for(var i = colors.length; i > 0; i--){
                        if(rate[r][1] <= colorNum[i-1]){
                            rateColor = i-1;
                        }
                    }
                    //console.log(colors[rateColor]);
                    $('<td></td>').append(
                        $('<font></font>').text(rate[r][1] + ' (' + rate[r][2] + ')').attr('color',colors[rateColor]) //現在のレート(最高レート)
                      ).appendTo(trJQ_r);

                    $('<td></td>').append(
                            $('<a></a>').append(
                                $('<font></font>').text(rate[r][0]).attr('color',colors[rateColor]) //ユーザー名
                            ).attr({href: url, target: '_blank'})
                        ).appendTo(trJQ_r);

                    tweet += r+1 + ". " + rate[r][0] + " (" + rate[r][1] + ")\n";



                  }


        var $widget = $("#twitter-widget-0");
        var src = 'https://platform.twitter.com/widgets/tweet_button.73a792b0fbc7ab73a8e3b3db9c36a8ac.en.html#dnt=false&id=twitter-widget-0&lang=en&original_referer=https://rika0384.github.io/codeforces_rating_comparison/index.html&size=m&text=&url=https://rika0384.github.io/codeforces_rating_comparison/index.html';
        var url = src.replace(/\&text=.*\&/, "&text=" + encodeURIComponent(tweet) + "&");
        //console.log(url);
        url += encodeURIComponent(location.search);
        //console.log(location.search);
        //console.log(url);
        $widget.attr({src: url});
        tweetplace.html($widget);

}



function makeSeries(){
      /*
        {user_id, [x:日時, y:レート, contestName, user_id]}
      */

      var ret = [];

      for(var i = 0; i < histories.length; i++){
          //console.log(history[i]);
          var user_id = histories[i][0];
        //  console.log(user_id);
          var data = [];
          for(var j = 0; j < histories[i][1].length; j++){
              //console.log(histories[i][1][j]);
              var x = new Date(histories[i][1][j].ratingUpdateTimeSeconds*1000);
              var y = Number(histories[i][1][j].newRating);
              var contestName = histories[i][1][j].contestName;
              data.push({x, y, contestName, user_id});
          }
          ret.push({name:user_id,data});
      }

      return ret;

}


function makeGraph(){

    //console.log(MaxRate);
    //console.log(MinRate);
    MaxRate -= MaxRate % 400;
    MinRate -= MinRate % 400;
    new Highcharts.Chart({
            title: { text: null },
            colors: ['yellow', 'blue', 'aqua', 'green', 'olive', 'purple', 'teal', 'navy', 'black', 'fuchsia', 'gray', 'maroon'],
            tooltip: {
              formatter: function () {
                return `<b>${this.point.user_id}</b><br />` +
                  `Contest: ${this.point.contestName}<br />` +
                  `Date: ${Highcharts.dateFormat('%e %b %Y', this.x)}<br />` +
                  `Rate: ${this.y}`;
              }
            },
            xAxis: {
              type: 'datetime',
              title: { text: null },
              //tickAmount: 4,
              dateTimeLabelFormats: {month: '%b \'%y', year: '%Y'},
              tickInterval: 30758400000/2
            },
            yAxis: {
              //min: 0,
              startOnTick: false,
              title: { text: null },
              plotLines: [{ value: 0, width: 1, color: '#808080' }],
              tickPositions: [ MinRate - 100, MinRate, 1200, 1400, 1600, 1900, 2100, 2300, 2400, 2600, 3000, MaxRate],
              //max: MaxRate,
              plotBands: [
                { "from":    0, "to": 1200 - 1, "color": 'rgb(204, 204, 204)' },
                { "from": 1200, "to": 1400 - 1, "color": 'rgb(121, 248, 123)' },
                { "from": 1400, "to": 1600 - 1, "color": 'rgb(123, 220, 187)' },
                { "from": 1600, "to": 1900 - 1, "color": 'rgb(170, 172, 252)' },
                { "from": 1900, "to": 2100 - 1, "color": 'rgb(253, 140, 253)' },
                { "from": 2100, "to": 2300 - 1, "color": 'rgb(254, 203, 141)' },
                { "from": 2300, "to": 2400 - 1, "color": 'rgb(253, 186, 94)' },
                { "from": 2400, "to": 2600 - 1, "color": 'rgb(253, 120, 122)' },
                { "from": 2600, "to": 3000 - 1, "color": 'rgb(252, 54, 59)' },
                { "from": 3000, "to": 1000000, "color": 'rgb(168, 5, 14)' },
              ]
            },
            chart: { height: 600, type: 'line', zoomType: 'x', renderTo: 'graph-container' },
            plotOptions: { series: { marker: { enabled: false } } },
            credits: { enabled: false },
            series: makeSeries()
      });
      //console.log(MaxRate);

}/*
var colors = ['gray','lime','green','blue','purple','yellow','orange','#FF6666','red','crimson'];
var colorNum = [1200, 1400, 1600, 1900, 2100, 2300, 2400, 2600, 3000];
*/
