import $ from 'jquery'
import gsap from 'gsap'

export function createLightbox(root, { onOpen, onClose, onLock } = {}) {
  const els = {
    img: root.querySelector('[data-lb-img]'),
    member: root.querySelector('[data-lb-member]'),
    group: root.querySelector('[data-lb-group]'),
    title: root.querySelector('[data-lb-title]'),
    figure: root.querySelector('[data-lb-figure]'),
    close: root.querySelector('[data-lb-close]'),
    prev: root.querySelector('[data-lb-prev]'),
    next: root.querySelector('[data-lb-next]'),
  }

  let list = []
  let index = 0
  let open = false

  function render() {
    const item = list[index]
    if (!item) return
    els.member.textContent = item.member ?? item.groupName
    els.group.textContent = item.member ? item.groupName : 'Group'
    els.title.textContent = item.title
    els.img.src = item.url
    els.img.alt = `${item.member ?? item.groupName} — ${item.groupName}`

    gsap.fromTo(
      els.img,
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', overwrite: true }
    )
  }

  function step(dir) {
    index = (index + dir + list.length) % list.length
    render()
  }

  function show() {
    if (open) return
    open = true
    root.hidden = false
    onLock?.(true)
    gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
    gsap.fromTo(
      els.figure,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    )
    render()
    onOpen?.()
  }

  function hide() {
    if (!open) return
    open = false
    gsap.to(root, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        root.hidden = true
        onLock?.(false)
        els.img.removeAttribute('src')
        onClose?.()
      },
    })
  }

  function next() {
    step(1)
  }
  function prev() {
    step(-1)
  }

  $(els.close).on('click', hide)
  $(els.next).on('click', next)
  $(els.prev).on('click', prev)
  $(root).on('click', (e) => {
    if (e.target === root) hide()
  })

  $(window).on('keydown', (e) => {
    if (!open) return
    if (e.key === 'Escape') hide()
    else if (e.key === 'ArrowRight') next()
    else if (e.key === 'ArrowLeft') prev()
  })

  return {
    open(nextList, nextIndex = 0) {
      list = nextList
      index = Math.max(0, Math.min(nextIndex, list.length - 1))
      show()
    },
    close: hide,
    get isOpen() {
      return open
    },
  }
}
