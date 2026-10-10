import re

with open('src/app/dashboard/owner/conditions/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'const fileName = .*?;',
    'const fileName = ${Math.random().toString(36).substring(2)}-.;',
    content
)

content = re.sub(
    r'const filePath = .*?;',
    'const filePath = proof//;',
    content
)

with open('src/app/dashboard/owner/conditions/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed strings safely via Python.")
