// This code generates a "Raw Searcher" to handle search queries. The Raw
// Searcher requires you to handle and draw the search results manually.
google.load('search', '1');

var newsSearch;

const STATE_MAX = 0;
const CITIES_MAX = 10;

const cities = [ "Jacksonville[g], Florida", "Charlotte, North Carolina", 
		"Memphis, Tennessee", 
		"Washington, District of Columbia", "Nashville, Tennessee",
		"Louisville, Kentucky", "Virginia Beach, Virginia", "Atlanta, Georgia",
		"Raleigh, North Carolina", "Miami, Florida", "Tampa, Florida",
		"Lexington, Kentucky", "Greensboro, North Carolina", "St. Petersburg, Florida",
		"Orlando, Florida", "Norfolk, Virginia", 
		"Durham, North Carolina", "Winston-Salem, North Carolina",
		"Hialeah, Florida", "Chesapeake, Virginia","Birmingham, Alabama",

];

const states = [ "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
		"GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
		"MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
		"ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
		"VA", "WA", "WV", "WI", "WY" ];

var stateNdx = -1;
var cityNdx = -1;
var query;
var articlesFound;
var complete = false;

function searchComplete() {
	// Check that we got results
	if (cityNdx == 0 && stateNdx == 0 && (newsSearch.results == null || (newsSearch.cursor == null && newsSearch.results.length == 0))) 
	{
		// No results found
		return;
	} 

	for ( var i = 0; i < newsSearch.results.length; i++) 
	{
		if (!articlesFound.hasOwnProperty(newsSearch.results[i].unescapedUrl))
		{
			// only add newly discovered articles
			articlesFound[newsSearch.results[i].unescapedUrl] = "";
			
			// Create HTML elements for search results
			var row = document.createElement('tr');
			var urlCol = document.createElement('td');
			var titleCol = document.createElement('td');
			var contentCol = document.createElement('td');
			var stateCol = document.createElement('td');

			var p = document.createElement('p');
			var a = document.createElement('a');
			var p2 = document.createElement('p');

			a.href = newsSearch.results[i].unescapedUrl;
			a.innerHTML = newsSearch.results[i].unescapedUrl;
			a.target = "_blank";
			urlCol.appendChild(a);

			titleCol.innerHTML = cleanUpStrings(newsSearch.results[i].title);
			contentCol.innerHTML = cleanUpStrings(newsSearch.results[i].content);

			if (stateNdx >= 0 && stateNdx < STATE_MAX) {
				stateCol.innerHTML = states[stateNdx] + " stateNdx: " + stateNdx;
			} else if (stateNdx + 1 >= STATE_MAX && cityNdx >= 0 && cityNdx < CITIES_MAX) {
				stateCol.innerHTML = cities[cityNdx] + " cityNdx: " + cityNdx;
			}
			else
			{
				stateCol.innerHTML = "World wide";
			}

			row.appendChild(urlCol);
			row.appendChild(titleCol);
			row.appendChild(contentCol);
//			row.appendChild(stateCol);

			$('#results-table').append(row);
		}
	}
	
	if (newsSearch.cursor != null && newsSearch.cursor.currentPageIndex + 1 < newsSearch.cursor.pages.length) 
	{
		newsSearch.gotoPage(newsSearch.cursor.currentPageIndex + 1);
	} 
	else if (stateNdx + 1 < STATE_MAX) 
	{
		updateProgress();		
		
		newsSearch.setQueryAddition('');
		newsSearch.setQueryAddition('"' + states[++stateNdx] + '"');
		newsSearch.execute(query);		
	} 
	else if (cityNdx + 1 < CITIES_MAX) 
	{
		updateProgress();		
		
		newsSearch.setQueryAddition('');
		newsSearch.setQueryAddition(cities[++cityNdx]);
		newsSearch.execute(query);
	}
	else
	{
		// all done
		updateProgress();		
	}
}

function cleanUpStrings(str) {
	// mTurk doesn't like unicode characters in our CSVs - removing them.
	str = str.replace(/[\u0080-\uF8FF]/g, '');
	str = str.replace(/&quot;/g, '')
	
	return str;
}

function updateProgress() {
	// ndx's start off at -1
	var progress = Math.round((stateNdx + cityNdx + 3) / (STATE_MAX + CITIES_MAX + 1) * 100);
	
	setProgress(progress);
}

function resetProgress() {
	$("#progress-container").addClass("active");
	$("#progress-container").addClass("progress-striped");
	$("#progress-container").css('cursor', 'wait');
	
	$("#progress-bar").removeClass("btn");
	$("#progress-bar").removeClass("btn-primary");
	
	$("#progress-bar").unbind('click');
	$("#progress-bar").text('Loading articles...');	
	
	$("#download-link").attr('href', null);
	$("#download-link").attr('download', null);
	
	setProgress(5);
	complete = false;
}

function setProgress(progress) {	
	$("#progress-bar").attr("aria-valuetransitiongoal", progress);
	$('.progress .progress-bar').progressbar();
}

function progressComplete()
{
	complete = true;
	totalArticles = Object.keys(articlesFound).length;
	
	$("#progress-container").removeClass("active");
	$("#progress-container").removeClass("progress-striped");
	
	$("#progress-bar").click(null);
	
	if (totalArticles > 0)
	{		
		$("#download-link").attr('href', getCsvUrl());
		$("#download-link").attr('download', getCsvName());
		
//		$("#progress-bar").click(function () {
//			$("#download-link").click();
//		});		
		
		$("#progress-bar").html('Found ' + totalArticles + ' "' + query + '" articles. Click to download.');
		$("#progress-bar").addClass("btn");
		$("#progress-bar").addClass("btn-primary");
		
		$("#progress-container").css('cursor', 'pointer');
	}
	else
	{
		$("#progress-bar").html('No articles found');
		$("#progress-container").css('cursor', 'auto');		
	}
}

function getCsvUrl() {
    var csv = $("#results-table").table2CSV({delivery:'value'});
    return 'data:text/csv;charset=ASCII,' + encodeURIComponent(csv);
    
//    a = document.createElement('a');
//    //a.href =  'data:text/csv;charset=UTF-8,' + encodeURIComponent(csv); 
//    a.href =  'http://google.com';
//    a.download = "word.csv";
//    
//    a.click();
}

function getCsvName() {
	return query.trim().split(' ').join('_') + '_articles.csv';
}

function fireAway() {

	// Clear results table
	$("#results-table").find("tr:gt(0)").remove();

	// Create a News Search instance.
	newsSearch = new google.search.NewsSearch();

	// Set searchComplete as the callback function when a search is
	// complete. The newsSearch object will have results in it.
	newsSearch.setSearchCompleteCallback(this, searchComplete, null);

	newsSearch.setResultSetSize(8);

	stateNdx = -1;
	cityNdx = -1;
	query = $("#news-search").val();
	articlesFound = {};
	resetProgress();

	// Specify search quer(ies)
	newsSearch.execute(query);
}

$(document).ready(function() {
	$("#search-button").click(function() {
		fireAway();
	});
	
	$('.progress .progress-bar').progressbar({
		done: function() {
			var progress = $("#progress-bar").attr("aria-valuetransitiongoal");
			
			if (progress != null && progress >= 100 && !complete)
			{				
				progressComplete();
			}
		}
	});
	
//	$('#twitter').sharrre({
//		  share: {
//		    twitter: true
//		  },
//		  template: '<a class="box" href="#"><div class="count" href="#">{total}</div><div class="share"><span></span>Tweet</div></a>',
//		  enableHover: false,
//		  enableTracking: true,
//		  urlCurl: '',
//		  buttons: { twitter: {via: 'CustomerDevLabs'}},
//		  click: function(api, options){
//		    api.simulateClick();
//		    api.openPopup('twitter');
//		  }
//		});
//		$('#facebook').sharrre({
//		  share: {
//		    facebook: true
//		  },
//		  template: '<a class="box" href="#"><div class="count" href="#">{total}</div><div class="share"><span></span>Like</div></a>',
//		  enableHover: false,
//		  enableTracking: true,
//		  urlCurl: '',
//		  click: function(api, options){
//		    api.simulateClick();
//		    api.openPopup('facebook');
//		  }
//		});
//		$('#googleplus').sharrre({
//		  share: {
//		    googlePlus: true
//		  },
//		  template: '<a class="box" href="#"><div class="count" href="#">{total}</div><div class="share"><span></span>Google+</div></a>',
//		  enableHover: false,
//		  enableTracking: true,
//		  urlCurl: '',
//		  click: function(api, options){
//		    api.simulateClick();
//		    api.openPopup('googlePlus');
//		  }
//		});
	
	$('#sharing').share({
		networks: ['twitter','googleplus','facebook','linkedin'],
		urlToShare: 'http://wp.me/p2pmCq-gA'
	});
		
//	  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
//	  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
//	  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
//	  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
//	
//	  ga('create', 'UA-44161122-1', 'customerdevlabs.com');
//	  ga('send', 'pageview');
});
