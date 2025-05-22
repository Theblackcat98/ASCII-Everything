#!/usr/bin/env python3
import sys
import argparse
from PIL import Image

# ASCII characters from darkest to lightest
ASCII_CHARS = '@%#*+=-:. '

def resize_image(image, new_width=100):
    """Resize image to fit the terminal width while maintaining aspect ratio."""
    width, height = image.size
    ratio = height / width
    new_height = int(new_width * ratio * 0.5)  # Terminal chars are taller than wide
    return image.resize((new_width, new_height))

def convert_to_grayscale(image):
    """Convert image to grayscale."""
    return image.convert('L')

def map_pixels_to_ascii(image, reverse=False):
    """Map each pixel to an ASCII character."""
    pixels = list(image.getdata())
    chars = []
    for pixel in pixels:
        # Map the pixel value (0-255) to an ASCII character
        index = int(pixel * (len(ASCII_CHARS) - 1) / 255)
        if reverse:
            index = len(ASCII_CHARS) - 1 - index
        chars.append(ASCII_CHARS[index])
    return chars

def true_color_ansi(r, g, b, text):
    """Apply true color ANSI codes to text."""
    return f"\033[38;2;{r};{g};{b}m{text}\033[0m"

def convert_image_to_ascii(image_path, width=100, reverse=False, bg_color=None, transparency_char=None, alpha_threshold=128, invert_on_white=False):
    """Convert image to colored ASCII art using true color."""
    try:
        image = Image.open(image_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    # Handle image with alpha channel
    has_alpha = image.mode == 'RGBA'
    
    # Create a working copy of the image
    working_image = image.copy()
    
    # Keep track of original alpha for rendering decisions
    original_alpha = None
    if has_alpha:
        original_alpha = image.split()[3]
    
    # If image has transparency and background color is provided, paste onto background
    if has_alpha and bg_color:
        bg = Image.new('RGBA', image.size, bg_color)
        working_image = Image.alpha_composite(bg, working_image)
        
        # If white background is specified and invert_on_white is True, invert the image
        if invert_on_white and bg_color[0] > 200 and bg_color[1] > 200 and bg_color[2] > 200:
            # Only invert non-transparent areas to preserve the image content
            if original_alpha:
                for y in range(working_image.height):
                    for x in range(working_image.width):
                        # Only invert pixels that were not fully transparent
                        if original_alpha.getpixel((x, y)) > alpha_threshold:
                            r, g, b, a = working_image.getpixel((x, y))
                            working_image.putpixel((x, y), (255-r, 255-g, 255-b, a))
    
    # Resize image
    working_image = resize_image(working_image, width)
    width, height = working_image.size
    
    # Resize original alpha if needed
    if original_alpha:
        original_alpha = original_alpha.resize((width, height), Image.LANCZOS)
    
    # Get grayscale image for ASCII mapping
    grayscale_image = convert_to_grayscale(working_image)
    
    # Map pixels to ASCII characters
    chars = map_pixels_to_ascii(grayscale_image, reverse)
    
    # Convert image to RGB for color extraction
    rgb_image = working_image.convert('RGB')
    
    # Print colored ASCII art
    for y in range(height):
        line = ""
        for x in range(width):
            position = y * width + x
            
            # Skip transparent pixels if transparency character is provided
            if has_alpha and transparency_char is not None and original_alpha:
                alpha_value = original_alpha.getpixel((x, y))
                if alpha_value < alpha_threshold:
                    if transparency_char == "":
                        line += " "  # Use space for empty transparency
                    else:
                        line += transparency_char
                    continue
            
            if position < len(chars):
                r, g, b = rgb_image.getpixel((x, y))
                colored_char = true_color_ansi(r, g, b, chars[position])
                line += colored_char
        print(line)

def main():
    parser = argparse.ArgumentParser(description='Convert an image to colored ASCII art with true color.')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('-w', '--width', type=int, default=100, help='Width of output (default: 100 characters)')
    parser.add_argument('-r', '--reverse', action='store_true', help='Reverse the ASCII mapping (light to dark)')
    parser.add_argument('-c', '--character', default=None, help='Use a specific character instead of ASCII gradient')
    parser.add_argument('-b', '--background', default=None, help='Background color for transparent areas (format: r,g,b,a or color name)')
    parser.add_argument('-t', '--transparent', default=None, help='Character to use for transparent pixels (empty string for space)')
    parser.add_argument('-a', '--alpha', type=int, default=128, help='Alpha threshold (0-255) for transparency (default: 128)')
    parser.add_argument('-i', '--invert-on-white', action='store_true', help='Invert colors when using white background to maintain visibility')
    
    args = parser.parse_args()
    
    # If a specific character is requested, replace the ASCII_CHARS
    global ASCII_CHARS
    if args.character:
        ASCII_CHARS = args.character
    
    # Parse background color
    bg_color = None
    if args.background:
        try:
            # Try parsing as r,g,b,a format
            if ',' in args.background:
                bg_parts = [int(x.strip()) for x in args.background.split(',')]
                if len(bg_parts) == 3:
                    bg_parts.append(255)  # Add full opacity if alpha not provided
                bg_color = tuple(bg_parts)
            else:
                # Try parsing as color name
                from PIL import ImageColor
                bg_color = ImageColor.getrgb(args.background)
                if len(bg_color) == 3:
                    bg_color = bg_color + (255,)  # Add alpha if not provided
        except:
            print(f"Warning: Could not parse background color '{args.background}'. Using default.")
    
    # Handle empty string for transparency
    transparency_char = args.transparent
    if args.transparent == "":
        transparency_char = ""
    
    convert_image_to_ascii(args.image_path, args.width, args.reverse, 
                           bg_color, transparency_char, args.alpha, args.invert_on_white)
    
if __name__ == '__main__':
    main() 