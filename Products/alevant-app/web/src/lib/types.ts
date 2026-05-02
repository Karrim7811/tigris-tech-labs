// ============================================================================
// ALEVANT — Shared types
// ============================================================================

export type WorkspaceStatus = "onboarding" | "active" | "paused" | "terminated";
export type Plan = "pilot" | "agent" | "team" | "brokerage" | "enterprise";

export type VoicePreset = "insider" | "storyteller" | "authority" | "local_legend";
export type ApprovalMode = "gated" | "autonomous" | "hybrid";

export type LeadStage =
  | "inquiry"
  | "pre_qual"
  | "showing"
  | "offer"
  | "under_contract"
  | "closed"
  | "lost";

export type ListingStatus =
  | "draft"
  | "coming_soon"
  | "active"
  | "pending"
  | "under_contract"
  | "sold"
  | "expired"
  | "withdrawn";

export type PropertyType =
  | "condo"
  | "sfh"
  | "townhouse"
  | "mf2_4"
  | "mf5plus"
  | "land"
  | "commercial";

export type PipelineKind = "buyer" | "seller" | "investor" | "rental";

export type SofiaChannel =
  | "voice"
  | "sms"
  | "web_chat"
  | "ig_dm"
  | "x_dm"
  | "tiktok_dm"
  | "linkedin_dm"
  | "whatsapp";

export type VesperChannel =
  | "instagram"
  | "x"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "email"
  | "print"
  | "web";

export type GridSignalStatus = "new" | "queued" | "outreach_sent" | "responded" | "converted" | "dead" | "do_not_contact";

export interface BrandKit {
  id: string;
  primary_color: string;
  secondary_color?: string;
  accent_color: string;
  surface_color: string;
  ink_color: string;
  display_font: string;
  body_font: string;
  logo_url?: string;
  wordmark_text?: string;
  tagline?: string;
  voice_preset: VoicePreset;
  prohibit_stock: boolean;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  status: WorkspaceStatus;
  plan: Plan;
  custom_domain?: string;
  brand_kit_id?: string;
  sofia_config_id?: string;
  vesper_config_id?: string;
  brokerage_id?: string;
  activated_at?: string;
}

export interface Listing {
  id: string;
  workspace_id: string;
  agent_id?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  property_type?: PropertyType;
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_sqft?: number;
  year_built?: number;
  hoa_monthly?: number;
  taxes_annual?: number;
  status: ListingStatus;
  mls_number?: string;
  photos?: { url: string; caption?: string }[];
  description?: string;
  microsite_slug?: string;
  vesper_campaign_status?: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  full_name?: string;
  emails?: string[];
  phones?: string[];
  category?: string;
  relationship_score?: number;
  source?: string;
  notes?: string;
  last_touch_at?: string;
}

export interface GridSignal {
  id: string;
  workspace_id: string;
  property_address: string;
  property_city?: string;
  property_state?: string;
  property_zip?: string;
  owner_name?: string;
  estimated_value?: number;
  estimated_equity?: number;
  years_owned?: number;
  motivation_score: number;
  tenure_score: number;
  equity_score: number;
  distress_score: number;
  life_event_score: number;
  market_score: number;
  is_pre_foreclosure?: boolean;
  is_tax_delinquent?: boolean;
  is_probate?: boolean;
  is_divorce?: boolean;
  is_absentee_owner?: boolean;
  is_vacant?: boolean;
  reasons?: string[];
  reasons_summary?: string;
  status: GridSignalStatus;
  do_not_contact?: boolean;
  on_dnc_registry?: boolean;
}

export interface UnderwriterCMAResult {
  subject_address: string;
  suggested_price: number;
  confidence_low: number;
  confidence_high: number;
  comp_set: Array<{
    address: string;
    sold_price: number;
    sold_date: string;
    sqft: number;
    price_per_sqft: number;
    distance_miles: number;
    similarity_score: number;
  }>;
  market_trend_30d_pct: number;
  market_trend_90d_pct: number;
  days_on_market_median: number;
  absorption_rate_months: number;
  narrative: string;
}

export interface UnderwriterInvestorResult {
  subject_address: string;
  acquisition_price: number;
  noi: number;
  cap_rate_pct: number;
  cash_on_cash_pct: number;
  grm: number;
  dscr: number;
  brrrr: {
    arv: number;
    rehab_cost: number;
    refinance_loan: number;
    cash_remaining: number;
  };
  str_projection?: {
    adr: number;
    occupancy_pct: number;
    monthly_revpar: number;
    annual_revenue: number;
  };
  firpta_flag: boolean;
  exchange_1031_window_days?: number;
  sensitivity: { variable: string; delta: string; result_delta: number }[];
  narrative: string;
}

export interface VesperListingCampaign {
  listing_id: string;
  campaign_id: string;
  assets: VesperAsset[];
  microsite_url?: string;
  status: "generating" | "ready_for_review" | "approved" | "live";
}

export interface VesperAsset {
  id: string;
  asset_type:
    | "film_script"
    | "photo_brief"
    | "microsite"
    | "brochure"
    | "social_post"
    | "email_blast"
    | "mls_description"
    | "press_pitch"
    | "open_house_invite"
    | "buyer_match_message"
    | "neighborhood_report"
    | "whisper_preview";
  channel?: VesperChannel;
  content: Record<string, unknown>;
  visual_urls?: string[];
  status: "queued" | "awaiting_approval" | "approved" | "rejected" | "published";
  fair_housing_lint_passed?: boolean;
}

export interface SofiaConversation {
  id: string;
  workspace_id: string;
  channel: SofiaChannel;
  direction: "inbound" | "outbound";
  status: "live" | "completed" | "escalated";
  qualification_score?: number;
  classification?: { intent: string; urgency: string; asset_class?: string; language?: string };
  caller_name?: string;
  caller_phone?: string;
  duration_seconds?: number;
}
