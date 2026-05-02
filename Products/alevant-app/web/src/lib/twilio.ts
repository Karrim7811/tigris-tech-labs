// Twilio wrapper — number provisioning + webhook configuration.

import twilio from "twilio";

let _client: ReturnType<typeof twilio> | null = null;

export function getTwilio() {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing");
    _client = twilio(sid, token);
  }
  return _client;
}

export interface NumberSearchOptions {
  areaCode?: string;
  contains?: string;
  voice?: boolean;
  sms?: boolean;
}

export async function searchAvailableLocalNumbers(opts: NumberSearchOptions = {}) {
  const t = getTwilio();
  const list = await t.availablePhoneNumbers("US").local.list({
    areaCode: opts.areaCode ? Number(opts.areaCode) : undefined,
    contains: opts.contains,
    voiceEnabled: opts.voice ?? true,
    smsEnabled: opts.sms ?? true,
    limit: 20,
  });
  return list.map((n) => ({
    phone_number: n.phoneNumber,
    friendly_name: n.friendlyName,
    locality: n.locality,
    region: n.region,
  }));
}

export async function purchaseNumber(opts: {
  phoneNumber: string;
  voiceUrl: string;
  smsUrl: string;
  statusCallback?: string;
  friendlyName?: string;
}) {
  const t = getTwilio();
  return t.incomingPhoneNumbers.create({
    phoneNumber: opts.phoneNumber,
    voiceUrl: opts.voiceUrl,
    voiceMethod: "POST",
    smsUrl: opts.smsUrl,
    smsMethod: "POST",
    statusCallback: opts.statusCallback,
    friendlyName: opts.friendlyName || `ALEVANT Sofia`,
  });
}

export async function reconfigureNumberWebhooks(opts: {
  sid: string;
  voiceUrl: string;
  smsUrl: string;
  statusCallback?: string;
}) {
  const t = getTwilio();
  return t.incomingPhoneNumbers(opts.sid).update({
    voiceUrl: opts.voiceUrl,
    voiceMethod: "POST",
    smsUrl: opts.smsUrl,
    smsMethod: "POST",
    statusCallback: opts.statusCallback,
  });
}

export async function releaseNumber(sid: string) {
  const t = getTwilio();
  await t.incomingPhoneNumbers(sid).remove();
}
