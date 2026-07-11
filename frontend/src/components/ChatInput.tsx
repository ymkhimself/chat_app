import { useState } from "react";

export default function ChatInput({ disabled, error, isStreaming, onSend, onStop }: { disabled: boolean; error?: string; isStreaming: boolean; onSend: (text: string) => void; onStop: () => void }) {
  const [value, setValue] = useState("");
  const submit = () => { if (value.trim() && !disabled) { onSend(value); setValue(""); } };
  return (
    <form className="composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="composer-row">
        <textarea value={value} disabled={disabled} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Message the assistant..." rows={1} aria-label="Message" />
        {isStreaming ? <button className="send-button stop-button" type="button" onClick={onStop}>Stop</button> : <button className="send-button" type="submit" disabled={!value.trim()}>Send <span aria-hidden="true">↗</span></button>}
      </div>
      <p className="composer-hint">Press Enter to send · Shift + Enter for a new line</p>
    </form>
  );
}
