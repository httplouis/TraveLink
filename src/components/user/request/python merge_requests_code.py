import os

ROOT_FOLDER = "."

OUTPUT_FILE = os.path.join(ROOT_FOLDER, "_MERGED_requests_code.txt")
INCLUDE_EXTS = {".tsx", ".ts"}
EXCLUDE_NAMES = {".next", "node_modules", "dist", "build"}
EXCLUDE_PATTERNS_ENDSWITH = {".d.ts", ".map"}

def should_include(file_name: str) -> bool:
    if any(file_name.endswith(p) for p in EXCLUDE_PATTERNS_ENDSWITH):
        return False
    _, ext = os.path.splitext(file_name)
    return ext in INCLUDE_EXTS

def main():
    if not os.path.isdir(ROOT_FOLDER):
        raise SystemExit(f"Folder not found: {ROOT_FOLDER}")

    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="\n") as out:
        for current_root, dirs, files in os.walk(ROOT_FOLDER):
            dirs[:] = [d for d in sorted(dirs) if d not in EXCLUDE_NAMES]
            for fname in sorted(files):
                if not should_include(fname):
                    continue
                path = os.path.join(current_root, fname)
                rel_path = os.path.normpath(path)
                out.write(f"===== {rel_path} =====\n")
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        out.write(f.read())
                except UnicodeDecodeError:
                    with open(path, "r", encoding="latin-1") as f:
                        out.write(f.read())
                out.write("\n\n")

    print(f"✅ Done. Merged files saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
