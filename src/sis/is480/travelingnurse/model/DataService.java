package sis.is480.travelingnurse.model;

import java.util.ArrayList;

import com.google.gson.Gson;

import sis.is480.travelingnurse.Data;

public class DataService
{
	@SuppressWarnings("unchecked")
	public static ArrayList get(Class c)
	{
		return new ArrayList(Data.get().query(GenericData.class).filter("kind = ", c.getName()).list());
	}
	
	private static ArrayList transform(ArrayList aL, Class c)
	{
		ArrayList result = new ArrayList();
		Gson gson = new Gson();
		for (Object oj : aL)
		{
			if (oj instanceof GenericData)
			{
				GenericData gd = (GenericData)oj;
				Object transformObject = gson.fromJson(gd.getContent(), c);
				result.add(transformObject);
			}
		}
		
		return result;
	}
	
	public static void put(Object obj, Class c)
	{
		Gson gson = new Gson();
		
		String content = gson.toJson(obj, c);
		GenericData gd = new GenericData();
		gd.setContent(content);
		gd.setKind(c.getName());
		
		Data.get().put(gd);
	}
	
}
