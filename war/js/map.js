var map = null;
var markers = [];
var routes = [];
var polylines_ = [];
var google_api_key = 'AIzaSyAfgUa4EBo0h7YVLDBnSfklmWlS9tY0EUM';

var patient_icon = L.icon({ iconUrl: 'assets/patient_location.gif', iconSize: [32, 32] });
var nurse_icon = L.icon({ iconUrl: 'assets/nurse_marker.gif', iconSize: [32, 32] });

/* If not initialised, the map will be defined. In both cases, the map will focus on the Singapore Mainland */
function setMap() {
	if (!map)
	{
		map = L.map('map', { zoomControl: false }).setView([1.355312, 103.827068], 12);
		var layer = L.tileLayer(	
			'http://{s}.tile.cloudmade.com/{key}/22677/256/{z}/{x}/{y}.png',
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

/* ALL API RELATED CODES GOES HERE */
/* Reverse geocode to retrieve the lat/lng from the address */
function reverse_geocode(address, completedFunction, errorFunction)
{
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + encodeUrl(address) + '&key=' + google_api_key;
	request(url, { }, 'GET', completedFunction, errorFunction);
}

/* Helps to retrieve the lat/lng value from the geocode result */
/* Results in [lat, lng] format */
function extractGeocodeResult(data)
{
	if (data)
	{
		if (data.results)
		{
			if (data.results[0])
			{
				return [data.results[0].geometry.location.lat, data.results[0].geometry.location.lng];
			}
		}
	}
	
	return null;
}

/* Gets the route between points. */
/* origin and destination could be anything that has lat and lng attributes. */
/* All failures will call the errorFunction */
function getRoute(origin, destination, completedFunction, errorFunction)
{
	errorFunction = errorFunction || function() { };
	
	if (origin && destination)
	{
		if (origin.lat && origin.lng && destination.lat && destination.lng)
		{
			var url = 'https://maps.googleapis.com/maps/api/directions/json?sensor=false&key=' + google_api_key + '&origin='
				+ origin.lat + ',' + origin.lng + '&destination=' + destination.lat + ',' + destination.lng;
			proxy(url, completedFunction, errorFunction);
		}
		else
		{
			errorFunction();
		}
	}
	else
	{
		errorFunction();
	}
}

/* Help extract the totalDuration and the routes from the response from the web service */
/* Returns null if extraction fails. Otherwise, { totalDuration, routes } */
function extractRouteResults(data)
{
	var jsonData = null;
	try
	{
		jsonData = JSON.parse(data);
	}
	catch (e)
	{
		jsonData = data;
	}
	
	var totalDuration = 0;
	var theRoutes = [];
	
	try
	{
		if (jsonData)
		{
			if (jsonData.routes)
			{
				for (var i = 0; i < jsonData.routes.length; i++)
				{
					for (var j = 0; j < jsonData.routes[i].legs.length; j++)
					{
						totalDuration += Number(jsonData.routes[i].legs[j].duration.value + '');
					}
					
					theRoutes.push(jsonData.routes[i].overview_polyline);
				}
				
				totalDuration += 30;
				return { totalDuration: totalDuration, routes: theRoutes };
			}
			else
			{
				return null;
			}
		}
		else
		{
			return null;
		}
	}
	catch (e)
	{
		alert(e);
		return null;
	}
}

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

/* Adds a marker to the map given the coordinates. */
/* It also returns the marker for reference purposes */
function addMarker(coor, option)
{
	option = option || { };
	var marker = L.marker(coor, option).addTo(map);
	markers.push(marker);
	return marker;
}

/* Plots polyline on the graph using the given routes */
/* The routes is an array of legs, each containing an array of points that would then be plotted */
function plotRoute(routes, color)
{
	//for (var i = 0; i < routes.length; i++)
	//{
		var polyline = new L.Polyline(routes,
			{
		        color: color,
		        opacity: 0.7,
		        weight: 5,
		        clickable: false
			}
		).addTo(map);
		polylines_.push(polyline);
	//}
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

function clearMap()
{
	for (var i = 0; i < markers.length; i++)
	{
		var marker = markers[i];
		map.removeLayer(marker);
	}

	for (var i = 0; i < polylines_.length; i++)
	{
		var line = polylines_[i];
		map.removeLayer(line);
	}
	
	
}


/* The decodeLine function is an extract from the google v3 api. It helps decode the polylines values into a series
   (an array of points which can be used to plot lines */
function decodeLine(encoded) 
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
