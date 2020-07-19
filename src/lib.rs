use fbas_analyzer::*;
use wasm_bindgen::prelude::*;
#[macro_use]
extern crate serde_derive;

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize)]
pub struct AnalysedValues {
    minimal_quorums: Vec<Vec<String>>,
    minimal_quorums_size: usize,
    has_intersection: bool,
    minimal_blocking_sets: Vec<Vec<String>>,
    minimal_blocking_sets_size: usize,
    minimal_splitting_sets: Vec<Vec<String>>,
    minimal_splitting_sets_size: usize,
    top_tier: Vec<String>,
    top_tier_size: usize,
}

#[wasm_bindgen]
pub fn fbas_analysis(json_fbas: String, json_orgs: String) -> JsValue {
    let fbas: Fbas = Fbas::from_json_str(&json_fbas);
    let orgs = Organizations::from_json_str(&json_orgs, &fbas);
    let analysis = Analysis::new(&fbas);
    let minimal_quorums = analysis
        .minimal_quorums()
        .merged_by_org(&orgs)
        .minimal_sets()
        .into_pretty_vec_vec(&fbas, Some(&orgs));
    let minimal_quorums_size = analysis.minimal_quorums().len();
    let has_intersection = analysis.has_quorum_intersection();
    let minimal_blocking_sets = analysis
        .minimal_blocking_sets()
        .merged_by_org(&orgs)
        .minimal_sets()
        .into_pretty_vec_vec(&fbas, Some(&orgs));
    let minimal_blocking_sets_size = analysis.minimal_blocking_sets().len();
    let minimal_splitting_sets = analysis
        .minimal_splitting_sets()
        .merged_by_org(&orgs)
        .minimal_sets()
        .into_pretty_vec_vec(&fbas, Some(&orgs));
    let minimal_splitting_sets_size = analysis.minimal_splitting_sets().len();
    let top_tier = analysis.top_tier().merged_by_org(&orgs).into_pretty_vec(&fbas, Some(&orgs));
    let top_tier_size = analysis.top_tier().merged_by_org(&orgs).len();

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
