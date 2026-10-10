import os

files_to_fix = [
    'src/app/login/page.tsx',
    'src/app/dashboard/owner/photo-check/page.tsx',
    'src/app/dashboard/owner/evidence/page.tsx',
    'src/app/dashboard/owner/conditions/page.tsx',
    'src/app/dashboard/owner/packet/page.tsx',
    'src/app/dashboard/owner/slots/page.tsx'
]

for file_path in files_to_fix:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'import { Suspense }' not in content:
        content = content.replace(\"'use client';\", \"'use client';\\nimport { Suspense } from 'react';\")
        
    # Find the default export
    import re
    match = re.search(r'export default function (\w+)\(\)\s*\{', content)
    if match:
        func_name = match.group(1)
        # Rename original to Inner
        inner_name = f\"{func_name}Inner\"
        content = content.replace(f\"export default function {func_name}()\", f\"function {inner_name}()\")
        
        # Append the new default export
        content += f\"\\n\\nexport default function {func_name}() {{\\n  return (\\n    <Suspense fallback={{<div>Loading...</div>}}>\\n      <{inner_name} />\\n    </Suspense>\\n  );\\n}}\\n\"
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

print('Fixed Suspense')
