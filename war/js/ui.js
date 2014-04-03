var ui_context = 'nurses';

$(document).ready(function(){
	
	$('.run').click(click_runSimulation);
	$('#btn_speed_normal').click(on_normal_speed);
	$('#btn_speed_faster').click(on_faster_speed);
	$('#btn_stop').click(on_stop);
	
	$('.nurse').click(on_nurses_click);
	$('.patient').click(on_patients_click);
	$('.schedule').click(on_bookings_click);
	$('.back').click(on_backfromlist_click)
	$('.add').click(on_add_click);
	$('.back-list').click(on_backlist_click);
	
	$('.save-nurse').click(on_save_nurse_click);
	$('.save-patient').click(on_save_patient_click);
	$('.save-booking').click(on_save_booking_click);
});


/* Click Events */
function click_runSimulation()
{
	onLoadingStartFunction = loadingStartUI;
	onLoadingFunction = onLoadingUI;
	onLoadingCompleteFunction = onLoadingCompleteUI;
	
	loadData();
}

/* Supporting Functions */
function loadingStartUI()
{
	$('.cover').hide();
	$('#loading-cover').show();
}

function onLoadingUI()
{
	var percentage = totalProgress == 0 ? 0 : (currentProgress / totalProgress) * 100;
	$('#progress').css('width', percentage + '%');
}

function onLoadingCompleteUI()
{
	$('#loading-cover').hide();
	$('.simulation-control').show();
	
	sims = new Simulator(data);
	sims.performScheduling();
	sims.simulationTickFunction = onSimulationTick;
	sims.plot();
	sims.simulate();
}

function onSimulationTick()
{
	var hour = Math.floor(sims.currentTime / 60);
	var minute = Math.floor(sims.currentTime % 60);
	
	var hourStr = hour + '';
	if (hour < 10) hourStr = '0' + hour;
	
	var minuteStr = minute +'';
	if (minute < 10) minuteStr = '0' + minute;
	
	$('.time').html(hourStr + ':' + minuteStr);
}

function on_normal_speed()
{
	sims.normal();
	$('#btn_speed_normal').attr('class', 'left button selected');
	$('#btn_speed_faster').attr('class', 'left button');
}

function on_faster_speed()
{
	sims.faster();
	$('#btn_speed_normal').attr('class', 'left button');
	$('#btn_speed_faster').attr('class', 'left button selected');
}

function on_stop()
{
	sims.stopSimulation();
	$('#main-cover').show();
	$('.simulation-control').hide();
}

function on_nurses_click()
{
	ui_context = 'nurses';
	showListUI();
}

function on_patients_click()
{
	ui_context = 'patients';
	showListUI();
}

function on_bookings_click()
{
	ui_context = 'bookings';
	showListUI();
}

function on_backlist_click()
{
	$('.cover').hide();
	showListUI();
}

function on_backfromlist_click()
{
	$('.cover').hide();
	$('#main-cover').show();
}

function on_add_click()
{
	$('.cover').hide();
	if (ui_context == 'patients')
	{
		$('#patient-cover').show();
	}
	else if (ui_context  == 'nurses')
	{
		$('#nurse-cover').show();
	}
	else
	{
		$('#booking-cover').show();
		
		// add patient names
		$('#ddlPatientName')
		    .find('option')
		    .remove()
		    .end();
		
		$('#ddlMedicalSchedule')
		    .find('option')
		    .remove()
		    .end();
		
		for (var i = 0; i < data.patientList.length; i++)
		{
			var patientName = data.patientList[i];
			$('#ddlPatientName')
	        	.append($("<option></option>")
	        			.attr("value",patientName)
	        			.text(patientName)); 
		}
		
		var m = 0;
		for (var hour = 0; hour < 24; hour++)
		{
			for (var minute = 0; minute < 2; minute++)
			{
				$('#ddlMedicalSchedule')
	        	.append($("<option></option>")
	        			.attr("value", m)
	        			.text(formatTime(hour, minute == 0 ? 0 : 30)));
				m++;
			}
		}
	}
}


function showListUI()
{
	if (ui_context == 'patients')
	{
		var html = '';
		for (var i = 0; i < data.patientList.length; i++)
		{
			var patient = data.patientList[i];
			html += 
				'<div class="list"><div class="left list-data">' + patient + '</div><div class="right list-delete" data-delete="' + i + '"></div><div class="clear"></div></div>'
		}
		
		$('#list-canvas').html(html);
	}
	else if (ui_context  == 'nurses')
	{
		var html = '';
		for (var i = 0; i < data.nurseList.length; i++)
		{
			var nurse = data.nurseList[i];
			html += 
				'<div class="list"><div class="left list-data">' + nurse + '</div><div class="right list-delete" data-delete="' + i + '"></div><div class="clear"></div></div>'
		}
		
		$('#list-canvas').html(html);
	}
	else
	{
		var html = '';
		for (var i = 0; i < data.bookings.length; i++)
		{
			var booking = data.bookings[i];
			html += 
				'<div class="list"><div class="left list-data" style="width: 20%">' + booking.patientName + '</div><div class="left list-data" style="width: 20%">' + timeString(booking) + '</div><div class="right list-delete" data-delete="' + i + '"></div><div class="clear"></div></div>'
		}
		
		$('#list-canvas').html(html);
	}
	
	$(document).off('click', '.list-delete').on('click', '.list-delete', 
			function() {
				var index = Number($(this).data('delete'));
				if (ui_context == 'patients')
				{
					data.patientList.splice(index, 1);
				}
				else if (ui_context  == 'nurses')
				{
					data.nurseList.splice(index, 1);
				}
				else
				{
					data.bookings.splice(index, 1);
				}
				
			showListUI();
		
	});
	
	$('.cover').hide();
	$('#list-cover').show();
}

function timeString(booking)
{
	var hour = booking.bookingHour;
	var hourStr = hour + '';
	if (hour < 10) hourStr = '0' + hour;
	
	var minute = booking.bookingMinute;
	var minuteStr = minute +'';
	if (minute < 10) minuteStr = '0' + minute;
	
	return hourStr + ':' + minuteStr;
}

function formatTime(hour, minute)
{
	var hourStr = hour + '';
	if (hour < 10) hourStr = '0' + hour;
	
	var minuteStr = minute +'';
	if (minute < 10) minuteStr = '0' + minute;
	
	return hourStr + ':' + minuteStr;
}

function on_save_nurse_click()
{
	var txtNurseName = $('#txtNurseName');
	var ddlWorkStartsFrom = $('#ddlWorkStartsFrom');
	var ddlWorkEndsAt = $('#ddlWorkEndsAt');
	
	if (txtNurseName.val() != "")
	{
		var name = txtNurseName.val();
		var starts = Number(ddlWorkStartsFrom.val());
		var ends = Number(ddlWorkEndsAt.val());
		
		addNewNurse(name, starts, ends);
		$('.cover').hide();
		showListUI();
	}
}

function on_save_patient_click()
{
	var txtPatientName = $('#txtPatientName');
	var txtPatientAddress = $('#txtPatientAddress');
	var txtPatientPhone = $('#txtPatientPhone');
	
	if (txtPatientPhone.val() != "" && txtPatientAddress.val() != "" && txtPatientPhone.val() != "")
	{
		var name = txtPatientName.val();
		var address = txtPatientAddress.val();
		var phone = txtPatientPhone.val();
		
		addNewPatient(name, address, phone);
		$('.cover').hide();
		showListUI();
	}
}

function on_save_booking_click()
{
	var ddlPatientName = $('#ddlPatientName');
	var ddlMedicalSchedule = $('#ddlMedicalSchedule');
	
	if (ddlPatientName.val() != "" && ddlMedicalSchedule.val() != "")
	{
		var name = ddlPatientName.val();
		var value = Number(ddlMedicalSchedule.val());
		var hour = Math.floor(value / 2);
		var minute = Math.floor(value % 2) == 0 ? 0 : 30;
		
		addNewBooking(name, hour, minute, 60);
		$('.cover').hide();
		showListUI();
	}
}