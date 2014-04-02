var map = null;
var markers = [];
var routes = [];
var google_api_key = 'AIzaSyCVhqb_4YGV_R2mwK5qNSgsGakBGlx3uBA';

$(document).ready(function(){
	setMap();
	addNewPatient('Mustaqim', 'Block 907 Jurong West St 91 Singapore 640907', '97325634');
	addNewPatient('Nenek', 'Block 513 West Coast Road Singapore 120513', '67741009');
	addNewPatient('CoolData', '80 Stamford Road Singapore 178902', '67741009');
	
	$('.nurse-icon').click(mapPointVertexes);
	$('.patient-icon').click(plotEverything);
	
});

function plotEverything()
{
	for (var i = 0; i < data.patientList.length; i++)
	{
		var patientName = data.patientList[i];
		var patient = data.patients[patientName];
		
		addMarker([patient.lat, patient.lng]);
	}
	
	for (var i = 0; i < data.routeList.length; i++)
	{
		var key = data.routeList[i];
		var route = data.routes[key];
		
		plotRoute(route.points);
	}
	
	$('.cover').hide();
}

function setMap() {
	if (!map)
	{
		map = L.map('map', { zoomControl: false }).setView([1.355312, 103.827068], 12);
		var layer = L.tileLayer(	
			'http://{s}.tile.cloudmade.com/{key}/3337/256/{z}/{x}/{y}.png',
			{
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
				key: '083ffc0920af489ea567776456cf13b5'
			}).addTo(map);
	}
	else
	{
		map.setView([1.355312, 103.827068], 12);
	}
}

function addMarker(coor)
{
	var marker = L.marker(coor).addTo(map);
	markers.push(marker);
}

function plotRoute(points)
{
	for (var i = 0; i < points.length; i++)
	{
		var pointL = points[i];
		var polyline = new L.Polyline(pointL).addTo(map);
		routes.push(polyline);
	}
}

function AppException(title, message)
{
	this.title = title;
	this.message =  message;
}




/* ALL API RELATED CODES GOES HERE */
function getPatientLocation(patient)
{
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + encodeUrl(patient.address) + '&key=' + google_api_key;
	//alert(JSON.stringify(patient));
	proxy(url, 
		function(response)
		{
			if (response.results)
			{
				if (response.results[0])
				{
					patient.lat = response.results[0].geometry.location.lat;
					patient.lng = response.results[0].geometry.location.lng;
					data.patients[patient.name] = patient;
				}
			}
		}
	);
}

function mapPointVertexes()
{
	for (var i = 0; i < data.patientList.length; i++)
	{
		var currentName = data.patientList[i];
		var current = data.patients[currentName];
		
		for (var j = i + 1; j < data.patientList.length; j++)
		{
			var nextName = data.patientList[j];
			var next = data.patients[nextName];
			
			var url = 'https://maps.googleapis.com/maps/api/directions/json?sensor=false&key=' + google_api_key + '&origin='
				+ current.lat + ',' + current.lng + '&destination=' + next.lat + ',' + next.lng;
			//alert(url);
			proxy(url, function(data)
			{
				var jData = JSON.parse(data);
				var totalDuration = 0;
				var theRoutes = [];
				
				for (var i = 0; i < jData.routes.length; i++)
				{
					for (var j = 0; j < jData.routes[i].legs.length; j++)
					{
						totalDuration += Number(jData.routes[i].legs[j].duration.value + '');
					}
					theRoutes.push(jData.routes[i].overview_polyline);
				}
				
				addNewRoute(current, next, totalDuration, theRoutes);
			});
			
		}
		
	}
}


/* ALL COMMON CODES GOES HERE */
function proxy(url, done, error)
{
	var encodedUrl = '/api/proxy?url=' + encodeUrl(url);
	request(encodedUrl, null, 'GET', done, error);
}

function request(url, data, action, done, error)
{
	data = data || { };
	action = action || 'GET';
	done = done || function() { };
	error = error || function() { };
	
	$.ajax({
		action: action,
		url: url,
		data: data
	})
	.done(done)
	.fail(error);
}

function corsRequest(url, method) 
{
	method = method || 'GET';
	
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) 
	{
	 	xhr.open(method, url, true);
	 	//alert('withcredential');
	} 
	else if (typeof XDomainRequest != "undefined") 
	{
		xhr = new XDomainRequest();
		xhr.open(method, url);
		//alert('domain');
	}
	else 
	{
		xhr = null;
		//alert('null');
	}
	  
	return xhr;
}

function encodeUrl(urlPart)
{
	return encodeURIComponent(urlPart);
}

//This function is from Google’s polyline utility.
function decodeLine (encoded) 
{
	 var len = encoded.length;
	 var index = 0;
	 var array = [];
	 var lat = 0;
	 var lng = 0;

	 while (index < len) 
	 {
		 var b;
		 var shift = 0;
		 var result = 0;
	 
		 do 
		 {
			 b = encoded.charCodeAt(index++) - 63;
			 result |= (b & 0x1f) << shift;
			 shift += 5;
		 } 
		 while (b >= 0x20);
		 
		 var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
		 lat += dlat;
	
		 shift = 0;
		 result = 0;
		 
		 do 
		 {
			 b = encoded.charCodeAt(index++) - 63;
			 result |= (b & 0x1f) << shift;
			 shift += 5;
		 } 
		 while (b >= 0x20);
	 
		 var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
		 lng += dlng;

		 array.push([lat * 1e-5, lng * 1e-5]);
	 }

	return array;
}
