import { AsciiGraph } from './types';
import dagre from 'dagre';

const PADDING = 2; // Horizontal padding inside a node

/**
 * Calculates the size of each node and assigns its (x, y) coordinates
 * using the Dagre layout engine.
 */
export function layoutGraph(graph: AsciiGraph): AsciiGraph {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    marginx: 2,
    marginy: 2,
    nodesep: 5,
    edgesep: 2,
    ranksep: 5,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Calculate size for each node and add to Dagre graph
  graph.nodes.forEach(node => {
    node.width = node.text.length + PADDING * 2;
    // Rectangles are 3 lines high, Rhombus are 5 for a nice shape
    node.height = 3;
    g.setNode(node.id, { width: node.width, height: node.height });
  });

  // Add edges to Dagre graph
  graph.edges.forEach(edge => {
    g.setEdge(edge.from, edge.to);
  });

  // Run layout
  dagre.layout(g);

  // Update our graph with the new layout information
  g.nodes().forEach(nodeId => {
    const dagreNode = g.node(nodeId);
    const ourNode = graph.nodes.get(nodeId);
    if (ourNode) {
      ourNode.x = Math.round(dagreNode.x - dagreNode.width / 2);
      ourNode.y = Math.round(dagreNode.y - dagreNode.height / 2);
    }
  });

  g.edges().forEach(edgeId => {
    const dagreEdge = g.edge(edgeId);
    const ourEdge = graph.edges.find(e => e.from === edgeId.v && e.to === edgeId.w);
    if (ourEdge) {
      ourEdge.points = dagreEdge.points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    }
  });

  return graph;
}
