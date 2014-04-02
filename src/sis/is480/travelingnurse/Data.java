package sis.is480.travelingnurse;

import sis.is480.travelingnurse.model.GenericData;
import com.googlecode.objectify.*;

public class Data {
	
	static {
			ObjectifyService.register(GenericData.class);
	}
	
	public static Objectify get() {
		
		return ObjectifyService.begin();
		
	}
	
	public static ObjectifyFactory factory() {
		return ObjectifyService.factory();
	}
	
}
