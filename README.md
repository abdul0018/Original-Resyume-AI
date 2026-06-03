# Rezyume AI — single website (resume builder + payment + built-in admin)

One Vercel project. Users build resumes and pay 4,000 UZS to download.
The admin panel is built INTO the same site, opened by a hidden lock icon.

## Structure
```
public/index.html     the whole website (builder + payment modal + admin panel)
api/log-event.js      records resume-created / download-requested activity (KV)
api/pay-create.js     user submits payment → pending (KV)
api/pay-status.js     site polls until approved/rejected (KV)
api/pay-admin.js      approve/reject (protected by ADMIN_KEY)
api/admin-data.js     global stats + payments + activity (protected by ADMIN_KEY)
vercel.json, package.json
```

## Admin access
- A small, faint lock icon sits in the footer ("© 2026 Resyume AI Engine 🔒").
- Click it → admin login modal → enter ADMIN_KEY → dashboard.
- The dashboard is GLOBAL (backed by Vercel KV): every admin, on any device or
  browser, sees the same live data. It is NOT browser-specific.

## Admin features
- Stats: total users, resumes created, download requests, paid downloads,
  pending count, revenue.
- Payments tab: view all requests, filter by status, search, Approve / Reject.
- Activity tab: every resume-created and download-requested event with user info.
- Auto-refreshes every 5 seconds.

## Deploy
1. Push these files to the repo ROOT → Vercel auto-builds (Framework: Other, no build cmd).
2. **Connect Vercel KV**: Vercel → project → Storage → Create → KV → connect.
   (This is what makes the admin data global + persistent.)
3. **Set env var** `ADMIN_KEY` (Settings → Environment Variables) to a long random string.
4. Redeploy.

## Set your card number
In `public/index.html`, near the top of App():
```js
const PAY_CARD = "5614 6848 0908 9087";  // your card
const PAY_AMOUNT = "4000";
```

## Security notes
- ADMIN_KEY lives only in Vercel env + the admin's session — never in the public code.
- The admin APIs reject any request without the correct key (401).
- The lock icon is intentionally faint and unlabeled; regular users won't notice it,
  but it is not "security" by itself — the real protection is ADMIN_KEY.

## Later: real auto-confirmation
Swap manual approval for Payme/Click: their callback sets a payment's status to
"approved" instead of you tapping it. The front end stays exactly the same.
