import $ from 'jquery'
import gsap from 'gsap'
import { groups } from './lib/data.js'

export function createMenu({ root, onSelect, getActive }) {
  const $root = $(root)
  const els = {
    primary: root.querySelector('[data-menu-primary]'),
    img: root.querySelector('[data-menu-img]'),
    close: root.querySelector('[data-menu-close]'),
    openBtn: document.querySelector('[data-menu-open]'),
  }

  const entries = [{ id: 'all', name: 'All Members' }, ...groups]
  let items = []
  let previewSrc = ''

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
      const src = g.id === 'all' ? groups[0].items[0]?.url : g.items[0]?.url
      if (src && src !== previewSrc) {
        previewSrc = src
        $(els.img).removeClass('is-shown')
        const next = new Image()
        next.onload = () => {
          els.img.src = src
          requestAnimationFrame(() => $(els.img).addClass('is-shown'))
        }
        next.src = src
      }
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
