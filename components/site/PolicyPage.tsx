import type { ReactNode } from 'react'

export interface PolicySection {
  title: string
  content: ReactNode
}

export default function PolicyPage({ eyebrow, title, intro, sections }: {
  eyebrow: string
  title: string
  intro: string
  sections: PolicySection[]
}) {
  return (
    <article className="policy-page container">
      <header>
        <p className="section-label">{eyebrow}</p>
        <h1 className="display">{title}</h1>
        <p>{intro}</p>
      </header>
      <div className="policy-layout">
        <p className="policy-updated">Información vigente para esta versión de la tienda.</p>
        <div className="policy-sections">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <div>{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}
