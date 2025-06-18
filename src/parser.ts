import mermaid from 'mermaid';
import { AsciiGraph, AsciiNode, AsciiEdge } from './types';

// Initialize Mermaid API for parsing
mermaid.initialize({ startOnLoad: false });

export async function buildGraph(source: string): Promise<AsciiGraph> {
  const graph: AsciiGraph = {
    nodes: new Map(),
    edges: [],
  };

  try {
    // THE DEFINITIVE SOLUTION:
    // 1. The correct function is `getDiagramFromText`.
    // 2. The library's main type definition is incomplete, so we cast `mermaid` to `any`
    //    to bypass the incorrect compile-time error.
    const diagram = await (mermaid as any).getDiagramFromText(source);

    // 3. Now we can correctly get the parser and the database from the diagram object.
    const db = diagram.getParser().getDiagramDb();

    // 4. This logic is now valid because `db` is correctly populated.
    const vertices = db.getVertices();
    for (const id in vertices) {
      const vertex = vertices[id];
      const node: AsciiNode = {
        id: vertex.id,
        text: (vertex.text || '').replace(/"/g, '"'),
        shape: vertex.type === 'question' ? 'rhombus' : 'rect',
        x: 0, y: 0, width: 0, height: 0,
      };
      graph.nodes.set(id, node);
    }

    const edges = db.getEdges();
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
