import math
import time
import sys
import argparse
import os

# --- Constants and Configuration ---
# DEFAULT_CHARS = " .:-=+*#%@"  # Shading characters (sparse to dense)
DEFAULT_CHARS = ".,:;*!?#@"  # A 9-character set to match gradients

# ANSI Escape Codes
ANSI_RESET = "\033[0m"
ANSI_CLEAR_SCREEN = "\033[2J"
ANSI_CURSOR_HOME = "\033[H"

# Camera and Projection
CAM_DISTANCE = 5.0  # Default distance of the camera from the origin

# Predefined color gradients (9 steps, matching default_chars length)
# Each gradient goes from darker to brighter
PREDEFINED_GRADIENTS = {
    "white": [232, 235, 238, 241, 244, 247, 250, 253, 255],  # Grayscale
    "grey": [232, 235, 238, 241, 244, 247, 250, 253, 255],
    "gray": [232, 235, 238, 241, 244, 247, 250, 253, 255],
    "red": [52, 88, 124, 160, 196, 197, 198, 200, 201],
    "green": [22, 28, 34, 40, 46, 47, 48, 83, 119],
    "blue": [17, 18, 19, 20, 21, 27, 33, 39, 45],
    "yellow": [58, 100, 142, 184, 226, 227, 228, 229, 230],
    "magenta": [53, 91, 127, 163, 199, 200, 201, 206, 207],
    "cyan": [24, 31, 38, 45, 51, 50, 86, 122, 159],
}

# For resolving color names to single ANSI 256 codes (mainly for background)
COLOR_NAME_TO_CODE = {
    "black": 0,
    "maroon": 1,
    "green": 2,
    "olive": 3,
    "navy": 4,
    "purple": 5,
    "teal": 6,
    "silver": 7,
    "grey": 8,
    "red": 9,
    "lime": 10,
    "yellow": 11,
    "blue": 12,
    "fuchsia": 13,
    "aqua": 14,
    "white": 15,
    # 256 color specific names
    "darkgrey": 232,
    "darkgray": 232,
    "lightgrey": 250,
    "lightgray": 250,
    # Using the brightest color from gradients for simple name mapping if needed elsewhere
    "brightred": 196,
    "brightgreen": 46,
    "brightblue": 21,
    "brightyellow": 226,
    "brightmagenta": 199,
    "brightcyan": 51,
    "brightwhite": 255,
}
# Add standard 16 ansi color codes (0-15)
for i in range(16):
    COLOR_NAME_TO_CODE[str(i)] = i
# Add 256 color cube codes (16-231) and grayscale (232-255)
for i in range(16, 256):
    COLOR_NAME_TO_CODE[str(i)] = i


# --- Helper Functions (Vector/Matrix Operations) ---
def dot_product(vec1, vec2):
    return sum(v1 * v2 for v1, v2 in zip(vec1, vec2))


def cross_product(vec1, vec2):
    return [
        vec1[1] * vec2[2] - vec1[2] * vec2[1],
        vec1[2] * vec2[0] - vec1[0] * vec2[2],
        vec1[0] * vec2[1] - vec1[1] * vec2[0],
    ]


def normalize(vec):
    mag = math.sqrt(sum(v * v for v in vec))
    if mag == 0:
        return [0.0, 0.0, 0.0]  # Or handle error, e.g. return [0,0,1] for light
    return [v / mag for v in vec]


def multiply_matrix_vector(matrix, vector):
    result = [0.0, 0.0, 0.0]
    for i in range(3):
        for j in range(3):
            result[i] += matrix[i][j] * vector[j]
    return result


def rotate_x_matrix(angle_rad):
    c, s = math.cos(angle_rad), math.sin(angle_rad)
    return [[1, 0, 0], [0, c, -s], [0, s, c]]


def rotate_y_matrix(angle_rad):
    c, s = math.cos(angle_rad), math.sin(angle_rad)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]


def rotate_z_matrix(angle_rad):
    c, s = math.cos(angle_rad), math.sin(angle_rad)
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]]


def apply_transformation(point, rot_x_mat, rot_y_mat, rot_z_mat):
    # Order: X, then Y, then Z
    p = multiply_matrix_vector(rot_x_mat, point)
    p = multiply_matrix_vector(rot_y_mat, p)
    p = multiply_matrix_vector(rot_z_mat, p)
    return p


# --- Cube Class ---
class Cube:
    def __init__(self, size):
        s = float(size)
        # Vertices: CCW from bottom, then CCW from top
        self._initial_vertices = [
            [-s, -s, -s],
            [s, -s, -s],
            [s, s, -s],
            [-s, s, -s],  # Bottom face (z=-s)
            [-s, -s, s],
            [s, -s, s],
            [s, s, s],
            [-s, s, s],  # Top face (z=s)
        ]
        # Faces: vertex indices, CCW order when viewed from outside
        self._faces = [
            (0, 3, 2, 1),  # Bottom face (normal 0,0,-1)
            (4, 5, 6, 7),  # Top face (normal 0,0,1)
            (0, 1, 5, 4),  # Front face (normal 0,-1,0) Looking from positive Y
            (1, 2, 6, 5),  # Right face (normal 1,0,0)
            (2, 3, 7, 6),  # Back face (normal 0,1,0) Looking from negative Y
            (3, 0, 4, 7),  # Left face (normal -1,0,0)
        ]
        self._initial_face_normals = []
        for face_indices in self._faces:
            v0 = self._initial_vertices[face_indices[0]]
            v1 = self._initial_vertices[face_indices[1]]
            v2 = self._initial_vertices[face_indices[2]]
            edge1 = [v1[i] - v0[i] for i in range(3)]
            edge2 = [
                v2[i] - v0[i] for i in range(3)
            ]  # Using v0,v1,v2 for normal calculation
            normal = normalize(cross_product(edge1, edge2))
            self._initial_face_normals.append(normal)

        self.rotation_x = 0.0
        self.rotation_y = 0.0
        self.rotation_z = 0.0

    def update_rotation(self, dx_rad, dy_rad, dz_rad):
        self.rotation_x += dx_rad
        self.rotation_y += dy_rad
        self.rotation_z += dz_rad

    def get_points_for_rendering(
        self,
        light_direction,
        focal_length,
        screen_width,
        screen_height,
        cam_dist,
        face_point_density,
        char_aspect_ratio=1.0,
    ):
        render_points = []

        rot_x_mat = rotate_x_matrix(self.rotation_x)
        rot_y_mat = rotate_y_matrix(self.rotation_y)
        rot_z_mat = rotate_z_matrix(self.rotation_z)

        # Scale factor for screen projection
        # Adjust Y scale for character aspect ratio
        # The smaller dimension of the screen will correspond to roughly 2 units in projected space
        # (e.g. if projected coords are in [-1, 1])
        # We scale X by char_aspect_ratio to make it wider if chars are tall
        effective_screen_height = screen_height
        effective_screen_width = screen_width / char_aspect_ratio

        # Base scale to fit a 2-unit wide object (e.g. projected coords in [-1,1])
        # into the smaller of the effective dimensions.
        base_scale = min(effective_screen_width, effective_screen_height) / 2.0

        scale_x = base_scale * char_aspect_ratio
        scale_y = base_scale

        for face_idx, face_v_indices in enumerate(self._faces):
            initial_normal = self._initial_face_normals[face_idx]
            transformed_normal = apply_transformation(
                initial_normal, rot_x_mat, rot_y_mat, rot_z_mat
            )

            # Back-face culling: if normal's Z component is positive, it's facing away from a camera at (0,0,-cam_dist)
            # (assuming camera looks towards positive Z of its own space)
            # Our camera is at (0,0,-cam_dist) in world space, looking at origin.
            # A face is visible if its normal has a Z component pointing towards the camera (negative Z).
            # So, if transformed_normal[2] > 0 (points away from camera), cull it.
            # More robust: dot product of normal with view vector (origin - camera_pos)
            view_vector = normalize(
                [0 - 0, 0 - 0, 0 - (-cam_dist)]
            )  # from camera to origin
            if (
                dot_product(transformed_normal, view_vector) >= 0.03
            ):  # Add a small threshold to avoid z-fighting on edges
                continue

            intensity = max(0, dot_product(transformed_normal, light_direction))
            intensity = min(1, intensity)  # Clamp intensity

            v_orig = [self._initial_vertices[i] for i in face_v_indices]
            v0, v1, v2, v3 = (
                v_orig[0],
                v_orig[1],
                v_orig[2],
                v_orig[3],
            )  # These are initial cube vertices for the face

            # Generate grid of points on the face using bilinear interpolation
            # P(s,t) = (1-s)(1-t)A + s(1-t)B + (1-s)tD + s*t*C
            # A=v0, B=v1, C=v2, D=v3 if face vertices are A,B,C,D in order
            # Our faces are (v0, v3, v2, v1) for bottom, so A=v0, B=v3, C=v2, D=v1. Let's use consistent v0,v1,v2,v3 from self._faces
            # The self._faces are (p0, p1, p2, p3) in CCW order.
            # So A=v_orig[0], B=v_orig[1], C=v_orig[2], D=v_orig[3]
            # P(s,t) = (1-s)(1-t)v_orig[0] + s(1-t)v_orig[1] + s*t*v_orig[2] + (1-s)t*v_orig[3]
            # This assumes v_orig[0], v_orig[1], v_orig[3], v_orig[2] form a convex quad in s,t space.
            # Let A=v_orig[0], B=v_orig[1], C=v_orig[2], D=v_orig[3]
            # P(s,t) = (1-s) * ((1-t)*A + t*D) + s * ((1-t)*B + t*C)
            # This interpolates along AD and BC, then between those. This is standard.

            A, B, C, D = (
                v_orig[0],
                v_orig[1],
                v_orig[2],
                v_orig[3],
            )  # For a face (A,B,C,D)

            for i in range(face_point_density + 1):
                s = i / face_point_density
                for j in range(face_point_density + 1):
                    t = j / face_point_density

                    # Bilinear interpolation for P(s,t) on quad A,B,C,D
                    # P(s,t) = A(1-s)(1-t) + B s(1-t) + C s t + D (1-s)t
                    # (Assuming A,B,C,D are counter-clockwise vertices of the quad)
                    point_3d_on_face = [0, 0, 0]
                    for k_dim in range(3):  # x,y,z components
                        p_st = (
                            A[k_dim] * (1 - s) * (1 - t)
                            + B[k_dim] * s * (1 - t)
                            + C[k_dim] * s * t
                            + D[k_dim] * (1 - s) * t
                        )
                        point_3d_on_face[k_dim] = p_st

                    rotated_point = apply_transformation(
                        point_3d_on_face, rot_x_mat, rot_y_mat, rot_z_mat
                    )

                    # Perspective Projection
                    # Shift cube along Z relative to camera before projection
                    # Camera is at (0,0,-cam_dist), looking towards origin.
                    # Effective Z for projection is point's Z + cam_dist
                    projected_z = rotated_point[2] + cam_dist
                    if (
                        projected_z <= 0
                    ):  # Avoid division by zero or points behind camera
                        continue

                    projected_x = rotated_point[0] * focal_length / projected_z
                    projected_y = rotated_point[1] * focal_length / projected_z

                    # Scale to screen coordinates
                    # Map projected_x, projected_y (typically in range like [-1, 1] or [-size, size]) to screen pixels
                    # (0,0) is top-left for screen buffer
                    screen_x = int(projected_x * scale_x + screen_width / 2)
                    screen_y = int(
                        projected_y * scale_y + screen_height / 2
                    )  # Y is often inverted in projection, but here positive Y up in world, positive Y down on screen

                    render_points.append((screen_x, screen_y, projected_z, intensity))
        return render_points


# --- Renderer Class ---
class Renderer:
    def __init__(self, width, height, char_set, fg_colors_list, bg_color_ansi_str):
        self.width = width
        self.height = height
        self.char_set = char_set
        self.fg_colors = fg_colors_list  # This is a list of ANSI codes for the gradient
        self.bg_color_ansi = bg_color_ansi_str  # Full ANSI string for background
        self.num_chars = len(char_set)
        self.num_fg_colors = len(fg_colors_list)

        # Initialize with a default char (space) and no specific fg/bg (will be set by bg_color_ansi)
        self.screen_buffer = [[" " for _ in range(width)] for _ in range(height)]
        self.depth_buffer = [
            [float("inf") for _ in range(width)] for _ in range(height)
        ]
        # Store actual color codes to apply, not just indices
        self.fg_color_buffer = [[None for _ in range(width)] for _ in range(height)]

    def clear_buffers(self):
        for r in range(self.height):
            for c in range(self.width):
                self.screen_buffer[r][c] = " "
                self.depth_buffer[r][c] = float("inf")
                self.fg_color_buffer[r][c] = None

    def add_point(self, x, y, z_depth, intensity):
        if 0 <= x < self.width and 0 <= y < self.height:
            if z_depth < self.depth_buffer[y][x]:
                self.depth_buffer[y][x] = z_depth

                char_idx = int(intensity * (self.num_chars - 1))
                char_idx = max(0, min(char_idx, self.num_chars - 1))  # Clamp index
                self.screen_buffer[y][x] = self.char_set[char_idx]

                color_idx = int(intensity * (self.num_fg_colors - 1))
                color_idx = max(
                    0, min(color_idx, self.num_fg_colors - 1)
                )  # Clamp index
                self.fg_color_buffer[y][x] = self.fg_colors[color_idx]

    def render(self):
        output_string_parts = [ANSI_CURSOR_HOME]
        current_fg_code = -1  # Use -1 to ensure first color is always set

        for r in range(self.height):
            output_string_parts.append(
                self.bg_color_ansi
            )  # Set background for the whole line
            current_fg_code = -1  # Reset fg_code at start of line to ensure it's set
            for c in range(self.width):
                char_to_print = self.screen_buffer[r][c]
                fg_code_for_char = self.fg_color_buffer[r][c]

                if fg_code_for_char is not None:
                    if fg_code_for_char != current_fg_code:
                        output_string_parts.append(f"\033[38;5;{fg_code_for_char}m")
                        current_fg_code = fg_code_for_char
                elif (
                    current_fg_code is not None and char_to_print != " "
                ):  # If no fg color but char exists, reset to default fg on this bg
                    # This case implies a background character, fg should not matter or be default
                    # To be safe, could reset to a default foreground or ensure bg_color_ansi also sets a default fg
                    # For now, rely on bg_color_ansi to fill, and only set fg for actual cube points.
                    # If current_fg_code is set, and this spot has no specific color, reset.
                    # This might be complex. Simpler: if fg_code_for_char is None, it's a background pixel.
                    # The self.bg_color_ansi has been applied.
                    # If previous char had a color, we might need to reset or set to bg's inherent fg.
                    # For now, assume bg_color_ansi handles fg for empty spots implicitly.
                    # The current logic: if fg_code_for_char is None, it prints with whatever fg is active.
                    # This is usually fine if bg is dark.
                    # Let's ensure fg is reset if the new char has no color but old one did.
                    if current_fg_code != -1:  # If a color was active
                        output_string_parts.append(
                            f"\033[38;5;{COLOR_NAME_TO_CODE['white']}m"
                        )  # Default to white on the BG
                        current_fg_code = -1  # Mark as default/unset

                output_string_parts.append(char_to_print)

            if r < self.height - 1:  # Avoid extra newline at the end of screen
                output_string_parts.append(
                    ANSI_RESET + "\n"
                )  # Reset at end of line, then newline
            else:
                output_string_parts.append(ANSI_RESET)

        sys.stdout.write("".join(output_string_parts))
        sys.stdout.flush()


# --- Argument Parsing and Main ---
def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Render a rotating ASCII cube in the terminal."
    )
    parser.add_argument("--fps", type=float, default=20.0, help="Frames per second.")
    parser.add_argument(
        "--rotation-x",
        type=float,
        default=0.5,
        help="Rotation speed around X-axis (degrees/frame).",
    )
    parser.add_argument(
        "--rotation-y",
        type=float,
        default=1.0,
        help="Rotation speed around Y-axis (degrees/frame).",
    )
    parser.add_argument(
        "--rotation-z",
        type=float,
        default=0.3,
        help="Rotation speed around Z-axis (degrees/frame).",
    )
    parser.add_argument("--size", type=float, default=1.0, help="Cube size multiplier.")
    parser.add_argument(
        "--focal-length",
        type=float,
        default=2.5,
        help="Focal length for perspective projection.",
    )
    parser.add_argument(
        "--cam-distance",
        type=float,
        default=CAM_DISTANCE,
        help="Camera distance from origin.",
    )
    parser.add_argument(
        "--chars",
        type=str,
        default=DEFAULT_CHARS,
        help="Character set for shading (sparse to dense).",
    )
    parser.add_argument(
        "--fg-color",
        type=str,
        default="white",
        help="Foreground color: name (e.g., 'blue', 'white' for gradient) or ANSI 256 code (0-255 for solid color).",
    )
    parser.add_argument(
        "--bg-color",
        type=str,
        default="black",
        help="Background color: name or ANSI 256 code.",
    )
    parser.add_argument(
        "--light-x",
        type=float,
        default=0.5,
        help="X component of light source direction.",
    )
    parser.add_argument(
        "--light-y",
        type=float,
        default=0.8,
        help="Y component of light source direction.",
    )
    parser.add_argument(
        "--light-z",
        type=float,
        default=-1.0,
        help="Z component of light source direction (camera relative). Positive Z is 'behind' camera if camera looks along -Z world.",
    )
    parser.add_argument(
        "--density",
        type=int,
        default=10,
        help="Number of points per edge on cube faces (e.g., 10 means 11x11 points per face).",
    )
    parser.add_argument(
        "--char-aspect",
        type=float,
        default=2.0,
        help="Aspect ratio (width/height) of characters in terminal. Typical is 0.5 (chars twice as tall as wide), so use 2.0 to compensate for x-scaling.",
    )

    return parser.parse_args()


def get_terminal_size():
    try:
        cols, lines = os.get_terminal_size()
    except OSError:
        cols, lines = 80, 24  # Default size if not in a real terminal
    return cols, lines


def main():
    args = parse_arguments()

    cols, lines = get_terminal_size()

    rot_x_rad = math.radians(args.rotation_x)
    rot_y_rad = math.radians(args.rotation_y)
    rot_z_rad = math.radians(args.rotation_z)

    # Light direction (normalized) - make it point towards the cube from viewer's general direction
    # Light vector should be specified in world coordinates.
    # If light Z is positive, it's from "behind" the cube relative to camera at (0,0,-cam_dist)
    light_direction = normalize([args.light_x, args.light_y, args.light_z])
    if all(v == 0 for v in light_direction):  # Handle (0,0,0) light
        light_direction = [0, 0, -1]  # Default light from camera

    num_char_steps = len(args.chars)
    final_fg_colors = []

    try:
        color_code = int(args.fg_color)
        if not (0 <= color_code <= 255):
            raise ValueError("Color code out of range 0-255")
        final_fg_colors = [color_code] * num_char_steps
    except ValueError:
        gradient = PREDEFINED_GRADIENTS.get(args.fg_color.lower())
        if gradient:
            if len(gradient) == num_char_steps:
                final_fg_colors = gradient
            else:  # Resample gradient or use brightest color
                # Simplest: use brightest color of gradient as solid
                print(
                    f"Warning: Char set length ({num_char_steps}) differs from '{args.fg_color}' gradient length ({len(gradient)}). Using solid color."
                )
                final_fg_colors = [gradient[-1]] * num_char_steps
        else:  # Unknown color name
            # Try resolving via COLOR_NAME_TO_CODE for a solid color
            single_code = COLOR_NAME_TO_CODE.get(args.fg_color.lower())
            if single_code is not None:
                final_fg_colors = [single_code] * num_char_steps
            else:
                print(
                    f"Unknown fg-color name: '{args.fg_color}'. Using default white gradient."
                )
                default_white_gradient = PREDEFINED_GRADIENTS["white"]
                if len(default_white_gradient) == num_char_steps:
                    final_fg_colors = default_white_gradient
                else:
                    final_fg_colors = [default_white_gradient[-1]] * num_char_steps

    # Resolve background color
    bg_color_val = COLOR_NAME_TO_CODE.get("black")  # Default
    try:
        parsed_bg_val = int(args.bg_color)
        if 0 <= parsed_bg_val <= 255:
            bg_color_val = parsed_bg_val
        else:
            print(
                f"Warning: BG color code '{args.bg_color}' out of range. Using default."
            )
    except ValueError:
        resolved_code = COLOR_NAME_TO_CODE.get(args.bg_color.lower())
        if resolved_code is not None:
            bg_color_val = resolved_code
        else:
            print(
                f"Unknown background color name: '{args.bg_color}'. Using default black."
            )

    bg_color_ansi = f"\033[48;5;{bg_color_val}m"

    cube = Cube(args.size)
    renderer = Renderer(cols, lines, args.chars, final_fg_colors, bg_color_ansi)

    sys.stdout.write(ANSI_CLEAR_SCREEN)  # Clear screen once at start

    try:
        while True:
            cols, lines = get_terminal_size()  # Check for resize (basic handling)
            if renderer.width != cols or renderer.height != lines:
                # Simplistic resize: re-init renderer. Could be more sophisticated.
                renderer = Renderer(
                    cols, lines, args.chars, final_fg_colors, bg_color_ansi
                )
                sys.stdout.write(ANSI_CLEAR_SCREEN)

            renderer.clear_buffers()
            cube.update_rotation(rot_x_rad, rot_y_rad, rot_z_rad)

            points_to_render = cube.get_points_for_rendering(
                light_direction,
                args.focal_length,
                cols,
                lines,
                args.cam_distance,
                args.density,
                args.char_aspect,
            )

            for p_data in points_to_render:
                renderer.add_point(p_data[0], p_data[1], p_data[2], p_data[3])

            renderer.render()
            time.sleep(1.0 / args.fps)

    except KeyboardInterrupt:
        print("Exiting...")
    finally:
        # Clean up terminal
        sys.stdout.write(ANSI_CURSOR_HOME)  # Move cursor to top-left
        sys.stdout.write(
            f"\033[48;5;{COLOR_NAME_TO_CODE['black']}m"
        )  # Reset background to black
        sys.stdout.write(ANSI_CLEAR_SCREEN)  # Clear screen with black background
        sys.stdout.write(ANSI_RESET)  # Reset all attributes
        sys.stdout.flush()


if __name__ == "__main__":
    main()
