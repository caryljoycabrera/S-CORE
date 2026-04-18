const fs = require('fs');

const files = [
    'public/javascripts/ejs/allrequestsadmin.js',
    'public/javascripts/ejs/approvals.js',
    'public/javascripts/ejs/services.js'
];

const loaderHtml = "if (historySection) historySection.style.display = 'block';\n        if (historyContainer) historyContainer.innerHTML = '<div style=\"text-align: center; padding: 2rem;\"><div class=\"spinner-border text-primary\" role=\"status\" style=\"width: 2rem; height: 2rem; border-width: 0.2em;\"><span class=\"visually-hidden\">Loading...</span></div><p style=\"margin-top: 1rem; color: #6b7280; font-size: 0.875rem;\">Loading revision history...</p></div>';";

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf-8');
        let newContent = content;

        newContent = newContent.replace(/(\s*)(const response = await fetch\(\\/api\/revision-history\/\$\{requestId\}\\);)/g, '\' + loaderHtml + '\\');
        newContent = newContent.replace(/(\s*)(const response = await fetch\(\\/api\/service-revision-history\/\$\{requestId\}\\);)/g, '\' + loaderHtml + '\\');

        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf-8');
            console.log('Updated ' + file);
        } else {
            console.log('No match found in ' + file);
        }
    } catch (e) {
        console.error('Error updating ' + file + ':', e.message);
    }
});