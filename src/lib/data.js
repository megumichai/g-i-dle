import { group, groups, items } from '../data/groups.js'

export { group, groups }

/** Round-robin items across members so the "All" feed feels mixed. */
function interleave(list) {
  const buckets = new Map()
  for (const it of list) {
    const key = it.member ?? group.name
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(it)
  }
  const queues = [...buckets.values()]
  const out = []
  let added = true
  while (added) {
    added = false
    for (const q of queues) {
      if (q.length) {
        out.push(q.shift())
        added = true
      }
    }
  }
  return out
}

const allItems = interleave(items)

/** Avatar URL for a member id, or null when unavailable. */
export const profileFor = (id) => groupById(id)?.avatar ?? null

const byGroup = new Map(groups.map((g) => [g.id, g.items]))

export function itemsFor(groupId) {
  if (!groupId || groupId === 'all') return allItems
  return byGroup.get(groupId) ?? []
}

export function groupById(id) {
  return groups.find((g) => g.id === id)
}

export const stats = {
  members: groups.length,
  photos: items.length,
}
