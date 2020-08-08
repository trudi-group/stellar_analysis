function call_stellarbeat_on_input() {
	const date = document.getElementById('date');
	const time = document.getElementById('time');
	var url = "https://api.stellarbeat.io/v2/all?at=" + date.value + "T" + time.value;
	console.log(url);
	timestamp = date.value + "T" + time.value;
	console.log("timestamp: ", timestamp );
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.send();
	xhr.onload = function() {
		console.log(xhr.status);
		console.log(xhr.response);
		fbas = xhr.response;
		prepare_fbas_string(timestamp, fbas);
		return xhr.response;
	}
}

function call_stellarbeat_on_click(clicked_date) {
	var time = "00" + ":" + "00";
	var url = "https://api.stellarbeat.io/v2/all?at=" + clicked_date + "T" + time;
	document.getElementById('date').value = clicked_date;
	document.getElementById('time').value = time;
	console.log(url);
	timestamp = clicked_date + "T" + time;
	console.log("timestamp: ", timestamp );
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.send();
	xhr.onload = function() {
		console.log(xhr.status);
		console.log(xhr.response);
		fbas = xhr.response;
		prepare_fbas_string(timestamp, fbas);
		return xhr.response;
	}
}

function prepare_fbas_string(timestamp, text) {
	var js_object = JSON.parse(text);
	const stellarbeat_nodes = JSON.stringify(js_object[Object.keys(js_object)[0]]);
	const stellarbeat_orga = JSON.stringify(js_object[Object.keys(js_object)[1]]);
	stellarbeat_timestamp = JSON.stringify(js_object[Object.keys(js_object)[2]]);
	current_nodes = stellarbeat_nodes;
	current_orgs = stellarbeat_orga;
	console.log(text.length);
	fbas_from_stellarbeat = stellarbeat_nodes;
	var should_merge = document.getElementById("merge_box").checked;
	console.log("to_merge: ", should_merge);
	var start = performance.now();
	var promise_results = run(fbas_from_stellarbeat, stellarbeat_orga, should_merge);
	var stop = performance.now();
	const duration = stop - start;
	const time_as_secs = duration / 1000;
	var resolved_results = promise_results.then(function(value) {
		log_results(timestamp, stellarbeat_timestamp, value, time_as_secs)
	});
	window.prepare_fbas_string = prepare_fbas_string
}
