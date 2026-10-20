const { parseFlowchart } = require('./flowchartParser');
const { parseStateDiagram } = require('./stateDiagramParser');
const { parseSequenceDiagram } = require('./sequenceDiagramParser');

class MermaidParser {
  parse(mermaidText) {
    const lines = mermaidText.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('%%'));

    if (lines.length === 0) {
      throw new Error('Empty diagram content');
    }

    const diagramType = this.detectDiagramType(lines[0]);

    switch (diagramType) {
      case 'flowchart':
        return parseFlowchart(lines);
      case 'stateDiagram':
        return parseStateDiagram(lines);
      case 'sequenceDiagram':
        return parseSequenceDiagram(lines);
      default:
        throw new Error(`Unsupported diagram type: ${diagramType}`);
    }
  }

  detectDiagramType(firstLine) {
    const line = firstLine.toLowerCase();
    if (line.includes('graph') || line.includes('flowchart')) {
      return 'flowchart';
    } else if (line.includes('statediagram')) {
      return 'stateDiagram';
    } else if (line.includes('sequencediagram')) {
      return 'sequenceDiagram';
    }
    throw new Error(`Unsupported diagram type: ${firstLine}`);
  }
}

module.exports = { MermaidParser };