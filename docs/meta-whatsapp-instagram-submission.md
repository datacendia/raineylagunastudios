# Meta Submissions — draft copy for Stuart

Paste these into the respective Meta Developer Console flows. Everything below has been written in the first person (as Stuart) and tuned for a fast-moving, boutique studio use-case. Meta reviewers read fast — clarity and specificity beat elaborate pitches.

---

## Part A · WhatsApp Business Platform (for Garúa AI + Socio)

### Business verification

- **Legal business name:** _[Your registered RUC-holding name here — e.g. Stuart John Andrew Rainey EIRL]_
- **Business website:** `https://raineylaguna.com`
- **Business category:** Marketing services / Advertising agencies
- **Business address:** Av. Conquistadores, San Isidro, Lima, Perú
- **Business phone:** +51 912 418 482
- **Business email:** hola@raineylaguna.com

### App creation

- **App name:** `Rainey Laguna — Garúa`
- **Use case:** *Other*

### App display information

> Rainey Laguna is an independent design and intelligence studio in Lima, Perú. We build websites, brands, and competitive-intelligence tooling for independent local businesses across hospitality, wellness, education, aesthetics, and retail.
>
> This WhatsApp Business app lets our clients receive pre-approved marketing messages that we co-author with them — including weather-triggered promotions during Lima's garúa season — and lets our clients converse with an AI assistant (Socio) that has been trained on their own brand voice, menu, and operational data.
>
> All messages are sent with explicit opt-in from the recipient, stored in our CRM, and revocable by replying STOP. Templates are submitted for review before any send.

### Data-use disclosure

- **User data accessed:** phone number, conversation history with the business, profile name, opt-in timestamp.
- **Why:** to allow end-users to receive marketing messages they have explicitly subscribed to, and to allow them to reply conversationally to an AI assistant trained on their business's data.
- **Third-party sharing:** message text is processed by Anthropic's Claude API solely to generate contextual responses. No persistent storage at Anthropic. No data is sold or shared for advertising.
- **Data retention:** 24 months rolling, then deleted. Users can request earlier deletion at hola@raineylaguna.com.

### Message template samples (first three for approval)

**Template 1 — `garua_hot_drink_offer` (Marketing, Spanish)**

> Hola {{1}}, hoy garúa en Lima y estamos sirviendo {{2}} hasta las {{3}}. Te lo guardamos caliente — responde SÍ y te separamos una mesa. STOP para no recibir más.

**Template 2 — `garua_hot_drink_offer_en` (Marketing, English)**

> Hi {{1}}, it's drizzling in Lima and we're serving {{2}} until {{3}}. We'll keep one warm for you — reply YES to hold a table. STOP to unsubscribe.

**Template 3 — `weekly_socio_summary` (Utility, Spanish)**

> {{1}}, tu resumen semanal de Socio: {{2}} conversaciones, {{3}} nuevas reseñas, {{4}}. Detalles en {{5}}.

### Verification documents to upload

- RUC certificate (Sunat)
- DNI or passport (front + back)
- Utility bill ≤ 90 days old showing business address (optional but speeds review)

---

## Part B · Instagram Graph API (for Garúa AI)

### Business Manager / Meta Business Suite

1. Ensure `raineylaguna.com` is claimed as a domain in Meta Business Suite.
2. Each client who wants Garúa auto-posting must connect **their** Instagram Business account to a Facebook Page **they own**, then grant Rainey Laguna Partner access (role: *Content creator*).

### App review — Permissions requested

- `pages_manage_posts` — to publish scheduled posts on the client's Page.
- `pages_read_engagement` — to report post metrics back to the client.
- `instagram_basic` — to confirm which IG Business account is connected.
- `instagram_content_publish` — to publish photo/video posts to the client's IG feed.
- `business_management` — to manage the partnership relationship.

### App review — Use-case narratives

> **Feature:** Weather-triggered marketing automation for independent hospitality businesses in Lima, Perú.
>
> **What the app does:** When Lima's atmospheric conditions change in a way that matches a client's pre-configured trigger (e.g. humidity above 85 %, meaning garúa drizzle is falling), our system generates three drafts of a matching Instagram post in the client's voice, using their menu and today's weather. Stuart (our founder) reviews the drafts in an internal admin, approves one, and the post is published to the client's IG feed via `instagram_content_publish`. We also publish a matching WhatsApp broadcast to the client's opted-in subscribers.
>
> **Why Instagram:** restaurant and café customers in Lima discover daily specials primarily on Instagram. Without automation, small independent cafés cannot respond to weather windows that last 2–4 hours. With our automation, they can.
>
> **Consent and control:** each client explicitly opts their IG account into Garúa through a signed addendum. They can revoke Partner access in one click. All posts are human-reviewed before publish during the first 90 days; after that, clients can opt into full autopilot.

### Screencast to upload (record these four actions)

1. Studio admin detects a weather shift (show Open-Meteo call returning humidity ≥ 85 %).
2. Three draft posts rendered with client's voice + today's menu + today's weather.
3. Stuart approves one. Draft is sent to Meta Graph API `POST /{ig-user-id}/media` then `POST /{ig-user-id}/media_publish`.
4. Post appears on the client's IG feed. Metrics start reporting back.

### Data handling declaration

- **What we store:** IG user ID, Page ID, access token (encrypted at rest), and published post IDs. That's it.
- **What we do not store:** follower lists, DM contents, other users' profile data, any non-public content.
- **Retention:** access tokens refreshed every 60 days; revoked immediately on partnership termination.

---

## Part C · Timeline expectations

- **WhatsApp Business Platform verification:** 2–7 business days (Meta has sped this up in 2026).
- **Instagram Graph App review:** 1–4 weeks. Budget 3 weeks.
- **First template approvals:** 24–72 hours each.

## Part D · Things to do today

1. Register the RUC if not already. (If you haven't, Sunat SOL online takes ~1 hour.)
2. Create a Meta Business Manager account at `business.facebook.com` and claim `raineylaguna.com` as a domain.
3. Create a WhatsApp Business account on the `+51 912 418 482` number (note: once it's on WA Business Platform it can no longer be used on the regular WhatsApp app — verify you're OK with this, or procure a separate line for the platform API).
4. Create one Facebook Page for Rainey Laguna Studios even if you'll rarely post to it. Meta requires it.

Ping me once you have (2) and (3) done and I'll write the glue code for the first weather → IG post flow.
