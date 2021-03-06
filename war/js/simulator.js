function Simulator(data)
{

	this.simulationData = clone(data);
	this.schedule = [];
	this.unscheduledBookings = [];
	this.markers = [];
	this.polylines = [];
	this.colors = ['rgb(255, 204, 0)', 'red', 'green', 'blue', 'rgb(112, 48, 160)', 'rgb(255, 0, 102)', 'rgb(254, 224, 2)', 'rgb(215, 41, 41)'];
	this.currentTime = -1;
	this.simulationSpeed = 500;
	this.simulatorInterval = null;
	this.simulationTickFunction = function() { };
	this.trackNurse = '';
	
	/* Calculates and schedule all tasks  */
	this.performScheduling = function()
	{
		// Sort all bookings by the starting time
		this.simulationData.bookings.sort(
			function(a, b)
			{
				return a.timeslotStart - b.timeslotStart;
			}
		)
		
		this.createSchedule();
		for (var bookingIndex = 0; bookingIndex < this.simulationData.bookings.length; bookingIndex++)
		{
			var booking = this.simulationData.bookings[bookingIndex];
			var success = false;
			
			var workableScheduleSlots = [];
			var workableResults = [];
			
			for (var scheduleIndex = 0; scheduleIndex < this.schedule.length; scheduleIndex++)
			{
				var scheduleSlots = this.schedule[scheduleIndex];
				var result = this.assignToNurse(scheduleSlots, booking, bookingIndex);
				if (result[0])
				{
					workableScheduleSlots.push(scheduleSlots);
					workableResults.push(result);
				}
			}
			
			if (workableScheduleSlots.length > 1)
			{
				var scheduleWithTheLeastBookings = [];
				var workableResultsWithTheLeastBookings = [];
				// Find the schedule with the lowest number of bookings
				var lowestNumberOfBookings = 100000;
				for (var m = 0; m < workableScheduleSlots.length; m++)
				{
					var scheduleSlots = workableScheduleSlots[m];
					if (scheduleSlots.bookings.length < lowestNumberOfBookings)
					{
						lowestNumberOfBookings = scheduleSlots.bookings.length;
						scheduleWithTheLeastBookings.length = 0;
						workableResultsWithTheLeastBookings .length = 0;
						
						scheduleWithTheLeastBookings.push(scheduleSlots);
						workableResultsWithTheLeastBookings.push(workableResults[m]);
					}
					else if (scheduleSlots.bookings.length == lowestNumberOfBookings)
					{
						scheduleWithTheLeastBookings.push(scheduleSlots);
						workableResultsWithTheLeastBookings.push(workableResults[m]);
					}
				}
				
				if (scheduleWithTheLeastBookings.length > 1)
				{
					// Find the schedule that has the lowest score
					var scheduleWithTheLeastScore = [];
					var workableResultsWithTheLeastScore = [];
					// Find the schedule with the lowest number of bookings
					var lowestScore = 10000000;
					for (var m = 0; m < workableScheduleSlots.length; m++)
					{
						var result = workableResultsWithTheLeastBookings[m];
						if (result[1] < lowestScore)
						{
							lowestScore = result[1];
							scheduleWithTheLeastScore.length = 0;
							workableResultsWithTheLeastScore.length = 0;
							
							scheduleWithTheLeastScore.push(scheduleWithTheLeastBookings[m]);
							workableResultsWithTheLeastScore.push(result);
						}
						else if (scheduleSlots.bookings.length == lowestNumberOfBookings)
						{
							scheduleWithTheLeastScore.push(scheduleWithTheLeastBookings[m]);
							workableResultsWithTheLeastScore.push(result);
						}
					}
					
					if (scheduleWithTheLeastScore.length >= 1)
					{
						this.assignToNurse(scheduleWithTheLeastScore[0], booking, bookingIndex, true);
						success = true;
					}
					
				}
				else
				{
					if (scheduleWithTheLeastBookings.length == 1)
					{
						this.assignToNurse(scheduleWithTheLeastBookings[0], booking, bookingIndex, true);
						success = true;
					}
				}
				
			}
			else
			{
				if (workableScheduleSlots.length == 1)
				{
					this.assignToNurse(workableScheduleSlots[0], booking, bookingIndex, true);
					success = true;
				}
			}
			
			
			if (!success)
			{
				this.unscheduledBookings.push(booking);
			}
		}
		
		// for each of the scheduled nurses, we add the ending base so that we can finally draw the polylines
		// once added we can query for the polylines and add them to the path
		for (var i = 0; i < this.schedule.length; i++)
		{
			var scheduleSlots = this.schedule[i];
			scheduleSlots.bookings.push(this.simulationData.base);
			
			for (var j = 0; j < scheduleSlots.bookings.length - 1; j++)
			{
				var currentLocation = scheduleSlots.bookings[j];
				var nextLocation = scheduleSlots.bookings[j + 1];
				
				var route = this.findRoute(currentLocation, nextLocation);
				
				if (route)
				{
					//alert(JSON.stringify(route));
					scheduleSlots.legs.push(route);
					
					// At the same time, we try to fill in the travelling gaps so that our things can move
					var arrayOfPoints = route.points[0];
					var timeDifference = 1;
					var currentSlotIndex = 0;
					var travelingTo = '';
					
					if (currentLocation == this.simulationData.base)
					{
						timeDifference = nextLocation.timeslotStart - scheduleSlots.nurseStart;
						currentSlotIndex = scheduleSlots.nurseStart;
						travelingTo = nextLocation.patientName;
					}
					else if (nextLocation == this.simulationData.base)
					{
						timeDifference = scheduleSlots.nurseEnd - currentLocation.timeslotEnd;
						currentSlotIndex = currentLocation.timeslotEnd;
						travelingTo = 'base';
					}
					else
					{
						timeDifference = nextLocation.timeslotStart - currentLocation.timeslotEnd;
						currentSlotIndex = currentLocation.timeslotEnd;
						travelingTo = nextLocation.patientName;
					}
					
					var timeToRemainStill = timeDifference - route.totalDuration;
					
					
					var test = true;
					
					for (var t = 0; t < timeToRemainStill; t++)
					{
						if (test)
						{
							//alert("still " + currentSlotIndex);
							test = false;
						}
						
						var slot = scheduleSlots.slots[currentSlotIndex];
						slot.lat = currentLocation.lat;
						slot.lng = currentLocation.lng;
						slot.action = 'Waiting to travel to ' + travelingTo;
						
						scheduleSlots.slots[currentSlotIndex] = slot;
						currentSlotIndex++;
					}
					
					
					var interval = 1;
					if (arrayOfPoints <= route.totalDuration)
					{
						interval = route.totalDuration / arrayOfPoints.length;
					}
					else
					{
						interval = arrayOfPoints.length / route.totalDuration;
					}
					
					test = true;
					
					var currentPointArray = 0;
					for (var l = currentSlotIndex; l < nextLocation.timeslotStart; l++)
					{
						if (test)
						{
							//alert("travel " + currentSlotIndex);
							test = false;
						}
						
						var slot = scheduleSlots.slots[l];
						var point = arrayOfPoints[Math.floor(currentPointArray)];
						slot.lat = point[0];
						slot.lng = point[1];
						slot.action = 'Traveling to ' + travelingTo;
						
						scheduleSlots.slots[l] = slot;
						
						currentPointArray = currentPointArray + interval;
					}
					
				}
			}
			
			/*for (var v = 0; v < 1440; v++)
			{
				var slot = scheduleSlots.slots[v];
				if (slot.action)
				{
					alert(v + ' ' + slot.action);
				}
			}*/
			
		}
		
		
	}
	
	/* Creates the schedule template and fill in with nurses availability */
	this.createSchedule = function()
	{
		this.schedule.length = 0;
		// Create schedule slots for each of the nurses
		for (var i = 0; i < this.simulationData.nurseList.length; i++)
		{
			var nurseName = this.simulationData.nurseList[i];
			var nurse = this.simulationData.nurses[nurseName];
			var nurseStart = nurse.workingHourStart * 60;
			var nurseEnd = nurse.workingHourEnd * 60;
			
			var nurseSlots = 
			{
				nurseName: nurseName,
				nurseStart: nurseStart,
				nurseEnd: nurseEnd,
				bookings: [],
				routes: [],
				legs: [],
				slots: [],
				color: this.colors[Math.floor(i % this.colors.length)]
			};
			
			nurseSlots.bookings.push(this.simulationData.base);
			
			for (var time = 0; time < 1440; time++)
			{
				var slot = 
				{
					available: time >= nurseStart && time < nurseEnd,
					booking: null,
					bookingIndex: -1,
					lat: 0,
					lng: 0
				};
				
				nurseSlots.slots.push(slot);
			}
			
			this.schedule.push(nurseSlots);
		}
		
		this.schedule.sort(
			function(a, b)
			{
				return a.nurseStart - b.nurseStart
			}
		);
	}
	
	/* Attempts to assign the booking to the current nurse schedule. */ 
	/* Returns true if successfully added. False if otherwise */
	this.assignToNurse = function(scheduleSlots, booking, bookingIndex, addImmediately)
	{
		addImmediately = addImmediately || false;
		
		// if booking is outside of nurse working hour
		if (scheduleSlots.nurseStart > booking.timeslotStart || scheduleSlots.nurseEnd <= booking.timeslotEnd)
		{
			/*alert(booking.patientName + ' Reject from ' + scheduleSlots.nurseName + ': Outside working hour');*/
			return [false, 0];
		}
		
		// Determine slot number from start to end of booking is empty
		for (var slotIndex = booking.timeslotStart; slotIndex < booking.timeslotEnd; slotIndex++)
		{
			var slot = scheduleSlots.slots[slotIndex];
			if (slot.booking != null)
			{
				/*alert(booking.patientName + ' Reject from ' + scheduleSlots.nurseName + ': Overlap other booking');*/
				return [false, 0];
			}
		}
		
		var bookingAhead = this.findBookingAhead(scheduleSlots, booking);
		var bookingBeyond = this.findBookingBeyond(scheduleSlots, booking);
		
		var timeAvailableAhead = 0;
		var timeAvailableBeyond = 0;
		
		if (bookingAhead == this.simulationData.base) timeAvailableAhead = booking.timeslotStart - scheduleSlots.nurseStart;
		else timeAvailableAhead = booking.timeslotStart - bookingAhead.timeslotEnd;
		
		if (bookingBeyond == this.simulationData.base) timeAvailableBeyond = scheduleSlots.nurseEnd - booking.timeslotEnd;
		else timeAvailableBeyond = bookingBeyond.timeslotStart - booking.timeslotEnd;
		
		var routeAhead = this.findRoute(booking, bookingAhead);
		var routeBeyond = this.findRoute(booking, bookingBeyond);
		
		if (routeAhead && routeBeyond)
		{
			if (routeAhead.totalDuration <= timeAvailableAhead && routeBeyond.totalDuration <= timeAvailableBeyond)
			{
				if (addImmediately)
				{
					for (var slotIndex = booking.timeslotStart; slotIndex < booking.timeslotEnd; slotIndex++)
					{
						var slot = scheduleSlots.slots[slotIndex];
						slot.booking = booking;
						slot.bookingIndex = bookingIndex;
						slot.lat = booking.lat;
						slot.lng = booking.lng;
						slot.action = 'Serving patient ' + booking.patientName;
						
						scheduleSlots.slots[slotIndex] = slot;
					}
					
					scheduleSlots.bookings.push(booking);
				}
				
				return [true, routeAhead.totalDuration + routeBeyond.totalDuration];
			}
			
		}
		
		
		return [false, 0];
	}
	
	
	/* Finds the booking that is ahead of the current booking to the point where nurse starts work */
	/* Returns the first book found. If not booking found, the base is returned */
	this.findBookingAhead = function(scheduleSlots, booking)
	{
		for (var timeSlot = booking.timeslotStart; timeSlot > scheduleSlots.nurseStart; timeSlot--)
		{
			var slot = scheduleSlots.slots[timeSlot];
			if (slot.booking != null)
			{
				return slot.booking;
			}
		}
		
		return this.simulationData.base;
	}
	
	/* Finds the booking that is beyond of the current booking to the point where nurse ends work */
	/* Returns the first book found. If not booking found, the base is returned */
	this.findBookingBeyond = function(scheduleSlots, booking)
	{
		for (var timeSlot = booking.timeslotEnd; timeSlot < scheduleSlots.nurseEnd; timeSlot++)
		{
			var slot = scheduleSlots.slots[timeSlot];
			if (slot.booking != null)
			{
				return slot.booking;
			}
		}
		
		return this.simulationData.base;
	}
	
	/* Attempts to find the route between two booking location */
	this.findRoute = function(booking1, booking2)
	{
		var pairName = pair(booking1, booking2);
		var route = this.simulationData.routes[pairName];
		
		if (route) return route;
		pairName = pair(booking2, booking1);
		return this.simulationData.routes[pairName];
	}

	
	
	this.plot = function()
	{
		// plot all the patients
		for (var i = 0; i < this.simulationData.patientList.length; i++)
		{
			var patientName = this.simulationData.patientList[i];
			var patient = this.simulationData.patients[patientName];
		
			var bookingHTML = '<br/>';
			var bookingCount = 1;
			
			for (var j = 0; j < this.simulationData.bookings.length; j++)
			{
				var booking = this.simulationData.bookings[j];
				if (booking.patientName == patientName)
				{
					bookingHTML += '<b> Booking #' + bookingCount + '</b> at ' + this.formatTime(booking.bookingHour, booking.bookingMinute) + '<br/>';
					bookingCount++;
				}
			}
			
			patient.marker = addMarker([patient.lat, patient.lng], { icon: patient_icon });
			patient.marker.bindPopup('Patient: <b>' + patientName + '</b><br/>Address: <b>' + patient.address + '</b><br/>' + bookingHTML);
		
		}
		
		// Plot all of the nurses
		for (var i = 0; i < this.simulationData.nurseList.length; i++)
		{
			var nurseName = this.simulationData.nurseList[i];
			var nurse = this.simulationData.nurses[nurseName];
			
			nurse.marker = addMarker([this.simulationData.base.lat, this.simulationData.base.lng], { icon: nurse_icon });
			nurse.marker.bindPopup('Nurse: <b>' + nurseName + '</b><br/><span id="nurse-marker-' + nurseName.replace(' ', '') + '"></span><br/><br/><div class="button track" data-nurse="' + nurseName + '">Track This Nurse</div>');
		}
		
		var mm = this;
		$(document).off('click', '.track').on('click', '.track', function(){
			
			var nurseName = $(this).data('nurse');
			if (mm.trackNurse == nurseName)
			{
				mm.trackNurse = '';
				$('.track').html("Track this Nurse");
			}
			else
			{
				mm.trackNurse = nurseName;
				$('.track').html("Track this Nurse");
				$(this).html("Stop Tracking");
			}
		});
		
		// for each of the nurse schedule, plot the route
		for (var i = 0; i < this.schedule.length; i++)
		{
			var scheduleSlots = this.schedule[i];
			if (scheduleSlots)
			{
				for (var j = 0; j < scheduleSlots.legs.length; j++)
				{

					plotRoute(scheduleSlots.legs[j].points[0], scheduleSlots.color);
				}
			}
		}
	}
	
	this.simulate = function()
	{
		var that = this;
		this.simulatorInterval = setInterval(function() { that.simulatingFunction(that); }, this.simulationSpeed);
	}
	
	this.simulatingFunction = function(currentInstance)
	{
		currentInstance.currentTime++;
		currentInstance.simulationTickFunction = currentInstance.simulationTickFunction || function() { };
		
		if (currentInstance.currentTime < 1440)
		{
			for (var i = 0; i < currentInstance.schedule.length; i++)
			{
				var scheduleSlots = currentInstance.schedule[i];
				var nurse = currentInstance.simulationData.nurses[scheduleSlots.nurseName];
				var marker = nurse.marker;
				
				var slot = scheduleSlots.slots[currentInstance.currentTime];
				if (slot.lat == 0 && slot.lng == 0)
				{
					if (this.trackNurse == scheduleSlots.nurseName)
					{
						this.trackNurse = '';
						$('.track').html("Track this Nurse");
					}
				}
				
				var newLatLng = new L.LatLng(slot.lat, slot.lng);
			    marker.setLatLng(newLatLng); 
			}
			
			currentInstance.simulationTickFunction();
			currentInstance.updateMarkers();
			currentInstance.followTrackedMarker();
		}
		else
		{
			clearInterval(currentInstance.simulatorInterval);
		}
	}
	
	this.stopSimulation = function()
	{
		clearInterval(this.simulatorInterval);
	}
	
	this.updateMarkers = function()
	{
		// we update the nurse to find out their actions
		for (var i = 0; i < this.schedule.length; i++)
		{
			var sch = this.schedule[i];
			var nurseName = sch.nurseName;
			var slot = sch.slots[this.currentTime];
			
			$('#nurse-marker-' + nurseName.replace(' ', '')).html(slot.action);
		}
	}
	
	this.followTrackedMarker = function()
	{
		if (this.trackNurse != '')
		{
			var nurse = this.simulationData.nurses[this.trackNurse];
			if (nurse)
			{
				var marker = nurse.marker;
				var latlng = marker.getLatLng();
				
				if (latlng.lat == 0 && latlng.lng == 0)
				{
					this.trackNurse = '';
				}
				else
				{
					map.setView([latlng.lat, latlng.lng], 12);
				}
			}
		}
	}
	
	this.normal = function()
	{
		clearInterval(this.simulatorInterval);
		this.simulationSpeed = 500;
		var that = this;
		this.simulatorInterval = setInterval(function() { that.simulatingFunction(that); }, this.simulationSpeed);
	}
	
	this.faster = function()
	{
		clearInterval(this.simulatorInterval);
		this.simulationSpeed = 200;
		var that = this;
		this.simulatorInterval = setInterval(function() { that.simulatingFunction(that); }, this.simulationSpeed);
	}
	
	this.formatTime = function(hour, minute)
	{
		var hourStr = hour + '';
		if (hour < 10) hourStr = '0' + hour;
		
		var minuteStr = minute +'';
		if (minute < 10) minuteStr = '0' + minute;
		
		return hourStr + ':' + minuteStr;
	}
	
	
}