const fs = require('fs');
const content = fs.readFileSync('routes/unit.js', 'utf8');
const regex = /(?:RequestApproval|ServiceRequest)\.(?:find|countDocuments)\(\{([\s\S]*?)\}\)/g;
let match;
let missingCount = 0;
while ((match = regex.exec(content)) !== null) {
  const query = match[1];
  if (!query.includes("'Archived', 'Deleted'")) {
    console.log("Missing filter at index " + match.index);
    console.log(match[0].substring(0, 150) + "...\n");
    missingCount++;
  }
}
console.log(`Total missing: ${missingCount}`);
