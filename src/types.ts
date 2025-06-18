// Our simplified, internal representation of the graph
// This is what we will use for layout and rendering

export interface AsciiNode {
  id: string;
  text: string;
  shape: 'rect' | 'rhombus';

  // Populated by the layout engine
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AsciiEdge {
  from: string; // Node ID
  to: string;   // Node ID
  label?: string;
}

export interface AsciiGraph {
  nodes: Map<string, AsciiNode>;
  edges: AsciiEdge[];
}
