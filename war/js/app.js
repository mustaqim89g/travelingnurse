$(document).ready(function(){
	setMap();
	addNewPatient('Mustaqim', 'Block 907 Jurong West St 91 Singapore 640907', '97325634');
	addNewPatient('Nenek', 'Block 513 West Coast Road Singapore 120513', '67741009');
	addNewPatient('CoolData', '80 Stamford Road Singapore 178902', '67741009');
	
	setBase('NUH', '5 Lower Kent Ridge Road Singapore 119074');
	addNewNurse('Jamilah', 6, 10);
});

/* An exception class that will be used for exception handling */
function AppException(title, message)
{
	this.title = title;
	this.message =  message;
}

/* ALL COMMON CODES GOES HERE */
/* Sends the request to the backend to act as the proxy to some of the API */
/* especially those affected greatly by the CORS requirement.*/
function proxy(url, done, error)
{
	var encodedUrl = '/api/proxy?url=' + encodeUrl(url);
	request(encodedUrl, null, 'GET', done, error);
}

/* Sends an ajax request */
function request(url, data, action, done, error)
{
	data = data || { };
	action = action || 'GET';
	done = done || function() { };
	error = error || function() { };
	
	$.ajax({
		action: action,
		url: url,
		data: data
	})
	.done(done)
	.fail(error);
}


function encodeUrl(urlPart)
{
	return encodeURIComponent(urlPart);
}






