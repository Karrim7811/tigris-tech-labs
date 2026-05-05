import SlideCover from "./SlideCover";
import SlideSpeakers from "./SlideSpeakers";
import SlidePosture from "./SlidePosture";
import SlideAonGlance from "./SlideAonGlance";
import SlideQualified from "./SlideQualified";
import SlideNationalBroking from "./SlideNationalBroking";
import SlideCarrierWall from "./SlideCarrierWall";
import SlideACT from "./SlideACT";
import SlideServiceOffering from "./SlideServiceOffering";
import SlideDayToDay from "./SlideDayToDay";
import SlideAGRC from "./SlideAGRC";
import SlideDigitalProperty from "./SlideDigitalProperty";
import SlideManuscriptForm from "./SlideManuscriptForm";
import SlideRapidResponse from "./SlideRapidResponse";
import SlideRenewalTimeline from "./SlideRenewalTimeline";
import SlideCasualtyDO from "./SlideCasualtyDO";
import SlideMarketReport from "./SlideMarketReport";
import SlideStormHistory from "./SlideStormHistory";
import SlideClimateContext from "./SlideClimateContext";
import SlidePredictiveLayer from "./SlidePredictiveLayer";
import SlidePortfolioMap from "./SlidePortfolioMap";
import SlideReward from "./SlideReward";
import SlidePenalize from "./SlidePenalize";
import SlideIgnore from "./SlideIgnore";
import SlideControl from "./SlideControl";
import SlideClose from "./SlideClose";
import SlideQA from "./SlideQA";

export const slides = [
  { id: "cover",          title: "Cover",                    component: SlideCover },
  { id: "speakers",       title: "Your Aon team",            component: SlideSpeakers },
  { id: "posture",        title: "Agenda",                   component: SlidePosture },
  { id: "glance",         title: "Aon at a glance",          component: SlideAonGlance },
  { id: "qualified",      title: "Real estate scale",        component: SlideQualified },
  { id: "national",       title: "National property broking", component: SlideNationalBroking },
  { id: "carriers",       title: "Markets we touch",         component: SlideCarrierWall },
  { id: "act",            title: "Aon Client Treaty",        component: SlideACT },
  { id: "service",        title: "Service offering",         component: SlideServiceOffering },
  { id: "daytoday",       title: "Your day-to-day",          component: SlideDayToDay },
  { id: "agrc",           title: "Aon Global Risk Consulting", component: SlideAGRC },
  { id: "digital",        title: "Digital Property Profile", component: SlideDigitalProperty },
  { id: "manuscript",     title: "Aon Manuscript Form",      component: SlideManuscriptForm },
  { id: "rapid",          title: "Aon Rapid Response",       component: SlideRapidResponse },
  { id: "timeline",       title: "Renewal timeline",         component: SlideRenewalTimeline },
  { id: "casualty",       title: "Casualty & D&O",           component: SlideCasualtyDO },
  { id: "market",         title: "P&C Market 2026",          component: SlideMarketReport },
  { id: "storms",         title: "70 years of storms",       component: SlideStormHistory },
  { id: "climate",        title: "2026 Atlantic outlook",    component: SlideClimateContext },
  { id: "predictive",     title: "Predictive AI Layer",      component: SlidePredictiveLayer },
  { id: "portfolio",      title: "Your building",            component: SlidePortfolioMap },
  { id: "reward",         title: "Framework — Reward",       component: SlideReward },
  { id: "penalize",       title: "Framework — Penalize",     component: SlidePenalize },
  { id: "ignore",         title: "Framework — Ignore",       component: SlideIgnore },
  { id: "control",        title: "What you control",         component: SlideControl },
  { id: "qa",             title: "Q&A",                      component: SlideQA },
  { id: "close",          title: "Close",                    component: SlideClose },
] as const;
