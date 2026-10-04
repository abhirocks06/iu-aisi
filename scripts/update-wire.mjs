#!/usr/bin/env node
/* Rebuilds src/data/wire.json — the incidents and quotes behind the home-page
   hero graph — from two pages on goveronica.com:

     Misalignment Map ............ data/misalignment-incidents.json
     What are states doing ...? .. data/ai-risk-states.json

   Rules (they reproduce the hand-made snapshot of Oct 1, 2026):
     nodes        the 10 newest episodes (any type) then the 10 newest quotes,
                  newest first; equal dates keep source order.
     links        source links whose ends are both among the 10, then, chain
                  by chain, each of the 10 joined to the next one in time.
     chainCount   distinct chains, in order of first appearance in the corpus.
     olderChains  for every episode not among the 10, in source order, the
                  index of its chain.
     handle       a short label on at most 4 incidents and 1 quote: curated
                  ones first (HANDLES below), then the source's own short
                  title; never truncated or reworded.

   The file is only written when every check passes, and only when something
   other than the date changed, so a weekly run with no news is a no-op.

   node scripts/update-wire.mjs [--dry-run] [--date YYYY-MM-DD]
        [--incidents URL|PATH] [--states URL|PATH] [--out PATH]

   Node 20+, no dependencies. Behind an HTTPS proxy on Node >= 22.21, run it
   with NODE_USE_ENV_PROXY=1 — Node's fetch ignores HTTPS_PROXY otherwise. */

import { readFile, rename, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const SOURCE = {
  incidents: 'https://goveronica.com/data/misalignment-incidents.json',
  states: 'https://goveronica.com/data/ai-risk-states.json',
}
const OUT = fileURLToPath(new URL('../src/data/wire.json', import.meta.url))
const PROVENANCE = 'Misalignment Map and What are states doing about AI risk? (goveronica.com), data generated'

const NEWEST = 10
const MAX_INCIDENT_HANDLES = 4
const MAX_QUOTE_HANDLES = 1
const MAX_HANDLE = 32

/* Hand-written labels, keyed by stable id. They are used whenever their node
   is among the newest; the rest of the slots are filled automatically. */
const HANDLES = {
  'oa-images': 'User photos posted publicly',
  'oa-usgov': 'U.S. government sites probed',
  'oa-dns': 'Agent escaped through DNS',
  'gg-three-cos-public': 'Gemini hacked three firms',
  'q-ro-khanna-2026-09-29': 'Khanna: “extinction risk”',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

class DataError extends Error {}
const fail = (msg) => { throw new DataError(msg) }

/* ---- dates -------------------------------------------------------------- */

// '2026-09-25' -> { long: 'Sep 25, 2026', short: 'Sep 25' }; '2026-09' -> 'Sep 2026' / 'Sep'.
function when(date, monthOnly = false) {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(date ?? '')
  if (!m || (m[2] && !MONTHS[m[2] - 1])) fail(`bad date ${JSON.stringify(date)}`)
  const [, y, mo, d] = m
  if (!mo) return { long: y, short: y }
  const mon = MONTHS[mo - 1]
  if (!d || monthOnly) return { long: `${mon} ${y}`, short: mon }
  return { long: `${mon} ${Number(d)}, ${y}`, short: `${mon} ${Number(d)}` }
}

// Newest first; equal dates keep source order (Array.prototype.sort is stable).
const newestFirst = (list) => [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

const host = (url) => new URL(url).hostname.replace(/^www\./, '')
const isUrl = (u) => { try { return /^https?:$/.test(new URL(u).protocol) } catch { return false } }
const text = (v) => (typeof v === 'string' ? v.trim() : '')

/* ---- incidents ---------------------------------------------------------- */

function readIncidents(corpus) {
  const eps = corpus?.episodes
  if (!Array.isArray(eps)) fail('misalignment-incidents.json: no "episodes" array')
  if (!Array.isArray(corpus.links)) fail('misalignment-incidents.json: no "links" array')
  const seen = new Set()
  for (const e of eps) {
    if (!text(e?.id)) fail('an episode has no id')
    if (seen.has(e.id)) fail(`episode id ${e.id} appears twice`)
    seen.add(e.id)
    if (!text(e.chain)) fail(`episode ${e.id} has no chain`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? '')) fail(`episode ${e.id} has bad date ${JSON.stringify(e.date)}`)
  }
  if (eps.length < NEWEST) fail(`only ${eps.length} episodes; need at least ${NEWEST}`)
  return eps
}

function incidentNode(e) {
  if (!Number.isInteger(e.severity) || e.severity < 1 || e.severity > 4) fail(`episode ${e.id} has severity ${e.severity}`)
  const sources = (e.sources ?? []).filter((s) => text(s?.t) && isUrl(s?.u))
  // "Outlet — Headline"; a source with no outlet in its title falls back to its host.
  const src = sources.find((s) => s.t.indexOf(' — ') > 0) ?? sources[0]
  if (!src) fail(`episode ${e.id} has no source with a title and URL`)
  const cut = src.t.indexOf(' — ')
  const outlet = cut > 0 ? src.t.slice(0, cut).trim() : host(src.u)
  const head = cut > 0 ? src.t.slice(cut + 3).trim() : src.t.trim()
  const d = when(e.date, e.precision === 'month')
  return {
    kind: 'incident',
    id: e.id,
    severity: e.severity,
    head,
    meta: `${outlet} · ${d.long}`,
    short: `${outlet} · ${d.short}`,
    link: { title: `Read on ${outlet}`, url: src.u },
  }
}

/* ---- quotes ------------------------------------------------------------- */

const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Every direct quote, in source order, with a stable id: q-<person>-<date>,
// plus -2, -3 … for a person's further quotes on the same date.
function readQuotes(corpus) {
  const people = corpus?.people
  if (!Array.isArray(people)) fail('ai-risk-states.json: no "people" array')
  const quotes = []
  const ids = new Set()
  for (const p of people) {
    const pid = slug(text(p?.id) || text(p?.name))
    if (!pid) fail('a person has neither id nor name')
    const perDay = new Map()
    for (const s of p.statements ?? []) {
      if (s?.kind !== 'quote') continue
      if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s.date ?? '')) fail(`a quote by ${pid} has bad date ${JSON.stringify(s.date)}`)
      const n = (perDay.get(s.date) ?? 0) + 1
      perDay.set(s.date, n)
      const id = `q-${pid}-${slug(String(s.date ?? ''))}${n > 1 ? `-${n}` : ''}`
      if (ids.has(id)) fail(`quote id ${id} appears twice`)
      ids.add(id)
      quotes.push({ id, person: p, s, date: s.date })
    }
  }
  if (quotes.length < NEWEST) fail(`only ${quotes.length} quotes; need at least ${NEWEST}`)
  return quotes
}

function quoteNode({ id, person: p, s }) {
  const name = text(p.name)
  const office = text(p.office)
  const said = text(s.text).replace(/^“(.*)”$/s, '$1')
  if (!name || !office || !said) fail(`quote ${id} is missing a name, office or text`)
  if (!isUrl(s.source)) fail(`quote ${id} has no source URL`)
  const party = text(p.party)
  const d = when(s.date)
  return {
    kind: 'quote',
    id,
    head: `“${said}”`,
    meta: `${name}, ${office}${party ? ` (${party})` : ''} · ${d.long}`,
    short: `${name} · ${d.short}`,
    link: { title: text(s.outlet) || host(s.source), url: s.source },
  }
}

/* ---- handles ------------------------------------------------------------ */

// A source title is usable as-is only if it is short and already sentence case.
function cleanLabel(s) {
  const t = text(s)
  if (!t || t.length > MAX_HANDLE || /\n/.test(t)) return null
  if (!/^[A-Z0-9]/.test(t) || /[:;,–—-]$/.test(t)) return null
  return t
}

// Surname only when it is unambiguous: "Gentner Drummond", "Anthony G. Brown",
// "Louis Blessing III", "Trish La Chica". "Andrea Joy Campbell" or "Erin Maye
// Quade" could be either, so they get no label rather than a wrong one.
function surname(name) {
  const w = text(name).replace(/,/g, ' ').split(/\s+/)
    .filter((x) => x && !/^(Jr|Sr|II|III|IV)\.?$/.test(x) && !/^[A-Z]\.$/.test(x))
  if (w.length === 2) return w[1]
  if (w.length === 3 && /^(Van|Von|De|Del|Della|Da|Di|Du|La|Le|St\.?)$/i.test(w[1])) return `${w[1]} ${w[2]}`
  return null
}

function chooseHandles(incidents, quotes, episodes, quoteSource) {
  const out = new Map()
  const used = new Set()
  const give = (id, label) => { out.set(id, label); used.add(label) }

  let n = 0
  for (const node of incidents) {
    if (n < MAX_INCIDENT_HANDLES && HANDLES[node.id]) { give(node.id, HANDLES[node.id]); n++ }
  }
  const pool = incidents.map((node, i) => ({ node, i })).filter(({ node }) => !out.has(node.id))
    .sort((a, b) => b.node.severity - a.node.severity || a.i - b.i)
  for (const { node } of pool) {
    if (n >= MAX_INCIDENT_HANDLES) break
    const label = cleanLabel(episodes.get(node.id).title)
    if (label && !used.has(label)) { give(node.id, label); n++ }
  }

  let q = 0
  for (const node of quotes) {
    if (q < MAX_QUOTE_HANDLES && HANDLES[node.id]) { give(node.id, HANDLES[node.id]); q++ }
  }
  for (const node of quotes) {
    if (q >= MAX_QUOTE_HANDLES) break
    if (out.has(node.id)) continue
    const { person, s } = quoteSource.get(node.id)
    const who = surname(person.name)
    if (!who) continue
    // A verbatim short form, if the source ever provides one; otherwise a neutral label.
    const short = text(s.short)
    const label = short && text(s.text).includes(short) && `${who}: “${short}”`.length <= MAX_HANDLE
      ? `${who}: “${short}”`
      : `${who} on AI risk`
    if (label.length <= MAX_HANDLE && !used.has(label)) { give(node.id, label); q++ }
  }
  return out
}

/* ---- build -------------------------------------------------------------- */

function buildWire(incidentCorpus, statesCorpus, runDate) {
  const eps = readIncidents(incidentCorpus)
  const episodes = new Map(eps.map((e) => [e.id, e]))
  const newest = newestFirst(eps).slice(0, NEWEST)
  const inNewest = new Set(newest.map((e) => e.id))

  const allQuotes = readQuotes(statesCorpus)
  const latestQuotes = newestFirst(allQuotes).slice(0, NEWEST)
  const quoteSource = new Map(latestQuotes.map((q) => [q.id, q]))

  const incidentNodes = newest.map(incidentNode)
  const quoteNodes = latestQuotes.map(quoteNode)
  const handles = chooseHandles(incidentNodes, quoteNodes, episodes, quoteSource)
  const withHandle = ({ kind, id, ...rest }) => ({ kind, id, ...(handles.has(id) ? { handle: handles.get(id) } : {}), ...rest })

  const chains = []
  for (const e of eps) if (!chains.includes(e.chain)) chains.push(e.chain)

  const links = []
  const linked = new Set()
  const join = (a, b) => {
    const key = [a, b].sort().join('\n')
    if (a === b || linked.has(key)) return
    linked.add(key)
    links.push([a, b])
  }
  for (const l of incidentCorpus.links) if (inNewest.has(l?.from) && inNewest.has(l?.to)) join(l.from, l.to)
  const oldestFirst = [...newest].reverse()
  for (const chain of chains) {
    const run = oldestFirst.filter((e) => e.chain === chain)
    for (let i = 1; i < run.length; i++) join(run[i - 1].id, run[i].id)
  }

  const data = {
    source: `${PROVENANCE} ${when(runDate).long}`,
    nodes: [...incidentNodes, ...quoteNodes].map(withHandle),
    links,
    chainCount: chains.length,
    olderChains: eps.filter((e) => !inNewest.has(e.id)).map((e) => chains.indexOf(e.chain)),
  }
  validate(data)
  return data
}

// The last line of defence: the hero must never get a file it cannot draw.
function validate(data) {
  const str = (v) => typeof v === 'string' && v.trim() !== ''
  const ids = new Set()
  const count = { incident: 0, quote: 0 }
  for (const n of data.nodes) {
    const where = `node ${n.id ?? '?'}`
    if (!(n.kind in count)) fail(`${where}: kind ${n.kind}`)
    count[n.kind]++
    for (const k of ['id', 'head', 'meta', 'short']) if (!str(n[k])) fail(`${where}: missing ${k}`)
    if (!str(n.link?.title) || !isUrl(n.link?.url)) fail(`${where}: missing link`)
    if (n.kind === 'incident' && !Number.isInteger(n.severity)) fail(`${where}: missing severity`)
    if ('handle' in n && (!str(n.handle) || n.handle.length > MAX_HANDLE)) fail(`${where}: bad handle`)
    if (ids.has(n.id)) fail(`${where}: duplicate id`)
    ids.add(n.id)
  }
  if (count.incident !== NEWEST || count.quote !== NEWEST) fail(`expected ${NEWEST} incidents and ${NEWEST} quotes, got ${count.incident} and ${count.quote}`)
  for (const [a, b] of data.links) if (!ids.has(a) || !ids.has(b)) fail(`link ${a} -> ${b} points outside the nodes`)
  if (!Number.isInteger(data.chainCount) || data.chainCount < 1) fail('no chains')
  if (!data.olderChains.every((c) => Number.isInteger(c) && c >= 0 && c < data.chainCount)) fail('olderChains out of range')
}

/* ---- io ----------------------------------------------------------------- */

async function load(where) {
  if (!/^https?:\/\//.test(where)) return JSON.parse(await readFile(where, 'utf8'))
  let last
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(where, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      last = err
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 5000))
    }
  }
  throw new Error(`could not fetch ${where}: ${last?.cause?.message ?? last?.message}`)
}

// Old snapshots numbered quotes by position, so quotes are matched by their text.
const keyOf = (n) => (n.kind === 'quote' ? `${n.meta}\n${n.head}` : n.id)

function summarize(prev, next) {
  const lines = []
  if (!prev) return ['no previous wire.json']
  const before = new Map(prev.nodes.map((n) => [keyOf(n), n]))
  const after = new Map(next.nodes.map((n) => [keyOf(n), n]))
  for (const [k, n] of after) {
    const old = before.get(k)
    if (!old) { lines.push(`+ ${n.kind} ${n.id}  ${n.short}`); continue }
    const changed = Object.keys({ ...old, ...n }).filter((f) => JSON.stringify(old[f]) !== JSON.stringify(n[f]))
    if (changed.length) lines.push(`~ ${n.kind} ${n.id}: ${changed.map((f) => `${f} ${JSON.stringify(old[f])} -> ${JSON.stringify(n[f])}`).join('; ')}`)
  }
  for (const [k, n] of before) if (!after.has(k)) lines.push(`- ${n.kind} ${n.id}  ${n.short}`)
  const pairs = (d) => new Set(d.links.map((l) => l.join(' -> ')))
  const [pl, nl] = [pairs(prev), pairs(next)]
  for (const l of nl) if (!pl.has(l)) lines.push(`+ link ${l}`)
  for (const l of pl) if (!nl.has(l)) lines.push(`- link ${l}`)
  if (prev.chainCount !== next.chainCount) lines.push(`~ chainCount ${prev.chainCount} -> ${next.chainCount}`)
  if (JSON.stringify(prev.olderChains) !== JSON.stringify(next.olderChains)) lines.push(`~ olderChains ${prev.olderChains.length} -> ${next.olderChains.length} entries`)
  if (prev.source !== next.source) lines.push(`~ source "${prev.source}" -> "${next.source}"`)
  return lines.length ? lines : ['no changes']
}

async function main() {
  const { values: opt } = parseArgs({
    options: {
      incidents: { type: 'string', default: SOURCE.incidents },
      states: { type: 'string', default: SOURCE.states },
      out: { type: 'string', default: OUT },
      date: { type: 'string', default: new Date().toISOString().slice(0, 10) },
      'dry-run': { type: 'boolean', default: false },
    },
  })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opt.date)) fail(`--date must be YYYY-MM-DD, got ${opt.date}`)

  const [incidents, states] = await Promise.all([load(opt.incidents), load(opt.states)])
  const data = buildWire(incidents, states, opt.date)

  let prev = null
  try { prev = JSON.parse(await readFile(opt.out, 'utf8')) } catch { /* first run, or unreadable: rebuild */ }
  const { source: _a, ...newBody } = data
  const { source: _b, ...oldBody } = prev ?? {}
  const same = prev && JSON.stringify(newBody) === JSON.stringify(oldBody)

  console.log(`update-wire: ${data.nodes.filter((n) => n.handle).map((n) => `${n.id} = "${n.handle}"`).join(', ')}`)
  for (const line of summarize(prev, data)) console.log(`  ${line}`)
  if (same) return console.log(`update-wire: ${opt.out} is already current; not rewritten`)
  if (opt['dry-run']) return console.log('update-wire: dry run; nothing written')

  const tmp = `${opt.out}.tmp`
  await writeFile(tmp, JSON.stringify(data, null, 1) + '\n', 'utf8')
  await rename(tmp, opt.out)
  console.log(`update-wire: wrote ${opt.out}`)
}

main().catch((err) => {
  console.error(`update-wire: ${err instanceof DataError ? 'refusing to write wire.json: ' : ''}${err.message}`)
  process.exit(1)
})
