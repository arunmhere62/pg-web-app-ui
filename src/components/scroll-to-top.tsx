import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll the window
    window.scrollTo(0, 0)

    // Also scroll any inner scrollable containers (PublicLayout uses overflow-y-auto divs)
    const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"]')
    scrollContainers.forEach((el) => {
      el.scrollTo(0, 0)
    })
  }, [pathname])

  return null
}
