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

macro_rules! create_analysis_report {
    ($($id: ident: $e: expr), *) => {{
        AnalysisReport {
            $($id: $e), * ,
        }
    }};
}
macro_rules! merge_by_group {
    ($result:expr, $grouping:expr, $merge_by:expr) => {{
        if $merge_by != MergeBy::DoNotMerge {
            $result.merged_by_group($grouping)
        } else {
            $result
        }
    }};
}
macro_rules! into_pretty_string {
    ($node_id_set:expr, $grouping:expr, $fbas:expr, $merge_by:expr) => {{
        let fbas = &$fbas;
        if $merge_by != MergeBy::DoNotMerge {
            (
                $node_id_set.len(),
                $node_id_set.min(),
                $node_id_set.into_pretty_string(&fbas, $grouping.as_ref()),
            )
        } else {
            (
                $node_id_set.len(),
                $node_id_set.min(),
                $node_id_set.into_pretty_string(&fbas, None),
            )
        }
    }};
}
#[wasm_bindgen]
#[derive(PartialEq, Clone, Copy)]
pub enum MergeBy {
    DoNotMerge,
    Orgs,
    ISPs,
    Countries,
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
    symmetric_top_tier_exists: bool,
    symmetric_top_tier: String,
    cache_hit: bool,
}

#[derive(Serialize, Default)]
/// Used for mqs, mss, mbs
pub struct AnalysisReport {
    result: String,
    size: usize,
    /// unused for mqs
    min: usize,
    /// only for mqs
    quorum_intersection: Option<bool>,
    cache_hit: bool,
}

#[derive(Serialize, Default)]
pub struct TopTierReport {
    top_tier: Vec<String>,
    top_tier_size: usize,
    symmetric_top_tier: String,
    cache_hit: bool,
}

#[derive(Debug, Clone, Default)]
struct CustomResultsStruct {
    minimal_quorums: NodeIdSetVecResult,
    minimal_quorums_size: usize,
    minimal_blocking_sets: NodeIdSetVecResult,
    minimal_splitting_sets: NodeIdSetVecResult,
    top_tier: NodeIdSetResult,
    top_tier_size: usize,
    has_quorum_intersection: bool,
    symmetric_clusters: Vec<QuorumSet>,
}

fn do_qi_analysis(analysis: &Analysis) -> bool {
    analysis.has_quorum_intersection()
}
fn do_mqs_analysis(analysis: &Analysis) -> NodeIdSetVecResult {
    analysis.minimal_quorums()
}
fn do_mbs_analysis(analysis: &Analysis) -> NodeIdSetVecResult {
    analysis.minimal_blocking_sets()
}
fn do_mss_analysis(analysis: &Analysis) -> NodeIdSetVecResult {
    analysis.minimal_splitting_sets()
}
fn do_top_tier_analysis(analysis: &Analysis) -> NodeIdSetResult {
    analysis.top_tier()
}
fn do_sc_analysis(analysis: &Analysis) -> Option<QuorumSet> {
    analysis.symmetric_top_tier()
}

lazy_static! {
    static ref ANALYSIS_CACHE: Mutex<HashMap<Fbas, Analysis>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

macro_rules! get_analysis_object {
    ($fbas:expr, $cache:expr) => {{
        let fbas = $fbas;
        let mut cache_hit = true;
        let cache = $cache;
        if !cache.contains_key(&fbas) {
            cache_hit = false;
            cache.insert(fbas.clone(), Analysis::new(fbas));
        }
        (cache.get(fbas).unwrap(), cache_hit)
    }};
}

fn get_grouping_to_merge_by(
    fbas: &Fbas,
    json_fbas: String,
    json_orgs: String,
    merge_by: MergeBy,
) -> Option<Groupings> {
    match merge_by {
        MergeBy::Orgs => Some(Groupings::organizations_from_json_str(&json_orgs, &fbas)),
        MergeBy::ISPs => Some(Groupings::isps_from_json_str(&json_fbas, &fbas)),
        MergeBy::Countries => Some(Groupings::countries_from_json_str(&json_fbas, &fbas)),
        MergeBy::DoNotMerge => None,
    }
}

#[wasm_bindgen]
pub fn analyze_minimal_quorums(json_fbas: String, json_orgs: String, merge_by: MergeBy) -> JsValue {
    let fbas: Fbas = Fbas::from_json_str(&json_fbas).to_standard_form();
    let grouping = get_grouping_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, cache_hit) = get_analysis_object!(&fbas, cache);
    let min_mqs = merge_by_group!(
        do_mqs_analysis(&analysis),
        &grouping.clone().unwrap(),
        merge_by
    )
    .minimal_sets();
    let (minimal_quorums_size, _, minimal_quorums) =
        into_pretty_string!(min_mqs, grouping, &fbas, merge_by);
    let qi = do_qi_analysis(&analysis);
    let results = create_analysis_report!(
        result: minimal_quorums,
                size: minimal_quorums_size,
                min: 0,
                quorum_intersection: Some(qi),
                cache_hit: cache_hit);
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn analyze_minimal_splitting_sets(
    json_fbas: String,
    json_orgs: String,
    merge_by: MergeBy,
) -> JsValue {
    let fbas: Fbas = Fbas::from_json_str(&json_fbas).to_standard_form();
    let grouping = get_grouping_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, cache_hit) = get_analysis_object!(&fbas, cache);
    let min_mss = merge_by_group!(
        do_mss_analysis(&analysis),
        &grouping.clone().unwrap(),
        merge_by
    )
    .minimal_sets();
    let (minimal_splitting_sets_size, smallest_splitting_set_size, minimal_splitting_sets) =
        into_pretty_string!(min_mss, grouping, &fbas, merge_by);
    let results = create_analysis_report!(
        result: minimal_splitting_sets,
        size: minimal_splitting_sets_size,
        min: smallest_splitting_set_size,
        quorum_intersection: None,
        cache_hit: cache_hit
    );
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn analyze_minimal_blocking_sets(
    json_fbas: String,
    json_orgs: String,
    faulty_nodes: String,
    merge_by: MergeBy,
) -> JsValue {
    let fbas: Fbas = Fbas::from_json_str(&json_fbas).to_standard_form();
    let grouping = get_grouping_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let inactive_nodes: Vec<String> = serde_json::from_str(&faulty_nodes).unwrap();
    let inactive_nodes: Vec<&str> = inactive_nodes.iter().map(|s| s.as_ref()).collect();
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, cache_hit) = get_analysis_object!(&fbas, cache);
    let min_mbs_without_faulty =
        do_mbs_analysis(&analysis).without_nodes_pretty(&inactive_nodes, &fbas, None);
    let min_mbs = merge_by_group!(min_mbs_without_faulty, &grouping.clone().unwrap(), merge_by)
        .minimal_sets();
    let (minimal_blocking_sets_size, smallest_blocking_set_size, minimal_blocking_sets) =
        into_pretty_string!(min_mbs, grouping, &fbas, merge_by);
    let results = create_analysis_report!(
        result: minimal_blocking_sets,
        size: minimal_blocking_sets_size,
        min: smallest_blocking_set_size,
        quorum_intersection: None,
        cache_hit: cache_hit
    );
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn analyze_top_tier(json_fbas: String, json_orgs: String, merge_by: MergeBy) -> JsValue {
    let fbas: Fbas = Fbas::from_json_str(&json_fbas).to_standard_form();
    let grouping = get_grouping_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, cache_hit) = get_analysis_object!(&fbas, cache);
    let sc = do_sc_analysis(&analysis);
    let top_tier = if merge_by != MergeBy::DoNotMerge {
        merge_by_group!(
            do_top_tier_analysis(&analysis),
            &grouping.clone().unwrap(),
            merge_by
        )
        .into_pretty_vec(&fbas, grouping.as_ref())
    } else {
        do_top_tier_analysis(&analysis).into_pretty_vec(&fbas, None)
    };
    let symmetric_top_tier = if let Some(cluster) = sc {
        let mut sc_as_vec: Vec<QuorumSet> = Vec::with_capacity(1);
        if merge_by != MergeBy::DoNotMerge {
            sc_as_vec.push(grouping.clone().unwrap().merge_quorum_set(cluster));
            sc_as_vec.into_pretty_string(&fbas, grouping.as_ref())
        } else {
            sc_as_vec.push(cluster);
            sc_as_vec.into_pretty_string(&fbas, None)
        }
    } else {
        String::default()
    };
    let top_tier_size = top_tier.len();
    let results = TopTierReport {
        top_tier,
        top_tier_size,
        symmetric_top_tier,
        cache_hit,
    };
    JsValue::from_serde(&results).unwrap()
}

#[cfg(test)]
mod tests {
    use wasm_bindgen_test::*;
    use js_sys::JSON;
    use super::*;

    lazy_static! {
        static ref TEST_FBAS_JSON: String = r#"[
            {
                "publicKey": "n0",
                "quorumSet": { "threshold": 3, "validators": ["n0", "n1", "n2", "n3"] }
            },
            {
                "publicKey": "n1",
                "quorumSet": { "threshold": 3, "validators": ["n0", "n1", "n2", "n3"] }
            },
            {
                "publicKey": "n2",
                "quorumSet": { "threshold": 3, "validators": ["n0", "n1", "n2", "n3"] }
            },
            {
                "publicKey": "n3",
                "quorumSet": { "threshold": 3, "validators": ["n0", "n1", "n2", "n3"] }
            }
        ]"#.to_string();

        static ref TEST_ORGS_JSON: String = "".to_string();
    }

    #[wasm_bindgen_test]
    fn test_analyze_minimal_quorums() {

        let result = analyze_minimal_quorums(TEST_FBAS_JSON.clone(), TEST_ORGS_JSON.clone(), MergeBy::DoNotMerge);

        let actual = JSON::stringify(
            &result
        ).unwrap().as_string().unwrap();

        let expected = "{\"result\":\"[[\\\"n0\\\",\\\"n1\\\",\\\"n2\\\"],[\\\"n0\\\",\\\"n1\\\",\\\"n3\\\"],[\\\"n0\\\",\\\"n2\\\",\\\"n3\\\"],[\\\"n1\\\",\\\"n2\\\",\\\"n3\\\"]]\",\"size\":4,\"min\":0,\"quorum_intersection\":true,\"cache_hit\":true}";

        assert_eq!(expected, actual);
    }

    #[wasm_bindgen_test]
    fn test_analyze_minimal_blocking_sets() {

        let faulty_nodes = "[\"n1\"]".to_string();

        let result = analyze_minimal_blocking_sets(TEST_FBAS_JSON.clone(), TEST_ORGS_JSON.clone(), faulty_nodes, MergeBy::DoNotMerge);

        let actual = JSON::stringify(
            &result
        ).unwrap().as_string().unwrap();

        let expected = "{\"result\":\"[[\\\"n0\\\"],[\\\"n2\\\"],[\\\"n3\\\"]]\",\"size\":3,\"min\":1,\"quorum_intersection\":null,\"cache_hit\":false}";

        assert_eq!(expected, actual);
    }
}
