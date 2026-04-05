const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'routes', 'unit.js');
let content = fs.readFileSync(targetFile, 'utf8');

const searchStr = 'isDeleted: { $ne: true }';
const replaceStr = "isDeleted: { $ne: true }, status: { $nin: ['Archived', 'Deleted'] }";

if (content.includes(searchStr)) {
    const updatedContent = content.split(searchStr).join(replaceStr);
    fs.writeFileSync(targetFile, updatedContent, 'utf8');
    console.log("Successfully updated routes/unit.js");
} else {
    console.log("String not found. The file may have already been updated.");
}
