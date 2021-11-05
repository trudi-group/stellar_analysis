use fbas_analyzer::*;
use wasm_bindgen::prelude::*;
use web_sys::console;

use std::collections::HashMap;
use std::sync::Mutex;

#[macro_use]
extern crate lazy_static;

#[macro_use]
extern crate serde_derive;

lazy_static! {
    static ref ANALYSIS_CACHE: Mutex<HashMap<Fbas, Analysis>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

macro_rules! get_analysis_object {
    ($fbas:expr, $cache:expr) => {{
        let fbas = $fbas;
        let cache = $cache;
        let mut cache_hit = false;
        if !cache.contains_key(&fbas) {
            console::log_1(&"lib: Creating new analysis object.".into());
            cache.insert(fbas.clone(), Analysis::new(fbas));
        } else {
            console::log_1(
                &"lib: Reusing existing analysis object (might have cached results).".into(),
            );
            cache_hit = true;
        }
        (cache.get(fbas).unwrap(), cache_hit)
    }};
}

macro_rules! maybe_merge {
    ($result:expr, $groupings:expr) => {{
        if let Some(groupings) = $groupings {
            $result.merged_by_group(&groupings)
        } else {
            $result
        }
    }};
}

#[derive(Serialize, Default)]
/// Used for mqs, mss, mbs
struct SetsReport {
    result: Vec<Vec<String>>,
    size: usize,
    min: usize,
    /// only for mqs
    quorum_intersection: Option<bool>,
}

#[derive(Serialize, Default)]
struct TopTierReport {
    top_tier: Vec<String>,
    top_tier_size: usize,
    cache_hit: bool,
}

#[derive(Serialize, Default)]
struct SymmetricTopTierReport {
    symmetric_top_tier: Option<PrettyQuorumSet>,
}

#[wasm_bindgen]
#[derive(PartialEq, Clone, Copy)]
pub enum MergeBy {
    DoNotMerge,
    Orgs,
    ISPs,
    Countries,
}

#[wasm_bindgen]
pub fn analyze_minimal_quorums(json_fbas: String, json_orgs: String, merge_by: MergeBy) -> JsValue {
    let fbas = get_filtered_standard_form_fbas(&json_fbas);
    let groupings = get_groupings_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, _) = get_analysis_object!(&fbas, cache);

    let mqs = maybe_merge!(analysis.minimal_quorums(), &groupings).minimal_sets();
    let qi = analysis.has_quorum_intersection();

    let results = SetsReport {
        size: mqs.len(),
        min: mqs.min(),
        result: mqs.into_pretty_vec_vec(&fbas, groupings.as_ref()),
        quorum_intersection: Some(qi),
    };
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn analyze_minimal_blocking_sets(
    json_fbas: String,
    json_orgs: String,
    faulty_nodes: String,
    merge_by: MergeBy,
) -> JsValue {
    let fbas = get_filtered_standard_form_fbas(&json_fbas);
    let groupings = get_groupings_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, _) = get_analysis_object!(&fbas, cache);

    let inactive_nodes: Vec<String> = serde_json::from_str(&faulty_nodes).unwrap();

    let mbs_without_faulty_unmerged =
        analysis
            .minimal_blocking_sets()
            .without_nodes_pretty(&inactive_nodes, &fbas, None);
    let mbs_without_faulty = maybe_merge!(mbs_without_faulty_unmerged, &groupings).minimal_sets();

    let results = SetsReport {
        size: mbs_without_faulty.len(),
        min: mbs_without_faulty.min(),
        result: mbs_without_faulty.into_pretty_vec_vec(&fbas, groupings.as_ref()),
        quorum_intersection: None,
    };
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn analyze_minimal_splitting_sets(
    json_fbas: String,
    json_orgs: String,
    merge_by: MergeBy,
) -> JsValue {
    let fbas = get_filtered_standard_form_fbas(&json_fbas);
    let groupings = get_groupings_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, _) = get_analysis_object!(&fbas, cache);

    let mss = maybe_merge!(analysis.minimal_splitting_sets(), &groupings).minimal_sets();

    let results = SetsReport {
        size: mss.len(),
        min: mss.min(),
        result: mss.into_pretty_vec_vec(&fbas, groupings.as_ref()),
        quorum_intersection: None,
    };
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn analyze_top_tier(json_fbas: String, json_orgs: String, merge_by: MergeBy) -> JsValue {
    let fbas = get_filtered_standard_form_fbas(&json_fbas);
    let groupings = get_groupings_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, cache_hit) = get_analysis_object!(&fbas, cache);

    let tt = maybe_merge!(analysis.top_tier(), &groupings);

    let results = TopTierReport {
        top_tier_size: tt.len(),
        top_tier: tt.into_pretty_vec(&fbas, groupings.as_ref()),
        cache_hit,
    };
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn analyze_symmetric_top_tier(
    json_fbas: String,
    json_orgs: String,
    merge_by: MergeBy,
) -> JsValue {
    let fbas = get_filtered_standard_form_fbas(&json_fbas);
    let groupings = get_groupings_to_merge_by(&fbas, json_fbas, json_orgs, merge_by);
    let cache = &mut ANALYSIS_CACHE.lock().unwrap();
    let (analysis, _) = get_analysis_object!(&fbas, cache);

    let symmetric_top_tier = analysis
        .symmetric_top_tier()
        .map(|qset| qset.into_pretty_quorum_set(&fbas, groupings.as_ref()));

    let results = SymmetricTopTierReport { symmetric_top_tier };
    JsValue::from_serde(&results).unwrap()
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

fn get_filtered_standard_form_fbas(json_fbas: &str) -> Fbas {
    let fbas = Fbas::from_json_str(json_fbas);
    let inactive_nodes = FilteredNodes::from_json_str(json_fbas, |v| v["active"] == false);
    let fbas = fbas.without_nodes_pretty(&inactive_nodes.into_pretty_vec());
    let fbas = fbas.without_nodes(&fbas.one_node_quorums());
    fbas.to_standard_form()
}

fn get_groupings_to_merge_by(
    fbas: &Fbas,
    json_fbas: String,
    json_orgs: String,
    merge_by: MergeBy,
) -> Option<Groupings> {
    match merge_by {
        MergeBy::Orgs => Some(Groupings::organizations_from_json_str(&json_orgs, fbas)),
        MergeBy::ISPs => Some(Groupings::isps_from_json_str(&json_fbas, fbas)),
        MergeBy::Countries => Some(Groupings::countries_from_json_str(&json_fbas, fbas)),
        MergeBy::DoNotMerge => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use js_sys::JSON;
    use wasm_bindgen_test::*;

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
                "quorumSet": { "threshold": 3, "validators": ["n0", "n1", "n2", "n3", "n4"] }
            },
            {
                "publicKey": "n4",
                "quorumSet": { "threshold": 2, "validators": ["n3", "n4"] },
                "active": false
            },
            {
                "publicKey": "n5",
                "quorumSet": { "threshold": 1, "validators": ["n5"] }
            }
        ]"#
        .to_string();
        static ref TEST_ORGS_JSON: String = r#"[
            {
                "name": "Team Even",
                "validators": [ "n0", "n2" ]
            },
            {
                "name": "Team Odd",
                "validators": [ "n1", "n3" ]
            }
            ]"#
        .to_string();
    }

    #[wasm_bindgen_test]
    fn test_analyze_minimal_quorums() {
        let result = analyze_minimal_quorums(
            TEST_FBAS_JSON.clone(),
            TEST_ORGS_JSON.clone(),
            MergeBy::DoNotMerge,
        );

        let actual = JSON::stringify(&result).unwrap().as_string().unwrap();

        let expected = "{\"result\":[[\"n0\",\"n1\",\"n2\"],[\"n0\",\"n1\",\"n3\"],[\"n0\",\"n2\",\"n3\"],[\"n1\",\"n2\",\"n3\"]],\"size\":4,\"min\":3,\"quorum_intersection\":true}";

        assert_eq!(expected, actual);
    }

    #[wasm_bindgen_test]
    fn test_analyze_minimal_blocking_sets() {
        let faulty_nodes = "[\"n1\"]".to_string();

        let result = analyze_minimal_blocking_sets(
            TEST_FBAS_JSON.clone(),
            TEST_ORGS_JSON.clone(),
            faulty_nodes,
            MergeBy::DoNotMerge,
        );

        let actual = JSON::stringify(&result).unwrap().as_string().unwrap();

        let expected = "{\"result\":[[\"n0\"],[\"n2\"],[\"n3\"]],\"size\":3,\"min\":1,\"quorum_intersection\":null}";

        assert_eq!(expected, actual);
    }

    #[wasm_bindgen_test]
    fn test_analyze_minimal_splitting_sets() {
        let result = analyze_minimal_splitting_sets(
            TEST_FBAS_JSON.clone(),
            TEST_ORGS_JSON.clone(),
            MergeBy::Orgs,
        );

        let actual = JSON::stringify(&result).unwrap().as_string().unwrap();

        let expected = "{\"result\":[[\"Team Even\"],[\"Team Odd\"]],\"size\":2,\"min\":1,\"quorum_intersection\":null}";

        assert_eq!(expected, actual);
    }

    #[wasm_bindgen_test]
    fn test_analyze_top_tier() {
        let result = analyze_top_tier(
            TEST_FBAS_JSON.clone(),
            TEST_ORGS_JSON.clone(),
            MergeBy::DoNotMerge,
        );

        let actual = JSON::stringify(&result).unwrap().as_string().unwrap();

        let expected =
            "{\"top_tier\":[\"n0\",\"n1\",\"n2\",\"n3\"],\"top_tier_size\":4,\"cache_hit\":true}";

        assert_eq!(expected, actual);
    }

    #[wasm_bindgen_test]
    fn test_analyze_symmetric_top_tier() {
        let result = analyze_symmetric_top_tier(
            TEST_FBAS_JSON.clone(),
            TEST_ORGS_JSON.clone(),
            MergeBy::DoNotMerge,
        );

        let actual = JSON::stringify(&result).unwrap().as_string().unwrap();

        let expected = "{\"symmetric_top_tier\":{\"threshold\":3,\"validators\":[\"n0\",\"n1\",\"n2\",\"n3\"]}}";

        assert_eq!(expected, actual);
    }
}
