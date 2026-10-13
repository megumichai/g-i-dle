import $ from 'jquery'
import gsap from 'gsap'
import { groups, profileFor } from './lib/data.js'

export function createMenu({ root, onSelect, getActive, onOpen }) {
  const $root = $(root)
  const els = {
    primary: root.querySelector('[data-menu-primary]'),
    preview: root.querySelector('[data-menu-preview]'),
    img: root.querySelector('[data-menu-img]'),
    close: root.querySelector('[data-menu-close]'),
    openBtn: document.querySelector('[data-menu-open]'),
  }

  const entries = [{ id: 'all', name: 'All Members' }, ...groups]
  let items = []
  let previewSrc = ''
  let previewToken = 0

  // Swap the preview image, falling back to the gallery shot when a member has
  // no avatar (or the avatar fails to load). Hovering "All Members" hides it.
  // A token guards against a slow load from a previous hover landing after a
  // newer one.
  function hidePreview() {
    previewSrc = ''
    ++previewToken
    $(els.preview).removeClass('is-shown')
  }

  function showPreview(src, fallback) {
    if (!src || src === previewSrc) return
    previewSrc = src
    const token = ++previewToken
    const img = els.img
    const box = els.preview
    $(box).removeClass('is-shown')

    const reveal = () => {
      if (token !== previewToken) return
      void box.offsetWidth // flush the opacity:0 removal so the fade-in replays
      $(box).addClass('is-shown')
    }
    img.addEventListener('load', reveal, { once: true })
    img.addEventListener(
      'error',
      () => {
        if (token === previewToken && fallback && fallback !== src) img.src = fallback
      },
      { once: true }
    )
    img.src = src
    // A cached image may already be `complete` when `src` is set, before any
    // `load` event is queued.
    if (img.complete && img.naturalWidth > 0) reveal()
  }

  entries.forEach((g, i) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'menu__item'
    btn.dataset.id = g.id

    const idx = document.createElement('span')
    idx.className = 'menu__idx'
    idx.textContent = String(i + 1).padStart(2, '0')
    const label = document.createElement('span')
    label.textContent = g.name

    btn.append(idx, label)
    $(btn).on('click', () => {
      onSelect(g.id)
      close()
    })
    $(btn).on('mouseenter', () => {
      if (g.id === 'all') {
        hidePreview()
        return
      }
      showPreview(profileFor(g.id) || g.items[0]?.url, g.items[0]?.url)
    })
    els.primary.append(btn)
    items.push(btn)
  })

  gsap.set(items, { y: 44, opacity: 0 })
  let open = false

  function syncActive() {
    const active = getActive()
    items.forEach((b) => $(b).toggleClass('is-active', b.dataset.id === active))
  }

  function openMenu() {
    if (open) return
    open = true
    syncActive()
    root.hidden = false
    $root.addClass('is-open')
    gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    gsap.to(items, {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.05,
      ease: 'power3.out',
      delay: 0.05,
    })
    els.openBtn.setAttribute('aria-expanded', 'true')
    onOpen?.()
  }

  function close() {
    if (!open) return
    open = false
    gsap.to(items, { y: 44, opacity: 0, duration: 0.25, ease: 'power2.in', stagger: 0.02 })
    gsap.to(root, {
      opacity: 0,
      duration: 0.3,
      delay: 0.1,
      onComplete: () => {
        root.hidden = true
        $root.removeClass('is-open')
      },
    })
    els.openBtn.setAttribute('aria-expanded', 'false')
  }

  $(els.openBtn).on('click', openMenu)
  $(els.close).on('click', close)
  $(window).on('keydown', (e) => {
    if (e.key === 'Escape') close()
  })

  return { open: openMenu, close, isOpen: () => open, syncActive }
}
