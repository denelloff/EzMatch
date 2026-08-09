import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });

await build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/agent.mjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  minify: false,
  external: [
    // `ws` loads these lazily and falls back to its JavaScript implementation
    // when they are missing. Bundling them would turn an optional speed-up into
    // a hard build dependency on a C toolchain.
    'bufferutil',
    'utf-8-validate',
    // dockerode pulls in ssh2 for DOCKER_HOST=ssh://, which in turn probes for
    // native crypto and CPU-feature bindings. Every one of those requires is
    // already wrapped in a try/catch upstream, so leaving them unresolved keeps
    // the pure-JavaScript path without needing a compiler in the image.
    '*.node',
  ],
  banner: {
    // Some transitive dependencies are CommonJS and expect these to exist.
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __dirname_ } from 'node:path';",
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __dirname_(__filename);',
    ].join('\n'),
  },
  logLevel: 'info',
});
