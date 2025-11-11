import re

# Read the original file
with open(r'c:\Users\USER\Documents\GitHub\S-CORE\views\Unit\unitdashboard.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original file: {len(content)} characters, {len(content.splitlines())} lines")

# Extract CSS
css_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if css_match:
    css = css_match.group(1).strip()
    with open(r'c:\Users\USER\Documents\GitHub\S-CORE\public\stylesheets\ejs\Unit\unitdashboard.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print(f"✓ Extracted CSS: {len(css.splitlines())} lines")
    # Remove CSS from content
    content = content[:css_match.start()] + content[css_match.end():]
    # Add CSS link before </head>
    content = content.replace('</head>', '  <link rel="stylesheet" href="/stylesheets/ejs/Unit/unitdashboard.css" />\n</head>')
    print("✓ Removed inline CSS and added link")

# Extract JavaScript  
# Find the last <script> tag without src attribute (the inline script)
# We'll look for <script> followed by actual JavaScript code, not just a src attribute
script_pattern = r'<script>\s*([\s\S]*?)\s*</script>\s*</body>\s*</html>\s*$'
script_match = re.search(script_pattern, content)

if script_match:
    js = script_match.group(1).strip()
    with open(r'c:\Users\USER\Documents\GitHub\S-CORE\public\javascripts\ejs\Unit\unitdashboard.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print(f"✓ Extracted JavaScript: {len(js.splitlines())} lines")
    # Remove JS and replace with script src tags + closing tags
    content = content[:script_match.start()] + '''
  <!-- Include Scripts -->
  <script src="/javascripts/notifications.js"></script>
  <script src="/javascripts/ejs/Unit/unitdashboard.js"></script>
</body>
</html>'''
    print("✓ Removed inline JavaScript and added script src links")
else:
    print("⚠ No inline JavaScript found")

# Save the cleaned file
with open(r'c:\Users\USER\Documents\GitHub\S-CORE\views\Unit\unitdashboard.ejs', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✓ Cleaned file saved: {len(content)} characters, {len(content.splitlines())} lines")
print("File now contains only HTML/EJS code with external CSS/JS links")
