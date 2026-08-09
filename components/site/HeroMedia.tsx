'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type NavigatorConnection = {
  saveData?: boolean
  addEventListener?: (type: 'change', listener: EventListener) => void
  removeEventListener?: (type: 'change', listener: EventListener) => void
}

export default function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playVideo, setPlayVideo] = useState(false)

  useEffect(() => {
    const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection
    const updateVideoPreference = () => {
      setPlayVideo(!(motionPreference?.matches ?? false) && !connection?.saveData)
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
    const video = videoRef.current
    if (!video || !playVideo) return
    if (typeof IntersectionObserver === 'undefined') {
      return () => video.pause()
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => undefined)
      else video.pause()
    }, { threshold: 0.2 })
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [playVideo])

  return (
    <section id="descubrir" className="hero-section" aria-labelledby="hero-title" data-scene="hero">
      <div className="hero-media">
        <Image src="/home.jpeg" alt="Boutique nocturna de Fyther Store" fill priority sizes="100vw" className="hero-poster" />
        {playVideo && (
          <video ref={videoRef} muted loop playsInline preload="metadata" poster="/home.jpeg" aria-hidden="true">
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
    </section>
  )
}
