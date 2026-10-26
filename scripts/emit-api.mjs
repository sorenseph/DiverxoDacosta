import { build } from 'vite'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

if (!existsSync('dist/index.html')) {
  throw new Error('No está dist/index.html. El sitio se construye antes de las funciones.')
}

const output = '.vercel/output'
rmSync(output, { recursive: true, force: true })
rmSync('.api-bundle', { recursive: true, force: true })

const names = readdirSync('server/routes')
  .filter((file) => file.endsWith('.ts'))
  .map((file) => file.slice(0, -3))

const functionConfig = {
  runtime: 'nodejs22.x',
  handler: 'index.js',
  launcherType: 'Nodejs',
  shouldAddHelpers: true,
}

for (const name of names) {
  const bundled = join('.api-bundle', name)
  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    ssr: { noExternal: true },
    build: {
      ssr: join('server/routes', `${name}.ts`),
      outDir: bundled,
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          format: 'es',
          codeSplitting: false,
          entryFileNames: 'index.js',
        },
      },
    },
  })
  const func = join(output, 'functions', 'api', `${name}.func`)
  mkdirSync(func, { recursive: true })
  cpSync(join(bundled, 'index.js'), join(func, 'index.js'))
  writeFileSync(join(func, 'package.json'), '{"type":"module"}\n')
  writeFileSync(join(func, '.vc-config.json'), `${JSON.stringify(functionConfig)}\n`)
}

cpSync('dist', join(output, 'static'), { recursive: true })
writeFileSync(join(output, 'config.json'), `${JSON.stringify({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: '/api/$1' },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2)}\n`)
