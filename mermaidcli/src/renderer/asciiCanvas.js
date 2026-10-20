class ASCIICanvas {
  constructor() {
    this.canvas = [];
    this.width = 0;
    this.height = 0;
  }

  calculateCanvasSize(nodes, edges, minWidth = 80, minHeight = 20) {
    let maxX = 0,
      maxY = 0;

    for (const node of nodes.values()) {
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    this.width = Math.max(maxX + 10, minWidth);
    this.height = Math.max(maxY + 5, minHeight);
  }

  initializeCanvas() {
    this.canvas = Array(this.height).fill(null).map(() => Array(this.width).fill(' '));
  }

  setChar(x, y, char) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const existing = this.canvas[y][x];

      if (existing === ' ') {
        this.canvas[y][x] = char;
        return;
      }

      if ((existing === '|' && char === '-') || (existing === '-' && char === '|')) {
        this.canvas[y][x] = '+';
        return;
      }

      if (char === '+' && (existing === '|' || existing === '-')) {
        this.canvas[y][x] = '+';
        return;
      }

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

module.exports = {
  ASCIICanvas
};