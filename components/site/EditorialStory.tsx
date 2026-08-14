import Image from 'next/image'

export default function EditorialStory() {
  return (
    <section id="fyther" className="editorial-story container" data-reveal aria-labelledby="editorial-story-title">
      <div className="editorial-story-media">
        <Image
          src="/modelo1.png"
          alt="Mujer entrenando en un espacio de luz cyan y rosa"
          fill
          sizes="(max-width: 767px) calc(100vw - 32px), 100vw"
        />
        <div className="editorial-story-copy">
          <p className="section-label">A TU MANERA</p>
          <h2 id="editorial-story-title" className="display">Tu rutina también vive en los detalles.</h2>
          <p>Lo que eliges para moverte puede sentirse cercano, útil y muy tuyo.</p>
        </div>
      </div>
    </section>
  )
}
