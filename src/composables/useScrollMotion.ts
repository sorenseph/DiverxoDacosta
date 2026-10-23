import { nextTick, onUnmounted, type Ref } from 'vue'

const itemSelector = [
  '.package-card',
  '.offer-card',
  '.space-row',
  '.service-list a',
  '.process article',
  '.gallery-grid figure',
  '.space-mini a',
  '.reservation-card',
  '.reel-card',
  '.choice',
  '.faq-item',
  '.section-head',
  '.cta-frame',
  '.filmstrip',
].join(', ')

export function useScrollMotion(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | null = null
  let scrollFrame = 0
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function parallax() {
    const scope = root.value
    if (!scope || reduce) return
    const mid = window.innerHeight / 2
    for (const node of scope.querySelectorAll<HTMLElement>('.parallax')) {
      const rect = node.getBoundingClientRect()
      const delta = (rect.top + rect.height / 2 - mid) / window.innerHeight
      const shift = Math.max(-28, Math.min(28, delta * -42))
      node.style.setProperty('--py', `${shift.toFixed(1)}px`)
    }
  }

  function onScroll() {
    cancelAnimationFrame(scrollFrame)
    scrollFrame = requestAnimationFrame(parallax)
  }

  function scan() {
    observer?.disconnect()
    const scope = root.value
    if (!scope) return
    const items = [...scope.querySelectorAll<HTMLElement>(itemSelector)]
    const sections = [...scope.querySelectorAll<HTMLElement>('section:not(.hero):not(.marquee):not(.cinema-band)')]
    const looseSections = sections.filter((section) => !section.querySelector(itemSelector))
    const groups = new Map<HTMLElement, HTMLElement[]>()

    if (!reduce) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer?.unobserve(entry.target)
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' })
    }

    for (const element of [...items, ...looseSections]) {
      const parent = element.parentElement ?? scope
      const list = groups.get(parent) ?? []
      list.push(element)
      groups.set(parent, list)
    }

    for (const list of groups.values()) {
      list.forEach((element, index) => {
        element.classList.add('rise')
        element.style.setProperty('--d', `${Math.min(index, 7) * 80}ms`)
        if (reduce || element.classList.contains('is-in')) {
          element.classList.add('is-in')
          return
        }
        observer?.observe(element)
      })
    }
  }

  async function refresh() {
    await nextTick()
    requestAnimationFrame(() => {
      scan()
      parallax()
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onUnmounted(() => {
    observer?.disconnect()
    cancelAnimationFrame(scrollFrame)
    window.removeEventListener('scroll', onScroll)
  })

  return { refresh }
}
