import { CommsSettingsClient } from "./CommsSettingsClient";

export const dynamic = "force-dynamic";

export default function CommsSettingsPage() {
  return (
    <div className="px-10 py-12 max-w-3xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Settings · Communications</p>
        <h1 className="serif-display text-ink text-5xl">Auto-log mode.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-2xl">
          Choose how aggressively ALEVANT writes activity to your contacts' timelines.
          Full-auto wires Gmail, Twilio, Sofia, and Vesper to log every email, text,
          call, and outreach automatically. Sofia-only keeps things conservative — your
          AI personas still log, but Gmail and Twilio require manual capture.
        </p>
      </header>

      <CommsSettingsClient />
    </div>
  );
}
