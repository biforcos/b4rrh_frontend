import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, '../..');
const backendContractPath = path.resolve(
  workspaceRoot,
  '../b4rrrh_backend/openapi/personnel-administration-api.yaml',
);
const localContractDirectory = path.resolve(workspaceRoot, 'openapi');
const localContractPath = path.resolve(localContractDirectory, 'personnel-administration-api.yaml');
const generatedDirectory = path.resolve(workspaceRoot, 'src/app/core/api/generated');
const generatedContractPath = path.resolve(generatedDirectory, 'personnel-administration-api.yaml');

if (!existsSync(backendContractPath)) {
  console.error(`Backend contract not found at ${backendContractPath}.`);
  process.exit(1);
}

mkdirSync(localContractDirectory, { recursive: true });
mkdirSync(generatedDirectory, { recursive: true });
copyFileSync(backendContractPath, localContractPath);
copyFileSync(backendContractPath, generatedContractPath);

console.log(`OpenAPI contract synced to ${localContractPath}`);
console.log(`OpenAPI contract copied to ${generatedContractPath}`);
