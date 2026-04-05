const fs = require('fs');
let code = fs.readFileSync('routes/unit.js', 'utf8');

// A function to find the matching closing brace for a given opening brace
function findClosingBrace(str, startIdx) {
  let depth = 1;
  for (let i = startIdx + 1; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') depth--;
    
    if (depth === 0) return i;
  }
  return -1; // Not found
}

let result = '';
let currentIdx = 0;

while (true) {
  let startIdx = code.indexOf('countDocuments({', currentIdx);
  if (startIdx === -1) {
    result += code.slice(currentIdx);
    break;
  }

  // Find the opening brace '{'
  startIdx = startIdx + 15;
  const endIdx = findClosingBrace(code, startIdx);
  
  if (endIdx === -1) {
    console.error("Syntax mismatch around", startIdx);
    result += code.slice(currentIdx);
    break;
  }

  let objContent = code.slice(startIdx + 1, endIdx);
  
  // Add properties if they don't exist
  let newObjContent = objContent;
  
  if (!newObjContent.includes('isDeleted:')) {
    // If it's effectively empty
    if (newObjContent.trim() === '') {
      newObjContent += '\n        isDeleted: { $ne: true }';
    } else {
      newObjContent += ',\n        isDeleted: { $ne: true }';
    }
  }
  
  if (!newObjContent.includes('status:')) {
    if (newObjContent.trim() === '') {
      newObjContent += '\n        status: { $nin: [\'Archived\', \'Deleted\'] }';
    } else {
      newObjContent += ',\n        status: { $nin: [\'Archived\', \'Deleted\'] }';
    }
  }

  // Prepend everything up to the opening brace
  result += code.slice(currentIdx, startIdx + 1) + newObjContent;
  result += '}';
  currentIdx = endIdx + 1;
}

// Write the changes
fs.writeFileSync('routes/unit.js', result);
console.log('Successfully updated countDocuments queries.');
