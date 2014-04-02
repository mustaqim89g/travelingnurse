package sis.is480.travelingnurse.api;

import java.io.*;
import java.net.*;

public class ProxyServlet extends StandardServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	protected void processRequest() {
		
		String urlStr = this.request.getParameter("url");
		URL url;
	    HttpURLConnection connection = null;  
	    try 
	    {
			  //Create connection
			  url = new URL(urlStr);
			  connection = (HttpURLConnection)url.openConnection();
			  connection.setRequestMethod("GET");
			  connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
			  connection.setRequestProperty("Content-Language", "en-US");  
					
			  connection.setUseCaches (false);
			  connection.setDoInput(true);
			  connection.setDoOutput(true);
			
			  //Send request
			  DataOutputStream wr = new DataOutputStream (connection.getOutputStream());
			  wr.flush ();
			  wr.close ();
			
			  //Get Response	
			  InputStream is = connection.getInputStream();
			  BufferedReader rd = new BufferedReader(new InputStreamReader(is));
			  String line;
			  StringBuffer response = new StringBuffer();
			  
			  while((line = rd.readLine()) != null) 
			  {
			        response.append(line);
			        response.append(' ');
			  }
			  
			  rd.close();
			  this.response.getWriter().write(response.toString());
			  this.response.setContentType("application/json");

	    } 
	    catch (Exception e) 
	    {

	      e.printStackTrace();

	    } 
	    finally 
	    {
			  if(connection != null) 
			  {
			    connection.disconnect(); 
			  }
	    }
	}

}
