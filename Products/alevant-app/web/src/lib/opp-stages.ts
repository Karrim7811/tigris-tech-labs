// Opportunity stages — RE-specific, separate from PRAIX insurance stages.

export const BUYER_STAGES = ["qualified", "showing", "offer_submitted", "won", "lost"] as const;
export const SELLER_STAGES = [
  "qualified",
  "listing_appointment",
  "listed",
  "offer_received",
  "won",
  "lost",
] as const;

export type OppSide = "buyer" | "seller" | "both";
export type OppStage =
  | "qualified"
  | "showing"
  | "offer_submitted"
  | "listing_appointment"
  | "listed"
  | "offer_received"
  | "won"
  | "lost";

export const STAGE_LABEL: Record<OppStage, string> = {
  qualified: "Qualified",
  showing: "Showing",
  offer_submitted: "Offer Submitted",
  listing_appointment: "Listing Appointment",
  listed: "Listed",
  offer_received: "Offer Received",
  won: "Won",
  lost: "Lost",
};

export const STAGE_PROBABILITY: Record<OppStage, number> = {
  qualified: 25,
  showing: 40,
  offer_submitted: 65,
  listing_appointment: 35,
  listed: 50,
  offer_received: 70,
  won: 100,
  lost: 0,
};

export function stagesForSide(side: OppSide): readonly OppStage[] {
  if (side === "buyer") return BUYER_STAGES;
  if (side === "seller") return SELLER_STAGES;
  // both: union, preserving a sensible reading order
  return [
    "qualified",
    "showing",
    "offer_submitted",
    "listing_appointment",
    "listed",
    "offer_received",
    "won",
    "lost",
  ] as const;
}

export function isOpenStage(s: OppStage): boolean {
  return s !== "won" && s !== "lost";
}
