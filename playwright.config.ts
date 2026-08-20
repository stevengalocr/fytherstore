import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const configuredPort = 3197
const unconfiguredPort = 3198
const configuredBaseURL = 'http://127.0.0.1:3197'
const unconfiguredBaseURL = 'http://127.0.0.1:3198'
const projectRoot = process.cwd()
const unconfiguredRootPrefix = 'fyther-store-e2e-unconfigured-'
const unconfiguredRoot = resolve(tmpdir(), `${unconfiguredRootPrefix}${process.pid}-${Date.now()}`)

const unconfiguredServerScript = `
  const { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } = require('node:fs')
  const { tmpdir } = require('node:os')
  const { basename, relative, resolve, sep } = require('node:path')
  const { spawn, spawnSync } = require('node:child_process')
  const source = ${JSON.stringify(projectRoot)}
  const target = ${JSON.stringify(unconfiguredRoot)}
  const targetPrefix = ${JSON.stringify(unconfiguredRootPrefix)}
  const resolvedTempRoot = resolve(tmpdir())
  const resolvedTarget = resolve(target)
  const excludedRoots = new Set(['.git', '.next', 'node_modules', 'playwright-report', 'test-results'])
  let cleaned = false

  function validateTarget() {
    if (!resolvedTarget.startsWith(resolvedTempRoot + sep) || !basename(resolvedTarget).startsWith(targetPrefix)) {
      throw new Error('Refusing to clean unsafe unconfigured E2E target: ' + resolvedTarget)
    }
  }

  function cleanup() {
    if (cleaned) return
    validateTarget()
    rmSync(resolvedTarget, { recursive: true, force: true })
    cleaned = true
    console.error('[unconfigured-e2e] cleaned ' + resolvedTarget)
  }

  validateTarget()
  console.error('[unconfigured-e2e] target ' + resolvedTarget)

  try {
    mkdirSync(resolvedTarget, { recursive: true })
    cpSync(source, resolvedTarget, {
      recursive: true,
      filter(sourcePath) {
        const relativePath = relative(source, sourcePath)
        if (!relativePath) return true
        const root = relativePath.split(sep)[0]
        const name = basename(sourcePath)
        return !excludedRoots.has(root) && name !== '.env' && !name.startsWith('.env.')
      },
    })
    symlinkSync(resolve(source, 'node_modules'), resolve(resolvedTarget, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
  } catch (error) {
    console.error(error)
    cleanup()
    process.exit(1)
  }

  const nextCli = resolve(resolvedTarget, 'node_modules', 'next', 'dist', 'bin', 'next')
  const build = spawnSync(process.execPath, [nextCli, 'build'], {
    cwd: resolvedTarget,
    env: process.env,
    stdio: 'inherit',
  })
  if (build.error || build.status !== 0) {
    if (build.error) console.error(build.error)
    cleanup()
    process.exit(build.status ?? 1)
  }

  const server = spawn(process.execPath, [nextCli, 'start', '--hostname', '127.0.0.1', '--port', '${unconfiguredPort}'], {
    cwd: resolvedTarget,
    env: process.env,
    stdio: 'inherit',
  })

  let finished = false
  let shuttingDown = false
  let requestedExitCode = 0
  let forceTimer
  let finalTimer
  let shutdownPoll

  function finish(code) {
    if (finished) return
    finished = true
    if (forceTimer) clearTimeout(forceTimer)
    if (finalTimer) clearTimeout(finalTimer)
    if (shutdownPoll) clearInterval(shutdownPoll)
    cleanup()
    process.exit(code)
  }

  function stop(signal, exitCode = signal === 'SIGINT' ? 130 : 143) {
    if (shuttingDown || finished) return
    shuttingDown = true
    requestedExitCode = exitCode

    if (server.exitCode !== null || server.signalCode !== null) {
      finish(requestedExitCode)
      return
    }

    server.kill(signal)
    forceTimer = setTimeout(() => {
      if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL')
      finalTimer = setTimeout(() => finish(requestedExitCode), 2_000)
    }, 5_000)
  }

  process.once('SIGINT', () => stop('SIGINT'))
  process.once('SIGTERM', () => stop('SIGTERM'))
  const shutdownMarker = resolve(resolvedTarget, '.shutdown')
  shutdownPoll = setInterval(() => {
    if (existsSync(shutdownMarker)) stop('SIGTERM', 0)
  }, 100)
  server.once('error', (error) => {
    console.error(error)
    finish(shuttingDown ? requestedExitCode : 1)
  })
  server.once('exit', (code) => {
    finish(shuttingDown ? requestedExitCode : (code ?? 1))
  })
`

const unconfiguredServerScriptBase64 = Buffer.from(unconfiguredServerScript).toString('base64')
const configuredEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  NEXT_PUBLIC_BUSINESS_ID: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  FYTHER_E2E_COMMERCE_FIXTURE: 'live',
}
const unconfiguredEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  NEXT_PUBLIC_BUSINESS_ID: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  // Production builds must ignore this flag; the unconfigured project is the build contract.
  FYTHER_E2E_COMMERCE_FIXTURE: 'live',
  FYTHER_UNCONFIGURED_SERVER_SCRIPT: unconfiguredServerScriptBase64,
}
const unconfiguredServerCommand = `${JSON.stringify(process.execPath)} -e "eval(Buffer.from(process.env.FYTHER_UNCONFIGURED_SERVER_SCRIPT,'base64').toString('utf8'))"`

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/e2e',
  globalTeardown: './e2e/global-teardown.ts',
  metadata: { unconfiguredRoot },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-configured',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: configuredBaseURL },
    },
    {
      name: 'tablet-configured',
      use: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, baseURL: configuredBaseURL },
    },
    {
      name: 'mobile-configured',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, baseURL: configuredBaseURL },
    },
    {
      name: 'desktop-unconfigured',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: unconfiguredBaseURL },
    },
    {
      name: 'desktop-no-js-configured',
      grep: /without JavaScript/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: configuredBaseURL,
        javaScriptEnabled: false,
      },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --hostname 127.0.0.1 --port ${configuredPort}`,
      url: configuredBaseURL,
      env: configuredEnv,
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      command: unconfiguredServerCommand,
      url: unconfiguredBaseURL,
      env: unconfiguredEnv,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
})
