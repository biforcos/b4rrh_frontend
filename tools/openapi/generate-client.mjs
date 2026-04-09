import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, '../..');
const inputSpec = path.resolve(workspaceRoot, 'openapi/personnel-administration-api.yaml');
const outputDirectory = path.resolve(workspaceRoot, 'src/app/core/api/generated');

if (!existsSync(inputSpec)) {
  console.error(`OpenAPI contract not found at ${inputSpec}.`);
  console.error('Run "npm run api:pull" first to sync it from backend.');
  process.exit(1);
}

mkdirSync(outputDirectory, { recursive: true });

const generatorArgs = [
  '--no-install',
  'openapi-generator-cli',
  'generate',
  '-g',
  'typescript-angular',
  '-i',
  inputSpec,
  '-o',
  outputDirectory,
  '--global-property',
  'apis,models,supportingFiles',
  '--additional-properties',
  'providedIn=root,useSingleRequestParameter=true,withInterfaces=true,stringEnums=true,modelPropertyNaming=original,fileNaming=kebab-case',
  ...process.argv.slice(2),
];

const result = spawnSync('npx', generatorArgs, {
  cwd: workspaceRoot,
  stdio: 'inherit',
  shell: true,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const generatedReadmePath = path.resolve(outputDirectory, 'README.md');
const generatedModelsPath = path.resolve(outputDirectory, 'model', 'models.ts');
const generatedReadme = `# Generated API client

This folder is generated from the OpenAPI contract.

- Do not edit files here manually.
- Regenerate with: npm run api:refresh
- Put custom API adapters and mappers outside generated in src/app/core/api/clients and src/app/core/api/mappers.
`;

writeFileSync(generatedReadmePath, generatedReadme, 'utf8');

if (existsSync(generatedModelsPath)) {
  let generatedModels = readFileSync(generatedModelsPath, 'utf8');

  generatedModels = ensureModelExport(generatedModels, 'close-work-center-request');
  generatedModels = ensureModelExport(generatedModels, 'replace-work-center-from-date-request');

  writeFileSync(generatedModelsPath, generatedModels, 'utf8');
}

function ensureModelExport(modelsSource, fileName) {
  const exportLine = `export * from './${fileName}';`;
  if (modelsSource.includes(exportLine)) {
    return modelsSource;
  }

  return `${modelsSource}${modelsSource.endsWith('\n') ? '' : '\n'}${exportLine}\n`;
}
