# `mermaidcli`

This is a CLI tool to render Mermaid diagrams as ASCII art in the terminal.

## Architecture

The application is structured into the following modules:

- **`src/cli`**: Main CLI entry point, argument parsing, and orchestration.
- **`src/parser`**: Handles parsing of Mermaid diagram syntax. It contains separate parsers for flowcharts, state diagrams, and sequence diagrams.
- **`src/layout`**: Calculates the layout of the diagram nodes and edges. It has different layout engines for different diagram types.
- **`src/renderer`**: Renders the diagram as ASCII art. It has different renderers for different diagram types and a reusable ASCII canvas.
- **`src/models`**: Contains functions to create the data models for diagram elements.

## Usage

To run the application, use the following command:

```bash
node src/cli/index.js [file.mmd] [options]
```

You can also pipe the input from a file:

```bash
cat [file.mmd] | node src/cli/index.js [options]
```

### Options

- `-h, --help`: Show the help message.
- `-o, --output <file>`: Write the output to a file instead of stdout.
- `-v, --verbose`: Enable verbose logging.

## Current Limitations

- The tool currently only supports rendering of state and sequence diagrams. Flowchart support is experimental.

## Examples

### State Diagram

<img alt="State Diagram" src="https://github.com/Theblackcat98/mermaidCLI/raw/master/assets/state-dmm.gif" width="800" />

### Sequence Diagram

<img alt="Sequence Diagram" src="https://github.com/Theblackcat98/mermaidCLI/raw/master/assets/sequence-dmm.gif" width="800" />

### Pocketflow Diagram

<img alt="Pocketflow Diagram" src="https://github.com/Theblackcat98/mermaidCLI/raw/master/assets/pocketflow-dmm.gif" width="1100" />

### Notes
* The GIFs were created using [vhs](https://github.com/charmbracelet/vhs).
* The PocketFlow diagram is from [The-Pocket/PocketFlow](https://github.com/The-Pocket/PocketFlow).

