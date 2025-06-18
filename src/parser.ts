import mermaid from 'mermaid';
import { AsciiGraph, AsciiNode, AsciiEdge } from './types';

// Initialize Mermaid API for parsing
mermaid.initialize({ startOnLoad: false });
mermaid.mermaidAPI.initialize();

export async function buildGraph(source: string): Promise<AsciiGraph> {
  const graph: AsciiGraph = {
    nodes: new Map(),
    edges: [],
  };

  try {
    // The `mermaid.parse()` function returns a Diagram object. We can access the
    // graph data by calling the `getGraph()` method on the diagram object.
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
    const { db } = diagram as any;
    const vertices = db.vertices;
    const edges = db.edges;

    for (const [id, vertex] of vertices) {
      const node: AsciiNode = {
        id: vertex.id,
        text: (vertex.text || '').replace(/"/g, '"'),
        shape: vertex.type === 'question' ? 'rhombus' : 'rect',
        x: 0, y: 0, width: 0, height: 0,
      };
      graph.nodes.set(vertex.id, node);
    }

    for (const edge of edges) {
      const newEdge: AsciiEdge = {
        from: edge.start,
        to: edge.end,
        label: edge.text
      };
      graph.edges.push(newEdge);
    }

    return graph;

  } catch (e) {
    console.error("Error parsing Mermaid diagram:", (e as Error).message);
    process.exit(1);
  }
}
