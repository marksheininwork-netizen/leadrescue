# LeadRescue

A lightweight lead inbox for small service businesses. Search and filter inquiries, edit contact notes, track estimated deal values and open pipeline value, and export CSV. Log each contact with a date and count, copy a friendly follow-up or open a prefilled email draft, and download or restore a versioned JSON backup.

## Live PWA

Install LeadRescue from [its public web app](https://marksheininwork-netizen.github.io/leadrescue/). The app shell works offline after the first visit; lead data is stored in the current browser only. See the [privacy policy](https://marksheininwork-netizen.github.io/leadrescue/privacy.html) and [support page](https://marksheininwork-netizen.github.io/leadrescue/support.html).

## Run locally

Open `index.html` in a modern browser. No install or build step is required. Demo records and new entries are stored in this browser's local storage. Follow-up actions prepare text or open a prefilled email draft; they never send messages.

## Checks

Run `node --test` with Node.js 18 or newer to check lead workflows, PWA assets, manifest wiring, and offline fallback.

## Scope

This prototype has no login, server, shared customer data, CRM sync, payment processing, or remote lead capture. The early-access link opens a prefilled GitHub issue for an inbound request.
