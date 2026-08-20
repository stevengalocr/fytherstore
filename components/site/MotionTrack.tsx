const items = [
  'ORIGINALES',
  'CORREOS DE COSTA RICA',
  'APARTADOS',
  'RESPUESTA EN MENOS DE 24H',
]

export default function MotionTrack() {
  return (
    <section
      className="current-rail"
      aria-label="ORIGINALES · CORREOS DE COSTA RICA · APARTADOS · RESPUESTA EN MENOS DE 24H"
      data-current
    >
      <p className="current-summary" aria-hidden="true">
        ORIGINALES <span>·</span> CORREOS DE COSTA RICA <span>·</span> APARTADOS <span>·</span> RESPUESTA EN MENOS DE 24H
      </p>
      <ul className="current-list" aria-label="Compromisos Fyther">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="current-line" aria-hidden="true"><span /></div>
    </section>
  )
}
