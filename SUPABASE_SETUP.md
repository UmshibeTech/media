# Connect the booking form to Supabase

The site sends booking enquiries to Supabase and lets the visitor open a
pre-filled WhatsApp message after the save succeeds. The visitor must still
choose to send that WhatsApp message. The database policy allows public
submissions only; visitors cannot read enquiries through the API.

## Setup

1. Create a free Supabase project and wait for it to finish provisioning.
2. In the Supabase Dashboard, open **SQL Editor**, paste in
   [`supabase/schema.sql`](./supabase/schema.sql), and run it.
3. In **Settings > API Keys**, copy your project's URL and **publishable key**
   (or legacy `anon` key).
4. Open [`supabase-config.js`](./supabase-config.js) and set `url` and
   `publishableKey` to those values. The URL should look like
   `https://your-project-id.supabase.co`.
5. Deploy the website, including `supabase-config.js` and the images, to your
   static host. Submit a test enquiry and confirm it appears in the
   `booking_enquiries` table in the Supabase Dashboard.

The publishable/anon key is intended to be visible in a website. **Never put a
secret or legacy `service_role` key in this file or in browser code.** The
database's row-level security policy is what prevents the public key from
reading the enquiries. Review and restrict data access if you change the SQL
policy.

Until the project URL and key are configured, the form clearly reports that
the enquiry was not saved and still offers a WhatsApp link as a fallback.

The free plan has usage limits and can change. This public form can also
receive automated spam; if that becomes a problem, add a CAPTCHA or a
server-side submission function before expanding its access.

## Automatically notify the business about wedding quotations

The wedding quote builder opens a WhatsApp draft for the client to review and
send to the business. It does not send an automatic notification. The repository
also contains an optional Edge Function for Meta's WhatsApp Cloud API, but the
website does not currently call it. Enabling automatic notifications requires
both the setup below and a deliberate frontend integration.

1. In Meta for Developers, connect a WhatsApp Business account and sending
   number to an app. Save the **Phone Number ID** and create a long-lived
   system-user access token with WhatsApp messaging permission. Do not put
   that token in this website or share it in chat.
2. In WhatsApp Manager, create and get approval for a utility template. Use
   six text placeholders in the body, in this order:
   `New wedding quote from {{1}}. Date: {{2}}. Venue: {{3}}. Selections: {{4}}. Total: {{5}}. Client email: {{6}}.`
   Save the approved template name and language code.
3. Ensure the business notification recipient is permitted for the Meta app.
   The notification recipient is configured separately from the sending
   number.
4. Apply the updated [`supabase/schema.sql`](./supabase/schema.sql) in the
   Supabase SQL Editor. This creates a private short-term rate-limit table.
5. In **Supabase Dashboard > Edge Functions > Secrets**, set:
   - `WHATSAPP_ACCESS_TOKEN` — the Meta system-user access token.
   - `WHATSAPP_PHONE_NUMBER_ID` — the sending number's Phone Number ID.
   - `WHATSAPP_NOTIFICATION_TO` — business recipient number in international
     format using digits only, for example `27711234567`.
   - `WHATSAPP_TEMPLATE_NAME` — the approved Meta template name.
   - `WHATSAPP_TEMPLATE_LANGUAGE` — the approved template language code
     (defaults to `en` if omitted).
   - `ALLOWED_ORIGINS` — comma-separated website origins, for example
     `https://www.mshibeweddingfilms.co.za,https://mshibeweddingfilms.co.za`.
     Add any preview origin you use. Requests from other origins are rejected.
   `WHATSAPP_GRAPH_API_VERSION` is optional and defaults to `v23.0`.
   Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge
   Functions; do not copy either secret into browser code.
6. Install the Supabase CLI, log in, link it to project
   `aifdqjhcuqrmyupfqtuv`, then deploy from the repository root:
   `supabase functions deploy send-wedding-quote`
7. Submit a test quotation from the deployed site. The client WhatsApp draft
   should open, and the business number should receive an approved-template
   notification containing the selected services and server-calculated total.

The function validates selections and calculates prices on the server rather
than trusting a total supplied by the browser. It limits each IP address to
five notification attempts per ten minutes and retains only hashed IPs in the
rate-limit table for up to one day. JWT verification is disabled for this
function because it is called from a static site with a public publishable
key; the function instead restricts browser origins, validates the request,
and applies the rate limit. The publishable key is not a secret.
