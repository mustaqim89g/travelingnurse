var data = { };
data.nurses = { };
data.patients = { };
data.nurseList = [];
data.patientList = [];
data.routes = { };
data.routeList = [];
data.base = { };


/* Adds a new nurse into the data */
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
function addNewPatient(patientName, homeAddress, telephoneNumber)
{
	if (patientName && homeAddress && telephoneNumber)
	{
		if (data.patients[patientName] == null)
		{
			data.patients[patientName] = { name: patientName, address: homeAddress, telephoneNumber: telephoneNumber }
			data.patientList.push(patientName);
			
			var patient = data.patients[patientName];
			getPatientLocation(patient);			
		}
	}
	else
	{
		throw new AppException('Patient Not Created', 'Patient Name, home address and telephone number has to be specified');
	}
}


function addNewRoute(origin, destination, totalDuration, overview_polylines)
{
	if (origin && destination && totalDuration && overview_polylines)
	{
		//alert('addnewroute');
		var key = pair(origin, destination);
		if (data.routes[key] == null)
		{
			//alert('adding' + key);
			data.routes[key] = 
			{
				origin: origin,
				destination: destination,
				totalDuration: totalDuration,
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

function pair(origin, destination)
{
	return origin.lat + ',' + origin.lng + '_' + destination.lat + ',' + destination.lng;
}

function decodeLineFully(overview_polylines)
{
	var thePoints = [];
	for (var i = 0; i < overview_polylines.length; i++)
	{
		var polyline = overview_polylines[i];
		//alert(JSON.stringify(polyline));
		thePoints.push(decodeLine(polyline.points));
	}
	
	return thePoints;
}

