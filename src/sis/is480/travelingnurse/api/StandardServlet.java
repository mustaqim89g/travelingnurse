package sis.is480.travelingnurse.api;

import java.io.IOException;
import java.io.Writer;

import javax.servlet.http.*;

import com.google.gson.Gson;

public abstract class StandardServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;
	protected HttpServletRequest request;
	protected HttpServletResponse response;
	
	protected void doPost(HttpServletRequest req, HttpServletResponse res)
	{
		this.request = req;
		this.response = res;
		processRequest();
	}
	
	protected void doGet(HttpServletRequest req, HttpServletResponse res)
	{
		this.request = req;
		this.response = res;
		processRequest();
	}
	
	protected <T> T transform(String requestParameter, Class<T> obj) {
		
		Gson gson = new Gson();
		return gson.fromJson(this.request.getParameter(requestParameter), obj);
		
	}
	
	protected String transform(Object obj) {
		Gson gson = new Gson();
		return gson.toJson(obj);
	}
	
	protected void respond(Object obj) {
		
		this.response.setContentType("text/json");
		try {
		
			Writer writer = this.response.getWriter();
			writer.write(transform(obj));
		} 
		catch (IOException e) {

		}
	}
	
	protected abstract void processRequest();

}
