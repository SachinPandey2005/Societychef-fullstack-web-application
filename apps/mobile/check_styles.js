const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.expo')) { 
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const allFiles = walk('c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile');

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('styles.') || content.includes('style={styles')) {
    // Check if styles is defined
    if (!content.includes('const styles') && !content.includes('let styles') && !content.includes('var styles') && !content.includes('styles =')) {
      console.log('Missing styles definition in:', file);
    }
  }
});
console.log('Done checking.');
