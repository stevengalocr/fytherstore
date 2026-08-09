import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const livePort = 3197
const unconfiguredPort = 3198
const liveBaseURL = 'http://127.0.0.1:3197'
const unconfiguredBaseURL = 'http://127.0.0.1:3198'
const projectRoot = process.cwd()
const unconfiguredRoot = resolve(tmpdir(), `fyther-store-e2e-unconfigured-${process.pid}`)

const unconfiguredServerScript = `
  const { cpSync, mkdirSync, rmSync, symlinkSync } = require('node:fs')
  const { basename, relative, resolve, sep } = require('node:path')
  const { spawn, spawnSync } = require('node:child_process')
  const source = ${JSON.stringify(projectRoot)}
  const target = ${JSON.stringify(unconfiguredRoot)}
  const excludedRoots = new Set(['.git', '.next', 'node_modules', 'playwright-report', 'test-results'])
  const cleanup = () => rmSync(target, { recursive: true, force: true })

  mkdirSync(target, { recursive: true })
  cpSync(source, target, {
    recursive: true,
    filter(sourcePath) {
      const relativePath = relative(source, sourcePath)
      if (!relativePath) return true
      const root = relativePath.split(sep)[0]
      const name = basename(sourcePath)
      return !excludedRoots.has(root) && name !== '.env' && !name.startsWith('.env.')
    },
  })
  symlinkSync(resolve(source, 'node_modules'), resolve(target, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')

  const build = spawnSync('npm run build', { cwd: target, env: process.env, shell: true, stdio: 'inherit' })
  if (build.status !== 0) {
    cleanup()
    process.exit(build.status ?? 1)
  }

  const server = spawn('npm run start -- --hostname 127.0.0.1 --port ${unconfiguredPort}', {
    cwd: target,
    env: process.env,
    shell: true,
    stdio: 'inherit',
  })
  const stop = (signal) => server.kill(signal)
  process.on('SIGINT', () => stop('SIGINT'))
  process.on('SIGTERM', () => stop('SIGTERM'))
  server.on('exit', (code) => {
    cleanup()
    process.exit(code ?? 0)
  })
`

const unconfiguredServerScriptBase64 = Buffer.from(unconfiguredServerScript).toString('base64')
const unconfiguredEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  NEXT_PUBLIC_BUSINESS_ID: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  FYTHER_UNCONFIGURED_SERVER_SCRIPT: unconfiguredServerScriptBase64,
}
const unconfiguredServerCommand = `${JSON.stringify(process.execPath)} -e "eval(Buffer.from(process.env.FYTHER_UNCONFIGURED_SERVER_SCRIPT,'base64').toString('utf8'))"`

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/e2e',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-live',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: liveBaseURL },
    },
    {
      name: 'tablet-live',
      use: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, baseURL: liveBaseURL },
    },
    {
      name: 'mobile-live',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, baseURL: liveBaseURL },
    },
    {
      name: 'desktop-unconfigured',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: unconfiguredBaseURL },
    },
  ],
  webServer: [
    {
      command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${livePort}`,
      url: liveBaseURL,
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
