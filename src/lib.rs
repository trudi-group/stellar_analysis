use fbas_analyzer::*;
use wasm_bindgen::prelude::*;
#[macro_use]
extern crate serde_derive;

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
    minimal_splitting_sets: String,
    minimal_splitting_sets_size: usize,
    top_tier: Vec<String>,
    top_tier_size: usize,
}

#[wasm_bindgen]
pub fn fbas_analysis(json_fbas: String, json_orgs: String, merge: bool, describe: bool) -> JsValue {
    let fbas: Fbas = Fbas::from_json_str(&json_fbas);
    let orgs = Organizations::from_json_str(&json_orgs, &fbas);
    let analysis = Analysis::new(&fbas);
    let mqs = if merge {
        analysis
            .minimal_quorums()
            .merged_by_org(&orgs)
            .minimal_sets()
    } else {
        analysis.minimal_quorums().minimal_sets()
    };
    let mbs = if merge {
        analysis
            .minimal_blocking_sets()
            .merged_by_org(&orgs)
            .minimal_sets()
    } else {
        analysis.minimal_blocking_sets().minimal_sets()
    };
    let mss = if merge {
        analysis
            .minimal_splitting_sets()
            .merged_by_org(&orgs)
            .minimal_sets()
    } else {
        analysis.minimal_splitting_sets().minimal_sets()
    };
    let top_tier = if merge {
        analysis
            .top_tier()
            .merged_by_org(&orgs)
            .into_pretty_vec(&fbas, Some(&orgs))
    } else {
        analysis.top_tier().into_pretty_vec(&fbas, None)
    };

    let minimal_quorums = if !describe {
        if !merge {
            mqs.into_id_string()
        } else {
            mqs.into_pretty_string(&fbas, Some(&orgs))
        }
    } else {
        serde_json::to_string(&mqs.describe()).expect("Error converting mqs to string")
    };

    let minimal_blocking_sets = if !describe {
        if !merge {
            mbs.into_id_string()
        } else {
            mbs.into_pretty_string(&fbas, Some(&orgs))
        }
    } else {
        serde_json::to_string(&mbs.describe()).expect("Error converting mbs to string")
    };

    let minimal_splitting_sets = if !describe {
        if !merge {
            mss.into_id_string()
        } else {
            mss.into_pretty_string(&fbas, Some(&orgs))
        }
    } else {
        serde_json::to_string(&mss.describe()).expect("Error converting mss to string")
    };

    let minimal_quorums_size = analysis.minimal_quorums().len();
    let has_intersection = analysis.has_quorum_intersection();
    let minimal_blocking_sets_size = analysis.minimal_blocking_sets().len();
    let minimal_splitting_sets_size = analysis.minimal_splitting_sets().len();
    let top_tier_size = top_tier.len();

    let analysed_values = AnalysedValues {
        minimal_quorums,
        minimal_quorums_size,
        has_intersection,
        minimal_blocking_sets,
        minimal_blocking_sets_size,
        minimal_splitting_sets,
        minimal_splitting_sets_size,
        top_tier,
        top_tier_size,
    };
    JsValue::from_serde(&analysed_values).unwrap()
}
