import { AsciiGraph, AsciiNode } from './types';
import { Canvas } from './canvas';

function drawNode(canvas: Canvas, node: AsciiNode) {
  const { x, y, width, height, shape, text } = node;

  if (shape === 'rect') {
    // Draw corners
    canvas.setChar(x, y, '┌');
    canvas.setChar(x + width - 1, y, '┐');
    canvas.setChar(x, y + height - 1, '└');
    canvas.setChar(x + width - 1, y + height - 1, '┘');

    // Draw horizontal lines
    for (let i = 1; i < width - 1; i++) {
      canvas.setChar(x + i, y, '─');
      canvas.setChar(x + i, y + height - 1, '─');
    }

    // Draw vertical lines
    for (let i = 1; i < height - 1; i++) {
      canvas.setChar(x, y + i, '│');
      canvas.setChar(x + width - 1, y + i, '│');
    }

    // Draw text
    canvas.writeText(x + 2, y + 1, text);
  } else if (shape === 'rhombus') {
    const midX = x + Math.floor(width / 2);
    const midY = y + Math.floor(height / 2);

    // Draw the diamond shape
    canvas.setChar(midX, y, '┌');
    canvas.setChar(midX, y + height - 1, '┘');
    canvas.setChar(x, midY, '┐');
    canvas.setChar(x + width - 1, midY, '└');

    // This is a simplified rhombus drawing. A better one would use '/' and '\'.
    // For now, this gives a visual cue.

    // Draw text
    canvas.writeText(x + 2, y + 2, text);
  }
}

function drawEdge(canvas: Canvas, from: AsciiNode, to: AsciiNode) {
  // NOTE: This is a placeholder edge router. A real implementation would use A*
  // or a similar pathfinding algorithm. This just draws a simple elbow.

  const startX = Math.floor(from.x + from.width / 2);
  const startY = from.y + from.height - 1;

  const endX = Math.floor(to.x + to.width / 2);
  const endY = to.y;

  const midY = Math.floor((startY + endY) / 2);

  // Vertical line down from 'from' node
  for (let y = startY; y <= midY; y++) {
    canvas.setChar(startX, y, '│');
  }
  // Vertical line up to 'to' node
  for (let y = midY; y < endY; y++) {
    canvas.setChar(endX, y, '│');
  }
  // Horizontal line
  const [h_start, h_end] = [startX, endX].sort((a, b) => a - b);
  for (let x = h_start; x <= h_end; x++) {
    canvas.setChar(x, midY, '─');
  }
  // Draw corners
  canvas.setChar(startX, startY, '┴');
  canvas.setChar(startX, midY, startX > endX ? '┐' : '┌');
  canvas.setChar(endX, midY, startX > endX ? '└' : '┘');
  // Draw arrowhead
  canvas.setChar(endX, endY - 1, '▼');
}

export function renderGraph(graph: AsciiGraph): string {
  if (graph.nodes.size === 0) {
    return 'Empty graph.';
  }

  // Determine canvas size
  let maxX = 0;
  let maxY = 0;
  graph.nodes.forEach(node => {
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  // Add some padding
  const canvas = new Canvas(maxX + 5, maxY + 5);

  // Draw nodes
  graph.nodes.forEach(node => drawNode(canvas, node));

  // Draw edges
  graph.edges.forEach(edge => {
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);
    if (fromNode && toNode) {
      drawEdge(canvas, fromNode, toNode);
    }
  });

  return canvas.toString();
}
