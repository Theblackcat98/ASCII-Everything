# Image to ASCII Art Converter

A command-line tool that converts images to colored ASCII art displayed in the terminal.

## Features

- Convert any image to ASCII art
- Display with colors in the terminal
- Adjust width of the output
- Reverse colors (light-to-dark mapping)
- Choose between regular 8-color mode or true color mode
- Optionally use a specific character
- **New**: Properly handle transparent backgrounds
- **New**: Fix white background handling with invert option

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/ImageToAscii.git
   cd ImageToAscii
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

### Basic Usage

```bash
python image_to_ascii.py path/to/your/image.jpg
```

### Options

- `-w, --width`: Set the width of the output in characters (default: 100)
- `-r, --reverse`: Reverse the ASCII mapping (light to dark)
- `-c, --character`: Use a specific character instead of ASCII gradient
- `-b, --background`: Set the background color for transparent areas (format: r,g,b,a or color name)
- `-t, --transparent`: Set the character to use for transparent pixels (use empty string for space)
- `-a, --alpha`: Set the alpha threshold (0-255) for transparency (default: 128)
- `-i, --invert-on-white`: Invert colors when using white background to maintain visibility

### True Color Mode

For better color representation (if your terminal supports it):

```bash
python image_to_ascii_truecolor.py path/to/your/image.jpg
```

Both scripts support the same command-line options.

### Examples

Convert an image with default settings:
```bash
python image_to_ascii.py image.png
```

Convert with a width of 150 characters:
```bash
python image_to_ascii.py image.png -w 150
```

Convert with reversed colors:
```bash
python image_to_ascii.py image.png -r
```

Use true color mode with a specific character:
```bash
python image_to_ascii_truecolor.py image.png -c "#"
```

Handle transparent areas by making them visible as dots:
```bash
python image_to_ascii_truecolor.py transparent_image.png -t "."
```

Fill transparent areas with a white background:
```bash
python image_to_ascii_truecolor.py transparent_image.png -b white
```

Fill transparent areas with a white background and invert the image to maintain visibility:
```bash
python image_to_ascii_truecolor.py transparent_image.png -b white -i
```

Use spaces for transparent areas:
```bash
python image_to_ascii_truecolor.py transparent_image.png -t ""
```

Adjust alpha threshold (higher values make more pixels transparent):
```bash
python image_to_ascii_truecolor.py transparent_image.png -t " " -a 200
```

## Requirements

- Python 3.6+
- Pillow (PIL Fork)
- Colorama (for basic version)

## License

MIT License 