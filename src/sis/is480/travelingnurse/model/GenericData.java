package sis.is480.travelingnurse.model;

import javax.persistence.Id;

public class GenericData {

	@Id
	private Long id;
	private String kind;
	private String content;
	
	public Long getId()
	{
		return id;
	}
	
	public String getKind()
	{
		return kind;
	}
	
	public void setKind(String kind)
	{
		this.kind = kind;
	}
	
	public String getContent()
	{
		return content;
	}
	
	public void setContent(String content)
	{
		this.content = content;
	}
	
}
