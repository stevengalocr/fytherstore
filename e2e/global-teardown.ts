import { existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, resolve, sep } from 'node:path'
import type { FullConfig } from '@playwright/test'

const targetPrefix = 'fyther-store-e2e-unconfigured-'

export default async function globalTeardown(config: FullConfig) {
  const target = config.metadata.unconfiguredRoot
  if (typeof target !== 'string') throw new Error('Missing unconfigured E2E cleanup target metadata')

  const resolvedTempRoot = resolve(tmpdir())
  const resolvedTarget = resolve(target)
  if (!resolvedTarget.startsWith(resolvedTempRoot + sep) || !basename(resolvedTarget).startsWith(targetPrefix)) {
    throw new Error(`Refusing to stop unsafe unconfigured E2E target: ${resolvedTarget}`)
  }
  if (!existsSync(resolvedTarget)) return

  writeFileSync(resolve(resolvedTarget, '.shutdown'), 'shutdown\n', 'utf8')
  const deadline = Date.now() + 15_000
  while (existsSync(resolvedTarget) && Date.now() < deadline) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
  }
  if (existsSync(resolvedTarget)) {
    throw new Error(`Unconfigured E2E target was not cleaned: ${resolvedTarget}`)
  }

  console.error(`[unconfigured-e2e] teardown confirmed ${resolvedTarget}`)
}
