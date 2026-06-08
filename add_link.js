const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    if (file === 'node_modules' || file === '.git' || file === '.vscode') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else if (file.endsWith('.html')) {
      files.push(filePath);
    }
  }
  return files;
}

const allFiles = getFiles('.');

const navTarget = '<a href="/blog/how-to-increase-cps">How to Increase Your CPS</a>';
const navReplacement = '<a href="/blog/how-to-increase-cps">How to Increase Your CPS</a>\n                        <a href="/blog/good-cps-for-minecraft">Good CPS for Minecraft PvP</a>';

const footerTarget = '<li><a href="/blog/how-to-increase-cps">How to Increase Your CPS</a></li>';
const footerReplacement = '<li><a href="/blog/how-to-increase-cps">How to Increase Your CPS</a></li>\n                        <li><a href="/blog/good-cps-for-minecraft">Good CPS for Minecraft PvP</a></li>';

// Note: Good CPS for Minecraft is already manually included in the created file, so we only need to update other files
// but if the new file already has it, replacing it again will just duplicate if not careful.
// So we check if it already has the new link before replacing.

for (let file of allFiles) {
  let c = fs.readFileSync(file, 'utf8');
  let originalC = c;
  
  if (!c.includes('Good CPS for Minecraft PvP')) {
    c = c.replace(navTarget, navReplacement);
    c = c.replace(footerTarget, footerReplacement);
    
    // Also handle possible slight variations in the footer
    c = c.replace('<li><a href="/blog/how-to-increase-cps">How to Increase Your CPS</a></li></ul>', 
                  '<li><a href="/blog/how-to-increase-cps">How to Increase Your CPS</a></li>\n                        <li><a href="/blog/good-cps-for-minecraft">Good CPS for Minecraft PvP</a></li></ul>');
                  
    if (c !== originalC) {
      fs.writeFileSync(file, c);
      console.log('Added new link to ' + file);
    }
  }
}
console.log('Update complete!');
