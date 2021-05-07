function merge_selection() {
      for (i = 0; i < document.merge.merge_box.length; i++) {
      if (document.merge.merge_box[i].checked) {
          return i;
      }
   }
}

var should_merge = merge_selection();
const merged_orgs_title = "Merged by organization (nodes by the same organization count as 1)";
const merged_isps_title = "Merged by ISP (nodes by the same ISP count as 1)";
const merged_ctry_title = "Merged by country (nodes by the same country count as 1)";
const raw_title = "Raw nodes (each physical node counts as 1)";

function make_chart_from_csv_url(canvas_id, csv_url) {
	should_merge = merge_selection();
	d3.csv(csv_url).then(function(csv_data) { make_chart_from_csv_data(canvas_id, csv_data); });
}

function make_chart_from_csv_data(canvas_id, csv_data) {

	Chart.defaults.global.defaultColor = 'rgba(0, 0, 0, 0)';

	var colors = {
		tt:        'rgba(70, 105, 90, 1)',
		mbs:       'rgba(35, 90, 130, 1)',
		mbs_light: 'rgba(35, 90, 130, 0.35)',
		mss:       'rgba(190, 85, 45, 1)',
		mss_light: 'rgba(190, 85, 45, 0.35)'
	};

	var chart_data = [];
	if (should_merge == MergeOptions.NONE) {
		chart_data = {
			labels: csv_data.map(function(d) {return d.label}),
			datasets: [{
				data: csv_data.map(function(d) {return d.top_tier_size}),
				label: '|top tier|',
				borderColor: colors.tt,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.mbs_mean}),
				label: 'mean(|minimal blocking sets|)',
				borderColor: colors.mbs,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.mbs_min}),
				label: 'min(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.mbs_max}),
				label: 'max(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.mss_mean}),
				label: 'mean(|minimal splitting sets|)',
				borderColor: colors.mss,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.mss_min}),
				label: 'min(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}, {
				data: csv_data.map(function(d) {return d.mss_max}),
				label: 'max(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}]
		};
    } else if (should_merge == MergeOptions.ORGS) {
		chart_data = {
			labels: csv_data.map(function(d) {return d.label}),
			datasets: [{
				data: csv_data.map(function(d) {return d.orgs_top_tier_size}),
				label: '|top tier|',
				borderColor: colors.tt,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.orgs_mbs_mean}),
				label: 'mean(|minimal blocking sets|)',
				borderColor: colors.mbs,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.orgs_mbs_min}),
				label: 'min(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.orgs_mbs_max}),
				label: 'max(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.orgs_mss_mean}),
				label: 'mean(|minimal splitting sets|)',
				borderColor: colors.mss,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.orgs_mss_min}),
				label: 'min(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}, {
				data: csv_data.map(function(d) {return d.orgs_mss_max}),
				label: 'max(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}]
		};
	} else if (should_merge == MergeOptions.ISPS) {
		chart_data = {
			labels: csv_data.map(function(d) {return d.label}),
			datasets: [{
				data: csv_data.map(function(d) {return d.isps_top_tier_size}),
				label: '|top tier|',
				borderColor: colors.tt,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.isps_mbs_mean}),
				label: 'mean(|minimal blocking sets|)',
				borderColor: colors.mbs,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.isps_mbs_min}),
				label: 'min(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.isps_mbs_max}),
				label: 'max(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.isps_mss_mean}),
				label: 'mean(|minimal splitting sets|)',
				borderColor: colors.mss,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.isps_mss_min}),
				label: 'min(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}, {
				data: csv_data.map(function(d) {return d.isps_mss_max}),
				label: 'max(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}]
		};
	} else if (should_merge == MergeOptions.COUNTRY) {
		chart_data = {
			labels: csv_data.map(function(d) {return d.label}),
			datasets: [{
				data: csv_data.map(function(d) {return d.ctries_top_tier_size}),
				label: '|top tier|',
				borderColor: colors.tt,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.ctries_mbs_mean}),
				label: 'mean(|minimal blocking sets|)',
				borderColor: colors.mbs,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.ctries_mbs_min}),
				label: 'min(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.ctries_mbs_max}),
				label: 'max(|minimal blocking sets|)',
				borderWidth: 0,
				backgroundColor: colors.mbs_light,
				steppedLine: true,
				fill: 1
			}, {
				data: csv_data.map(function(d) {return d.ctries_mss_mean}),
				label: 'mean(|minimal splitting sets|)',
				borderColor: colors.mss,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: -1
			}, {
				data: csv_data.map(function(d) {return d.ctries_mss_min}),
				label: 'min(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}, {
				data: csv_data.map(function(d) {return d.ctries_mss_max}),
				label: 'max(|minimal splitting sets|)',
				borderWidth: 0,
				backgroundColor: colors.mss_light,
				steppedLine: true,
				fill: 4
			}]
		};
	}

	var chart_text;
	if (should_merge == MergeOptions.ORGS) {
		chart_text = merged_orgs_title;
	} else if (should_merge == MergeOptions.NONE){
		chart_text = raw_title;
	} else if (should_merge == MergeOptions.ISPS){
		chart_text = merged_isps_title;
	} else if (should_merge == MergeOptions.COUNTRY){
		chart_text = merged_ctry_title;
	}

	var options = {
		responsive: true,
		maintainAspectRatio: false,
		title: {
			display: true,
			text: chart_text,
		},
		scales: {
			yAxes: [{
				ticks: {
					beginAtZero: true,
				}
			}]
		},
		elements: {
			point: {
				radius: 0,
				hitRadius: 5
			},
		},
		legend: {
			labels: {
				filter: function(legendItem, data) {
					return !legendItem.text.startsWith('min') && !legendItem.text.startsWith('max')
				}
			}
		}
	};

	var ctx = document.getElementById(canvas_id).getContext('2d');

	if (window.chart) window.chart.destroy();
	window.chart = new Chart(ctx, {
		type: 'line',
		data: chart_data,
		options: options
	});
	document.getElementById(canvas_id).onclick = function(evt) {
		var activePoint = chart.getElementAtEvent(event);

		// make sure click was on an actual point
		if (activePoint.length > 0) {
			var clickedDatasetIndex = activePoint[0]._datasetIndex;
			var clickedElementindex = activePoint[0]._index;
			var label = chart.data.labels[clickedElementindex];
			var value = chart.data.datasets[clickedDatasetIndex].data[clickedElementindex];     
			console.log("Clicked: " + label + " - " + value);
			get_and_analyze_stellarbeat_data_via_click(label);
		}
	};
}
