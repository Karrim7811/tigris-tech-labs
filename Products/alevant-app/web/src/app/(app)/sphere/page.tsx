import { Heart, MessageCircle, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SIGNALS = [
  { id: "s1", contact: "Maria Delgado", signal: "3-year close anniversary · building +22%", suggested: "Free valuation update + soft refi conversation.", priority: "high" },
  { id: "s2", contact: "Carlos & Andrea Pereira", signal: "Just announced baby on LinkedIn", suggested: "Handwritten card today. Valuation update in 90 days.", priority: "high" },
  { id: "s3", contact: "Renato Torres", signal: "LinkedIn job change → Director at JPM Miami", suggested: "Congratulations text + investor opportunity intro.", priority: "high" },
  { id: "s4", contact: "Beatriz Nogueira", signal: "Birthday tomorrow", suggested: "Personal text + dinner reservation suggestion.", priority: "medium" },
  { id: "s5", contact: "Capital Holdings LLC", signal: "Permit pulled 1450 NW 7th — new construction", suggested: "Off-market opportunity intro for portfolio.", priority: "medium" },
];

export default function SpherePage() {
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Sphere Brain</p>
        <h1 className="serif-display text-ink text-5xl">Today's right calls.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
          LinkedIn changes, public records, life events, anniversaries, equity-position alerts — fused into a daily list of contacts who should hear from you today, with a drafted opening message.
        </p>
      </header>

      <section className="space-y-4">
        {SIGNALS.map((s) => (
          <div key={s.id} className="border border-mist bg-parchment p-6 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Heart className={`w-4 h-4 ${s.priority === "high" ? "text-hot" : "text-stone"}`} />
                <p className="serif-display text-ink text-2xl">{s.contact}</p>
                <Badge tone={s.priority === "high" ? "hot" : "neutral"}>{s.priority}</Badge>
              </div>
              <p className="text-sm text-smoke leading-relaxed mb-2">
                <strong className="text-ink">Signal: </strong> {s.signal}
              </p>
              <p className="text-sm text-smoke leading-relaxed">
                <strong className="text-ink">Suggested: </strong> {s.suggested}
              </p>
            </div>
            <div className="space-y-2">
              <button className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep"><Phone className="w-3 h-3 mr-2" /> Open call</button>
              <button className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist"><MessageCircle className="w-3 h-3 mr-2" /> Send text</button>
              <button className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist"><Mail className="w-3 h-3 mr-2" /> Send card</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
