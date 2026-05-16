const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace getStyles argument
  content = content.replace(/const getStyles = \(shellTheme: Theme\)/g, 'const getStyles = (theme: Theme)');
  
  // Replace shellTheme. with theme. everywhere
  content = content.replace(/shellTheme\./g, 'theme.');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
}
