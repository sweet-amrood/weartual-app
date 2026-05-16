const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const filesToRefactor = [
  'AboutTab.tsx',
  'AuthScreen.tsx',
  'ContactTab.tsx',
  'HomeTab.tsx',
  'ShellBackground.tsx',
  'TabButton.tsx',
  'ThemedButton.tsx',
  'TryOnStudio.tsx',
  // ProfileTab will be done manually later as it needs redesign
];

for (const file of filesToRefactor) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already refactored
  if (content.includes('useTheme()')) continue;

  // 1. Replace imports
  content = content.replace(
    /import \{ shellTheme \} from "..\/theme\/shellTheme";/,
    'import { useTheme } from "../theme/ThemeContext";\nimport type { Theme } from "../theme/shellTheme";'
  );
  
  if (!content.includes('useTheme')) {
    // some might have different relative path or no import
     content = content.replace(
      /import \{ shellTheme \} from ".\/theme\/shellTheme";/,
      'import { useTheme } from "./theme/ThemeContext";\nimport type { Theme } from "./theme/shellTheme";'
    );
  }

  // Add useMemo import if not present
  if (!content.includes('useMemo')) {
    if (content.includes('import {')) {
      content = content.replace(/import \{([^}]+)\} from "react";/, (match, p1) => {
        if (!p1.includes('useMemo')) {
          return `import { ${p1}, useMemo } from "react";`;
        }
        return match;
      });
    } else {
      content = 'import { useMemo } from "react";\n' + content;
    }
  }

  // 2. Change StyleSheet.create to getStyles
  content = content.replace(
    /const styles = StyleSheet.create\(\{/,
    'const getStyles = (shellTheme: Theme) => StyleSheet.create({'
  );

  // 3. Inject useTheme into component
  // Find component declaration
  content = content.replace(
    /export default function (\w+)\(([^)]*)\) \{/,
    'export default function $1($2) {\n  const { theme } = useTheme();\n  const styles = useMemo(() => getStyles(theme), [theme]);\n'
  );
  
  // also handle React.memo components or arrow functions
  content = content.replace(
    /export default function\(\) \{/,
    'export default function() {\n  const { theme } = useTheme();\n  const styles = useMemo(() => getStyles(theme), [theme]);\n'
  );

  fs.writeFileSync(filePath, content);
  console.log(`Refactored ${file}`);
}
