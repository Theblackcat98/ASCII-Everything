#!/usr/bin/env node

const fs = require('fs');
const process = require('process');
const { MermaidParser } = require('../parser');
const { SimpleLayoutEngine, SequenceLayoutEngine } = require('../layout');
const { ASCIIRenderer, SequenceRenderer } = require('../renderer');

class MermaidCLI {
  constructor() {
    this.parser = new MermaidParser();
    this.options = {
      verbose: false,
      output: null,
      inputFile: null
    };
  }

  async run() {
    try {
      this.parseArgs();
      const input = await this.getInput();

      if (!input.trim()) {
        throw new Error('No input provided');
      }

      if (this.options.verbose) {
        console.error('Parsing Mermaid diagram...');
      }

      const parsed = this.parser.parse(input);
      let output;

      if (parsed.type === 'sequenceDiagram') {
        if (this.options.verbose) {
          console.error(`Found sequence diagram with ${parsed.participants.length} participants and ${parsed.edges.length} messages`);
        }

        const layoutEngine = new SequenceLayoutEngine(parsed.participants, parsed.edges);
        const layout = layoutEngine.calculateLayout();
        const renderer = new SequenceRenderer(layout.participants, layout.messages);
        output = renderer.render();
      } else {
        if (this.options.verbose) {
          console.error(`Found ${parsed.type} with ${parsed.nodes.size} nodes and ${parsed.edges.length} edges`);
        }

        const layoutEngine = new SimpleLayoutEngine(parsed.nodes, parsed.edges, parsed.direction);
        const positionedNodes = layoutEngine.calculateLayout();

        if (this.options.verbose) {
          console.error('Layout calculated. Rendering ASCII...');
        }

        const renderer = new ASCIIRenderer(positionedNodes, parsed.edges, parsed.direction);
        output = renderer.render();
      }

      if (this.options.output) {
        fs.writeFileSync(this.options.output, output, 'utf8');
        if (this.options.verbose) {
          console.error(`Diagram written to ${this.options.output}`);
        }
      } else {
        console.log(output);
      }

    } catch (error) {
      console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
      if (this.options.verbose && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  parseArgs() {
    const args = process.argv.slice(2);

    if (args.length === 0 && process.stdin.isTTY) {
      this.showHelp();
      process.exit(0);
    }

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      } else if (arg === '--verbose' || arg === '-v') {
        this.options.verbose = true;
        i++;
      } else if (arg === '--output' || arg === '-o') {
        if (i + 1 >= args.length) {
          throw new Error('Missing file path for --output option');
        }
        this.options.output = args[i + 1];
        i += 2;
      } else if (arg.startsWith('-')) {
        throw new Error(`Unknown option: ${arg}`);
      } else {
        if (this.options.inputFile) {
          throw new Error('Multiple input files specified. Please provide only one.');
        }
        this.options.inputFile = arg;
        i++;
      }
    }
  }

  async getInput() {
    if (this.options.inputFile) {
      if (this.options.verbose) {
        console.error(`Reading from file: ${this.options.inputFile}`);
      }
      if (!fs.existsSync(this.options.inputFile)) {
        throw new Error(`Input file not found: ${this.options.inputFile}`);
      }
      return fs.readFileSync(this.options.inputFile, 'utf8');
    } else {
      if (this.options.verbose) {
        console.error('Reading from standard input...');
      }
      if (process.stdin.isTTY) {
        console.error('\x1b[33mWarning: Reading from TTY. Pipe input to the script or provide a file path.\x1b[0m');
      }
      return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.on('readable', () => {
          let chunk;
          while ((chunk = process.stdin.read()) !== null) {
            data += chunk;
          }
        });
        process.stdin.on('end', () => resolve(data));
        process.stdin.on('error', reject);
      });
    }
  }

  showHelp() {
    console.log(`
Enhanced CLI Mermaid Visualizer
Renders flowcharts, state diagrams, and sequence diagrams as ASCII.

Usage: node src/cli/index.js [file.mmd] [options]
   or: cat file.mmd | node src/cli/index.js [options]

Options:
  -h, --help             Show this help message.
  -o, --output <file>    Write output to a file instead of stdout.
  -v, --verbose          Enable verbose logging.
    `);
  }
}

if (require.main === module) {
  const cli = new MermaidCLI();
  cli.run();
}