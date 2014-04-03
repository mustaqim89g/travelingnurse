function Simulator(data)
{

	this.simulationData = clone(data);
	this.schedule = [];
	this.unscheduledBookings = [];
	this.markers = [];
	this.polylines = [];
	this.colors = ['rgb(255, 204, 0)', 'red', 'green', 'blue', 'rgb(112, 48, 160)', 'rgb(255, 0, 102)', 'rgb(254, 224, 2)', 'rgb(215, 41, 41)'];
	
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
			
			for (var scheduleIndex = 0; scheduleIndex < this.schedule.length; scheduleIndex++)
			{
				var scheduleSlots = this.schedule[scheduleIndex];
				if (this.assignToNurse(scheduleSlots, booking, booking))
				{
					success = true;
					break;
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
				//alert(JSON.stringify(route));
				if (route)
				{
					//alert(JSON.stringify(route));
					scheduleSlots.legs.push(route);
					//scheduleSlots.routes.concat(route.points);
				}
			}
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
	this.assignToNurse = function(scheduleSlots, booking, bookingIndex)
	{
		// if booking is outside of nurse working hour
		if (scheduleSlots.nurseStart > booking.timeslotStart || scheduleSlots.nurseEnd <= booking.timeslotEnd)
		{
			/*alert(booking.patientName + ' Reject from ' + scheduleSlots.nurseName + ': Outside working hour');*/
			return false;
		}
		
		// Determine slot number from start to end of booking is empty
		for (var slotIndex = booking.timeslotStart; slotIndex < booking.timeslotEnd; slotIndex++)
		{
			var slot = scheduleSlots.slots[slotIndex];
			if (slot.booking != null)
			{
				/*alert(booking.patientName + ' Reject from ' + scheduleSlots.nurseName + ': Overlap other booking');*/
				return false;
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
				for (var slotIndex = booking.timeslotStart; slotIndex < booking.timeslotEnd; slotIndex++)
				{
					var slot = scheduleSlots.slots[slotIndex];
					slot.booking = booking;
					slot.bookingIndex = bookingIndex;
					slot.lat = booking.lat;
					slot.lng = booking.lng;
					
					scheduleSlots.slots[slotIndex] = slot;
				}
				
				scheduleSlots.bookings.push(booking);
				return true;
			}
			
		}
		
		
		return false;
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
			
			patient.marker = addMarker([patient.lat, patient.lng]);
		}
		
		// for each of the nurse schedule, plot the route
		for (var i = 0; i < this.schedule.length; i++)
		{
			var scheduleSlots = this.schedule[i];
			//alert("plotting...");
			if (scheduleSlots)
			{
				alert(JSON.stringify(scheduleSlots.legs))
				for (var j = 0; j < scheduleSlots.legs.length; j++)
				{
					//alert(JSON.stringify(scheduleSlots.legs[j]))
					plotRoute(scheduleSlots.legs[j].points[0], scheduleSlots.color);
				}
				//alert('platter');
			}
		}
	}
	
}