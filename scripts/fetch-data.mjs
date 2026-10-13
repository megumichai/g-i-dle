// Regenerates src/data/groups.js with real (G)I-DLE photos from Wikimedia Commons.
//
//   pnpm fetch:data
//
// Output structure matches the placeholder generator: one "group" bucket per
// member, so the gallery menu filters by member. Full-group shots are skipped
// for now (member buckets only) to keep the data shape consistent.
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

const GROUP_ID = 'gidle'
const GROUP_NAME = '(G)I-DLE'

const GROUP = {
  id: GROUP_ID,
  name: GROUP_NAME,
  kr: '(여자)아이들',
  agency: 'CUBE Entertainment',
  debut: '2018.05.02',
  fandom: 'NEVERLAND',
  members: [
    ['miyeon', 'Miyeon'],
    ['minnie', 'Minnie'],
    ['soyeon', 'Soyeon'],
    ['yuqi', 'Yuqi'],
    ['shuhua', 'Shuhua'],
  ],
}

// One avatar per member, in `GROUP.members` order.
const PROFILES = [
  'https://pbs.twimg.com/media/HLuHKTrbwAAQnX9?format=jpg&name=large',
  'https://pbs.twimg.com/media/HL6Miqia8AAjznY?format=jpg&name=large',
  'https://pbs.twimg.com/media/HL6MmojaIAIIDER?format=jpg&name=large',
  'https://pbs.twimg.com/media/HL6MrOJaoAA2esp?format=jpg&name=large',
  'https://pbs.twimg.com/media/HL6MvOHasAAEQB2?format=jpg&name=large',
]

const BLOCK =
  /(logo|icon|signature|map|timeline|chart|symbol|wordmark|diagram|screenshot|fan ?art|edit|template|wiki|stub|user|navbox)/i
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url, attempts = 6) {
  let lastErr
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (res.status === 429) throw new Error('HTTP 429 (rate limited)')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      lastErr = e
      await sleep((e.message.includes('429') ? 5000 : 1000) * (attempt + 1))
    }
  }
  throw lastErr
}

async function commonsSearch(query, limit = 40) {
  const q = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
    iiurlwidth: '900',
  })
  const data = await getJson(`${COMMONS_API}?${q}`)
  return Object.values(data?.query?.pages ?? {})
}

function pick(pages, { member }) {
  const out = []
  for (const p of pages) {
    const ii = p.imageinfo?.[0]
    if (!ii || !(ii.thumburl || ii.url)) continue
    if (!/image\/(jpeg|png|webp)/.test(ii.mime || '')) continue
    const title = p.title.replace(/^File:/, '')
    if (BLOCK.test(title)) continue
    const w = ii.width ?? 0
    const h = ii.height ?? 0
    if (w < 500 || h < 500) continue
    if (member) {
      const tok = member
        .toLowerCase()
        .replace(/[^a-z]/g, ' ')
        .trim()
        .split(' ')[0]
      if (tok.length > 2 && !title.toLowerCase().includes(tok)) continue
    }
    out.push({ title: title.replace(/\.[a-z]+$/i, ''), url: ii.thumburl || ii.url, w, h })
  }
  return out
}

async function fetchMemberImages(memberName, target = 10) {
  let picked = []
  for (const query of [`${memberName} ${GROUP_NAME}`, `${memberName} idle`, `${memberName}`]) {
    try {
      const imgs = pick(await commonsSearch(query), { member: memberName })
      if (imgs.length) picked = picked.concat(imgs)
      if (picked.length >= target) break
    } catch (e) {
      console.log(`  (${query} failed: ${e.message})`)
    }
    await sleep(300)
  }
  return picked.slice(0, target)
}

console.log('Source: Wikimedia Commons')

try {
  await getJson(`${COMMONS_API}?action=query&meta=siteinfo&format=json`)
} catch (e) {
  console.error(
    `\nCannot reach commons.wikimedia.org from this network (${e.message}).\nExisting src/data/groups.js is untouched.`
  )
  process.exit(1)
}

const seen = new Set()
const groups = []

for (const [id, name] of GROUP.members) {
  process.stdout.write(`- ${name} ... `)
  let items = []
  try {
    items = await fetchMemberImages(name)
  } catch (e) {
    console.log(`FAILED: ${e.message}`)
  }
  const uniq = []
  for (const it of items) {
    if (seen.has(it.url)) continue
    seen.add(it.url)
    uniq.push(it)
  }
  groups.push({
    id,
    name,
    kr: '',
    agency: GROUP.agency,
    debut: GROUP.debut,
    fandom: GROUP.fandom,
    members: GROUP.members.map(([, n]) => n),
    items: uniq,
  })
  console.log(`${uniq.length} images`)
}

const total = groups.reduce((n, g) => n + g.items.length, 0)

if (total < 20) {
  console.error(
    `\nOnly ${total} images fetched — likely network-blocked here.\nExisting src/data/groups.js was left untouched.`
  )
  process.exit(1)
}

for (const g of groups) {
  g.items.forEach((it, i) => {
    it.id = `${g.id}-${String(i + 1).padStart(2, '0')}`
    it.groupId = GROUP_ID
    it.groupName = GROUP_NAME
    it.member = g.name
    it.orientation = it.w >= it.h ? 'landscape' : it.h / it.w > 1.15 ? 'portrait' : 'square'
  })
}

const header =
  `// AUTO-GENERATED by scripts/fetch-data.mjs — ${new Date().toISOString()}\n` +
  `// ${groups.length} members · ${total} images · source: Wikimedia Commons\n`

const groupMeta = groups[0]
  ? `export const group = {\n  id: '${GROUP_ID}',\n  name: '${GROUP_NAME}',\n  kr: '(여자)아이들',\n  agency: 'CUBE Entertainment',\n  debut: '2018.05.02',\n  fandom: 'NEVERLAND',\n  members: ${JSON.stringify(GROUP.members.map(([, n]) => n))},\n  profiles: ${JSON.stringify(PROFILES, null, 2).replace(/\n/g, '\n  ')},\n};\n\n`
  : ''

const out =
  `${header}${groupMeta}export const groups = ${JSON.stringify(groups, null, 2)};\n\n` +
  `export const items = groups.flatMap((g) => g.items);\n\n` +
  `export default { group, groups, items };\n`

const file = resolve(__dirname, '../src/data/groups.js')
await writeFile(file, out, 'utf8')
console.log(`\nWrote ${file} — ${groups.length} members, ${total} images.`)
