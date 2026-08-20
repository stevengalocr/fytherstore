'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown } from 'lucide-react'
import { getHeroFrame, getHeroTravel } from '@/lib/hero-scroll'

type NavigatorConnection = {
  saveData?: boolean
  addEventListener?: (type: 'change', listener: EventListener) => void
  removeEventListener?: (type: 'change', listener: EventListener) => void
}

function setCategoryCueAvailability(cue: HTMLAnchorElement | null, isAvailable: boolean) {
  if (!cue) return

  cue.tabIndex = isAvailable ? 0 : -1
  cue.toggleAttribute('aria-hidden', !isAvailable)
}

export default function HeroMedia() {
  const journeyRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const categoryCueRef = useRef<HTMLAnchorElement>(null)
  const frameRef = useRef<number | null>(null)
  const previousProgressRef = useRef(0)
  const [canScrubVideo, setCanScrubVideo] = useState<boolean | null>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const shouldScrubVideo = canScrubVideo === true && !videoFailed
  const isStaticHero = canScrubVideo === false || videoFailed

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
    const journey = journeyRef.current
    const scene = sceneRef.current
    const video = videoRef.current
    if (!journey || !scene || !video || !shouldScrubVideo) return

    video.pause()
    let scrollAttached = false

    const detachScroll = () => {
      if (!scrollAttached) return
      window.removeEventListener('scroll', scheduleFrame)
      scrollAttached = false
    }

    const updateFrame = () => {
      frameRef.current = null
      const start = journey.getBoundingClientRect().top + window.scrollY
      const frame = getHeroFrame({
        scrollY: window.scrollY,
        start,
        travel: getHeroTravel(journey.offsetHeight, scene.offsetHeight),
        duration: video.duration,
        previousProgress: previousProgressRef.current,
      })

      previousProgressRef.current = frame.progress
      video.currentTime = frame.currentTime
      journey.style.setProperty('--hero-progress', String(frame.progress))
      journey.style.setProperty('--hero-media-scale', String(1.025 - frame.progress * 0.025))
      journey.style.setProperty('--hero-media-shift', `${frame.progress * -12}px`)
      journey.style.setProperty('--hero-copy-shift', `${frame.progress * -24}px`)
      journey.style.setProperty('--hero-copy-opacity', String(1 - frame.progress * 0.72))
      journey.style.setProperty('--hero-scrim-opacity', String(0.72 + frame.progress * 0.28))
      journey.dataset.heroComplete = String(frame.complete)
      setCategoryCueAvailability(categoryCueRef.current, frame.complete)
      if (frame.complete) detachScroll()
    }

    const scheduleFrame = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(updateFrame)
    }

    window.addEventListener('scroll', scheduleFrame, { passive: true })
    scrollAttached = true
    window.addEventListener('resize', scheduleFrame)
    video.addEventListener('loadedmetadata', scheduleFrame)
    scheduleFrame()

    return () => {
      detachScroll()
      window.removeEventListener('resize', scheduleFrame)
      video.removeEventListener('loadedmetadata', scheduleFrame)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      video.pause()
    }
  }, [shouldScrubVideo])

  useEffect(() => {
    const journey = journeyRef.current
    if (!journey || !isStaticHero) return

    previousProgressRef.current = 0
    journey.style.setProperty('--hero-progress', '0')
    journey.style.setProperty('--hero-media-scale', '1')
    journey.style.setProperty('--hero-media-shift', '0px')
    journey.style.setProperty('--hero-copy-shift', '0px')
    journey.style.setProperty('--hero-copy-opacity', '1')
    journey.style.setProperty('--hero-scrim-opacity', '0.72')
    journey.dataset.heroComplete = 'false'
    setCategoryCueAvailability(categoryCueRef.current, false)
  }, [isStaticHero])

  return (
    <section
      ref={journeyRef}
      id="descubrir"
      className={`hero-journey${isStaticHero ? ' hero-journey-static' : ''}`}
      aria-labelledby="hero-title"
      data-scene="hero"
      data-hero-complete="false"
      data-hero-static={String(isStaticHero)}
      style={{ '--hero-progress': '0' } as CSSProperties}
    >
      <div ref={sceneRef} className="hero-section hero-scene">
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
          {shouldScrubVideo && (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="metadata"
              poster="/editorial/hero-poster-desktop.webp"
              aria-hidden="true"
              onError={() => setVideoFailed(true)}
            >
              <source src="/video-presentacion.mp4" type="video/mp4" />
            </video>
          )}
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-content container">
          <p>PARA MOVERTE, COMPARTIR Y SENTIRTE BIEN</p>
          <h1 id="hero-title" className="display">Muévete a tu manera.</h1>
          <p className="hero-description">Ropa y accesorios elegidos para moverte, compartir y sentirte bien.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#ropa">Descubrir ropa</Link>
            <Link className="button button-secondary" href="#accesorios">Ver accesorios</Link>
          </div>
        </div>
        <Link ref={categoryCueRef} className="hero-category-cue" href="#ropa" tabIndex={-1} aria-hidden="true">
          Continuar a las categorías
          <ArrowDown aria-hidden="true" size={16} strokeWidth={1.8} />
        </Link>
      </div>
    </section>
  )
}
