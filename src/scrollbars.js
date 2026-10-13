import { OverlayScrollbars } from 'overlayscrollbars'

const BASE = {
  scrollbars: {
    theme: 'os-theme-light',
    autoHide: 'leave',
    autoHideDelay: 500,
  },
}

/**
 * Overlay scrollbars for the two scroll containers of the site:
 * the document (page) and the full-screen menu list.
 *
 * The page instance targets `document.body`, which keeps the native
 * `window.scrollY` / `window.scrollTo` behavior intact while replacing
 * the browser scrollbar with a themed one.
 */
export function createScrollbars() {
  const page = OverlayScrollbars(document.body, {
    ...BASE,
    scrollbars: { ...BASE.scrollbars, autoHide: 'scroll' },
    overflow: { x: 'hidden', y: 'scroll' },
  })

  const menu = OverlayScrollbars(document.querySelector('.menu__inner'), {
    ...BASE,
    overflow: { x: 'hidden', y: 'scroll' },
  })

  return {
    page,
    menu,
    /** Lock / unlock page scrolling (used by the lightbox). */
    lock(locked) {
      page.options({ overflow: { y: locked ? 'hidden' : 'scroll' } })
    },
    /** Re-measure the menu list after it becomes visible. */
    syncMenu() {
      menu.update(true)
    },
  }
}
