# LeadRescue

A lightweight lead inbox for small service businesses. Search and filter inquiries, edit contact notes, sort by follow-up urgency, and export a CSV backup. Copy a friendly follow-up or open a prefilled email draft when you are ready to contact someone.

## Run locally

Open `index.html` in a modern browser. No install or build step is required. Demo records and new entries are stored in this browser's local storage. Follow-up actions prepare text or open a prefilled email draft; they never send messages.

## Checks

Run `node --test core.test.mjs` with Node.js 18 or newer.

## Scope

This prototype has no login, server, shared customer data, CRM sync, payment processing, or remote lead capture. The early-access link opens a prefilled GitHub issue for an inbound request.
