var data = { };
data.nurses = { };
data.patients = { };
data.nurseList = [];
data.patientList = [];
data.routes = { };
data.routeList = [];
data.bookings = [];
data.base = null;

/* Variables for the loading of information */
var currentData = null;
var currentDataIndex = 0;
var currentDataSecondIndex = 0;
var totalProgress = 0;
var currentProgress = 0;
var currentTotalProgress = 0;
var loadingLock = false;
var loadingInterval = null;

var onLoadingStartFunction = function() {};
var onLoadingFunction = function() {};
var onLoadingCompleteFunction = function() {};

/* Trigger Point to start loading all data from the web api/services */
/* It will ensure that at least one nurse and one patient is entered into the app */
/* Base Address also have to be specified */
function loadData()
{
	if (data.nurseList.length > 0)
	{
		if (data.patientList.length > 0)
		{
			if (data.base != null)
			{
				currentData = 'patient';
				currentDataIndex = -1;
				
				totalProgress = 1 + data.patientList.length + Math.floor((data.patientList.length * (data.patientList.length - 1)) / 2);
				currentProgress = -1;
				
				onLoadingStartFunction = onLoadingStartFunction || function() { };
				onLoadingFunction = onLoadingFunction || function() { };
				onLoadingCompleteFunction = onLoadingCompleteFunction || function() { };
				
				loadingInterval = setInterval(function() { getNextData(); }, 100);
				onLoadingStartFunction();
			}
			else
			{
				throw new AppException('Loading Aborted', 'Base information has to be provided.');
			}
		}
		else
		{
			throw new AppException('Loading Aborted', 'At least one patient has to be provided.');
		}
	}
	else
	{
		throw new AppException('Loading Aborted', 'At least one nurse has to be provided');
	}
}

/* Used internally to populate all data from the webservice. To be handled by an interval call */
/* Used to prevent conflicting call and other problems with concurrent connections */
function getNextData()
{
	if (loadingLock) return;
	loadingLock = true;
	onLoadingFunction();
	
	currentProgress++;
	
	if (currentData != 'routes')
	{
		currentDataIndex++;
	}
		
	if (currentData == 'patient')
	{
		if (currentDataIndex < data.patientList.length)
		{
			var patientName = data.patientList[currentDataIndex];
			var patient = data.patients[patientName];
			
			reverse_geocode(patient.address, 
				function(result) 
				{
					var exData = extractGeocodeResult(result);
					if (exData != null)
					{
						patient.lat = exData[0];
						patient.lng = exData[1];
						loadingLock = false;
					}
				}
			);
		}
		else
		{
			currentProgress--;
			
			currentData = 'base';
			currentDataIndex = -1;
			loadingLock = false;
		}
	}
	else if (currentData == 'base')
	{
		reverse_geocode(data.base.address, 
			function(result) 
			{
				var exData = extractGeocodeResult(result);
				if (exData != null)
				{
					data.base.lat = exData[0];
					data.base.lng = exData[1];
					
					currentData = 'routes';
					currentDataIndex = 0;
					currentDataSecondIndex = 1;
					currentTotalProgress = Math.floor((data.patientList.length * (data.patientList.length - 1)) / 2);
					loadingLock = false;
				}
			}
		);
	}
	else if (currentData == 'routes')
	{
		if (currentDataIndex < data.patientList.length)
		{
			if (currentDataSecondIndex < data.patientList.length)
			{
				var firstPatientName = data.patientList[currentDataIndex];
				var secondPatientName = data.patientList[currentDataSecondIndex];
				var firstPatient = data.patients[firstPatientName];
				var secondPatient = data.patients[secondPatientName];
				
				getRoute(firstPatient, secondPatient, 
					function(result)
					{
						var exData = extractRouteResults(result);
						if (exData)
						{
							addNewRoute(firstPatient, secondPatient, exData.totalDuration, exData.routes);
						}
						
						currentDataSecondIndex++;
						loadingLock = false;
					}
				);
			}
			else
			{
				currentProgress--;
				currentDataIndex++;
				currentDataSecondIndex = currentDataIndex + 1;
				loadingLock = false;
			}
		}
		else
		{
			currentProgress--;
			currentData = 'baseroutes';
			currentDataIndex = -1;
			loadingLock = false;
		}
	}
	else // if baseroutes
	{
		if (currentDataIndex < data.patientList.length)
		{
			var patientName = data.patientList[currentDataIndex];
			var patient = data.patients[patientName];

			getRoute(data.base, patient, 
				function(result)
				{
					var exData = extractRouteResults(result);
					if (exData)
					{
						addNewRoute(data.base, patient, exData.totalDuration, exData.routes);
					}
					loadingLock = false;
				}
			);
		}
		else
		{
			clearInterval(loadingInterval);
			
			// Do last minute matching of data
			for (var i = 0; i < data.bookings.length; i++)
			{
				var booking = data.bookings[i];
				var patientName = booking.patientName;
				var patient = data.patients[patientName];
				
				booking.lat = patient.lat;
				booking.lng = patient.lng;
			}
			
			loadingLock = false;
			onLoadingCompleteFunction();
		}
	}
}

/* Sets the base information at which all nurses will start from and ends at */
/* All parameters are required */
function setBase(name, address)
{
	if (name && address)
	{
		data.base =
		{
			name: name,
			address: address
		};
	}
	else
	{
		throw new AppException('Base not set.', 'The name and the address of the base has to be specified');
	}
}


/* Adds a new nurse into the data */
/* This function will throw an exception if a nurse has the same name */
/* All parameters are required */
function addNewNurse(nurseName, workingHourStart, workingHourEnd)
{
	if (nurseName && workingHourStart && workingHourEnd)
	{
		if (data.nurses[nurseName] == null)
		{
			data.nurses[nurseName] = { workingHourStart: workingHourStart, workingHourEnd: workingHourEnd, schedule: [] };
			data.nurseList.push(nurseName);
		}
		else
		{
			throw new AppException('Nurse Not Created', 'Nurse cannot be created because another nurse of the same name already exist.');
		}
	}
	else
	{
		throw new AppException('Nurse Not Created', 'Nurse Name, working hour start and working hour end has to be specified');
	}
}

/* Add a new patient into the data */
/* All parameters are required. */
function addNewPatient(patientName, homeAddress, telephoneNumber)
{
	if (patientName && homeAddress && telephoneNumber)
	{
		if (data.patients[patientName] == null)
		{
			data.patients[patientName] = { name: patientName, address: homeAddress, telephoneNumber: telephoneNumber }
			data.patientList.push(patientName);			
		}
	}
	else
	{
		throw new AppException('Patient Not Created', 'Patient Name, home address and telephone number has to be specified');
	}
}

/* Adds a new route between two points */
/* All parameters are required. */
function addNewRoute(origin, destination, totalDuration, overview_polylines)
{
	if (origin && destination && totalDuration && overview_polylines)
	{
		var key = pair(origin, destination);
		if (data.routes[key] == null)
		{
			data.routes[key] = 
			{
				origin: origin,
				destination: destination,
				totalDuration: Math.floor(totalDuration / 60),
				overview_polylines: overview_polylines, 
				points: decodeLineFully(overview_polylines) // Array of array of points make up individual polylines
			};
			data.routeList.push(key);
		}
	}
	else
	{
		throw new AppException('Route Not Created', 'Origin, destination, totalDuration and overview_polylines has to be specified');
	}
}

/* Gets a pair name between two points */
function pair(origin, destination)
{
	return origin.lat + ',' + origin.lng + '_' + destination.lat + ',' + destination.lng;
}

/* Decodes the entire overview polylines into an array of array of points. */
function decodeLineFully(overview_polylines)
{
	var thePoints = [];
	for (var i = 0; i < overview_polylines.length; i++)
	{
		var polyline = overview_polylines[i];
		thePoints.push(decodeLine(polyline.points));
	}
	
	return thePoints;
}

/* Add a booking to schedule */
/* PatientName must already exists */
/* All parameters are required */
function addNewBooking(patientName, bookingHour, bookingMinute, duration)
{
	var patient = data.patients[patientName];
	if (patient)
	{
		if (bookingHour && bookingMinute && duration)
		{
			var booking = 
			{
				patientName: patientName,
				bookingHour: bookingHour,
				bookingMinute: bookingMinute,
				duration: duration,
				timeslotStart: bookingHour * 60 + bookingMinute,
				timeslotEnd: bookingHour * 60 + bookingMinute + duration,
				completed: false,
			}
			
			data.bookings.push(booking);
		}
		else
		{
			throw new AppException('Booking Not Created', 'bookingHour, bookingMinute and duration must be provided');
		}
	}
	else
	{
		throw new AppException('Booking Not Created', 'Patient must already exist.');
	}
}
