import { AsciiGraph } from './types';

const PADDING = 2; // Horizontal padding inside a node
const NODE_SPACING_Y = 2; // Vertical spacing between nodes

/**
 * Calculates the size of each node and assigns its (x, y) coordinates.
 *
 * NOTE: This is a placeholder layout engine. A real implementation would use
 * a proper graph layout algorithm (e.g., Sugiyama/layered graph drawing).
 * This version simply stacks all nodes vertically for demonstration.
 */
export function layoutGraph(graph: AsciiGraph): AsciiGraph {
  let currentY = 1; // Start with a 1-char margin at the top

  // Calculate size for each node
  graph.nodes.forEach(node => {
    node.width = node.text.length + PADDING * 2;
    // Rectangles are 3 lines high, Rhombus are 5 for a nice shape
    node.height = node.shape === 'rhombus' ? 5 : 3;
  });

  // Position nodes
  graph.nodes.forEach(node => {
    // Center all nodes horizontally for this simple layout
    node.x = 10;
    node.y = currentY;
    currentY += node.height + NODE_SPACING_Y;
  });

  return graph;
}
