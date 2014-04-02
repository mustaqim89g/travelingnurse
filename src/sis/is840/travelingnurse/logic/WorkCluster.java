package sis.is840.travelingnurse.logic;

import java.util.ArrayList;
import sis.is480.travelingnurse.model.Nurse;

public class WorkCluster 
{
	private Nurse nurse;
	private ArrayList<Work> workList;
	
	public WorkCluster(Nurse nurse)
	{
		this.setNurse(nurse);
		this.workList = new ArrayList<Work>();
	}

	public Nurse getNurse() {
		return nurse;
	}

	public void setNurse(Nurse nurse) {
		this.nurse = nurse;
	}

	public ArrayList<Work> getWork() {
		ArrayList<Work> works = new ArrayList<Work>();
		works.addAll(this.workList);
		return works;
	}

	
	
	
}
