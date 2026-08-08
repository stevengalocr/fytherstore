'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownRight } from 'lucide-react'

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
    <section id="descubrir" className="hero-section dark-surface" aria-labelledby="hero-title">
      <div className="hero-media">
        <Image src="/home.jpeg" alt="Campaña de Fyther Store" fill priority sizes="100vw" className="hero-poster" />
        {playVideo && (
          <video ref={videoRef} muted loop playsInline preload="metadata" poster="/home.jpeg" aria-hidden="true">
            <source src="/video-presentacion.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content container">
        <p>FYTHER / ACTIVE STORE</p>
        <h1 id="hero-title" className="display" aria-label="Move Different.">MOVE<br />DIFFERENT.</h1>
        <div className="hero-support">
          <span>Ropa y accesorios deportivos seleccionados para moverte con confianza.</span>
          <Link className="button button-accent" href="/catalogo">
            Shop the drop <ArrowDownRight aria-hidden="true" size={18} strokeWidth={1.7} />
          </Link>
        </div>
      </div>
    </section>
  )
}
