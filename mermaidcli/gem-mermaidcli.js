#!/usr/bin/env node

/**
 * Enhanced CLI Mermaid Visualizer
 * Supports flowcharts, state diagrams, and sequence diagrams with ASCII rendering
 * Usage: node mermaid-cli.js [file.mmd] [options]
 */

const fs = require('fs');
const process = require('process');
const path = require('path');

class MermaidParser {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.participants = [];
    this.nodeCounter = 0;
    this.diagramType = null;
  }

  parse(mermaidText) {
    const lines = mermaidText.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('%%')); // Filter comments

    if (lines.length === 0) {
      throw new Error('Empty diagram content');
    }

    // Detect diagram type
    this.diagramType = this.detectDiagramType(lines[0]);

    if (this.diagramType === 'flowchart') {
      return this.parseFlowchart(lines);
    } else if (this.diagramType === 'stateDiagram') {
      return this.parseStateDiagram(lines);
    } else if (this.diagramType === 'sequenceDiagram') {
      return this.parseSequenceDiagram(lines);
    }

    throw new Error(`Unsupported diagram type: ${this.diagramType}`);
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

  parseFlowchart(lines) {
    const direction = this.parseDirection(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      try {
        this.parseFlowchartLine(lines[i]);
      } catch (error) {
        throw new Error(`Error parsing line ${i + 1}: "${lines[i]}" - ${error.message}`);
      }
    }

    if (this.nodes.size === 0) {
      throw new Error('No nodes found in flowchart');
    }

    return {
      type: 'flowchart',
      nodes: this.nodes,
      edges: this.edges,
      direction
    };
  }

  parseStateDiagram(lines) {
    for (let i = 1; i < lines.length; i++) {
      try {
        this.parseStateLine(lines[i]);
      } catch (error) {
        throw new Error(`Error parsing line ${i + 1}: "${lines[i]}" - ${error.message}`);
      }
    }

    if (this.nodes.size === 0) {
      throw new Error('No states found in state diagram');
    }

    return {
      type: 'stateDiagram',
      nodes: this.nodes,
      edges: this.edges,
      direction: 'TD'
    };
  }

  parseSequenceDiagram(lines) {
    for (let i = 1; i < lines.length; i++) {
      try {
        this.parseSequenceLine(lines[i]);
      } catch (error) {
        throw new Error(`Error parsing line ${i + 1}: "${lines[i]}" - ${error.message}`);
      }
    }

    if (this.participants.length === 0) {
      throw new Error('No participants found in sequence diagram');
    }

    return {
      type: 'sequenceDiagram',
      participants: this.participants,
      edges: this.edges
    };
  }

  parseDirection(firstLine) {
    const match = firstLine.match(/(?:graph|flowchart)\s+(\w+)/i);
    return match ? match[1].toUpperCase() : 'TD';
  }

  parseFlowchartLine(line) {
    // Enhanced regex to handle more complex syntax
    const arrowRegex = /([A-Za-z0-9_]+)(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?\s*(-->|---|\.->\.|==>)\s*([A-Za-z0-9_]+)(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?/g;
    let match;
    let hasMatch = false;

    while ((match = arrowRegex.exec(line)) !== null) {
      hasMatch = true;
      const [, fromId, fromLabel, arrow, toId, toLabel] = match;

      this.addNode(fromId, fromLabel);
      this.addNode(toId, toLabel);

      this.edges.push({
        from: fromId,
        to: toId,
        type: arrow
      });
    }

    // Handle standalone node definitions
    if (!hasMatch) {
      const nodeRegex = /([A-Za-z0-9_]+)(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})/;
      const nodeMatch = line.match(nodeRegex);
      if (nodeMatch) {
        const [, nodeId, nodeLabel] = nodeMatch;
        this.addNode(nodeId, nodeLabel);
      }
    }
  }

  parseStateLine(line) {
    const stateRegex = /(\[\*\]|[A-Za-z0-9_]+)\s*-->\s*(\[\*\]|[A-Za-z0-9_]+)(?:\s*:\s*(.+))?/;
    const match = line.match(stateRegex);

    if (match) {
      const [, fromState, toState, trigger] = match;

      this.addStateNode(fromState);
      this.addStateNode(toState);

      this.edges.push({
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
      this.addStateNode(id, label);
    }
  }

  parseSequenceLine(line) {
    const participantRegex = /participant\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?/;
    const participantMatch = line.match(participantRegex);

    if (participantMatch) {
      const [, id, label] = participantMatch;
      this.addParticipant(id, label || id);
      return;
    }

    const messageRegex = /([A-Za-z0-9_]+)\s*(->>|-->|-x|--x)\s*([A-Za-z0-9_]+)\s*:\s*(.+)/;
    const messageMatch = line.match(messageRegex);

    if (messageMatch) {
      const [, from, arrow, to, message] = messageMatch;

      this.addParticipant(from);
      this.addParticipant(to);

      this.edges.push({
        from,
        to,
        type: arrow,
        label: message,
        sequence: this.edges.length
      });
    }
  }

  addNode(id, labelMatch) {
    if (!this.nodes.has(id)) {
      let label = id;
      let shape = 'rect';

      if (labelMatch) {
        if (labelMatch.startsWith('[') && labelMatch.endsWith(']')) {
          label = labelMatch.slice(1, -1);
          shape = 'rect';
        } else if (labelMatch.startsWith('(') && labelMatch.endsWith(')')) {
          label = labelMatch.slice(1, -1);
          shape = 'round';
        } else if (labelMatch.startsWith('{') && labelMatch.endsWith('}')) {
          label = labelMatch.slice(1, -1);
          shape = 'rhombus';
        }
      }

      this.nodes.set(id, {
        id,
        label,
        x: 0,
        y: 0,
        width: Math.max(label.length + 4, 8),
        height: 3,
        shape
      });
    }
  }

  addStateNode(id, label) {
    if (!this.nodes.has(id)) {
      if (id === '[*]') {
        this.nodes.set(id, {
          id,
          label: '',
          x: 0,
          y: 0,
          width: 3,
          height: 3,
          shape: 'rhombus'
        });
      } else {
        const nodeLabel = label || id;
        this.nodes.set(id, {
          id,
          label: nodeLabel,
          x: 0,
          y: 0,
          width: Math.max(nodeLabel.length + 4, 10),
          height: 3,
          shape: 'roundedRect'
        });
      }
    }
  }

  addParticipant(id, label) {
    const participantLabel = label || id;

    if (!this.participants.find(p => p.id === id)) {
      this.participants.push({
        id,
        label: participantLabel,
        x: 0,
        y: 0,
        width: Math.max(participantLabel.length + 4, 10),
        height: 3
      });
    }
  }
}

class SimpleLayoutEngine {
  constructor(nodes, edges, direction = 'TD') {
    this.nodes = nodes;
    this.edges = edges;
    this.direction = direction;
    this.levels = new Map();
  }

  calculateLayout() {
    this.calculateLevels();
    this.positionNodes();
    return this.nodes;
  }

  calculateLevels() {
    const visited = new Set();
    const level = new Map();

    const hasIncoming = new Set();
    this.edges.forEach(edge => hasIncoming.add(edge.to));

    const roots = Array.from(this.nodes.keys()).filter(id => !hasIncoming.has(id));

    if (roots.length === 0) {
      // Handle cycles by picking arbitrary root
      const firstNode = Array.from(this.nodes.keys())[0];
      if (firstNode) roots.push(firstNode);
    }

    const queue = roots.map(id => ({ id, level: 0 }));

    while (queue.length > 0) {
      const { id, level: currentLevel } = queue.shift();

      if (visited.has(id)) continue;
      visited.add(id);

      level.set(id, currentLevel);

      this.edges
        .filter(edge => edge.from === id)
        .forEach(edge => {
          if (!visited.has(edge.to)) {
            queue.push({ id: edge.to, level: currentLevel + 1 });
          }
        });
    }

    // Handle orphaned nodes
    for (const nodeId of this.nodes.keys()) {
      if (!level.has(nodeId)) {
        level.set(nodeId, 0);
      }
    }

    this.levels = level;
  }

  positionNodes() {
    const levelGroups = new Map();
    const nodeSpacingX = 10;
    const nodeSpacingY = 8;

    for (const [nodeId, level] of this.levels) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level).push(this.nodes.get(nodeId));
    }

    for (const [level, nodesInLevel] of levelGroups) {
      // Center the whole group of nodes at each level
      const totalWidthOfNodes = nodesInLevel.reduce((sum, node) => sum + node.width, 0);
      const totalSpacing = (nodesInLevel.length - 1) * nodeSpacingX;
      const groupWidth = totalWidthOfNodes + totalSpacing;

      let startX = Math.floor((100 - groupWidth) / 2); // Center on a virtual 100-char width
      startX = Math.max(2, startX);

      let currentX = startX;
      nodesInLevel.forEach(node => {
        if (this.direction === 'LR') {
          node.x = level * (20 + nodeSpacingX) + 5;
          node.y = currentX; // Use currentX for Y in LR
          currentX += node.height + nodeSpacingY;
        } else { // TD
          node.x = currentX;
          node.y = level * nodeSpacingY + 2;
          currentX += node.width + nodeSpacingX;
        }
      });
    }
  }
}

class ASCIIRenderer {
  constructor(nodes, edges, direction = 'TD') {
    this.nodes = nodes;
    this.edges = edges;
    this.direction = direction;
    this.canvas = [];
    this.width = 0;
    this.height = 0;
  }

  render() {
    this.calculateCanvasSize();
    this.initializeCanvas();
    this.renderNodes();
    this.renderEdges();
    return this.canvasToString();
  }

  calculateCanvasSize() {
    let maxX = 0, maxY = 0;

    for (const node of this.nodes.values()) {
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    this.width = Math.max(maxX + 10, 80);
    this.height = Math.max(maxY + 5, 20);
  }

  initializeCanvas() {
    this.canvas = Array(this.height).fill().map(() => Array(this.width).fill(' '));
  }

  renderNodes() {
    for (const node of this.nodes.values()) {
      switch (node.shape) {
        case 'round':
          this.drawRoundedBox(node.x, node.y, node.width, node.height, node.label);
          break;
        case 'rhombus':
          this.drawDiamond(node.x, node.y, node.width, node.height, node.label);
          break;
        case 'roundedRect':
          this.drawRoundedRect(node.x, node.y, node.width, node.height, node.label);
          break;
        default:
          this.drawBox(node.x, node.y, node.width, node.height, node.label);
      }
    }
  }

  drawBox(x, y, width, height, label) {
    for (let i = 1; i < width - 1; i++) {
      this.setChar(x + i, y, '-');
      this.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.setChar(x, y + i, '|');
      this.setChar(x + width - 1, y + i, '|');
    }

    this.setChar(x, y, '+');
    this.setChar(x + width - 1, y, '+');
    this.setChar(x, y + height - 1, '+');
    this.setChar(x + width - 1, y + height - 1, '+');

    this.drawLabel(x, y, width, height, label);
  }

  drawRoundedBox(x, y, width, height, label) {
    for (let i = 1; i < width - 1; i++) {
      this.setChar(x + i, y, '-');
      this.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.setChar(x, y + i, '|');
      this.setChar(x + width - 1, y + i, '|');
    }

    this.setChar(x, y, '(');
    this.setChar(x + width - 1, y, ')');
    this.setChar(x, y + height - 1, '(');
    this.setChar(x + width - 1, y + height - 1, ')');

    this.drawLabel(x, y, width, height, label);
  }

  drawRoundedRect(x, y, width, height, label) {
    for (let i = 1; i < width - 1; i++) {
      this.setChar(x + i, y, '-');
      this.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.setChar(x, y + i, '|');
      this.setChar(x + width - 1, y + i, '|');
    }

    this.setChar(x, y, '/');
    this.setChar(x + width - 1, y, '\\');
    this.setChar(x, y + height - 1, '\\');
    this.setChar(x + width - 1, y + height - 1, '/');

    this.drawLabel(x, y, width, height, label);
  }

  drawDiamond(x, y, width, height, label) {
    const centerX = x + Math.floor(width / 2);
    const centerY = y + Math.floor(height / 2);

    // Simple diamond approximation
    this.setChar(centerX, y, '/');
    this.setChar(centerX, y + height - 1, '\\');
    this.setChar(x, centerY, '<');
    this.setChar(x + width - 1, centerY, '>');

    this.drawLabel(x, y, width, height, label);
  }

  drawLabel(x, y, width, height, label) {
    const labelY = y + Math.floor(height / 2);
    const labelX = x + Math.max(2, Math.floor((width - label.length) / 2));

    for (let i = 0; i < label.length && i < width - 4; i++) {
      this.setChar(labelX + i, labelY, label[i]);
    }
  }

  renderEdges() {
    for (const edge of this.edges) {
      this.drawArrow(edge.from, edge.to);
    }
  }

  drawArrow(fromId, toId) {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (!fromNode || !toNode) return;

    if (this.direction === 'LR') {
      const fromX = fromNode.x + fromNode.width - 1;
      const fromY = fromNode.y + Math.floor(fromNode.height / 2);
      const toX = toNode.x;
      const toY = toNode.y + Math.floor(toNode.height / 2);

      const midX = fromX + Math.floor((toX - fromX) / 2);

      for (let x = fromX; x <= midX; x++) this.setChar(x, fromY, '-');
      for (let x = midX; x < toX; x++) this.setChar(x, toY, '-');

      const minY = Math.min(fromY, toY);
      const maxY = Math.max(fromY, toY);
      for (let y = minY; y <= maxY; y++) this.setChar(midX, y, '|');

      if (fromY !== toY) {
        this.setChar(midX, fromY, '+');
        this.setChar(midX, toY, '+');
      }

      this.setChar(toX - 1, toY, '>');
      this.setChar(toX, toY, '>');
    } else { // Default to TD
      const fromX = fromNode.x + Math.floor(fromNode.width / 2);
      const toX = toNode.x + Math.floor(toNode.width / 2);
      const isUpward = toNode.y < fromNode.y;

      const fromY_boundary = isUpward ? fromNode.y : fromNode.y + fromNode.height - 1;
      const toY_boundary = isUpward ? toNode.y + toNode.height - 1 : toNode.y;

      const fromY_start = isUpward ? fromY_boundary - 1 : fromY_boundary + 1;
      const toY_end = isUpward ? toY_boundary + 1 : toY_boundary - 1;

      const midY = Math.floor((fromY_start + toY_end) / 2);

      // Vertical line from fromNode
      for (let y = Math.min(fromY_start, midY); y <= Math.max(fromY_start, midY); y++) {
        this.setChar(fromX, y, '|');
      }
      
      // Horizontal line
      for (let x = Math.min(fromX, toX); x <= Math.max(fromX, toX); x++) {
        this.setChar(x, midY, '-');
      }

      // Vertical line to toNode
      for (let y = Math.min(toY_end, midY); y <= Math.max(toY_end, midY); y++) {
        this.setChar(toX, y, '|');
      }
      
      // Arrowhead at toNode boundary
      this.setChar(toX, toY_boundary, isUpward ? '^' : 'v');
    }
  }

  setChar(x, y, char) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const existing = this.canvas[y][x];

      // Allow drawing on empty space
      if (existing === ' ') {
        this.canvas[y][x] = char;
        return;
      }

      // Form corners
      if ((existing === '|' && char === '-') || (existing === '-' && char === '|')) {
        this.canvas[y][x] = '+';
        return;
      }
      
      // Let corners overwrite lines
      if (char === '+' && (existing === '|' || existing === '-')) {
        this.canvas[y][x] = '+';
        return;
      }

      // Let arrowheads overwrite lines/corners
      if ("v^<>".includes(char) && "|-+".includes(existing)) {
        this.canvas[y][x] = char;
        return;
      }
    }
  }

  canvasToString() {
    return this.canvas.map(row => row.join('')).join('\n');
  }
}

// Sequence diagram classes remain the same...
class SequenceLayoutEngine {
  constructor(participants, messages) {
    this.participants = participants;
    this.messages = messages;
    this.messageHeight = 4;
  }

  calculateLayout() {
    let currentX = 5;
    for (const participant of this.participants) {
      participant.x = currentX;
      participant.y = 2;
      currentX += participant.width + 15;
    }

    let currentY = 8;
    for (const message of this.messages) {
      message.y = currentY;
      currentY += this.messageHeight;
    }

    return { participants: this.participants, messages: this.messages };
  }
}

class SequenceRenderer {
  constructor(participants, messages) {
    this.participants = participants;
    this.messages = messages;
    this.canvas = [];
    this.width = 0;
    this.height = 0;
  }

  render() {
    this.calculateCanvasSize();
    this.initializeCanvas();
    this.renderParticipants();
    this.renderLifelines();
    this.renderMessages();
    return this.canvasToString();
  }

  calculateCanvasSize() {
    let maxX = 0;
    let maxY = 10;

    for (const participant of this.participants) {
      maxX = Math.max(maxX, participant.x + participant.width);
    }

    if (this.messages.length > 0) {
      maxY = Math.max(maxY, this.messages[this.messages.length - 1].y + 10);
    }

    this.width = Math.max(maxX + 10, 50);
    this.height = Math.max(maxY, 20);
  }

  initializeCanvas() {
    this.canvas = Array(this.height).fill().map(() => Array(this.width).fill(' '));
  }

  renderParticipants() {
    for (const participant of this.participants) {
      this.drawBox(participant.x, participant.y, participant.width, participant.height, participant.label);
    }
  }

  renderLifelines() {
    for (const participant of this.participants) {
      const centerX = participant.x + Math.floor(participant.width / 2);
      const startY = participant.y + participant.height;
      const endY = this.height - 2;

      for (let y = startY; y < endY; y++) {
        this.setChar(centerX, y, '|');
      }
    }
  }

  renderMessages() {
    for (const message of this.messages) {
      this.drawMessage(message);
    }
  }

  drawMessage(message) {
    const fromParticipant = this.participants.find(p => p.id === message.from);
    const toParticipant = this.participants.find(p => p.id === message.to);

    if (!fromParticipant || !toParticipant) return;

    const fromX = fromParticipant.x + Math.floor(fromParticipant.width / 2);
    const toX = toParticipant.x + Math.floor(toParticipant.width / 2);
    const y = message.y;

    const minX = Math.min(fromX, toX);
    const maxX = Math.max(fromX, toX);

    for (let x = minX; x <= maxX; x++) {
      this.setChar(x, y, '-');
    }

    if (message.type === '->>') {
      this.setChar(toX, y, '>');
    } else if (message.type === '-x' || message.type === '--x') {
      this.setChar(toX, y, 'X');
    } else {
      this.setChar(toX, y, '>');
    }

    const labelX = Math.min(fromX, toX) + Math.floor(Math.abs(toX - fromX) / 2) - Math.floor(message.label.length / 2);
    const labelY = y - 1;

    for (let i = 0; i < message.label.length; i++) {
      this.setChar(labelX + i, labelY, message.label[i]);
    }
  }

  drawBox(x, y, width, height, label) {
    for (let i = 1; i < width - 1; i++) {
      this.setChar(x + i, y, '-');
      this.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.setChar(x, y + i, '|');
      this.setChar(x + width - 1, y + i, '|');
    }

    this.setChar(x, y, '+');
    this.setChar(x + width - 1, y, '+');
    this.setChar(x, y + height - 1, '+');
    this.setChar(x + width - 1, y + height - 1, '+');

    const labelY = y + Math.floor(height / 2);
    const labelX = x + Math.max(2, Math.floor((width - label.length) / 2));

    for (let i = 0; i < label.length && i < width - 2; i++) {
      this.setChar(labelX + i, labelY, label[i]);
    }
  }

  setChar(x, y, char) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.canvas[y][x] = char;
    }
  }

  canvasToString() {
    return this.canvas.map(row => row.join('')).join('\n');
  }
}

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

Usage: node mermaid-cli.js [file.mmd] [options]
   or: cat file.mmd | node mermaid-cli.js [options]

Options:
  -h, --help             Show this help message.
  -o, --output <file>    Write output to a file instead of stdout.
  -v, --verbose          Enable verbose logging.
    `);
  }
}

// Main execution block
if (require.main === module) {
  const cli = new MermaidCLI();
  cli.run();
}
