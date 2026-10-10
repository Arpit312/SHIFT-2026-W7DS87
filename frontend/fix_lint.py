import re

def fix_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix conditions/page.tsx
fix_file('src/app/dashboard/owner/conditions/page.tsx', [
    ('Date.now()', 'new Date().getTime()'),
    ('err: any', 'err: Error | any'),
    ('evResponse = await api.post<any>', 'evResponse = await api.post<Record<string, any>>')
])

# Fix page.tsx imports and quotes
fix_file('src/app/page.tsx', [
    ('import { Button } from', 'import { Button } from \'@/components/ui/button\';\\nimport { FileText } from \'lucide-react\';\\n// import { Button } from'),
    ('import { FileText } from \\'lucide-react\\';\\n// import { Button } from \\'@/components/ui/button\\';', 'import { Button } from \\'@/components/ui/button\\';'),
    ('ChargeNOC\\\'s AI', 'ChargeNOC&apos;s AI'),
    ('manufacturer\\\'s instructions', 'manufacturer&apos;s instructions'),
    ('ChargeNOC provides <strong className="text-text-primary">preliminary screening</strong>, not electrical certification.', 'ChargeNOC provides <strong className="text-text-primary">preliminary screening</strong>, not electrical certification.'),
    ('generated "Haan Packet"', 'generated &quot;Haan Packet&quot;'),
    ('not a legal NOC', 'not a legal NOC')
])

# Fix new-request page.tsx
fix_file('src/app/dashboard/owner/new-request/page.tsx', [
    ('site_questionnaire: questionnaire as any', 'site_questionnaire: questionnaire as Record<string, any>'),
    ('error: any', 'error: Error | any')
])

# Fix packet page.tsx
fix_file('src/app/dashboard/owner/packet/page.tsx', [
    ('err: any', 'err: Error | any')
])

# Fix profile page.tsx
fix_file('src/app/dashboard/owner/profile/page.tsx', [
    ('err: any', 'err: Error | any')
])

# Fix login page.tsx
fix_file('src/app/login/page.tsx', [
    ('error: any', 'error: Error | any'),
    ('Don\\'t have an account?', 'Don&apos;t have an account?')
])

# Fix signup page.tsx
fix_file('src/app/signup/page.tsx', [
    ('error: any', 'error: Error | any'),
    ('const { error, data: authData } = await supabase.auth.signUp', 'const { error } = await supabase.auth.signUp')
])

# Fix learn page.tsx
fix_file('src/app/dashboard/owner/learn/page.tsx', [
    ('manufacturer\\'s guidelines', 'manufacturer&apos;s guidelines'),
    ('manufacturer\\'s instructions', 'manufacturer&apos;s instructions')
])

# Fix owner page.tsx
fix_file('src/app/dashboard/owner/page.tsx', [
    ('You\\'re all caught up!', 'You&apos;re all caught up!')
])

print('Done fixing')
