'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Init Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutCubic
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
    })

    lenisRef.current = lenis

    // requestAnimationFrame: continuously update the scroll
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Handle anchor links
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement
      if (target.hash) {
        e.preventDefault()
        const element = document.querySelector(target.hash) as HTMLElement
        if (element) {
          lenis.scrollTo(element, { duration: 1.5 })
        }
      }
    }

    // Event listeners for anchor links
    document.addEventListener('click', handleAnchorClick)

    // Cleanup function to prevent memory leaks
    return () => {
      document.removeEventListener('click', handleAnchorClick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
