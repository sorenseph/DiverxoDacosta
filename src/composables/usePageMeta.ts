import { siteContact, siteMeta } from '@/data/site'
import { onMounted, toValue, watch, type MaybeRefOrGetter } from 'vue'

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`)
  if (!(element instanceof HTMLMetaElement)) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(href: string) {
  const current = document.head.querySelector('link[rel="canonical"]')
  const element = current instanceof HTMLLinkElement ? current : document.createElement('link')
  element.rel = 'canonical'
  element.href = href
  if (!current) document.head.appendChild(element)
}

function setJsonLd(title: string, description: string) {
  const origin = window.location.origin
  const url = window.location.href
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FoodService',
        name: siteMeta.name,
        slogan: siteMeta.tagline,
        description: siteMeta.description,
        telephone: siteContact.phoneHref.replace('tel:', ''),
        url: origin,
        image: `${origin}/media/hero.jpg`,
        areaServed: 'México',
        knowsAbout: ['Catering', 'Banquetes', 'Renta de espacios para eventos', 'Bodas', 'Eventos empresariales'],
      },
      {
        '@type': 'WebSite',
        name: siteMeta.name,
        url: origin,
        inLanguage: 'es-MX',
      },
      {
        '@type': 'WebPage',
        name: title,
        description,
        url,
        inLanguage: 'es-MX',
        isPartOf: { '@type': 'WebSite', name: siteMeta.name, url: origin },
      },
    ],
  }
  const current = document.getElementById('datos-estructurados')
  const element = current instanceof HTMLScriptElement ? current : document.createElement('script')
  element.id = 'datos-estructurados'
  element.type = 'application/ld+json'
  element.textContent = JSON.stringify(data)
  if (!current) document.head.appendChild(element)
}

export function usePageMeta(title: MaybeRefOrGetter<string>, description: MaybeRefOrGetter<string>) {
  const apply = () => {
    const fullTitle = `${toValue(title)} · DiverxoDacosta`
    document.title = fullTitle
    const text = toValue(description)
    const image = `${window.location.origin}/media/hero.jpg`
    setMeta('description', text)
    setMeta('robots', 'index, follow')
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', text, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:locale', 'es_MX', 'property')
    setMeta('og:site_name', 'DiverxoDacosta', 'property')
    setMeta('og:url', window.location.href, 'property')
    setMeta('og:image', image, 'property')
    setMeta('og:image:alt', 'Mesa de banquete de DiverxoDacosta', 'property')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', text)
    setMeta('twitter:image', image)
    setCanonical(window.location.href)
    setJsonLd(fullTitle, text)
  }

  onMounted(apply)
  watch(() => [toValue(title), toValue(description)], apply)
}
