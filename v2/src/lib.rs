//! Port of the exact own Countable-derived implementation. See NOTICES.md.
//! Character decoding uses scalar pairs; word and sentence rules use UTF-16 units.
use serde::{Deserialize, Serialize};

/// Explicit limit, checked before counting. Input is never truncated.
pub const MAX_UTF16_UNITS: usize = 1_048_576;
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Counts {
    pub paragraphs: usize,
    pub sentences: usize,
    pub words: usize,
    pub reading_time: usize,
    pub speaking_time: usize,
    pub characters: usize,
}
/// ECMAScript WhiteSpace + LineTerminator, intentionally unlike Rust is_whitespace.
pub fn js_whitespace(c: u16) -> bool {
    matches!(c, 0x0009..=0x000d | 0x0020 | 0x00a0 | 0x1680 | 0x2000..=0x200a | 0x2028 | 0x2029 | 0x202f | 0x205f | 0x3000 | 0xfeff)
}
pub fn js_trim(s: &str) -> &str {
    s.trim_matches(|c: char| u16::try_from(u32::from(c)).is_ok_and(js_whitespace))
}
fn cjk(c: u16) -> bool {
    // Source charCodeAt cannot reach its supplementary ranges. Preserve that behavior.
    matches!(c, 0x4e00..=0x9fff | 0x3040..=0x30ff | 0xac00..=0xd7af | 0x3400..=0x4dbf | 0xf900..=0xfaff)
}
fn cjk_punctuation(c: u16) -> bool {
    matches!(c, 0x3000..=0x303f | 0xff01..=0xff0f | 0xff1a..=0xff20 | 0xff3b..=0xff40 | 0xff5b..=0xff65 | 0xfe30..=0xfe4f)
}
fn western_punctuation(c: u16) -> bool {
    matches!(
        c,
        0x27 | 0x22 | 0x3b | 0x3a | 0x2c | 0x2e | 0x3f | 0xbf | 0x2d | 0x21 | 0xa1
    )
}
fn sentence_punctuation(c: u16) -> bool {
    matches!(c, 0x2e | 0x3f | 0x21 | 0x2026)
}
fn line_terminator(c: u16) -> bool {
    matches!(c, 0x0a | 0x0d | 0x2028 | 0x2029)
}
fn decoded_length(units: &[u16]) -> usize {
    let mut i = 0;
    let mut length = 0;
    while i < units.len() {
        let paired = (0xd800..=0xdbff).contains(&units[i])
            && units
                .get(i + 1)
                .is_some_and(|c| (0xdc00..=0xdfff).contains(c));
        i += if paired { 2 } else { 1 };
        length += 1;
    }
    length
}
/// Also accepts lone surrogates for oracle parity; JSON host strings are valid UTF-8.
pub fn count_utf16(text: &[u16], include_whitespace: bool) -> Result<Counts, String> {
    if text.len() > MAX_UTF16_UNITS {
        return Err(
            "Text exceeds the 1,048,576 UTF-16 code-unit limit; nothing was truncated.".into(),
        );
    }
    let begin = text
        .iter()
        .position(|c| !js_whitespace(*c))
        .unwrap_or(text.len());
    let end = text
        .iter()
        .rposition(|c| !js_whitespace(*c))
        .map_or(begin, |i| i + 1);
    let trimmed = &text[begin..end];
    let mut result = Counts::default();
    let mut non_cjk = false;
    for &c in trimmed {
        if western_punctuation(c) {
            continue;
        }
        if js_whitespace(c) || cjk_punctuation(c) || cjk(c) {
            result.words += usize::from(non_cjk);
            non_cjk = false;
            result.words += usize::from(cjk(c));
        } else {
            non_cjk = true;
        }
    }
    result.words += usize::from(non_cjk);
    if !trimmed.is_empty() {
        result.paragraphs = 1;
        let mut lf = false;
        for &c in trimmed {
            if c == 10 && !lf {
                result.paragraphs += 1;
            }
            lf = c == 10;
        }
        // Exact /[.?!…]+./g, including greedy backtracking and JS dot line exclusions.
        result.sentences = 1;
        let mut i = 0;
        while i < trimmed.len() {
            if !sentence_punctuation(trimmed[i]) {
                i += 1;
                continue;
            }
            let start = i;
            while i < trimmed.len() && sentence_punctuation(trimmed[i]) {
                i += 1;
            }
            if i < trimmed.len() && !line_terminator(trimmed[i]) {
                result.sentences += 1;
                i += 1;
            } else if i - start >= 2 {
                result.sentences += 1;
            }
        }
    }
    result.characters = if include_whitespace {
        decoded_length(text)
    } else {
        decoded_length(
            &trimmed
                .iter()
                .copied()
                .filter(|c| !js_whitespace(*c))
                .collect::<Vec<_>>(),
        )
    };
    result.reading_time = result.words.div_ceil(275);
    result.speaking_time = result.words.div_ceil(180);
    Ok(result)
}
pub fn count(text: &str, include_whitespace: bool) -> Result<Counts, String> {
    if text.len() > MAX_UTF16_UNITS * 4 {
        return Err("Text exceeds the input resource limit; nothing was truncated.".into());
    }
    count_utf16(&text.encode_utf16().collect::<Vec<_>>(), include_whitespace)
}
impl Counts {
    pub fn form_description(&self) -> String {
        format!("{} characters · {} words \n{} sentences · {} paragraphs \n{} minutes to read · {} minutes to speak", self.characters, self.words, self.sentences, self.paragraphs, self.reading_time, self.speaking_time)
    }
    /// Locale pinned to en-US in the concrete adaptation (see INTEGRATION).
    pub fn clipboard_description(&self) -> String {
        fn number(n: usize) -> String {
            let digits = n.to_string();
            let mut s = String::new();
            for (i, c) in digits.chars().enumerate() {
                if i > 0 && (digits.len() - i) % 3 == 0 {
                    s.push(',');
                }
                s.push(c);
            }
            s
        }
        [
            (self.characters, "char", "chars"),
            (self.words, "word", "words"),
            (self.sentences, "sentence", "sentences"),
            (self.paragraphs, "paragraph", "paragraphs"),
        ]
        .map(|(n, one, many)| format!("{} {}", number(n), if n == 1 { one } else { many }))
        .join(" · ")
    }
}
