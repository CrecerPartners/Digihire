from PIL import Image
import os

assets_dirs = [
    'apps/landing/public/assets',
    'public/assets'
]

files_to_process = [
    ('talent-1.jpg', 'talent-1.jpg', 800),
    ('talent-2.png', 'talent-2.jpg', 800),
    ('talent-3.png', 'talent-3.jpg', 800),
    ('talent-4.jpg', 'talent-4.jpg', 800),
]

for adir in assets_dirs:
    for src_name, dst_name, max_width in files_to_process:
        src_path = os.path.join(adir, src_name)
        dst_path = os.path.join(adir, dst_name)
        if os.path.exists(src_path):
            img = Image.open(src_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            # Calculate new height maintaining aspect ratio
            w, h = img.size
            if w > max_width:
                new_h = int(h * (max_width / w))
                img = img.resize((max_width, new_h), Image.Resampling.LANCZOS)
            img.save(dst_path, 'JPEG', quality=82, optimize=True)
            print(f"Compressed {src_path} -> {dst_path} ({os.path.getsize(dst_path)} bytes)")

print("All images compressed successfully!")
