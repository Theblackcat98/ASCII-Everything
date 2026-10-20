const { createNode } = require('../models/diagramModels');

function parseFlowchart(lines) {
  const nodes = new Map();
  const edges = [];

  function addNode(id, label) {
    if (!nodes.has(id)) {
      nodes.set(id, createNode(id, label));
    }
  }

  const direction = parseDirection(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    try {
      parseFlowchartLine(lines[i], addNode, edges);
    } catch (error) {
      throw new Error(`Error parsing line ${i + 1}: "${lines[i]}" - ${error.message}`);
    }
  }

  if (nodes.size === 0) {
    throw new Error('No nodes found in flowchart');
  }

  return {
    type: 'flowchart',
    nodes,
    edges,
    direction
  };
}

function parseDirection(firstLine) {
  const match = firstLine.match(/(?:graph|flowchart)\s+(\w+)/i);
  return match ? match[1].toUpperCase() : 'TD';
}

function parseFlowchartLine(line, addNode, edges) {
  const arrowRegex = /([A-Za-z0-9_]+)(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?\s*(-->|---|\.->\.|==>)\s*([A-Za-z0-9_]+)(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?/g;
  let match;
  let hasMatch = false;

  while ((match = arrowRegex.exec(line)) !== null) {
    hasMatch = true;
    const [, fromId, fromLabel, arrow, toId, toLabel] = match;

    addNode(fromId, fromLabel);
    addNode(toId, toLabel);

    edges.push({
      from: fromId,
      to: toId,
      type: arrow
    });
  }

  if (!hasMatch) {
    const nodeRegex = /([A-Za-z0-9_]+)(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})/;
    const nodeMatch = line.match(nodeRegex);
    if (nodeMatch) {
      const [, nodeId, nodeLabel] = nodeMatch;
      addNode(nodeId, nodeLabel);
    }
  }
}

module.exports = { parseFlowchart };