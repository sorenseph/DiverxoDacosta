import { build } from 'vite'
import { copyFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const names = readdirSync('server/routes').filter((file) => file.endsWith('.ts')).map((file) => file.replace(/\.ts$/, ''))
rmSync('.api-bundle', { recursive: true, force: true })

for (const name of names) {
  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    ssr: { noExternal: true },
    build: {
      ssr: join('server/routes', `${name}.ts`),
      outDir: join('.api-bundle', name),
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
  copyFileSync(join('.api-bundle', name, `${name}.js`), join('api', `${name}.js`))
}
