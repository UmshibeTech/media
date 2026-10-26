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
