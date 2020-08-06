use fbas_analyzer::*;
use wasm_bindgen::prelude::*;
#[macro_use]
extern crate serde_derive;

use std::collections::HashMap;
#[macro_use]
extern crate lazy_static;
use std::sync::Mutex;

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Default)]
pub struct AnalysedValues {
    minimal_quorums: String,
    minimal_quorums_size: usize,
    has_intersection: bool,
    minimal_blocking_sets: String,
    minimal_blocking_sets_size: usize,
    smallest_blocking_set_size: usize,
    minimal_splitting_sets: String,
    minimal_splitting_sets_size: usize,
    smallest_splitting_set_size: usize,
    top_tier: Vec<String>,
    top_tier_size: usize,
    cache_hit: bool,
}

#[derive(Debug, Clone, Default)]
struct CustomResultsStruct {
    minimal_quorums: NodeIdSetVecResult,
    minimal_quorums_size: usize,
    minimal_blocking_sets: NodeIdSetVecResult,
    minimal_blocking_sets_size: usize,
    smallest_blocking_set_size: usize,
    minimal_splitting_sets: NodeIdSetVecResult,
    minimal_splitting_sets_size: usize,
    smallest_splitting_set_size: usize,
    top_tier: NodeIdSetResult,
    top_tier_size: usize,
    has_quorum_intersection: bool,
}

fn do_analysis(fbas: &Fbas) -> CustomResultsStruct {
    let analysis = Analysis::new(fbas);
    CustomResultsStruct {
        minimal_quorums: analysis.minimal_quorums(),
        minimal_quorums_size: analysis.minimal_quorums().len(),
        minimal_blocking_sets: analysis.minimal_blocking_sets(),
        minimal_blocking_sets_size: analysis.minimal_blocking_sets().len(),
        smallest_blocking_set_size: analysis.minimal_blocking_sets().min(),
        minimal_splitting_sets: analysis.minimal_splitting_sets(),
        minimal_splitting_sets_size: analysis.minimal_splitting_sets().len(),
        smallest_splitting_set_size: analysis.minimal_splitting_sets().min(),
        top_tier: analysis.top_tier(),
        top_tier_size: analysis.top_tier().len(),
        has_quorum_intersection: analysis.has_quorum_intersection(),
    }
}

lazy_static! {
    static ref RESULTS_CACHE: Mutex<HashMap<Fbas, CustomResultsStruct>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

fn fbas_has_been_analysed(fbas: &Fbas) -> Option<CustomResultsStruct> {
    let cache = RESULTS_CACHE.lock().unwrap();
    let value = cache.get(&fbas);
    if let Some(cached_results) = value {
        Some(cached_results.clone())
    } else {
        None
    }
}

#[wasm_bindgen]
pub fn fbas_analysis(json_fbas: String, json_orgs: String, merge: bool, describe: bool) -> JsValue {
    let fbas: Fbas = Fbas::from_json_str(&json_fbas).to_standard_form();
    let orgs = Organizations::from_json_str(&json_orgs, &fbas);
    let mut cache_hit = false;
    let analysis_results = if let Some(cached_results) = fbas_has_been_analysed(&fbas) {
        cache_hit = true;
        cached_results
    } else {
        let new_results = do_analysis(&fbas);
        let mut results_cache = RESULTS_CACHE.lock().unwrap();
        results_cache.insert(fbas.clone(), new_results.clone());
        new_results
    };

    let min_mqs = if merge {
        analysis_results
            .minimal_quorums
            .merged_by_org(&orgs)
            .minimal_sets()
    } else {
        analysis_results.minimal_quorums.minimal_sets()
    };
    let minimal_quorums = if describe {
        serde_json::to_string(&min_mqs.describe()).expect("Error converting mqs to string")
    } else if merge {
        min_mqs.into_pretty_string(&fbas, Some(&orgs))
    } else {
        min_mqs.into_pretty_string(&fbas, None)
    };

    let min_mbs = if merge {
        analysis_results
            .minimal_blocking_sets
            .merged_by_org(&orgs)
            .minimal_sets()
    } else {
        analysis_results.minimal_blocking_sets.minimal_sets()
    };
    let minimal_blocking_sets = if describe {
        serde_json::to_string(&min_mbs.describe()).expect("Error converting mbs to string")
    } else if merge {
        min_mbs.into_pretty_string(&fbas, Some(&orgs))
    } else {
        min_mbs.into_pretty_string(&fbas, None)
    };

    let min_mss = if merge {
        analysis_results
            .minimal_splitting_sets
            .merged_by_org(&orgs)
            .minimal_sets()
    } else {
        analysis_results.minimal_splitting_sets.minimal_sets()
    };
    let minimal_splitting_sets = if describe {
        serde_json::to_string(&min_mss.describe()).expect("Error converting mss to string")
    } else if merge {
        min_mss.into_pretty_string(&fbas, Some(&orgs))
    } else {
        min_mss.into_pretty_string(&fbas, None)
    };

    let top_tier = if merge {
        analysis_results
            .top_tier
            .merged_by_org(&orgs)
            .into_pretty_vec(&fbas, Some(&orgs))
    } else {
        analysis_results.top_tier.into_pretty_vec(&fbas, None)
    };

    let minimal_quorums_size = analysis_results.minimal_quorums_size;
    let minimal_blocking_sets_size = analysis_results.minimal_blocking_sets_size;
    let has_intersection = analysis_results.has_quorum_intersection;
    let minimal_splitting_sets_size = analysis_results.minimal_splitting_sets_size;
    let smallest_blocking_set_size = analysis_results.smallest_blocking_set_size;
    let smallest_splitting_set_size = analysis_results.smallest_splitting_set_size;
    let top_tier_size = top_tier.len();

    let analysed_values = AnalysedValues {
        minimal_quorums,
        minimal_quorums_size,
        has_intersection,
        minimal_blocking_sets,
        minimal_blocking_sets_size,
        smallest_blocking_set_size,
        minimal_splitting_sets,
        minimal_splitting_sets_size,
        smallest_splitting_set_size,
        top_tier,
        top_tier_size,
        cache_hit,
    };
    JsValue::from_serde(&analysed_values).unwrap()
}
