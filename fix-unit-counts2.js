const fs = require('fs');
let code = fs.readFileSync('routes/unit.js', 'utf8');

function fixCountDocuments(source) {
  let result = source;
  // Use a global regex to find countDocuments calls
  // We'll search for countDocuments({ ... })
  let index = 0;
  
  while (true) {
    const matchIdx = result.indexOf('countDocuments({', index);
    if (matchIdx === -1) break;
    
    const startIdx = matchIdx + 15; // index of '{'
    
    let depth = 1;
    let endIdx = -1;
    for (let i = startIdx + 1; i < result.length; i++) {
      if (result[i] === '{') depth++;
      else if (result[i] === '}') depth--;
      
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
    
    if (endIdx === -1) {
      index = matchIdx + 1;
      continue;
    }
    
    let objText = result.slice(startIdx + 1, endIdx);
    
    // Check for isDeleted
    if (!/isDeleted\s*:/.test(objText)) {
      if (objText.trim() === '') {
        objText += '\n        isDeleted: { $ne: true }';
      } else {
        objText += ',\n        isDeleted: { $ne: true }';
      }
    }
    
    // Check for status
    if (!/status\s*:/.test(objText)) {
      objText += ",\n        status: { $nin: ['Archived', 'Deleted'] }";
    } else {
      // If there is a status, check if it's a $nin array
      const ninMatch = objText.match(/status\s*:\s*\{\s*\$nin\s*:\s*\[([^\]]*)\]\s*\}/);
      if (ninMatch) {
        let arrContent = ninMatch[1];
        let newArrContent = arrContent;
        if (!/['"]Archived['"]/.test(newArrContent)) {
          newArrContent += (newArrContent.trim() ? ", " : "") + "'Archived'";
        }
        if (!/['"]Deleted['"]/.test(newArrContent)) {
          newArrContent += (newArrContent.trim() ? ", " : "") + "'Deleted'";
        }
        const newNinObj = `status: { $nin: [${newArrContent}] }`;
        objText = objText.replace(ninMatch[0], newNinObj);
      }
      // If it's another kind of explicit status (e.g., regex, direct string), do nothing to status
    }
    
    result = result.slice(0, startIdx + 1) + objText + result.slice(endIdx);
    index = startIdx + objText.length + 1;
  }
  
  return result;
}

const updatedCode = fixCountDocuments(code);
fs.writeFileSync('routes/unit.js', updatedCode);
console.log('Successfully updated countDocuments queries.');
