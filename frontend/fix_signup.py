import re

with open('src/app/signup/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Select component with Input
select_pattern = re.compile(r'<Select\s+label="Society".*?/>', re.DOTALL)
replacement = '''<Input
                label="Society Name"
                placeholder="e.g. Green Valley Apartments"
                {...register('societyName')}
                error={errors.societyName?.message}
                disabled={isLoading}
              />'''
content = select_pattern.sub(replacement, content)

# Remove the societyOptions array
options_pattern = re.compile(r'const societyOptions = \[.*?\];', re.DOTALL)
content = options_pattern.sub('', content)

with open('src/app/signup/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated signup page")
