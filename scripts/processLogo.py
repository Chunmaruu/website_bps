from PIL import Image

def make_transparent(input_path, output_png, output_webp):
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size
    pixels = img.load()

    # Sample the corner pixel color (assumed background)
    corner_colors = [pixels[0, 0], pixels[width - 1, 0], pixels[0, height - 1], pixels[width - 1, height - 1]]
    
    # Process every pixel
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # If the pixel is white or light grey/checkerboard background
            diff_rg = abs(r - g)
            diff_gb = abs(g - b)
            diff_rb = abs(r - b)
            
            # Pure/near white or grey checkerboard pattern
            if (r > 190 and g > 190 and b > 190 and diff_rg < 25 and diff_gb < 25 and diff_rb < 25) or (r > 235 and g > 235 and b > 235):
                # Calculate transparency fade at edges for smooth anti-aliasing
                if r > 240 and g > 240 and b > 240:
                    pixels[x, y] = (r, g, b, 0)
                else:
                    # Partial transparency for anti-aliasing
                    alpha = max(0, int(255 - ((r + g + b) / 3 - 190) * 4))
                    pixels[x, y] = (r, g, b, 0)

    # Crop extra padding if needed
    img.save(output_png, 'PNG')
    img.save(output_webp, 'WEBP')
    print("Logo successfully made transparent!")

if __name__ == '__main__':
    make_transparent('gambar/logo.webp', 'gambar/logo.png', 'gambar/logo.webp')
