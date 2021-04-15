function call_stellarbeat_on_input() {
	const date = document.getElementById('date');
	var time = document.getElementById('time');
    var url = "";
    if (!time.value) {
	    url = "https://api.stellarbeat.io/v2/all?at=" + date.value + "T" + "00:00";
        console.log("url: ", url);
    } else {
	    url = "https://api.stellarbeat.io/v2/all?at=" + date.value + "T" + time.value;
    }
	timestamp = date.value + "T" + time.value;
	console.log("input timestamp: ", timestamp );
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.send();
	xhr.onload = function() {
		console.log(xhr.status);
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
	console.log("input timestamp: ", timestamp );
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.send();
	xhr.onload = function() {
		console.log(xhr.status);
		fbas = xhr.response;
		prepare_fbas_string(timestamp, fbas);
		return xhr.response;
	}
}

function prepare_fbas_string(timestamp, text) {
	var js_object = JSON.parse(text);
	const stellarbeat_nodes = JSON.stringify(js_object[Object.keys(js_object)[0]]);
	const stellarbeat_orga = JSON.stringify(js_object[Object.keys(js_object)[1]]);
	stellarbeat_timestamp = JSON.stringify(js_object[Object.keys(js_object)[3]]).replace(/\"/g, "");
	console.log(text.length);
	fbas_from_stellarbeat = stellarbeat_nodes;
    current_nodes = fbas_from_stellarbeat;
    current_orgs = stellarbeat_orga;

	var inactive_nodes = [];
	const nodes_as_obj = JSON.parse(fbas_from_stellarbeat);
	nodes_as_obj.forEach(function(item){
		if (item.active === false) {
			inactive_nodes.push(item.publicKey);
		}
	});
	const faulty_nodes = JSON.stringify(inactive_nodes);
    inactive_fbas_nodes = faulty_nodes;

	var should_merge = merge_selection();

	const mqs = () => run_mqs(fbas_from_stellarbeat, stellarbeat_orga, should_merge);
	const mss = () => run_mss(fbas_from_stellarbeat, stellarbeat_orga, should_merge);
	const mbs = () => run_mbs(fbas_from_stellarbeat, stellarbeat_orga, faulty_nodes, should_merge);
	const tt = () => run_tt(fbas_from_stellarbeat, stellarbeat_orga, should_merge);
    var mqs_res, mss_res, mbs_res, tt_res;
	var start = performance.now();
    Promise.all([
        mqs(),
        mss(),
        mbs(),
        tt(),
    ]).then(([mqs_res, mss_res, mbs_res, tt_res]) => {
        var stop = performance.now();
        const duration = stop - start;
        const time_as_secs = duration / 1000;
        var [mqs, mqs_len, mqs_unused, cache_hit] = split_results(mqs_res);
	    console.log("mqs cache hit: ", cache_hit);
        var quorum_inter = Object.values(mqs_res)[3];
        var [mss, mss_len, mss_min, cache_hit] = split_results(mss_res);
	    console.log("mss cache hit: ", cache_hit);
        var [mbs, mbs_len, mbs_min, cache_hit] = split_results(mbs_res);
	    console.log("mbs cache hit: ", cache_hit);
        var [tt, tt_len, exists, symm_top_tier, cache_hit] = split_top_tier(tt_res);
	    console.log("tt cache hit: ", cache_hit);
        var analysis_res = new CompleteResults(mqs, quorum_inter, mqs_len,
            mbs, mbs_len, mbs_min, mss, mss_len, mss_min,
            tt, tt_len, exists, symm_top_tier);
        log_results(timestamp, stellarbeat_timestamp, analysis_res, time_as_secs)
    }).catch((err) => console.log(err))

	window.prepare_fbas_string = prepare_fbas_string
}

function split_results(result) {
    var value = Object.values(result)[0];
    var size = Object.values(result)[1];
    var min = Object.values(result)[2];
    var cache_hit = Object.values(result)[4];
    return [value, size, min, cache_hit];
}

function split_top_tier(result) {
    var value = Object.values(result)[0];
    var size = Object.values(result)[1];
    var symm_top_tier = Object.values(result)[2];
    var cache_hit = Object.values(result)[3];
    var symmetric_top_tier_exists;
    if (symm_top_tier === "") {
        symmetric_top_tier_exists = false;
    } else {
        symmetric_top_tier_exists = true;
    }
    return [value, size, symmetric_top_tier_exists, symm_top_tier, cache_hit];
}
