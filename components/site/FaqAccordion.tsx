import { type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: ReactNode
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="trust-faq-list">
      {items.map((item) => (
          <details name="fyther-faq" key={item.question}>
            <summary>
              <span>{item.question}</span>
              <ChevronDown aria-hidden="true" size={20} strokeWidth={1.7} />
            </summary>
            <div className="trust-faq-answer"><p>{item.answer}</p></div>
          </details>
      ))}
    </div>
  )
}
