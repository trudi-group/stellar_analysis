function get_and_analyze_stellarbeat_data_via_button() {
	var date = document.getElementById('date').value;
	var time = document.getElementById('time').value;
    get_and_analyze_stellarbeat_data(date, time);
}

function get_and_analyze_stellarbeat_data_via_click(clicked_date) {
    var date = clicked_date;
	var time = "00" + ":" + "00";
	document.getElementById('date').value = date;
	document.getElementById('time').value = time;
    get_and_analyze_stellarbeat_data(date, time);
}

function get_and_analyze_stellarbeat_data(date, time) {
    timestamp = build_timestamp(date, time);
    console.log("input timestamp: ", timestamp);
    get_stellarbeat_data_promise(date, time)
    .then(function(stellarbeat_data) {
        parse_stellarbeat_data(stellarbeat_data);
        should_merge = merge_selection();
		analyze_and_update_results_box();
    });
}

function build_timestamp(date, time) {
    return date + "T" + time;
}

function get_stellarbeat_data_promise(date, time) {
    var url = "https://api.stellarbeat.io/v2/all?at=" + build_timestamp(date, time);
    console.log("Getting data from: ", url);
    return new Promise(function (resolve) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
     	xhr.onload = function() {
     		console.log(xhr.status);
     		resolve(xhr.response);
     	}
        xhr.send();
    });
}

function parse_stellarbeat_data(stellarbeat_data) {
	var js_object = JSON.parse(stellarbeat_data);
	stellarbeat_nodes = JSON.stringify(js_object[Object.keys(js_object)[0]]);
    stellarbeat_orgs = JSON.stringify(js_object[Object.keys(js_object)[1]]);
	stellarbeat_timestamp = JSON.stringify(js_object[Object.keys(js_object)[3]]).replace(/\"/g, "");

	fbas_from_stellarbeat = stellarbeat_nodes;
    current_nodes = fbas_from_stellarbeat;
    current_orgs = stellarbeat_orgs;

	var inactive_nodes = [];
	const nodes_as_obj = JSON.parse(fbas_from_stellarbeat);
	nodes_as_obj.forEach(function(item){
		if (item.active === false) {
			inactive_nodes.push(item.publicKey);
		}
	});
	const faulty_nodes = JSON.stringify(inactive_nodes);
    inactive_fbas_nodes = faulty_nodes;
}

async function analyze_and_update_results_box() {
    var start = performance.now();

    clear_results_box();
    show_results_box_title(timestamp, stellarbeat_timestamp);
    await tick();

    console.log("mqs analysis...");
    let mqs_res = await run_mqs(fbas_from_stellarbeat, stellarbeat_orgs, should_merge);
    var [mqs, mqs_len, mqs_unused, cache_hit] = split_results(mqs_res);
    console.log("mqs cache hit: ", cache_hit);
    var has_quorum_intersection = Object.values(mqs_res)[3];
    show_mqs_results(mqs, mqs_len, has_quorum_intersection);
    await tick();

    console.log("tt analysis...");
	let tt_res = await run_tt(fbas_from_stellarbeat, stellarbeat_orgs, should_merge);
    var [tt, tt_len, symm_tt_exists, symm_tt, cache_hit] = split_top_tier(tt_res);
    console.log("tt cache hit: ", cache_hit);
    show_tt_results(tt, tt_len, symm_tt_exists, symm_tt);
    await tick();

    console.log("mbs analysis...");
    let mbs_res = await run_mbs(fbas_from_stellarbeat, stellarbeat_orgs, inactive_fbas_nodes, should_merge);
    var [mbs, mbs_len, mbs_min, cache_hit] = split_results(mbs_res);
    console.log("mbs cache hit: ", cache_hit);
    show_mbs_results(mbs, mbs_len, mbs_min);
    await tick();

    console.log("mss analysis...");
	let mss_res = await run_mss(fbas_from_stellarbeat, stellarbeat_orgs, should_merge);
    var [mss, mss_len, mss_min, cache_hit] = split_results(mss_res);
    console.log("mss cache hit: ", cache_hit);
    show_mss_results(mss, mss_len, mss_min);
    await tick();

    var stop = performance.now();
    const duration = stop - start;
    const time_as_secs = duration / 1000;
	console.log("analysis duration (s): ", time_as_secs);
    await tick();
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
