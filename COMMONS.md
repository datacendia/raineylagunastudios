# Rainey Laguna Commons

**An open-source promise.** Every website Rainey Laguna builds for a client is published, in full, on GitHub — source, history, and experiments included — from the day it ships.

## Why

Design studios gate-keep their code. It's an old instinct from an era when the HTML *was* the value. It is not any more. What clients buy from us in 2026 is strategy, brand voice, competitive intelligence, and care. None of those live in the code.

By open-sourcing every client site, we commit to competing only on the things that matter. Other studios in Lima can fork Curcucho Café's exact implementation tonight — and still not be able to replicate the eight weeks Stuart spent understanding Curcucho's customers, the voice doc, the competitive monitoring, the weekly experiments, or the relationship.

## How it works

1. Every client signs a **Commons Clause** at contract time. It grants Studios permission to publish the site source publicly. No PII, no credentials, no analytics secrets. The clause is plain Spanish, two paragraphs, optional but strongly encouraged.
2. Every repo is created under `github.com/raineylaguna-commons/<client-slug>`.
3. A pre-commit hook (`scripts/strip-secrets.sh`) scrubs `.env`, API keys, emails, and phone numbers before every push. Catches what CI would miss.
4. The repo README is bilingual (es-PE / en-US) and includes a *"what this teaches"* section with three concrete lessons other small-business designers can take.
5. Every A/B test result, every experiment branch, and every post-mortem is committed publicly with a CHANGELOG entry.

## What stays private

- Client reservation/order data and anything covered under Ley 29733.
- Email archives ingested into Socio (AI Co-Founder) remain in an encrypted Supabase bucket with per-client isolation.
- Sereno's competitor-scrape cache (it is ours, licensed by us, not for redistribution).
- Client-owned photography and copy before launch. After launch: optional, up to the client.

## What this is not

- **It is not a license for clients to rebuild on their own.** The Commons Clause keeps the repo public, but we retain the relationship and the ongoing Care tier. Clients can walk away at any time — they already own their brand and their content — but the Commons repo is Studios-owned as a reference artifact.
- **It is not a marketing stunt.** It is an operational commitment that constrains how we work. If a technique isn't publishable, we don't ship it.

## Exceptions

- Enterprise or legally sensitive clients (medical, legal, financial) are private by default. The Commons Clause is declined in the contract.
- Sites under active NDA during a sensitive launch window stay private until launch +30 days.

## Credit

Inspired by the open-notebook tradition in science, the SourceHut "default-public" stance, and Rachel Andrew's early CSS-Grid teaching work. We think design deserves the same commons.

---

`Document version: 0.1 · 2 May 2026 · Stuart John Andrew Rainey`
