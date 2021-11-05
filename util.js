function maybe_change_analysis() {
    should_merge = merge_selection();
    // Necessary when we change the grouping before having done an analysis
    if (!current_nodes || !current_orgs) {
        return;
    }
	if (last_merge_state != should_merge) {
        last_merge_state = should_merge;

        analyze_and_update_results_box();
	}
}

const div = document.getElementById('results-box');

function create_title_in_div(text) {
    var b = document.createElement("b");
    b.innerHTML = text;
	div.append(b);
    div.append(document.createElement("br"));
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

	btn.addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});

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

	copy_btn.addEventListener("click", function() {
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

	btn.addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});

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

	copy_btn.addEventListener("click", function() {
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

	paragraph.appendChild(copy_btn);

	var myDiv = document.createElement("pre");
	myDiv.id = 'myDiv';
	myDiv.innerHTML = results;
	paragraph.appendChild(myDiv);
	inner_div.appendChild(paragraph);
}

function clear_results_box() {
    while(div.firstChild) {
        div.removeChild(div.firstChild);
    };
}

function show_results_box_title(timestamp, stellarbeat_timestamp) {
	create_title_in_div("Results for " + timestamp + " (data from Stellarbeat has timestamp " + stellarbeat_timestamp + ")");
}

function show_mqs_results(mqs, mqs_len, has_quorum_intersection) {
	var mqs_output = JSON.stringify(mqs, null, 4);

	var mqs_tooltip = "Minimal sets of nodes that are sufficient to reach agreement.";
	if (has_quorum_intersection) {
		create_buttons_in_div("quorums |", " We found " + mqs_len + " minimal quorums. All quorums intersect 👍", mqs_output, mqs_tooltip);
	} else {
		create_buttons_in_div("quorums |", " We found " + mqs_len + " minimal quorums. Some quorums don't intersect 👎 Safety severely threatened for some nodes! (Also, the remaining results here might not make much sense.)", mqs_output, mqs_tooltip);
	}
}

function show_mbs_results(mbs, mbs_len, mbs_min) {
	var mbs_output = JSON.stringify(mbs, null, 4);
	var mbs_tooltip = "Control over any of these sets is sufficient to compromise the liveness of all nodes and to censor future transactions.";
	create_buttons_in_div("blocking sets |", " We found "+ mbs_len + " minimal blocking sets. The smallest one has size " + mbs_min + ".", mbs_output, mbs_tooltip);
}

function show_mss_results(mss, mss_len, mss_min) {
	var mss_output = JSON.stringify(mss, null, 4);
	var mss_tooltip = "Control over any of these sets is sufficient to compromise safety by undermining the quorum intersection of at least two quorums.";
	create_buttons_in_div("splitting sets |", " We found "+ mss_len + " minimal splitting sets. The smallest one has size " + mss_min + ".", mss_output, mss_tooltip);
}

function show_tt_results(tt, tt_len, symm_tt) {
	var tt = [JSON.stringify(tt)];
	var tt_tooltip = "These are the nodes out of which all minimal quorums, minimal blocking sets and minimal splitting sets are formed.";
	create_buttons_in_div("top tier 👑 |", " There are " + tt_len +  " nodes in the top tier.", tt, tt_tooltip);

	if (symm_tt) {
		symm_tt_string = JSON.stringify(symm_tt, null, 4);
		var sc_tooltip = "All top tier nodes have identical quorum sets."
		create_buttons_in_div_alter("The top tier is", " symmetric", ".", symm_tt_string, sc_tooltip);
	}
}

// let a few milliseconds pass just so, so that the browser can redraw
function tick() {
    return new Promise(r => setTimeout(r, 1));
}
