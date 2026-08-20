import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import FaqAccordion from '@/components/site/FaqAccordion'

const items = [
  { question: 'Primera', answer: 'Respuesta uno' },
  { question: 'Segunda', answer: 'Respuesta dos' },
]

function getControlledPanel(question: HTMLElement) {
  const panelId = question.getAttribute('aria-controls')
  expect(panelId).toBeTruthy()
  const panel = document.getElementById(panelId as string)
  expect(panel).toBeInTheDocument()
  return panel as HTMLElement
}

function expectCollapsed(question: HTMLElement, answer: string) {
  const panel = getControlledPanel(question)
  expect(question).toHaveAttribute('aria-expanded', 'false')
  expect(panel).toHaveAttribute('role', 'region')
  expect(panel).toHaveAttribute('aria-labelledby', question.id)
  expect(panel).toHaveAttribute('hidden')
  expect(panel).not.toHaveAttribute('tabindex')
  expect(panel.querySelectorAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0)
  expect(screen.queryByText(answer)).not.toBeInTheDocument()
}

describe('FaqAccordion', () => {
  it('keeps every aria-controls panel mounted through its complete toggle lifecycle', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion items={items} />)

    const firstQuestion = screen.getByRole('button', { name: 'Primera' })
    const secondQuestion = screen.getByRole('button', { name: 'Segunda' })
    expectCollapsed(firstQuestion, 'Respuesta uno')
    expectCollapsed(secondQuestion, 'Respuesta dos')
    expect(screen.queryByRole('region')).not.toBeInTheDocument()

    await user.click(firstQuestion)

    const firstPanel = getControlledPanel(firstQuestion)
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(firstPanel).not.toHaveAttribute('hidden')
    expect(screen.getByRole('region', { name: 'Primera' })).toBe(firstPanel)
    expect(firstPanel).toHaveTextContent('Respuesta uno')
    expectCollapsed(secondQuestion, 'Respuesta dos')

    await user.click(secondQuestion)

    expectCollapsed(firstQuestion, 'Respuesta uno')
    const secondPanel = getControlledPanel(secondQuestion)
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(secondPanel).not.toHaveAttribute('hidden')
    expect(screen.getByRole('region', { name: 'Segunda' })).toBe(secondPanel)
    expect(secondPanel).toHaveTextContent('Respuesta dos')
    expect(screen.getAllByRole('region')).toHaveLength(1)

    await user.click(secondQuestion)

    expectCollapsed(firstQuestion, 'Respuesta uno')
    expectCollapsed(secondQuestion, 'Respuesta dos')
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('uses unique IDs and preserves native keyboard toggling', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion items={items} />)

    const questions = screen.getAllByRole('button')
    expect(new Set(questions.map(({ id }) => id)).size).toBe(questions.length)
    expect(new Set(questions.map((question) => getControlledPanel(question).id)).size).toBe(questions.length)

    await user.tab()
    expect(questions[0]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(questions[0]).toHaveAttribute('aria-expanded', 'true')

    await user.tab()
    expect(questions[1]).toHaveFocus()
    await user.keyboard(' ')
    expect(questions[0]).toHaveAttribute('aria-expanded', 'false')
    expect(questions[1]).toHaveAttribute('aria-expanded', 'true')
  })
})
