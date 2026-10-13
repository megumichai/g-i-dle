import $ from 'jquery'
import gsap from 'gsap'
import 'overlayscrollbars/overlayscrollbars.css'
import './style.css'
import { stats, groupById } from './lib/data.js'
import { createScrollbars } from './scrollbars.js'
import { createGallery } from './gallery.js'
import { createMenu } from './menu.js'
import { createLightbox } from './lightbox.js'

const currentEl = $('[data-current]')[0]
const colsEl = $('[data-cols]')[0]
const galleryEl = $('[data-gallery]')[0]

let gallery
let menu

const scrollbars = createScrollbars()

const lightbox = createLightbox($('[data-lightbox]')[0], {
  onOpen: () => gallery?.setPaused(true),
  onClose: () => gallery?.setPaused(false),
  onLock: (locked) => scrollbars.lock(locked),
})

gallery = createGallery({
  colsEl,
  onOpen: (list, index) => lightbox.open(list, index),
})

menu = createMenu({
  root: $('[data-menu]')[0],
  onSelect: (id) => selectGroup(id),
  getActive: () => gallery.group,
  onOpen: () => scrollbars.syncMenu(),
})

function selectGroup(id) {
  gallery.setFilter(id)
  const name = id === 'all' ? 'All Members' : (groupById(id)?.name ?? id)
  currentEl.textContent = name.toUpperCase()
  menu.syncActive()
}

/* meta */
$('[data-count]').text(stats.photos + ' photos')
$('[data-groups]').text(stats.members + ' members')
$('[data-year]').text(`© ${new Date().getFullYear()}`)

/* boot + resize */
selectGroup('all')

let rAF
$(window).on('resize', () => {
  clearTimeout(rAF)
  rAF = setTimeout(() => selectGroup(gallery.group), 250)
})

/* subtle intro */
gsap.from('.site-header, .site-footer', {
  opacity: 0,
  y: -12,
  duration: 0.9,
  ease: 'power2.out',
  stagger: 0.1,
})
gsap.from(galleryEl, {
  opacity: 0,
  scale: 1.03,
  duration: 1.2,
  ease: 'power2.out',
})
