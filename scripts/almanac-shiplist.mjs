#!/usr/bin/env node
/**
 * almanac-shiplist.mjs
 *
 * Pulls confirmed Almanac orders from the CRM and writes a ship-list CSV
 * ready for the imprenta + courier. Each order is assigned its copy number
 * (001..200) in the order it reached "Proposal" stage in the CRM (i.e. once
 * the operator has confirmed payment).
 *
 * Usage:
 *   node scripts/almanac-shiplist.mjs                 # writes ./almanac-shiplist.csv
 *   node scripts/almanac-shiplist.mjs --out ship.csv  # custom path
 *   node scripts/almanac-shiplist.mjs --stage Closed  # change source stage
 *
 * Env:
 *   CRM_PUBLIC_API          https://crm.raineylaguna.com
 *   CRM_LEAD_INTAKE_SECRET  shared secret (re-used as a simple bearer here;
 *                           a dedicated CRM_REPORTING_SECRET can replace it).
 *
 * Note: the CRM doesn't yet expose a public read endpoint for leads. Until it
 * does, this script falls back to reading data/almanac-orders.json — a file
 * the operator maintains manually by copying confirmed orders out of the CRM.
 * That fallback path is fine for the MVP (200 copies → ~weekly batch).
 */

import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function parseArgs(argv) {
  const args = { out: 'almanac-shiplist.csv', stage: 'Proposal' }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') args.out = argv[++i]
    else if (a === '--stage') args.stage = argv[++i]
  }
  return args
}

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

async function loadFromFile() {
  const p = path.join(ROOT, 'data', 'almanac-orders.json')
  try {
    const raw = await fs.readFile(p, 'utf8')
    const json = JSON.parse(raw)
    if (!Array.isArray(json)) throw new Error('almanac-orders.json must be an array')
    return json
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

async function loadFromCRM(stage) {
  const url = process.env.CRM_PUBLIC_API
  const secret = process.env.CRM_LEAD_INTAKE_SECRET
  if (!url || !secret) return null

  // CRM doesn't yet expose a read endpoint guarded by the intake secret.
  // When that endpoint exists (e.g. GET /api/leads/by-niche?niche=Almanac&stage=Proposal),
  // wire it here. For now, return null so we fall back to the JSON file.
  return null
}

async function main() {
  const args = parseArgs(process.argv)

  const fromCrm = await loadFromCRM(args.stage)
  const orders = fromCrm ?? (await loadFromFile())

  if (orders.length === 0) {
    console.error('No confirmed orders found.')
    console.error('Either populate data/almanac-orders.json or wire the CRM read endpoint.')
    process.exit(1)
  }

  // Sort by confirmation timestamp so copy numbers are assigned FIFO.
  orders.sort((a, b) => {
    const ta = new Date(a.confirmed_at || a.received_at || 0).getTime()
    const tb = new Date(b.confirmed_at || b.received_at || 0).getTime()
    return ta - tb
  })

  const header = [
    'copy_number',
    'edition',
    'name',
    'email',
    'phone',
    'address',
    'dedication',
    'amount_pen',
    'confirmed_at',
  ]
  const lines = [header.join(',')]
  orders.forEach((o, i) => {
    const num = String(i + 1).padStart(3, '0')
    lines.push([
      num,
      o.edition || 'MMXXVI',
      o.name,
      o.email || '',
      o.phone || '',
      o.address || '',
      o.dedication || '',
      o.amount_pen || '',
      o.confirmed_at || o.received_at || '',
    ].map(csvEscape).join(','))
  })

  const outPath = path.isAbsolute(args.out) ? args.out : path.join(ROOT, args.out)
  await fs.writeFile(outPath, lines.join('\n') + '\n', 'utf8')
  console.log(`✓ Wrote ${orders.length} orders to ${outPath}`)
  console.log(`  Copies 001..${String(orders.length).padStart(3, '0')} of 200 reserved.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
