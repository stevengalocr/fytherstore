import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import FaqAccordion from '@/components/site/FaqAccordion'

const items = [
  { question: 'Primera', answer: 'Respuesta uno' },
  { question: 'Segunda', answer: 'Respuesta dos' },
]

describe('FaqAccordion', () => {
  it('renders native disclosures with answers present before JavaScript enhancement', async () => {
    const user = userEvent.setup()
    const { container } = render(<FaqAccordion items={items} />)

    const disclosures = [...container.querySelectorAll('details')]
    const questions = [...container.querySelectorAll('summary')]
    expect(disclosures).toHaveLength(2)
    expect(questions.map(({ textContent }) => textContent)).toEqual(['Primera', 'Segunda'])
    expect(screen.getByText('Respuesta uno')).toBeInTheDocument()
    expect(screen.getByText('Respuesta dos')).toBeInTheDocument()
    expect(disclosures.every((details) => !details.open)).toBe(true)

    await user.click(questions[0])
    expect(disclosures[0]).toHaveAttribute('open')
    await user.click(questions[0])
    expect(disclosures[0]).not.toHaveAttribute('open')
  })

  it('keeps every native summary in the keyboard focus order', async () => {
    const user = userEvent.setup()
    const { container } = render(<FaqAccordion items={items} />)

    const questions = [...container.querySelectorAll('summary')]
    await user.tab()
    expect(questions[0]).toHaveFocus()

    await user.tab()
    expect(questions[1]).toHaveFocus()
    expect(questions.every((question) => question.closest('details'))).toBe(true)
  })
})
