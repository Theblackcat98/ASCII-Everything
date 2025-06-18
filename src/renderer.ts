import { AsciiGraph, AsciiNode, AsciiEdge } from './types';
import { Canvas } from './canvas';

function drawNode(canvas: Canvas, node: AsciiNode) {
  const { x, y, width, height, shape, text } = node;

  if (shape === 'rect') {
    canvas.drawBox(x, y, width, height, text);
  } else if (shape === 'rhombus') {
    canvas.drawBox(x, y, width, height, `◆ ${text}`);
  }
}

function drawEdge(canvas: Canvas, edge: AsciiEdge) {
  if (!edge.points || edge.points.length < 2) return;

  // Draw line segments
  for (let i = 0; i < edge.points.length - 1; i++) {
    const start = edge.points[i];
    const end = edge.points[i + 1];
    canvas.drawLine(start.x, start.y, end.x, end.y);
  }

  // Draw corners
  for (let i = 1; i < edge.points.length - 1; i++) {
    const prev = edge.points[i - 1];
    const curr = edge.points[i];
    const next = edge.points[i + 1];
    const char = getCornerChar(prev, curr, next);
    if (char) {
      canvas.setChar(curr.x, curr.y, char);
    }
  }

  // Draw arrowhead
  const p1 = edge.points[edge.points.length - 2];
  const p2 = edge.points[edge.points.length - 1];
  const arrowhead = getArrowhead(p1, p2);
  canvas.setChar(p2.x, p2.y, arrowhead);
}

function getCornerChar(prev: {x: number, y: number}, curr: {x: number, y: number}, next: {x: number, y: number}): string | null {
  const dx1 = curr.x - prev.x;
  const dy1 = curr.y - prev.y;
  const dx2 = next.x - curr.x;
  const dy2 = next.y - curr.y;

  if (dx1 === 0 && dy1 > 0) { // From Top
    if (dx2 > 0) return '┌';
    if (dx2 < 0) return '┐';
  } else if (dx1 === 0 && dy1 < 0) { // From Bottom
    if (dx2 > 0) return '└';
    if (dx2 < 0) return '┘';
  } else if (dy1 === 0 && dx1 > 0) { // From Left
    if (dy2 > 0) return '┐';
    if (dy2 < 0) return '┘';
  } else if (dy1 === 0 && dx1 < 0) { // From Right
    if (dy2 > 0) return '┌';
    if (dy2 < 0) return '└';
  }
  return null; // Default
}

function getArrowhead(p1: {x: number, y: number}, p2: {x: number, y: number}): string {
  if (p1.y < p2.y) return '▼';
  if (p1.y > p2.y) return '▲';
  if (p1.x < p2.x) return '►';
  return '◄';
}

export function renderGraph(graph: AsciiGraph): string {
  if (graph.nodes.size === 0) {
    return 'Empty graph.';
  }

  // Determine canvas size from layout
  let maxX = 0;
  let maxY = 0;
  graph.nodes.forEach(node => {
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });
  graph.edges.forEach(edge => {
    if (edge.points) {
      edge.points.forEach(point => {
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    }
  });


  // Add some padding
  const canvas = new Canvas(maxX + 5, maxY + 5);

  // Draw nodes
  graph.nodes.forEach(node => drawNode(canvas, node));

  // Draw edges
  graph.edges.forEach(edge => {
    drawEdge(canvas, edge);
  });

  return canvas.toString();
}
