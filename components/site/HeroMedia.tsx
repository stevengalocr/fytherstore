'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playVideo, setPlayVideo] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const connection = navigator as Navigator & { connection?: { saveData?: boolean } }
    if (!reduce && !connection.connection?.saveData) setPlayVideo(true)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playVideo || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => undefined)
      else video.pause()
    }, { threshold: 0.2 })
    observer.observe(video)
    return () => observer.disconnect()
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
        <p className="hero-description">Una selección de ropa activa para entrenar, caminar o disfrutar el día con las personas que te impulsan.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/catalogo">Ver la colección</Link>
          <Link className="button button-secondary" href="/#fyther">Conocer Fyther</Link>
        </div>
      </div>
    </section>
  )
}
