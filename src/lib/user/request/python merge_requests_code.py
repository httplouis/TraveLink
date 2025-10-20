import os

ROOT_FOLDER = "."

OUTPUT_FILE = os.path.join(ROOT_FOLDER, "_MERGED_requests_code.txt")
INCLUDE_EXTS = {".tsx", ".ts"}  # baguhin mo lang kung gusto mong isama lahat
EXCLUDE_DIR_NAMES = {".next", "node_modules", "dist", "build"}
EXCLUDE_PATTERNS_ENDSWITH = {".d.ts", ".map"}

# dynamic basenames we must skip everywhere
SCRIPT_BASENAME = os.path.basename(__file__)
OUTPUT_BASENAME = os.path.basename(OUTPUT_FILE)

# extra safety: skip any merged outputs or similarly named helpers
EXCLUDE_BASENAMES = {
    SCRIPT_BASENAME,
    OUTPUT_BASENAME,
}
EXCLUDE_PREFIXES = {"_MERGED_"}          # e.g., _MERGED_requests_code.txt
EXCLUDE_SUBSTRINGS = {"merge_requests_code"}  # e.g., python merge_requests_code.py

def should_include(path: str) -> bool:
    bn = os.path.basename(path)

    # hard excludes by name
    if (
        bn in EXCLUDE_BASENAMES
        or any(bn.startswith(pfx) for pfx in EXCLUDE_PREFIXES)
        or any(substr in bn for substr in EXCLUDE_SUBSTRINGS)
    ):
        return False

    # pattern excludes by suffix
    if any(bn.endswith(p) for p in EXCLUDE_PATTERNS_ENDSWITH):
        return False

    # extension filter
    _, ext = os.path.splitext(bn)
    return ext in INCLUDE_EXTS

def main():
    if not os.path.isdir(ROOT_FOLDER):
        raise SystemExit(f"Folder not found: {ROOT_FOLDER}")

    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="\n") as out:
        for current_root, dirs, files in os.walk(ROOT_FOLDER):
            # skip unwanted directories
            dirs[:] = [d for d in sorted(dirs) if d not in EXCLUDE_DIR_NAMES]

            for fname in sorted(files):
                path = os.path.join(current_root, fname)
                if not should_include(path):
                    continue

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
