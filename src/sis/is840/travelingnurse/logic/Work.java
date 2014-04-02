package sis.is840.travelingnurse.logic;

import sis.is480.travelingnurse.model.*;

public class Work 
{
	private Patient patient;
	private MedicalServiceBooking booking;
	
	public Work(Patient patient, MedicalServiceBooking booking)
	{
		this.setPatient(patient);
		this.setBooking(booking);
	}

	public Patient getPatient() {
		return patient;
	}

	public void setPatient(Patient patient) {
		this.patient = patient;
	}

	public MedicalServiceBooking getBooking() {
		return booking;
	}

	public void setBooking(MedicalServiceBooking booking) {
		this.booking = booking;
	}
	
	
	
}
