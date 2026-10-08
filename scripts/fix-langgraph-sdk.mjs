// @langchain/langgraph-sdk bundles its ESM dependencies under dist/node_modules with no package.json, and Node's
// "type" lookup stops at node_modules, so those files count as CommonJS. Node 24 detects the import syntax and
// loads them anyway; Vercel's function loader doesn't, and the agent crashed on load ("Cannot use import
// statement outside a module"). Mark each bundled package as a module. Runs on every npm install (postinstall).
// ponytail: delete once langgraph-sdk ships package.json files with its bundled deps (still missing in 1.12.3).
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'node_modules/@langchain/langgraph-sdk/dist/node_modules/.pnpm';
if (existsSync(root)) {
  for (const dep of readdirSync(root)) {
    const mods = join(root, dep, 'node_modules');
    if (!existsSync(mods)) continue;
    for (const name of readdirSync(mods)) {
      if (statSync(join(mods, name)).isDirectory()) writeFileSync(join(mods, name, 'package.json'), '{ "type": "module" }\n');
    }
  }
}
