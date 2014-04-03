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
	$('.simulation-control').show();
	
	sims = new Simulator(data);
	sims.performScheduling();
	sims.simulationTickFunction = onSimulationTick;
	sims.plot();
	sims.simulate();
}

function onSimulationTick()
{
	var hour = Math.floor(sims.currentTime / 60);
	var minute = Math.floor(sims.currentTime % 60);
	
	var hourStr = hour + '';
	if (hour < 10) hourStr = '0' + hour;
	
	var minuteStr = minute +'';
	if (minute < 10) minuteStr = '0' + minute;
	
	$('.time').html(hourStr + ':' + minuteStr);
}