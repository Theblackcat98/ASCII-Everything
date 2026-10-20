const { ASCIICanvas } = require('./asciiCanvas');

class ASCIIRenderer {
  constructor(nodes, edges, direction = 'TD') {
    this.nodes = nodes;
    this.edges = edges;
    this.direction = direction;
    this.canvas = new ASCIICanvas();
  }

  render() {
    this.canvas.calculateCanvasSize(this.nodes, this.edges);
    this.canvas.initializeCanvas();
    this.renderNodes();
    this.renderEdges();
    return this.canvas.canvasToString();
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
      this.canvas.setChar(x + i, y, '-');
      this.canvas.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.canvas.setChar(x, y + i, '|');
      this.canvas.setChar(x + width - 1, y + i, '|');
    }

    this.canvas.setChar(x, y, '+');
    this.canvas.setChar(x + width - 1, y, '+');
    this.canvas.setChar(x, y + height - 1, '+');
    this.canvas.setChar(x + width - 1, y + height - 1, '+');

    this.drawLabel(x, y, width, height, label);
  }

  drawRoundedBox(x, y, width, height, label) {
    for (let i = 1; i < width - 1; i++) {
      this.canvas.setChar(x + i, y, '-');
      this.canvas.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.canvas.setChar(x, y + i, '|');
      this.canvas.setChar(x + width - 1, y + i, '|');
    }

    this.canvas.setChar(x, y, '(');
    this.canvas.setChar(x + width - 1, y, ')');
    this.canvas.setChar(x, y + height - 1, '(');
    this.canvas.setChar(x + width - 1, y + height - 1, ')');

    this.drawLabel(x, y, width, height, label);
  }

  drawRoundedRect(x, y, width, height, label) {
    for (let i = 1; i < width - 1; i++) {
      this.canvas.setChar(x + i, y, '-');
      this.canvas.setChar(x + i, y + height - 1, '-');
    }

    for (let i = 1; i < height - 1; i++) {
      this.canvas.setChar(x, y + i, '|');
      this.canvas.setChar(x + width - 1, y + i, '|');
    }

    this.canvas.setChar(x, y, '/');
    this.canvas.setChar(x + width - 1, y, '\\');
    this.canvas.setChar(x, y + height - 1, '\\');
    this.canvas.setChar(x + width - 1, y + height - 1, '/');

    this.drawLabel(x, y, width, height, label);
  }

  drawDiamond(x, y, width, height, label) {
    const centerX = x + Math.floor(width / 2);
    const centerY = y + Math.floor(height / 2);

    this.canvas.setChar(centerX, y, '/');
    this.canvas.setChar(centerX, y + height - 1, '\\');
    this.canvas.setChar(x, centerY, '<');
    this.canvas.setChar(x + width - 1, centerY, '>');

    this.drawLabel(x, y, width, height, label);
  }

  drawLabel(x, y, width, height, label) {
    const labelY = y + Math.floor(height / 2);
    const labelX = x + Math.max(2, Math.floor((width - label.length) / 2));

    for (let i = 0; i < label.length && i < width - 4; i++) {
      this.canvas.setChar(labelX + i, labelY, label[i]);
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

      for (let x = fromX; x <= midX; x++) this.canvas.setChar(x, fromY, '-');
      for (let x = midX; x < toX; x++) this.canvas.setChar(x, toY, '-');

      const minY = Math.min(fromY, toY);
      const maxY = Math.max(fromY, toY);
      for (let y = minY; y <= maxY; y++) this.canvas.setChar(midX, y, '|');

      if (fromY !== toY) {
        this.canvas.setChar(midX, fromY, '+');
        this.canvas.setChar(midX, toY, '+');
      }

      this.canvas.setChar(toX - 1, toY, '>');
      this.canvas.setChar(toX, toY, '>');
    } else { // Default to TD
      const fromX = fromNode.x + Math.floor(fromNode.width / 2);
      const toX = toNode.x + Math.floor(toNode.width / 2);
      const isUpward = toNode.y < fromNode.y;

      const fromY_boundary = isUpward ? fromNode.y : fromNode.y + fromNode.height - 1;
      const toY_boundary = isUpward ? toNode.y + toNode.height - 1 : toNode.y;

      const fromY_start = isUpward ? fromY_boundary - 1 : fromY_boundary + 1;
      const toY_end = isUpward ? toY_boundary + 1 : toY_boundary - 1;

      const midY = Math.floor((fromY_start + toY_end) / 2);

      for (let y = Math.min(fromY_start, midY); y <= Math.max(fromY_start, midY); y++) {
        this.canvas.setChar(fromX, y, '|');
      }

      for (let x = Math.min(fromX, toX); x <= Math.max(fromX, toX); x++) {
        this.canvas.setChar(x, midY, '-');
      }

      for (let y = Math.min(toY_end, midY); y <= Math.max(toY_end, midY); y++) {
        this.canvas.setChar(toX, y, '|');
      }

      this.canvas.setChar(toX, toY_boundary, isUpward ? '^' : 'v');
    }
  }
}

module.exports = { ASCIIRenderer };