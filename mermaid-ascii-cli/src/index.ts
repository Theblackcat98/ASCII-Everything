// =================================================================
// START JSDOM BOILERPLATE
// This sets up a fake browser environment so Mermaid can work.
// It must be at the very top of the entrypoint file.
// -----------------------------------------------------------------
import { JSDOM } from 'jsdom';

const dom = new JSDOM('', {
  // This is necessary for mermaid to be able to calculate text sizes
  pretendToBeVisual: true,
});

// @ts-ignore
global.window = dom.window;
global.document = dom.window.document;
// =================================================================
// END JSDOM BOILERPLATE
// =================================================================

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildGraph } from './parser';
import { layoutGraph } from './layout';
import { renderGraph } from './renderer';

const program = new Command();

program
  .version('0.1.0')
  .description('A CLI tool to render MermaidJS diagrams as ASCII art')
  .argument('<file>', 'Input Mermaid .mmd file path')
  .parse(process.argv);

async function main() {
  const inputFile = program.args[0];
  if (!inputFile) {
    console.error('Error: Input file must be specified.');
    program.help();
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), inputFile);
  const fileContent = readFileSync(filePath, 'utf-8');

  // 1. Parse the Mermaid source into our intermediate representation
  const graph = await buildGraph(fileContent);

  // 2. Run the layout engine to calculate positions
  const laidOutGraph = layoutGraph(graph);

  // 3. Render the laid-out graph to an ASCII string
  const asciiArt = renderGraph(laidOutGraph);

  // 4. Print the final result
  console.log(asciiArt);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
