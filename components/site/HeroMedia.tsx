'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getHeroFrame } from '@/lib/hero-scroll'

type NavigatorConnection = {
  saveData?: boolean
  addEventListener?: (type: 'change', listener: EventListener) => void
  removeEventListener?: (type: 'change', listener: EventListener) => void
}

export default function HeroMedia() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<number | null>(null)
  const previousProgressRef = useRef(0)
  const [canScrubVideo, setCanScrubVideo] = useState<boolean | null>(null)

  useEffect(() => {
    const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection
    const updateVideoPreference = () => {
      setCanScrubVideo(!(motionPreference?.matches ?? false) && !connection?.saveData)
    }

    updateVideoPreference()
    if (motionPreference?.addEventListener) {
      motionPreference.addEventListener('change', updateVideoPreference)
    } else {
      motionPreference?.addListener?.(updateVideoPreference)
    }
    connection?.addEventListener?.('change', updateVideoPreference)

    return () => {
      if (motionPreference?.removeEventListener) {
        motionPreference.removeEventListener('change', updateVideoPreference)
      } else {
        motionPreference?.removeListener?.(updateVideoPreference)
      }
      connection?.removeEventListener?.('change', updateVideoPreference)
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video || !canScrubVideo) return

    video.pause()

    const updateFrame = () => {
      frameRef.current = null
      const start = section.getBoundingClientRect().top + window.scrollY
      const frame = getHeroFrame({
        scrollY: window.scrollY,
        start,
        travel: section.offsetHeight - window.innerHeight,
        duration: video.duration,
        previousProgress: previousProgressRef.current,
      })

      previousProgressRef.current = frame.progress
      video.currentTime = frame.currentTime
      section.style.setProperty('--hero-progress', String(frame.progress))
      section.style.setProperty('--hero-media-scale', String(1.025 - frame.progress * 0.025))
      section.style.setProperty('--hero-media-shift', `${frame.progress * -12}px`)
      section.style.setProperty('--hero-copy-shift', `${frame.progress * -10}px`)
      section.style.setProperty('--hero-copy-opacity', String(1 - frame.progress * 0.18))
      section.style.setProperty('--hero-scrim-opacity', String(0.72 + frame.progress * 0.28))
      section.dataset.heroComplete = String(frame.complete)
    }

    const scheduleFrame = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(updateFrame)
    }

    window.addEventListener('scroll', scheduleFrame, { passive: true })
    window.addEventListener('resize', scheduleFrame)
    video.addEventListener('loadedmetadata', scheduleFrame)
    scheduleFrame()

    return () => {
      window.removeEventListener('scroll', scheduleFrame)
      window.removeEventListener('resize', scheduleFrame)
      video.removeEventListener('loadedmetadata', scheduleFrame)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      video.pause()
    }
  }, [canScrubVideo])

  return (
    <section
      ref={sectionRef}
      id="descubrir"
      className="hero-section"
      aria-labelledby="hero-title"
      data-scene="hero"
      data-hero-complete="false"
    >
      <div className="hero-scene">
        <div className="hero-media">
          <picture className="hero-poster-frame">
            <source className="hero-poster-mobile" media="(max-width: 767px)" srcSet="/editorial/hero-poster-mobile.webp" />
            <Image
              src="/editorial/hero-poster-desktop.webp"
              alt="Fyther Store, entrada a la colección"
              fill
              priority
              sizes="100vw"
              className="hero-poster hero-poster-desktop"
            />
          </picture>
          {canScrubVideo && (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="metadata"
              poster="/editorial/hero-poster-desktop.webp"
              aria-hidden="true"
            >
              <source src="/video-presentacion.mp4" type="video/mp4" />
            </video>
          )}
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-content container" data-reveal>
          <p>PARA MOVERTE, COMPARTIR Y SENTIRTE BIEN</p>
          <h1 id="hero-title" className="display">Muévete a tu manera.</h1>
          <p className="hero-description">Ropa y accesorios elegidos para moverte, compartir y sentirte bien.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#ropa">Descubrir ropa</Link>
            <Link className="button button-secondary" href="#accesorios">Ver accesorios</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
