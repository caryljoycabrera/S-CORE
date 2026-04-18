import re
import os

file_path = r"c:\Users\USER\Documents\GitHub\S-CORE\public\stylesheets\ejs\services.css"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Detect if the line is heavily spaced out (corruption)
    # A simple check: if the line has more than 5 spaces and the ratio of spaces to characters is high
    stripped = line.strip()
    if len(stripped) > 10 and stripped.count(' ') > len(stripped) // 2:
        # Remove all spaces and reconstruct
        # But wait, some spaces might be intentional (e.g. "1.5 rem")
        # However, in CSS, "1.5rem" is valid.
        # Let's remove ALL spaces and see.
        cleaned = stripped.replace(' ', '')
        # Special case: if it's a property, add a space after colon
        if ':' in cleaned and not cleaned.startswith('/') and not cleaned.startswith('*'):
            prop, val = cleaned.split(':', 1)
            cleaned = f"    {prop}: {val}"
        elif cleaned.startswith('.'):
            cleaned = cleaned
        elif cleaned.startswith('}'):
             cleaned = '}'
        new_lines.append(cleaned + '\n')
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
