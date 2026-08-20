export interface HeroFrameInput {
  scrollY: number
  start: number
  travel: number
  duration: number
  previousProgress: number
}

export interface HeroFrame {
  progress: number
  currentTime: number
  complete: boolean
}

function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function getHeroTravel(journeyHeight: number, sceneHeight: number): number {
  const journey = Number.isFinite(journeyHeight) ? journeyHeight : 0
  const scene = Number.isFinite(sceneHeight) ? sceneHeight : 0
  return Math.max(1, journey - scene)
}

export function getHeroFrame(input: HeroFrameInput): HeroFrame {
  const travel = Math.max(1, Number.isFinite(input.travel) ? input.travel : 1)
  const raw = (input.scrollY - input.start) / travel
  const progress = Math.max(
    clampProgress(input.previousProgress),
    clampProgress(raw),
  )
  const duration = Number.isFinite(input.duration) ? input.duration : 0
  const cutTime = Math.max(0, duration - 1)

  return {
    progress,
    currentTime: cutTime * progress,
    complete: progress === 1,
  }
}
