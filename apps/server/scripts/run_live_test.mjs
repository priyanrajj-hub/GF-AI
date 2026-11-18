import { execSync } from 'node:child_process'

process.env.LIVE_MARKET_TEST = 'true'
try {
  execSync('npx vitest run tests/trading_live.test.ts', {
    stdio: 'inherit',
    env: { ...process.env, LIVE_MARKET_TEST: 'true' },
  })
} catch (err) {
  process.exit(1)
}
