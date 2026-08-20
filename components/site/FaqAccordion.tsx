'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: ReactNode
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const accordionId = useId()

  return (
    <div className="trust-faq-list">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const questionId = `${accordionId}-question-${index}`
        const answerId = `${accordionId}-answer-${index}`

        return (
          <div className="trust-faq-item" data-open={isOpen ? 'true' : undefined} key={questionId}>
            <button
              id={questionId}
              className="trust-faq-question"
              type="button"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <ChevronDown aria-hidden="true" size={20} strokeWidth={1.7} />
            </button>
            <div
              id={answerId}
              className="trust-faq-answer"
              role="region"
              aria-labelledby={questionId}
              hidden={!isOpen}
            >
              {isOpen && <p>{item.answer}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
