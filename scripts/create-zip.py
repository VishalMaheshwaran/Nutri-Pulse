import os
import zipfile
import sys

def make_zip(source_dir, output_zip_path):
    exclude_dirs = {'.aistudio', 'node_modules', 'dev-dist', 'dist', '.git', '__pycache__', '.vite'}
    exclude_files = {'.DS_Store'}
    
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.git')]
            for file in files:
                if file in exclude_files:
                    continue
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, source_dir)
                zipf.write(abs_path, rel_path)

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else '.'
    out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/nutripulse-project.zip'
    make_zip(src, out)
    print(f"Zip created at {out} ({os.path.getsize(out)} bytes)")
