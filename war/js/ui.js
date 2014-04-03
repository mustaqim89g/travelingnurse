$(document).ready(function(){
	
	$('.run').click(click_runSimulation);
	
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
	
	sims = new Simulator(data);
	sims.performScheduling();
	sims.plot();
}