const values = [
  'Calidad seleccionada',
  'Originalidad verificable',
  'Lista para moverte',
]

export default function WhyFyther() {
  return (
    <section id="fyther" className="why-fyther container" data-reveal aria-labelledby="why-fyther-title">
      <div className="why-fyther-heading">
        <p className="section-label">POR QUÉ FYTHER</p>
        <h2 id="why-fyther-title" className="display">Elegimos con intención.</h2>
      </div>
      <ol className="why-fyther-values">
        {values.map((value, index) => (
          <li key={value}>
            <span aria-hidden="true">0{index + 1}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ol>
    </section>
  )
}
