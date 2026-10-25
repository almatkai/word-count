use serde_json::{json, Value};
use std::io::{self, BufRead};
fn main() {
    for line in io::stdin().lock().lines() {
        let value: Value = serde_json::from_str(&line.unwrap()).unwrap();
        let units: Vec<u16> = value["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|n| u16::try_from(n.as_u64().unwrap()).unwrap())
            .collect();
        let c =
            tezbar_word_count::count_utf16(&units, value["includeWhitespace"].as_bool().unwrap())
                .unwrap();
        println!(
            "{}",
            json!({"counts":c,"form":c.form_description(),"clipboard":c.clipboard_description()})
        );
    }
}
