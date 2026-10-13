import $ from 'jquery'
import gsap from 'gsap'
import { group, itemsFor } from './lib/data.js'

const PER_COL = 7
const BASE_SPEED = 18 // px / second at rest
const SCROLL_BOOST = 0.07 // scroll delta → playback boost sensitivity
const MAX_BOOST = 30 // playback ceiling while scrolling hard
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Number of columns for the current viewport (aligned with the CSS breakpoints). */
function columnCount() {
  const w = window.innerWidth
  if (w >= 768) return 4
  if (w >= 521) return 3
  return 2
}

export function createGallery({ colsEl, onOpen }) {
  let columns = []
  let currentGroup = 'all'
  let paused = false

  /* ---- scroll velocity → playback rate ---- */
  let lastScroll = window.scrollY
  let dir = 1
  let mag = 1
  let targetMag = 1

  $(window).on('scroll', () => {
    const y = window.scrollY
    const v = y - lastScroll
    lastScroll = y
    if (v === 0) return
    dir = v > 0 ? 1 : -1
    targetMag = 1 + Math.min(Math.abs(v) * SCROLL_BOOST, MAX_BOOST - 1)
  })

  gsap.ticker.add(() => {
    if (REDUCED) return
    targetMag += (1 - targetMag) * 0.06
    mag += (targetMag - mag) * 0.12
    const scale = paused ? 0 : dir * mag
    for (const c of columns) c.tl.timeScale(scale)
  })

  function buildTile(item) {
    const tile = document.createElement('button')
    tile.type = 'button'
    tile.className = 'tile'
    tile.dataset.orientation = item.orientation

    const img = document.createElement('img')
    img.className = 'tile__img'
    img.loading = 'eager'
    img.decoding = 'async'
    img.src = item.url
    img.alt = `${item.member ?? group.name} — ${group.name}`
    img.addEventListener('error', () => {
      img.src = `https://picsum.photos/seed/${item.id}/600/800`
    })

    const overlay = document.createElement('div')
    overlay.className = 'tile__overlay'
    const name = document.createElement('span')
    name.className = 'tile__name'
    name.textContent = item.member ?? group.name
    const sub = document.createElement('span')
    sub.className = 'tile__group'
    sub.textContent = item.member ? group.name : 'Group'
    overlay.append(name, sub)

    tile.append(img, overlay)
    return tile
  }

  function buildBaseColumn(index, items) {
    const col = document.createElement('div')
    col.className = 'col'
    col.dataset.col = String(index)

    const track = document.createElement('div')
    track.className = 'col__track'

    const set1 = items.map((it) => buildTile(it))
    set1.forEach((t) => track.append(t))

    col.append(track)
    $(colsEl).append(col)

    return { col, track, set1, index, items }
  }

  function finalizeColumn({ col, track, set1, index, items }) {
    const setHeight = track.scrollHeight
    let clones = 1
    while (track.scrollHeight < col.clientHeight + setHeight && clones < 5) {
      set1.forEach((t) => track.append(t.cloneNode(true)))
      clones++
    }
    // bind clicks on originals + clones uniformly
    $(track)
      .find('.tile')
      .each(function (i) {
        const itemIndex = i % set1.length
        $(this).on('click', () => onOpen(items, itemIndex))
      })

    const reverse = index % 2 === 1
    const duration = setHeight / BASE_SPEED
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'none' } })
    if (reverse) {
      gsap.set(track, { y: -setHeight })
      tl.to(track, { y: 0, duration })
    } else {
      tl.to(track, { y: -setHeight, duration })
    }
    tl.progress(Math.random())
    if (REDUCED) tl.timeScale(0)
    return { col, tl }
  }

  function setFilter(groupId) {
    currentGroup = groupId
    for (const c of columns) c.tl.kill()
    columns = []
    $(colsEl).empty()

    const pool = itemsFor(groupId)
    const built = []
    const COLS = columnCount()

    for (let c = 0; c < COLS; c++) {
      const picked = []
      for (let k = c; k < pool.length && picked.length < PER_COL; k += COLS) {
        picked.push(pool[k])
      }
      if (picked.length === 0) continue
      built.push(buildBaseColumn(c, picked))
    }

    // All columns are in the DOM now, so flex widths (= tile sizes) are final.
    // Measuring in a second pass avoids columns 0/1 seeing an inflated width
    // while they are the only children of the flex row.
    for (const b of built) columns.push(finalizeColumn(b))
  }

  return {
    setFilter,
    get group() {
      return currentGroup
    },
    setPaused(v) {
      paused = v
    },
  }
}
