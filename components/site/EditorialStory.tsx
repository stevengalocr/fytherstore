import Image from 'next/image'

export default function EditorialStory() {
  return (
    <section id="fyther" className="editorial-story" data-reveal aria-labelledby="editorial-story-title">
      <div className="editorial-story-media">
        <Image
          src="/editorial/community-movement.webp"
          alt="Mujer entrenando en un espacio de luz cyan y rosa"
          fill
          sizes="100vw"
        />
      </div>
      <div className="editorial-story-copy container">
        <p className="section-label">A TU MANERA</p>
        <h2 id="editorial-story-title" className="display">Tu rutina también vive en los detalles.</h2>
        <p>Lo que eliges para moverte puede sentirse cercano, útil y muy tuyo.</p>
      </div>
    </section>
  )
}
