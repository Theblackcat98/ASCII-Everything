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
}
