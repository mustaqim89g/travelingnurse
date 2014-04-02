package sis.is840.travelingnurse.logic;

import java.util.ArrayList;
import sis.is480.travelingnurse.model.*;

public class WorkClusteringService {

	private ArrayList<Nurse> nurses;
	private ArrayList<Patient> patients;
	private ArrayList<PointDistance> pointDistances;
	
	public WorkClusteringService(ArrayList<Nurse> nurses, ArrayList<Patient> patients, ArrayList<PointDistance> pointDistances)
	{
		this.nurses = nurses;
		this.patients = patients;
		this.pointDistances = pointDistances;
	}
	
	
	
}
