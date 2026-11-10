import os
from pathlib import Path

# The output file
OUTPUT_FILE = "FULL_CODEBASE.txt"

# Folders to ignore
IGNORE_DIRS = {".git", "node_modules", "dist", ".venv", "venv", ".github", "jq", "jd"}

# File extensions to include
INCLUDE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".json", ".yml", ".yaml", ".sql", ".md", ".py", ".toml"}

# Specific files to ignore
IGNORE_FILES = {"package-lock.json", "FULL_CODEBASE.txt", "generate_codebase.py"}

def generate_tree(startpath):
    tree_str = "📁 Project Directory Structure:\n"
    # Convert Path to string to avoid the TypeError
    startpath_str = str(startpath)
    
    for root, dirs, files in os.walk(startpath_str):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        level = root.replace(startpath_str, '').count(os.sep)
        indent = '    ' * level
        tree_str += f"{indent}├── {os.path.basename(root)}/\n"
        
        subindent = '    ' * (level + 1)
        for f in files:
            if f not in IGNORE_FILES and Path(f).suffix in INCLUDE_EXTS:
                tree_str += f"{subindent}├── {f}\n"
    return tree_str

def main():
    root_dir = Path.cwd()
    print(f"🔍 Scanning {root_dir}...")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        # 1. Write the Tree
        out.write("=" * 80 + "\n")
        out.write("CBT MASTER - FULL CODEBASE EXPORT\n")
        out.write("=" * 80 + "\n\n")
        out.write(generate_tree(root_dir))
        out.write("\n\n" + "=" * 80 + "\n")
        out.write("FILE CONTENTS\n")
        out.write("=" * 80 + "\n\n")

        # 2. Walk and dump files
        file_count = 0
        for root, dirs, files in os.walk(str(root_dir)):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                if file in IGNORE_FILES:
                    continue
                
                filepath = Path(root) / file
                if filepath.suffix not in INCLUDE_EXTS:
                    continue

                # Safe relative path calculation
                rel_path = filepath.relative_to(root_dir)
                
                try:
                    content = filepath.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    continue # Skip binary files that slipped through

                out.write(f"\n{'─' * 80}\n")
                out.write(f"📄 FILE: {rel_path}\n")
                out.write(f"{'─' * 80}\n\n")
                out.write(content)
                out.write("\n")
                file_count += 1
                print(f"  + Added {rel_path}")

    print(f"\n✅ Successfully exported {file_count} files to {OUTPUT_FILE}")
    print(f"📦 File size: {os.path.getsize(OUTPUT_FILE) / 1024:.2f} KB")

if __name__ == "__main__":
    main()
