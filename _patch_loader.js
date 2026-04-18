const fs = require('fs');

const files = [
    'public/javascripts/ejs/allrequestsadmin.js',
    'public/javascripts/ejs/approvals.js',
    'public/javascripts/ejs/services.js'
];

const loaderHtml = "if (historySection) historySection.style.display = 'block';\nif (historyContainer) historyContainer.innerHTML = '<div style=\"text-align: center; padding: 2rem;\"><div class=\"spinner-border text-primary\" role=\"status\" style=\"width: 2rem; height: 2rem; border-width: 0.2em;\"><span class=\"visually-hidden\">Loading...</span></div><p style=\"margin-top: 1rem; color: #6b7280; font-size: 0.875rem;\">Loading revision history...</p></div>';";

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf-8');
        let newContent = content.replace(/(\s+)(const response = await fetch\([\'\"]\/(?:api\/)(?:revision|service|approval)-history\/)/g, '\' + loaderHtml + '\\');
        
        // Also look for: = await fetch(/api/revision-history/)
        // Let's just be explicit
        const targetRegex = /(\s+)(const\s+response\s*=\s*await\s+fetch\(['"]\/api\/(?:revision-history|service-revision-history)\/[^)]+\)[^;]*;)/g;
        newContent = content.replace(targetRegex, '\' + loaderHtml + '\\');

        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf-8');
            console.log('Updated ' + file);
        } else {
            console.log('No match in ' + file);
        }
    } catch (e) {
        console.error('Error ' + file + ':', e.message);
    }
});
