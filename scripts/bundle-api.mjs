import { build } from 'vite'
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const names = readdirSync('api').filter((file) => file.endsWith('.ts')).map((file) => file.replace(/\.ts$/, ''))
const outDir = '.api-bundle'
rmSync(outDir, { recursive: true, force: true })

for (const name of names) {
  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    ssr: { noExternal: true },
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
  for (const name of names) {
    const bundled = readFileSync(join(outDir, name, `${name}.js`), 'utf8')
    writeFileSync(join('api', `${name}.ts`), bundled)
  }
}
