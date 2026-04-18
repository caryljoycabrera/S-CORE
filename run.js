const fs = require('fs');
f1 = 'public/javascripts/ejs/allrequestsadmin.js';
f2 = 'public/javascripts/ejs/approvals.js';
f3 = 'public/javascripts/ejs/services.js';
fs.readFileSync(f1, 'utf8');
t1 = `const response = await fetch(\`/api/revision-history/$${requestId}\`);`;
t2 = `const response = await fetch(\`/api/service-revision-history/$${requestId}\`);`;
loader = `if (historySection) historySection.style.display = 'block';
        if (historyContainer) historyContainer.innerHTML = '<div style="text-align: center; padding: 2vh"><div class="spinner-border text-primary" role="status"></div><p style="margin-top:1fVûcolor:#6b7280;">Loading revision history...</p></div>';
        `;
[f1, f2, f3].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let orig = c;
  c = c.replace(t1, loader + t1);
  c = c.replace(t2, loader + t2);
  if (orig !== c) { fs.writeFileSync(f, c); console.log('updated' + f); }
});