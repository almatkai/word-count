//! Concrete compiled-in adapter for beta fd300e276356587726566026f072563eb9c34cb1.
//! New module; uses only the existing CoreContext router and sibling V2 SDK.
//! HUD/toast are intentionally presented in supported views. See INTEGRATION.md.
use super::v2_sdk as sdk;
use crate::native_core::common::{CoreContext, CoreResult};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::OnceLock;
use tezbar_word_count::{count, js_trim, Counts};

const COMMANDS: &[&str] = &["count", "count-screenshot", "count-overlay"];
static PROCESS: OnceLock<String> = OnceLock::new();
pub fn commands() -> &'static [&'static str] {
    if cfg!(any(target_os = "macos", target_os = "windows")) {
        COMMANDS
    } else {
        &[]
    }
}
#[derive(Clone, Serialize, Deserialize)]
struct Session {
    process: String,
    token: String,
    command: String,
    text: String,
    include_whitespace: bool,
    counts: Counts,
    notice: String,
    error: bool,
}
impl Session {
    fn id(&self, action: &str) -> String {
        format!("word-count:{}:{}:{action}", self.process, self.token)
    }
    fn action(&self, action: &str, title: &str) -> Value {
        json!({"id":self.id(action),"title":title,"kind":"action"})
    }
}
fn process() -> &'static str {
    PROCESS.get_or_init(|| uuid::Uuid::new_v4().to_string())
}
fn validate_launch(payload: &Value) -> Result<(), String> {
    if !payload.is_object() {
        return Err("Invalid Word Count launch payload.".into());
    }
    if let Some(arguments) = payload.get("argumentValues") {
        if !arguments.as_object().is_some_and(|a| a.is_empty()) {
            return Err("Word Count does not declare launch arguments.".into());
        }
    }
    if payload.get("preferences").is_some_and(|p| !p.is_object()) {
        return Err("Invalid Word Count preferences payload.".into());
    }
    Ok(())
}
// Reads are values, not effect acknowledgements. Never coerce null/object/boolean to text.
async fn clipboard(ctx: &CoreContext) -> Result<String, String> {
    ctx.request("clipboard:read", vec![])
        .await
        .map_err(|_| {
            "Unable to read clipboard text. Retry when the clipboard is available.".to_string()
        })?
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| "Clipboard returned an invalid text response.".into())
}
async fn source(ctx: &CoreContext, command: &str) -> Result<(String, String), String> {
    let mut notices = Vec::new();
    if command != "count-screenshot" {
        // The own utility catches selection transport errors and falls back.
        if let Ok(value) = ctx.request("core:platform:selected-text", vec![]).await {
            let selected = value
                .as_str()
                .ok_or("Selection returned an invalid text response.")?;
            if command == "count" && !selected.is_empty() {
                notices.push("Text loaded from selected text");
            }
            // Source tests truthiness before trim, then caller tests trimmed truthiness.
            let trimmed = js_trim(selected);
            if !trimmed.is_empty() {
                return Ok((trimmed.into(), notices.join(" · ")));
            }
        }
    }
    let raw = clipboard(ctx).await?;
    if command == "count" && !raw.is_empty() {
        notices.push("Text loaded from clipboard");
    }
    Ok((js_trim(&raw).into(), notices.join(" · ")))
}
async fn load(ctx: &CoreContext, session: &mut Session) {
    // Source acquisition is complete before committing a new computation. Retry never
    // clears a previously computed result on a read error, and nothing is auto-retried.
    match source(ctx, &session.command)
        .await
        .and_then(|(text, notice)| {
            count(&text, session.include_whitespace).map(|counts| (text, notice, counts))
        }) {
        Ok((text, notice, counts)) => {
            session.text = text;
            session.notice = notice;
            session.counts = counts;
            session.error = false;
        }
        Err(error) => {
            session.error = true;
            session.notice = error;
        }
    }
}
fn render(s: &Session, text_value: bool, whitespace_value: bool) -> Value {
    if s.error {
        return sdk::view(
            "Word Count",
            json!({"type":"Detail","props":{"markdown":format!("# Unable to count\n\n{}",s.notice)}}),
            vec![s.action("retry", "Retry Reading Text")],
        );
    }
    if s.command == "count" {
        let mut text = json!({"id":"text","title":"Text to Count","placeholder":"Start typing...","actionId":s.id("text")});
        let mut whitespace = json!({"id":"include-whitespace","title":"Options","label":"Include whitespace in character count","actionId":s.id("whitespace")});
        if text_value {
            text["value"] = json!(s.text);
        }
        if whitespace_value {
            whitespace["value"] = json!(s.include_whitespace);
        }
        let mut children =
            vec![json!({"type":"Form.Description","props":{"text":s.counts.form_description()}})];
        if !s.notice.is_empty() {
            children.push(json!({"type":"Form.Description","props":{"text":format!("{} · Use Clear Text in Actions to reset",s.notice)}}));
        }
        children.extend([
            json!({"type":"Form.TextArea","props":text}),
            json!({"type":"Form.Checkbox","props":whitespace}),
        ]);
        let mut toggle = s.action("toggle", "Toggle Whitespace");
        toggle["shortcut"] = json!({"modifiers":["cmd"],"key":"t"});
        let mut clear = s.action("clear", "Clear Text");
        clear["shortcut"] = json!({"modifiers":["cmd"],"key":"e"});
        sdk::view(
            "Word Count",
            json!({"type":"Form","props":{},"children":children}),
            vec![toggle, clear],
        )
    } else {
        let message = if s.command == "count-overlay" {
            format!("Word Count: {}", s.counts.words)
        } else if s.text.is_empty() {
            "Nothing to count in the clipboard".into()
        } else {
            s.counts.clipboard_description()
        };
        // No fake overlay/hud routes, no no-view assertion that an overlay was shown.
        sdk::view(
            "Word Count",
            json!({"type":"Form","props":{},"children":[{"type":"Form.Description","props":{"text":message}}]}),
            vec![],
        )
    }
}
fn full_form(payload: &Value, s: &mut Session) -> Result<(), String> {
    if let Some(form) = payload.get("formValues") {
        let form = form.as_object().ok_or("Invalid form values.")?;
        if form.len() != 2 || !form.contains_key("text") || !form.contains_key("include-whitespace")
        {
            return Err("Submit the complete Word Count form.".into());
        }
        s.text = form["text"]
            .as_str()
            .ok_or("Text must be a string.")?
            .into();
        s.include_whitespace = form["include-whitespace"]
            .as_bool()
            .ok_or("Whitespace must be a boolean.")?;
    }
    Ok(())
}
fn field(payload: &Value) -> Result<&Value, String> {
    let form = payload["formValues"]
        .as_object()
        .ok_or("Invalid field callback.")?;
    if form.len() != 1 {
        return Err("Invalid field callback.".into());
    }
    form.get("value")
        .ok_or_else(|| "Missing field value.".into())
}
pub async fn handle(
    ctx: &CoreContext,
    command: &str,
    operation: &str,
    payload: &Value,
    state: &mut Value,
) -> CoreResult {
    if !COMMANDS.contains(&command) {
        return Err("Unknown Word Count command.".into());
    }
    if operation == "extension:dispose-session" {
        *state = Value::Null;
        return Ok(sdk::unchanged());
    }
    if operation == "extension:run-command" {
        validate_launch(payload)?;
        let mut s = Session {
            process: process().into(),
            token: uuid::Uuid::new_v4().to_string(),
            command: command.into(),
            text: String::new(),
            include_whitespace: true,
            counts: Counts::default(),
            notice: String::new(),
            error: false,
        };
        load(ctx, &mut s).await;
        let view = render(&s, true, true);
        *state = serde_json::to_value(s).map_err(|_| "Cannot create Word Count session.")?;
        return Ok(view);
    }
    let mut s: Session = serde_json::from_value(state.clone())
        .map_err(|_| "Word Count session expired; reopen it.")?;
    if s.process != process() || s.command != command {
        return Err("Word Count session expired; reopen it.".into());
    }
    match operation {
        // These operations must not allocate capabilities or mutate a clone that the
        // host may discard. Search has no role in the source's Form UI.
        "extension:refresh-session" | "extension:search-text-changed" | "extension:load-more" => {
            return Ok(sdk::unchanged())
        }
        "extension:invoke-action" => {}
        _ => return Err("Unsupported Word Count operation.".into()),
    }
    let id = payload["actionId"]
        .as_str()
        .ok_or("Missing Word Count action.")?;
    let mut text_value = false;
    let mut whitespace_value = false;
    if s.error {
        if id != s.id("retry") || payload.get("formValues").is_some() {
            return Err("Invalid Word Count retry action.".into());
        }
        load(ctx, &mut s).await;
        text_value = true;
        whitespace_value = true;
    } else if s.command == "count" {
        if id == s.id("text") {
            s.text = field(payload)?
                .as_str()
                .ok_or("Text must be a string.")?
                .into();
        } else if id == s.id("whitespace") {
            s.include_whitespace = field(payload)?
                .as_bool()
                .ok_or("Whitespace must be a boolean.")?;
        } else if id == s.id("toggle") {
            full_form(payload, &mut s)?;
            s.include_whitespace = !s.include_whitespace;
            whitespace_value = true;
        } else if id == s.id("clear") {
            full_form(payload, &mut s)?;
            s.text.clear();
            text_value = true;
        } else {
            return Err("Invalid or stale Word Count action.".into());
        }
        s.counts = count(&s.text, s.include_whitespace)?;
        s.notice.clear();
    } else {
        return Err("Invalid or stale Word Count action.".into());
    }
    let view = render(&s, text_value, whitespace_value);
    *state = serde_json::to_value(s).map_err(|_| "Cannot save Word Count session.")?;
    Ok(view)
}
