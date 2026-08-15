import { describe, expect, it } from 'vitest'
import { getHeroFrame } from '@/lib/hero-scroll'

describe('getHeroFrame', () => {
  it('maps halfway through the scroll travel to halfway through the cut time', () => {
    expect(getHeroFrame({
      scrollY: 750,
      start: 0,
      travel: 1500,
      duration: 8,
      previousProgress: 0,
    })).toEqual({
      progress: 0.5,
      currentTime: 3.5,
      complete: false,
    })
  })

  it('completes at the end of the scroll travel', () => {
    expect(getHeroFrame({
      scrollY: 1500,
      start: 0,
      travel: 1500,
      duration: 8,
      previousProgress: 0,
    })).toEqual({
      progress: 1,
      currentTime: 7,
      complete: true,
    })
  })

  it('clamps scroll progress below zero and above one', () => {
    expect(getHeroFrame({
      scrollY: -1,
      start: 0,
      travel: 1500,
      duration: 8,
      previousProgress: 0,
    })).toEqual({
      progress: 0,
      currentTime: 0,
      complete: false,
    })

    expect(getHeroFrame({
      scrollY: 1501,
      start: 0,
      travel: 1500,
      duration: 8,
      previousProgress: 0,
    })).toEqual({
      progress: 1,
      currentTime: 7,
      complete: true,
    })
  })

  it('never moves backward from the previous progress', () => {
    const frame = getHeroFrame({
      scrollY: 200,
      start: 0,
      travel: 1000,
      duration: 8,
      previousProgress: 0.7,
    })

    expect(frame.progress).toBe(0.7)
    expect(frame.currentTime).toBeCloseTo(4.9)
    expect(frame.complete).toBe(false)
  })

  it('returns zero current time for a zero duration', () => {
    const frame = getHeroFrame({
      scrollY: 750,
      start: 0,
      travel: 1500,
      duration: 0,
      previousProgress: 0,
    })

    expect(frame.currentTime).toBe(0)
    expect(Number.isNaN(frame.currentTime)).toBe(false)
    expect(frame.currentTime).toBeGreaterThanOrEqual(0)
  })

  it('clamps nonpositive travel to one', () => {
    for (const travel of [0, -1500]) {
      expect(getHeroFrame({
        scrollY: 10,
        start: 0,
        travel,
        duration: 8,
        previousProgress: 0,
      })).toEqual({
        progress: 1,
        currentTime: 7,
        complete: true,
      })
    }
  })
})
