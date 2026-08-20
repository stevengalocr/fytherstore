import { describe, expect, it } from 'vitest'
import { getHeroFrame, type HeroFrame } from '@/lib/hero-scroll'
import * as heroScroll from '@/lib/hero-scroll'

function expectFiniteBoundedFrame(frame: HeroFrame) {
  expect(Number.isFinite(frame.progress)).toBe(true)
  expect(Number.isFinite(frame.currentTime)).toBe(true)
  expect(frame.progress).toBeGreaterThanOrEqual(0)
  expect(frame.progress).toBeLessThanOrEqual(1)
  expect(frame.currentTime).toBeGreaterThanOrEqual(0)
  expect(frame.complete).toBe(frame.progress === 1)
}

describe('getHeroFrame', () => {
  it('derives mobile travel from the journey and actual sticky scene heights', () => {
    const getHeroTravel = (heroScroll as unknown as {
      getHeroTravel?: (journeyHeight: number, sceneHeight: number) => number
    }).getHeroTravel

    expect(getHeroTravel).toEqual(expect.any(Function))
    if (!getHeroTravel) return
    expect(getHeroTravel(1200, 840)).toBe(360)
    expect(getHeroTravel(1200, 1000)).toBe(200)
    expect(getHeroTravel(840, 840)).toBe(1)
  })

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
    expect(getHeroFrame({
      scrollY: 750,
      start: 0,
      travel: 1500,
      duration: 0,
      previousProgress: 0,
    })).toEqual({
      progress: 0.5,
      currentTime: 0,
      complete: false,
    })
  })

  it('clamps nonpositive travel to one', () => {
    for (const travel of [0, -1500]) {
      expect(getHeroFrame({
        scrollY: 0.5,
        start: 0,
        travel,
        duration: 8,
        previousProgress: 0,
      })).toEqual({
        progress: 0.5,
        currentTime: 3.5,
        complete: false,
      })
    }
  })

  it.each([
    { label: 'NaN', travel: Number.NaN },
    { label: 'positive infinity', travel: Number.POSITIVE_INFINITY },
    { label: 'negative infinity', travel: Number.NEGATIVE_INFINITY },
  ])('falls back to one for $label travel', ({ travel }) => {
    const frame = getHeroFrame({
      scrollY: 0.5,
      start: 0,
      travel,
      duration: 8,
      previousProgress: 0,
    })

    expect(frame).toEqual({
      progress: 0.5,
      currentTime: 3.5,
      complete: false,
    })
    expectFiniteBoundedFrame(frame)
  })

  it.each([
    { label: 'NaN', duration: Number.NaN },
    { label: 'positive infinity', duration: Number.POSITIVE_INFINITY },
    { label: 'negative infinity', duration: Number.NEGATIVE_INFINITY },
  ])('falls back to zero for $label duration', ({ duration }) => {
    const frame = getHeroFrame({
      scrollY: 0.5,
      start: 0,
      travel: 1,
      duration,
      previousProgress: 0,
    })

    expect(frame).toEqual({
      progress: 0.5,
      currentTime: 0,
      complete: false,
    })
    expectFiniteBoundedFrame(frame)
  })

  it.each([
    {
      label: 'NaN scroll position',
      scrollY: Number.NaN,
      start: 0,
      expected: { progress: 0, currentTime: 0, complete: false },
    },
    {
      label: 'positive infinite scroll position',
      scrollY: Number.POSITIVE_INFINITY,
      start: 0,
      expected: { progress: 1, currentTime: 7, complete: true },
    },
    {
      label: 'negative infinite scroll position',
      scrollY: Number.NEGATIVE_INFINITY,
      start: 0,
      expected: { progress: 0, currentTime: 0, complete: false },
    },
    {
      label: 'NaN start position',
      scrollY: 0.5,
      start: Number.NaN,
      expected: { progress: 0, currentTime: 0, complete: false },
    },
    {
      label: 'positive infinite start position',
      scrollY: 0.5,
      start: Number.POSITIVE_INFINITY,
      expected: { progress: 0, currentTime: 0, complete: false },
    },
    {
      label: 'negative infinite start position',
      scrollY: 0.5,
      start: Number.NEGATIVE_INFINITY,
      expected: { progress: 1, currentTime: 7, complete: true },
    },
  ])('clamps raw progress from $label', ({ scrollY, start, expected }) => {
    const frame = getHeroFrame({
      scrollY,
      start,
      travel: 1,
      duration: 8,
      previousProgress: 0,
    })

    expect(frame).toEqual(expected)
    expectFiniteBoundedFrame(frame)
  })

  it.each([
    {
      label: 'NaN',
      previousProgress: Number.NaN,
      expected: { progress: 0.2, currentTime: 7 * 0.2, complete: false },
    },
    {
      label: 'positive infinity',
      previousProgress: Number.POSITIVE_INFINITY,
      expected: { progress: 1, currentTime: 7, complete: true },
    },
    {
      label: 'negative infinity',
      previousProgress: Number.NEGATIVE_INFINITY,
      expected: { progress: 0.2, currentTime: 7 * 0.2, complete: false },
    },
  ])('preserves bounded monotonic progress for $label previous progress', ({
    previousProgress,
    expected,
  }) => {
    const frame = getHeroFrame({
      scrollY: 0.2,
      start: 0,
      travel: 1,
      duration: 8,
      previousProgress,
    })

    expect(frame).toEqual(expected)
    expectFiniteBoundedFrame(frame)
  })
})
