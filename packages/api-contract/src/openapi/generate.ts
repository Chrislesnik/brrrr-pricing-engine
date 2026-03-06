import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { registry, registerRoutes } from './registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../../dist');

registerRoutes();

const generator = new OpenApiGeneratorV3(registry.definitions);

const doc = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'dscr.ai API',
    version: '1.0.0',
    description:
      'REST API for managing deals, loans, borrowers, entities, scenarios, and more within the dscr.ai platform.',
  },
  servers: [
    {
      url: 'https://pricingengine.pro',
      description: 'Production',
    },
  ],
});

fs.mkdirSync(distDir, { recursive: true });

const jsonPath = path.join(distDir, 'openapi.json');
fs.writeFileSync(jsonPath, JSON.stringify(doc, null, 2));

const pathCount = Object.keys(doc.paths ?? {}).length;
const operationCount = Object.values(doc.paths ?? {}).reduce(
  (sum, methods) => sum + Object.keys(methods).length,
  0,
);

console.log(`OpenAPI spec generated successfully.`);
console.log(`  ${jsonPath}`);
console.log(`  ${pathCount} paths, ${operationCount} operations`);
