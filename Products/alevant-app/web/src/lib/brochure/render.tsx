// Editorial listing brochure renderer — magazine-tier 8-12 page PDF.
// Inputs: listing record, brand kit, photography URLs, Vesper-generated copy outline.

import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { registerFonts } from "./fonts";
import type { BrandKit, Listing } from "@/lib/types";

registerFonts();

export interface BrochureInputs {
  listing: Listing;
  brand: BrandKit;
  brokerage_name: string;
  agent: { full_name: string; title: string; phone: string; email: string; headshot_url?: string };
  hero_image_url?: string;
  gallery_image_urls?: string[];
  outline: {
    page_1_cover: string;
    page_2_3_hero_spread: string;
    page_4_5_features: string;
    page_6_7_floorplan: string;
    page_8_neighborhood: string;
    page_9_agent_letter: string;
    page_10_back_cover: string;
  };
}

const PAGE_W = 612;  // US Letter portrait at 72dpi (8.5")
const PAGE_H = 792;  // 11"
const MARGIN = 48;

function mkStyles(brand: BrandKit) {
  return StyleSheet.create({
    page: {
      backgroundColor: brand.surface_color,
      color: brand.ink_color,
      fontFamily: "Jost",
      fontSize: 10,
      padding: MARGIN,
    },
    pageDark: {
      backgroundColor: brand.ink_color,
      color: brand.surface_color,
      fontFamily: "Jost",
      fontSize: 10,
      padding: MARGIN,
    },
    eyebrow: {
      fontSize: 8,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: brand.accent_color,
      marginBottom: 12,
    },
    eyebrowMuted: {
      fontSize: 8,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: brand.ink_color,
      opacity: 0.55,
      marginBottom: 12,
    },
    display: {
      fontFamily: "Cormorant Garamond",
      fontWeight: 300,
      fontSize: 46,
      lineHeight: 1.1,
      color: brand.ink_color,
      marginBottom: 16,
    },
    displayItalic: {
      fontFamily: "Cormorant Garamond",
      fontStyle: "italic",
      fontWeight: 300,
      fontSize: 28,
      lineHeight: 1.2,
      color: brand.ink_color,
    },
    h2: {
      fontFamily: "Cormorant Garamond",
      fontWeight: 400,
      fontSize: 22,
      lineHeight: 1.2,
      marginBottom: 14,
    },
    body: {
      fontSize: 11,
      lineHeight: 1.7,
      color: brand.ink_color,
      opacity: 0.85,
      marginBottom: 12,
    },
    rule: {
      width: 48,
      height: 1,
      backgroundColor: brand.accent_color,
      marginVertical: 16,
    },
    coverHeader: {
      position: "absolute",
      top: MARGIN,
      left: MARGIN,
      right: MARGIN,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    coverFooter: {
      position: "absolute",
      bottom: MARGIN,
      left: MARGIN,
      right: MARGIN,
    },
    centerStack: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: MARGIN,
    },
    twoCol: {
      flexDirection: "row",
      gap: 24,
    },
    col: { flex: 1 },
    feature: {
      borderTop: `0.5pt solid ${brand.ink_color}30`,
      paddingTop: 8,
      paddingBottom: 8,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    featureLabel: {
      fontSize: 9,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: brand.ink_color,
      opacity: 0.6,
    },
    featureValue: { fontSize: 11, color: brand.ink_color },
    fullBleed: {
      position: "absolute",
      top: 0,
      left: 0,
      width: PAGE_W,
      height: PAGE_H,
    },
    pageNum: {
      position: "absolute",
      bottom: 24,
      right: MARGIN,
      fontSize: 8,
      letterSpacing: 1.6,
      color: brand.ink_color,
      opacity: 0.45,
    },
    brokerage: {
      position: "absolute",
      bottom: 24,
      left: MARGIN,
      fontSize: 7,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: brand.ink_color,
      opacity: 0.45,
    },
  });
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function ListingBrochure(inputs: BrochureInputs) {
  const { listing, brand, brokerage_name, agent, hero_image_url, gallery_image_urls = [], outline } = inputs;
  const s = mkStyles(brand);

  return (
    <Document title={`${listing.address} — ${brand.wordmark_text || agent.full_name}`}>
      {/* PAGE 1 — Cover */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        {hero_image_url && (
          <Image src={hero_image_url} style={[s.fullBleed, { opacity: 0.92 }]} />
        )}
        <View style={s.coverHeader}>
          <Text style={[s.displayItalic, { fontSize: 22, color: brand.ink_color }]}>
            {brand.wordmark_text || agent.full_name}
          </Text>
          <Text style={s.eyebrowMuted}>Just Listed</Text>
        </View>
        <View style={s.centerStack}>
          <Text style={s.eyebrow}>{listing.city}, {listing.state}</Text>
          <Text style={[s.display, { fontSize: 56, textAlign: "center" }]}>{listing.address}</Text>
          <Text style={[s.displayItalic, { textAlign: "center", marginTop: 12, opacity: 0.75 }]}>
            {listing.beds} bedrooms · {listing.baths} bathrooms · {listing.sqft?.toLocaleString()} sq ft
          </Text>
          <View style={s.rule} />
          <Text style={[s.h2, { color: brand.accent_color, fontSize: 24 }]}>
            {fmtCurrency(Number(listing.price) || 0)}
          </Text>
        </View>
        <View style={s.coverFooter}>
          <Text style={s.eyebrowMuted}>{brand.tagline || ""}</Text>
        </View>
        <Text style={s.brokerage}>Brokered by {brokerage_name}</Text>
      </Page>

      {/* PAGES 2-3 — Hero spread */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        {gallery_image_urls[0] && (
          <Image src={gallery_image_urls[0]} style={s.fullBleed} />
        )}
        <Text style={s.pageNum}>02</Text>
      </Page>
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.eyebrow}>The Property</Text>
        <Text style={s.display}>An Editorial.</Text>
        <View style={s.rule} />
        <Text style={s.body}>{outline.page_2_3_hero_spread}</Text>
        <Text style={s.pageNum}>03</Text>
      </Page>

      {/* PAGES 4-5 — Features */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.eyebrow}>Specifications</Text>
        <Text style={s.display}>The Particulars.</Text>
        <View style={s.rule} />
        <View style={{ marginTop: 12 }}>
          {[
            ["Bedrooms", String(listing.beds || "—")],
            ["Bathrooms", String(listing.baths || "—")],
            ["Living Area", `${listing.sqft?.toLocaleString() || "—"} sq ft`],
            ["Lot Size", listing.lot_sqft ? `${listing.lot_sqft.toLocaleString()} sq ft` : "—"],
            ["Year Built", String(listing.year_built || "—")],
            ["Property Type", String(listing.property_type || "—")],
            ["HOA / Month", listing.hoa_monthly ? fmtCurrency(listing.hoa_monthly) : "—"],
            ["Annual Taxes", listing.taxes_annual ? fmtCurrency(listing.taxes_annual) : "—"],
          ].map(([label, value]) => (
            <View key={label} style={s.feature}>
              <Text style={s.featureLabel}>{label}</Text>
              <Text style={s.featureValue}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={s.pageNum}>04</Text>
      </Page>
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.eyebrow}>Features</Text>
        <Text style={s.display}>What Distinguishes.</Text>
        <View style={s.rule} />
        <Text style={s.body}>{outline.page_4_5_features}</Text>
        <Text style={s.pageNum}>05</Text>
      </Page>

      {/* PAGES 6-7 — Floor plan */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.eyebrow}>Floor Plan</Text>
        <Text style={s.display}>The Architecture.</Text>
        <View style={s.rule} />
        <Text style={s.body}>{outline.page_6_7_floorplan}</Text>
        <Text style={s.pageNum}>06</Text>
      </Page>
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        {gallery_image_urls[1] && <Image src={gallery_image_urls[1]} style={s.fullBleed} />}
        <Text style={s.pageNum}>07</Text>
      </Page>

      {/* PAGE 8 — Neighborhood */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.eyebrow}>The Neighborhood</Text>
        <Text style={s.display}>{listing.city}, {listing.state}.</Text>
        <View style={s.rule} />
        <Text style={s.body}>{outline.page_8_neighborhood}</Text>
        <Text style={s.pageNum}>08</Text>
      </Page>

      {/* PAGE 9 — Agent letter */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <View style={s.twoCol}>
          {agent.headshot_url && (
            <View style={[s.col, { flex: 0.4 }]}>
              <Image src={agent.headshot_url} style={{ width: 160, height: 200, objectFit: "cover" }} />
            </View>
          )}
          <View style={[s.col, { flex: 0.6 }]}>
            <Text style={s.eyebrow}>From the Listing Agent</Text>
            <Text style={s.h2}>{agent.full_name}</Text>
            <Text style={[s.featureLabel, { marginBottom: 16 }]}>{agent.title}</Text>
            <View style={s.rule} />
            <Text style={s.body}>{outline.page_9_agent_letter}</Text>
            <Text style={[s.featureLabel, { marginTop: 16 }]}>
              {agent.phone}  ·  {agent.email}
            </Text>
          </View>
        </View>
        <Text style={s.pageNum}>09</Text>
      </Page>

      {/* PAGE 10 — Back cover */}
      <Page size={[PAGE_W, PAGE_H]} style={s.pageDark}>
        <View style={s.centerStack}>
          <Text
            style={{
              fontFamily: "Cormorant Garamond",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 56,
              color: brand.surface_color,
              textAlign: "center",
            }}
          >
            {brand.wordmark_text || agent.full_name}
          </Text>
          {brand.tagline && (
            <Text
              style={{
                fontFamily: "Cormorant Garamond",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 18,
                color: brand.surface_color,
                opacity: 0.65,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {brand.tagline}
            </Text>
          )}
          <View style={[s.rule, { backgroundColor: brand.accent_color, marginVertical: 32 }]} />
          <Text
            style={{
              fontSize: 8,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: brand.surface_color,
              opacity: 0.55,
              textAlign: "center",
            }}
          >
            Brokered by {brokerage_name}
          </Text>
          <Text
            style={{
              fontSize: 7,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: brand.surface_color,
              opacity: 0.35,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            Powered by ALEVANT · A Tigris Tech Labs Product
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderBrochureBuffer(inputs: BrochureInputs): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(<ListingBrochure {...inputs} />);
  return buf;
}
