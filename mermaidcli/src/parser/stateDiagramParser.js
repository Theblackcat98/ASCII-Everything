const { createStateNode } = require('../models/diagramModels');

function parseStateDiagram(lines) {
  const nodes = new Map();
  const edges = [];

  function addStateNode(id, label) {
    if (!nodes.has(id)) {
      nodes.set(id, createStateNode(id, label));
    }
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      parseStateLine(lines[i], addStateNode, edges);
    } catch (error) {
      throw new Error(`Error parsing line ${i + 1}: "${lines[i]}" - ${error.message}`);
    }
  }

  if (nodes.size === 0) {
    throw new Error('No states found in state diagram');
  }

  return {
    type: 'stateDiagram',
    nodes,
    edges,
    direction: 'TD'
  };
}

function parseStateLine(line, addStateNode, edges) {
  const stateRegex = /(\[\*\]|[A-Za-z0-9_]+)\s*-->\s*(\[\*\]|[A-Za-z0-9_]+)(?:\s*:\s*(.+))?/;
  const match = line.match(stateRegex);

  if (match) {
    const [, fromState, toState, trigger] = match;

    addStateNode(fromState);
    addStateNode(toState);

    edges.push({
      from: fromState,
      to: toState,
      type: '-->',
      label: trigger || ''
    });
    return;
  }

  const stateDefRegex = /state\s+"([^"]+)"\s+as\s+([A-Za-z0-9_]+)/;
  const defMatch = line.match(stateDefRegex);
  if (defMatch) {
    const [, label, id] = defMatch;
    addStateNode(id, label);
  }
}

module.exports = { parseStateDiagram };