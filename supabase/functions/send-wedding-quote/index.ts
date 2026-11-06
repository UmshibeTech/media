const servicePrices: Record<string, { label: string; price: number }> = {
  'full-video': { label: 'Full Wedding Event Video', price: 4000 },
  'digital-pictures': { label: 'Digital Pictures', price: 4000 },
  'highlight-video': { label: 'Highlight Video', price: 1500 },
  videographer: { label: '2nd Videography', price: 2500 },
  photography: { label: '2nd Photography', price: 3500 },
  'portrait-highlight': { label: 'Portrait Highlight', price: 3000 },
  'drone-coverage': { label: 'Drone Coverage (per day)', price: 1500 },
  'ukukhipha-umakoti': { label: 'Ukukhipha uMakoti Video', price: 3000 },
  'event-reel': { label: 'One-Hour Event Reel', price: 1500 },
  'sound-system': { label: 'Sound System (transport included)', price: 4500 },
  'live-streaming': { label: 'Live Streaming', price: 15000 },
  'online-editing': { label: 'Online Editing', price: 3000 },
  'digital-invitation': { label: 'Digital Invitation', price: 1000 }
};

const photobookPrices: Record<string, { label: string; price: number }> = {
  'a4-30': { label: 'A4 Photobook – 30 pages', price: 800 },
  'a4-40': { label: 'A4 Photobook – 40 pages', price: 1000 },
  'a3-30': { label: 'A3 Photobook – 30 pages', price: 1200 },
  'a3-40': { label: 'A3 Photobook – 40 pages', price: 1500 }
};

const canvasPrices: Record<string, { label: string; price: number }> = {
  a4: { label: 'A4 Canvas', price: 300 },
  a3: { label: 'A3 Canvas', price: 400 },
  a2: { label: 'A2 Canvas', price: 500 },
  a1: { label: 'A1 Canvas', price: 600 }
};

const additionalHourPrice = 1000;
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ||
  'https://www.mshibeweddingfilms.co.za,https://mshibeweddingfilms.co.za')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Vary': 'Origin'
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string' || value.length > maxLength) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

async function hashIp(ip: string) {
  const bytes = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function checkRateLimit(supabaseUrl: string, serviceRoleKey: string, ipHash: string) {
  const restUrl = `${supabaseUrl}/rest/v1/whatsapp_quote_notification_attempts`;
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const countResponse = await fetch(
    `${restUrl}?ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(tenMinutesAgo)}&select=id`,
    { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } }
  );
  if (!countResponse.ok) throw new Error('Could not check notification rate limit.');
  const contentRange = countResponse.headers.get('content-range') || '';
  const requestCount = Number(contentRange.split('/')[1]);
  if (Number.isFinite(requestCount) && requestCount >= 5) return false;

  const insertResponse = await fetch(restUrl, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ip_hash: ipHash })
  });
  if (!insertResponse.ok) throw new Error('Could not record notification request.');

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cleanupResponse = await fetch(
    `${restUrl}?created_at=lt.${encodeURIComponent(oneDayAgo)}`,
    { method: 'DELETE', headers }
  );
  if (!cleanupResponse.ok) throw new Error('Could not clean up expired rate-limit records.');
  return true;
}

Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  if (!allowedOrigins.includes(origin)) {
    return new Response('Origin not allowed', { status: 403 });
  }
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin'
      }
    });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, origin);
  }

  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return jsonResponse({ error: 'Invalid quotation request.' }, 400, origin);
    }

    const clientName = getText(body.clientName, 120);
    const clientEmail = getText(body.clientEmail, 254);
    const eventDate = getText(body.eventDate, 10) || '';
    const eventLocation = getText(body.eventLocation, 200) || '';
    const makotiLocation = getText(body.makotiLocation, 200) || '';
    const serviceIds = Array.isArray(body.serviceIds) ? body.serviceIds : null;
    const photobookId = getText(body.photobookId, 20) || '';
    const canvasId = getText(body.canvasId, 10) || '';
    const additionalHours = body.additionalHours;

    if (!clientName || !serviceIds || serviceIds.length > Object.keys(servicePrices).length ||
      !serviceIds.every(id => typeof id === 'string' && Object.hasOwn(servicePrices, id)) ||
      new Set(serviceIds).size !== serviceIds.length ||
      (body.clientEmail != null && body.clientEmail !== '' && !clientEmail) ||
      (body.eventDate != null && body.eventDate !== '' && !eventDate) ||
      (body.eventLocation != null && body.eventLocation !== '' && !eventLocation) ||
      (body.makotiLocation != null && body.makotiLocation !== '' && !makotiLocation) ||
      (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) ||
      (eventDate && !validDate(eventDate)) ||
      (body.photobookId != null && body.photobookId !== '' && !Object.hasOwn(photobookPrices, photobookId)) ||
      (body.canvasId != null && body.canvasId !== '' && !Object.hasOwn(canvasPrices, canvasId)) ||
      !Number.isSafeInteger(additionalHours) ||
      (additionalHours as number) < 0 || (additionalHours as number) > 9) {
      return jsonResponse({ error: 'Please check the quotation details and try again.' }, 400, origin);
    }

    const selectedServices = serviceIds.map(id => servicePrices[id as string]);
    const photobook = photobookId ? photobookPrices[photobookId] : null;
    const canvas = canvasId ? canvasPrices[canvasId] : null;
    if (!selectedServices.length && !photobook && !canvas && additionalHours === 0) {
      return jsonResponse({ error: 'Choose at least one service or add-on.' }, 400, origin);
    }
    if (serviceIds.includes('ukukhipha-umakoti') && !makotiLocation) {
      return jsonResponse({ error: 'Add the location of uMakoti to your request.' }, 400, origin);
    }

    const total = selectedServices.reduce((sum, service) => sum + service.price, 0) +
      (photobook?.price || 0) +
      (canvas?.price || 0) +
      (additionalHours as number) * additionalHourPrice;
    if (!Number.isSafeInteger(total)) {
      return jsonResponse({ error: 'The quotation total could not be calculated.' }, 400, origin);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/+$/, '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const notificationTo = Deno.env.get('WHATSAPP_NOTIFICATION_TO');
    const templateName = Deno.env.get('WHATSAPP_TEMPLATE_NAME');
    const templateLanguage = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'en';
    const graphVersion = Deno.env.get('WHATSAPP_GRAPH_API_VERSION') || 'v23.0';

    if (!supabaseUrl || !serviceRoleKey || !accessToken || !phoneNumberId ||
      !notificationTo || !templateName) {
      console.error('WhatsApp quotation notification is missing required server secrets.');
      return jsonResponse({ error: 'Automatic WhatsApp notification is not set up yet.' }, 503, origin);
    }
    if (!/^\d+$/.test(notificationTo) || !/^\d+$/.test(phoneNumberId) ||
      !/^[a-zA-Z0-9_]+$/.test(templateName) || !/^v\d+\.\d+$/.test(graphVersion)) {
      return jsonResponse({ error: 'The WhatsApp notification settings are not configured correctly.' }, 503, origin);
    }

    const forwardedIp = request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown';
    const allowed = await checkRateLimit(
      supabaseUrl,
      serviceRoleKey,
      await hashIp(forwardedIp)
    );
    if (!allowed) {
      return jsonResponse({ error: 'Too many quote requests. Please try again in a few minutes.' }, 429, origin);
    }

    const formatter = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    });
    const servicesText = [
      ...selectedServices.map(service => service.label),
      ...(photobook ? [photobook.label] : []),
      ...(canvas ? [canvas.label] : []),
      ...(additionalHours ? [`Additional hours: ${additionalHours}`] : [])
    ].join(', ').slice(0, 900);
    const parameters = [
      clientName,
      eventDate || 'To be confirmed',
      eventLocation || 'To be confirmed',
      servicesText,
      formatter.format(total),
      clientEmail || 'Not provided'
    ];
    const graphResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: notificationTo,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [{
              type: 'body',
              parameters: parameters.map(text => ({ type: 'text', text }))
            }]
          }
        })
      }
    );
    if (!graphResponse.ok) {
      const providerError = await graphResponse.text();
      console.error('WhatsApp Cloud API rejected a quotation notification:', providerError);
      return jsonResponse({ error: 'WhatsApp could not deliver the notification. Please contact us directly.' }, 502, origin);
    }

    return jsonResponse({ ok: true }, 200, origin);
  } catch (error) {
    console.error('Wedding quote notification failed:', error);
    return jsonResponse({ error: 'We could not send the automatic WhatsApp notification.' }, 500, origin);
  }
});
