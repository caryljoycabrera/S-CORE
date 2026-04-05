const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'unit.js');
let content = fs.readFileSync(filePath, 'utf8');

// Task 1: Globally find and replace `isDeleted: { $ne: true }` 
// with `isDeleted: { $ne: true }, status: { $nin: ['Archived', 'Deleted'] }`
// Using regex to handle potential spacing differences
content = content.replace(/isDeleted:\s*\{\s*\$ne:\s*true\s*\}/g, "isDeleted: { $ne: true }, status: { $nin: ['Archived', 'Deleted'] }");

// Task 2: Find `status: { $nin: ['completed', 'cancelled', 'Archived'] }`
// and add `isDeleted: { $ne: true }` and add 'Deleted' to `$nin` array
content = content.replace(/status:\s*\{\s*\$nin:\s*\['completed',\s*'cancelled',\s*'Archived'\]\s*\}/g, "isDeleted: { $ne: true }, status: { $nin: ['completed', 'cancelled', 'Archived', 'Deleted'] }");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated routes/unit.js');
