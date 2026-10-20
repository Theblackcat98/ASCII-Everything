export class Canvas {
  private grid: string[][];
  public readonly width: number;
  public readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // Initialize the grid with blank spaces
    this.grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(' '));
  }

  /**
   * Places a character at a specific (x, y) coordinate.
   * Ignores writes that are out of bounds.
   */
  setChar(x: number, y: number, char: string): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      // Use the first character of the string
      this.grid[y][x] = char[0];
    }
  }

  getChar(x: number, y: number): string {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.grid[y][x];
    }
    return ' ';
  }

  /**
   * Writes a string of text horizontally.
   */
  writeText(x: number, y: number, text: string): void {
    for (let i = 0; i < text.length; i++) {
      this.setChar(x + i, y, text[i]);
    }
  }

  /**
   * Converts the entire canvas grid into a single printable string.
   */
  toString(): string {
    return this.grid.map(row => row.join('')).join('\n');
  }
  /**
   * Draws a simple box with text inside.
   */
  drawBox(x: number, y: number, width: number, height: number, text: string): void {
    // Draw corners
    this.setChar(x, y, '┌');
    this.setChar(x + width - 1, y, '┐');
    this.setChar(x, y + height - 1, '└');
    this.setChar(x + width - 1, y + height - 1, '┘');

    // Draw horizontal lines
    for (let i = 1; i < width - 1; i++) {
      this.setChar(x + i, y, '─');
      this.setChar(x + i, y + height - 1, '─');
    }

    // Draw vertical lines
    for (let i = 1; i < height - 1; i++) {
      this.setChar(x, y + i, '│');
      this.setChar(x + width - 1, y + i, '│');
    }

    // Draw text
    this.writeText(x + 2, y + 1, text);
  }

  /**
   * Draws a rhombus shape with text inside.
   */
  drawRhombus(x: number, y: number, width: number, height: number, text: string): void {
    const midX = x + Math.floor(width / 2);
    const midY = y + Math.floor(height / 2);

    // Draw lines
    for (let i = 0; i < midX - x; i++) {
      this.setChar(midX - i, y + i, '/');
      this.setChar(midX + i, y + i, '\\');
      this.setChar(midX - i, y + height - 1 - i, '\\');
      this.setChar(midX + i, y + height - 1 - i, '/');
    }
    
    // Draw text
    this.writeText(x + 2, midY, text);
  }

  /**
   * Draws a line between two points, handling intersections.
   */
  drawLine(x0: number, y0: number, x1: number, y1: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    if (dx === 0) { // Vertical line
      for (let y = y0; y !== y1 + sy; y += sy) {
        const existing = this.getChar(x0, y);
        this.setChar(x0, y, lineChars.vertical[existing] || '│');
      }
    } else if (dy === 0) { // Horizontal line
      for (let x = x0; x !== x1 + sx; x += sx) {
        const existing = this.getChar(x, y0);
        this.setChar(x, y0, lineChars.horizontal[existing] || '─');
      }
    }
    // This simple version doesn't handle diagonal lines, which is fine for dagre's output.
  }
}

// Helper for drawing lines, handles intersections
const lineChars: {
  vertical: { [key: string]: string };
  horizontal: { [key: string]: string };
} = {
  vertical: { '─': '┼', '┌': '├', '┐': '┤', '└': '├', '┘': '┤', '┬': '┼', '┴': '┼', '├': '┼', '┤': '┼' },
  horizontal: { '│': '┼', '┌': '┬', '┐': '┬', '└': '┴', '┘': '┴', '┬': '┬', '┴': '┴', '├': '┼', '┤': '┼' },
};
