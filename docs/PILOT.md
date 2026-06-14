# GarageOS Pilot Guide

Onboarding and success metrics for independent auto workshops in Pakistan (1–10 staff).

## Who this is for

Owner-operated general repair shops that already use WhatsApp with customers and want to replace paper job cards.

## Setup (15 minutes)

1. **Sign up** at `/signup` with workshop name and owner mobile.
2. **Settings → General:** add workshop WhatsApp number and invoice footer.
3. **Settings → Team:** add mechanic accounts (share mobile + temp password).
4. **Settings → Automation:** enable daily digest if desired; set reminder interval (e.g. 90 days).
5. **Create first job card** from the Jobs tab (+ button).
6. **Complete a job** with "Notify customer via WhatsApp" to test the full flow.

## WhatsApp before pilot

Configure production credentials in `backend/.env`:

| Provider | Required vars |
|----------|----------------|
| Twilio | `WHATSAPP_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` |
| Meta | `WHATSAPP_PROVIDER=meta`, `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID` |

Test from **Settings → Send test WhatsApp**.

## Pilot KPIs

GarageOS records events automatically. Owners can view counts at:

```
GET /api/v1/analytics/pilot-summary
```

### Target metrics (5–10 shops, 2 weeks)

| Metric | Target | Event name(s) |
|--------|--------|----------------|
| Time to first job | < 30 min after signup | `signup_completed`, `first_job_created` |
| WhatsApp delivery rate | ≥ 95% | `whatsapp_sent` / `whatsapp_failed` |
| Owner weekly use | Opens Summary ≥ 1×/week | `summary_viewed` |
| Job completion flow | ≥ 3 completed jobs/week | `job_completed` |
| Mechanic adoption | Mechanics update assigned jobs | compare owner vs mechanic `job_completed` metadata |

### Tracked events

| Event | Source |
|-------|--------|
| `signup_completed` | Backend on registration |
| `first_job_created` | Backend when workshop creates first job |
| `job_created` | Backend on each new job |
| `job_completed` | Backend + frontend on complete |
| `whatsapp_sent` / `whatsapp_failed` | Backend on each WhatsApp attempt |
| `password_reset_sent` / `password_reset_failed` | Backend on forgot password |
| `summary_viewed` | Frontend when owner opens Summary tab |
| `job_created_frontend` | Frontend backup telemetry |

## Udhaar (credit) tracking

Partial payments are recorded on completed jobs. View outstanding balances:

- **History tab** → "Outstanding balance (udhaar)" list
- **Customer profile** → total outstanding per customer

## Urdu support

Toggle **English / اردو** on login, signup, landing, and dashboard. Auth pages and landing hero translate; full landing page remains mostly English.

## Support checklist for churn

If a shop stops after week 1, ask:

1. Did WhatsApp messages deliver?
2. Did mechanics log in?
3. Was the first job created same day as signup?
4. Was paper workflow faster for them?

## Escalation

- WhatsApp not sending → verify provider credentials and customer opted in (Twilio sandbox requires join code)
- Password reset → link sent via WhatsApp to registered mobile
- Scheduler duplicates → run single API worker or disable `SCHEDULER_ENABLED` on scaled deploys
