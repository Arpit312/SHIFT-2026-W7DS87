import os
import glob
import re

base_path = 'src/app/dashboard/owner'
for page_file in glob.glob(f'{base_path}/**/page.tsx', recursive=True):
    with open(page_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Let's find any root-level conditional returns and move them inside the main return.
    # Actually, it's safer to just manually fix the specific ones we know about.
    # But for a quick fix, if a file has if (error) return ... at the root, Next.js complains.
    print(f"Checking {page_file}")
