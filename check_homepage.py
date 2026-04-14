import re

with open('views/Admin/configuration.ejs', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'<div id=\"homepage-tab\"(.*?)<div id=\"workflow-tab\"', text, re.DOTALL)
if match:
    h = match.group(1)
    containers = re.findall(r'<div id=\"([a-zA-Z0-9_]+)\" class=\"dynamic-items-container\">', h)
    for c in containers:
        block_match = re.search(fr'<div id=\"{c}\" class=\"dynamic-items-container\">(.*?)</div>\s*</div>\s*</div>', h, re.DOTALL)
        if block_match:
            b = block_match.group(1)
            # Find the first input or textarea name ending in []
            input_match = re.search(r'name=\"([a-zA-Z0-9_]+)\[\]\"', b)
            print(f'{c} -> {input_match.group(1) if input_match else "None"}')