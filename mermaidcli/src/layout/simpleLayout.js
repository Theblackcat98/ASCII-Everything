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
      const totalWidthOfNodes = nodesInLevel.reduce((sum, node) => sum + node.width, 0);
      const totalSpacing = (nodesInLevel.length - 1) * nodeSpacingX;
      const groupWidth = totalWidthOfNodes + totalSpacing;

      let startX = Math.floor((100 - groupWidth) / 2);
      startX = Math.max(2, startX);

      let currentX = startX;
      nodesInLevel.forEach(node => {
        if (this.direction === 'LR') {
          node.x = level * (20 + nodeSpacingX) + 5;
          node.y = currentX;
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

module.exports = { SimpleLayoutEngine };