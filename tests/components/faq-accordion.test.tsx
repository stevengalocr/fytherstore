import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import FaqAccordion from '@/components/site/FaqAccordion'

const items = [
  { question: 'Primera', answer: 'Respuesta uno' },
  { question: 'Segunda', answer: 'Respuesta dos' },
]

describe('FaqAccordion', () => {
  it('starts collapsed and connects every question to its answer region', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion items={items} />)

    const firstQuestion = screen.getByRole('button', { name: 'Primera' })
    const secondQuestion = screen.getByRole('button', { name: 'Segunda' })
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false')
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region')).not.toBeInTheDocument()

    await user.click(firstQuestion)

    const answer = screen.getByRole('region', { name: 'Primera' })
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(firstQuestion).toHaveAttribute('aria-controls', answer.id)
    expect(answer).toHaveAttribute('aria-labelledby', firstQuestion.id)
    expect(answer).toHaveTextContent('Respuesta uno')
  })

  it('keeps only one answer open and toggles the active item closed', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion items={items} />)

    const firstQuestion = screen.getByRole('button', { name: 'Primera' })
    const secondQuestion = screen.getByRole('button', { name: 'Segunda' })
    await user.click(firstQuestion)
    expect(screen.getByText('Respuesta uno')).toBeVisible()

    await user.click(secondQuestion)
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Respuesta uno')).not.toBeInTheDocument()
    expect(screen.getByText('Respuesta dos')).toBeVisible()
    expect(screen.getAllByRole('region')).toHaveLength(1)

    await user.click(secondQuestion)
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })
})
