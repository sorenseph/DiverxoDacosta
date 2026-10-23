import { build } from 'vite'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const names = readdirSync('api').filter((file) => file.endsWith('.ts')).map((file) => file.replace(/\.ts$/, ''))
const outDir = '.api-bundle'
rmSync(outDir, { recursive: true, force: true })

for (const name of names) {
  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    build: {
      ssr: join('api', `${name}.ts`),
      outDir: join(outDir, name),
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          format: 'es',
          codeSplitting: false,
          entryFileNames: `${name}.js`,
        },
      },
    },
  })
}

if (process.env.VERCEL === '1') {
  mkdirSync('api', { recursive: true })
  for (const name of names) {
    cpSync(join(outDir, name, `${name}.js`), join('api', `${name}.js`))
    rmSync(join('api', `${name}.ts`))
  }
}
