import { PlaybookEditor } from "../PlaybookEditor";

export default function NewPlaybookPage() {
  return (
    <div className="px-10 py-12 max-w-5xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Playbooks · New</p>
        <h1 className="serif-display text-ink text-5xl">Craft a cadence.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
          Build a sequence of touches that auto-starts when a contact matches your trigger
          rules. Steps surface on your dashboard each day as "Today's plays."
        </p>
      </header>

      <PlaybookEditor mode="new" />
    </div>
  );
}
