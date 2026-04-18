files = [
    'public/javascripts/ejs/allrequestsadmin.js',
    'public/javascripts/ejs/approvals.js',
    'public/javascripts/ejs/services.js'
]

loader = "        if (historySection) historySection.style.display = 'block';\n        if (historyContainer) historyContainer.innerHTML = '<div class=\"revision-loading\" style=\"text-align: center; padding: 2rem;\"><div class=\"spinner-border text-primary\" role=\"status\" style=\"width: 2rem; height: 2rem; border-width: 0.2em;\"><span class=\"visually-hidden\">Loading...</span></div><p style=\"margin-top: 1rem; color: #6b7280; font-size: 0.875rem;\">Loading revision history...</p></div>';\n        "

for f in files:
    content = open(f, 'r', encoding='utf-8').read()
    
    t1 = "const response = await fetch(/api/revision-history/);"
    t2 = "const response = await fetch(/api/service-revision-history/);"
    
    out = content.replace(t1, loader + t1)
    out = out.replace(t2, loader + t2)
    
    if content != out:
        open(f, 'w', encoding='utf-8').write(out)
        print(f + ' updated')
    else:
        print(f + ' unchanged')