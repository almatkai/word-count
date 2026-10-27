use tezbar_word_count::{count, count_utf16, js_trim, MAX_UTF16_UNITS};
#[test]
fn source_quirks_not_language_segmentation() {
    assert_eq!(count("can't foo-bar", true).unwrap().words, 2);
    assert_eq!(count("pre你好post", true).unwrap().words, 4);
    assert_eq!(count("𠀀𠀁", true).unwrap().words, 1); // charCodeAt bug preserved
    assert_eq!(count("👨‍👩‍👦 e\u{301}", true).unwrap().characters, 8); // not graphemes
    assert_eq!(count("a\r\n\r\nb", true).unwrap().paragraphs, 3); // LF runs separated by CR
    assert_eq!(count("a...", true).unwrap().sentences, 2); // greedy backtrack
    assert_eq!(count("a.\nb", true).unwrap().sentences, 1);
    assert_eq!(
        count("\u{feff}a\u{85}b\u{feff}", false).unwrap().characters,
        3
    );
    assert_eq!(js_trim("\u{feff}\t a \u{feff}"), "a");
    assert_eq!(
        count_utf16(&[0xd800, 0xd800, 0xdc00], true)
            .unwrap()
            .characters,
        2
    );
}
#[test]
fn limits_and_rounding() {
    for words in [0, 1, 179, 180, 181, 274, 275, 276, 549, 550, 551] {
        let text = vec!["x"; words].join(" ");
        let c = count(&text, true).unwrap();
        assert_eq!(c.reading_time, words.div_ceil(275));
        assert_eq!(c.speaking_time, words.div_ceil(180));
    }
    assert_eq!(
        count(&"x".repeat(MAX_UTF16_UNITS), true)
            .unwrap()
            .characters,
        MAX_UTF16_UNITS
    );
    assert!(count(&"x".repeat(MAX_UTF16_UNITS + 1), true)
        .unwrap_err()
        .contains("nothing was truncated"));
    assert!(count_utf16(&vec![0; MAX_UTF16_UNITS + 1], true).is_err());
}
