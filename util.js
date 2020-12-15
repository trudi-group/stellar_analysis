function maybe_change_analysis() {
	if (current_nodes || current_orgs) {
		should_merge = document.getElementById("merge_box").checked;
		var start = performance.now();
		var promise_results = run(current_nodes, current_orgs, should_merge);
		var stop = performance.now();
		const duration = stop - start;
		const time_as_secs = duration / 1000;
		var resolved_results = promise_results.then(function(value) {
			log_results(timestamp, stellarbeat_timestamp, value, time_as_secs)
		});
	}
}

const div = document.getElementById('results-box');
function write_to_div(text) {
	div.innerHTML = div.innerHTML + text;
	div.innerHTML = div.innerHTML + "<br>";
}

function create_buttons_in_div(title, short_results, results, tooltip) {
	var btn = document.createElement("button");
	btn.setAttribute('class', 'collapsible tooltip');
	var tip = document.createElement('div');
	tip.setAttribute('class', 'tooltiptext');
	tip.innerHTML = tooltip;
	btn.appendChild(tip);

	var main = document.createElement("b");
	main.innerHTML = title;
	btn.appendChild(main);
	var label = document.createTextNode(short_results);
	btn.appendChild(label);

	var output = document.getElementById("results-box");
	output.appendChild(btn);

	var inner_div = document.createElement("div");
	inner_div.setAttribute('class', 'content');
	output.appendChild(inner_div);

	var paragraph = document.createElement("P");
	paragraph.setAttribute('id', 'par');
	var copy_btn = document.createElement("button");
	copy_btn.setAttribute('class', 'copyButton');
	copy_btn.setAttribute('title', 'Copy');
	copy_btn.innerHTML = "&#x2398";
	paragraph.appendChild(copy_btn);

	var myDiv = document.createElement("div");
	myDiv.id = 'myDiv';
	myDiv.innerHTML = results;
	paragraph.appendChild(myDiv);
	inner_div.appendChild(paragraph);
}
/*
 * Different function for symmetric top tier because 
 * - short_results is bold
 * - non-bold text after short_results
 * - Results are written in a <pre> (JSON)
 */

function create_buttons_in_div_alter(title, short_results, sub_results, results, tooltip) {
	var btn = document.createElement("button");
	btn.setAttribute('class', 'collapsible tooltip');
	var tip = document.createElement('div');
	tip.setAttribute('class', 'tooltiptext');
	tip.innerHTML = tooltip;
	btn.appendChild(tip);

	var text = document.createTextNode(title);
	btn.appendChild(text);
	var bold = document.createElement("b");
	bold.innerHTML = short_results;
	btn.appendChild(bold);
	text = document.createTextNode(sub_results);
	btn.appendChild(text);

	var output = document.getElementById("results-box");
	output.appendChild(btn);

	var inner_div = document.createElement("div");
	inner_div.setAttribute('class', 'content');
	output.appendChild(inner_div);

	var paragraph = document.createElement("P");
	paragraph.setAttribute('id', 'par');
	var copy_btn = document.createElement("button");
	copy_btn.setAttribute('class', 'copyButton');
	copy_btn.setAttribute('title', 'Copy');
	copy_btn.innerHTML = "&#x2398";
	paragraph.appendChild(copy_btn);

	var myDiv = document.createElement("pre");
	myDiv.id = 'myDiv';
	myDiv.innerHTML = results;
	paragraph.appendChild(myDiv);
	inner_div.appendChild(paragraph);
}

function log_results(timestamp, stellarbeat_timestamp, results, duration) {

	div.innerHTML = "";

	write_to_div("<b>Results for " + timestamp + " (data from Stellarbeat has timestamp " + stellarbeat_timestamp + ")" + "</b>");
	console.log("cache hit: ", results.cache_hit);
	var mqs_output = [JSON.stringify(results.minimal_quorums, null, 4).replace(/\\/g, "").slice(1, -1)];

	var mqs_tooltip = "Minimal sets of nodes that are sufficient to reach agreement.";
	if (results.has_intersection) {
		create_buttons_in_div("quorums |", " We found " + results.minimal_quorums_size +" minimal quorums. All quorums intersect 👍", mqs_output, mqs_tooltip); 
	} else {
		create_buttons_in_div("quorums |", " We found " + results.minimal_quorums_size +" minimal quorums. Some quorums don't intersect 👎 Safety severely threatened for some nodes! (Also, the remaining results here might not make much sense.)", mqs_output, mqs_tooltip);
	}

	var mbs_output = [JSON.stringify(results.minimal_blocking_sets, null, 4).replace(/\\/g, "").slice(1, -1)];
	var mbs_tooltip = "Control over any of these sets is sufficient to compromise the liveness of all nodes and to censor future transactions.";
	create_buttons_in_div("blocking sets |", " We found "+ results.minimal_blocking_sets_size + " minimal blocking sets. The smallest one has size " + results.smallest_blocking_set_size + ".", mbs_output, mbs_tooltip);

	var mss_output = [JSON.stringify(results.minimal_splitting_sets, null, 4).replace(/\\/g, "").slice(1, -1)];
	var mss_tooltip = "Control over any of these sets is sufficient to compromise safety by undermining the quorum intersection of at least two quorums.";
	create_buttons_in_div("splitting sets |", " We found " + results.minimal_splitting_sets_size + " minimal splitting sets. The smallest one has size " + results.smallest_splitting_set_size + ".", mss_output, mss_tooltip);

	var top_tier = [JSON.stringify(results.top_tier)];
	var tt_tooltip = "These are the nodes out of which all minimal quorums, minimal blocking sets and minimal splitting sets are formed.";
	create_buttons_in_div("top tier 👑 |", " There are " + results.top_tier_size +  " nodes in the top tier.", top_tier, tt_tooltip);

	if (results.symmetric_top_tier_exists) {
		var symmetric_top_tier = results.symmetric_top_tier.slice(1, -1);
		symmetric_top_tier = JSON.stringify(JSON.parse(symmetric_top_tier), null, 4);
		var sc_tooltip = "All top tier nodes have identical quorum sets."
		create_buttons_in_div_alter("The top tier is", " symmetric", ".", symmetric_top_tier, sc_tooltip);
	}

	console.log("analysis duration (s): ", duration);

	var coll = document.getElementsByClassName("collapsible");
	coll[0].addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});
	coll[1].addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});
	coll[2].addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});
	coll[3].addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});

	if (coll.length > 4) {
		coll[4].addEventListener("click", function() {
			this.classList.toggle("active");
			var content = this.nextElementSibling;
			if (content.style.maxHeight){
				content.style.maxHeight = null;
			} else {
				content.style.maxHeight = content.scrollHeight + "px";
			}
		});
	}

	var copy_btns = document.getElementsByClassName("copyButton");
	copy_btns[0].addEventListener("click", function() {
		var textarea = document.createElement('textarea');
		textarea.id = 'temp_element';
		textarea.style.height = 0;
		document.body.appendChild(textarea);
		textarea.value = this.nextElementSibling.innerText;
		var selector = document.querySelector('#temp_element');
		selector.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
	});
	copy_btns[1].addEventListener("click", function() {
		var textarea = document.createElement('textarea');
		textarea.id = 'temp_element';
		textarea.style.height = 0;
		document.body.appendChild(textarea);
		textarea.value = this.nextElementSibling.innerText;
		var selector = document.querySelector('#temp_element');
		selector.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
	});
	copy_btns[2].addEventListener("click", function() {
		var textarea = document.createElement('textarea');
		textarea.id = 'temp_element';
		textarea.style.height = 0;
		document.body.appendChild(textarea);
		textarea.value = this.nextElementSibling.innerText;
		var selector = document.querySelector('#temp_element');
		selector.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
	});
	copy_btns[3].addEventListener("click", function() {
		var textarea = document.createElement('textarea');
		textarea.id = 'temp_element';
		textarea.style.height = 0;
		document.body.appendChild(textarea);
		textarea.value = this.nextElementSibling.innerText;
		var selector = document.querySelector('#temp_element');
		selector.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
	});

	if (copy_btns.length > 4) {
		copy_btns[4].addEventListener("click", function() {
			var textarea = document.createElement('textarea');
			textarea.id = 'temp_element';
			textarea.style.height = 0;
			document.body.appendChild(textarea);
			textarea.value = this.nextElementSibling.innerText;
			var selector = document.querySelector('#temp_element');
			selector.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
		});
		}
}
