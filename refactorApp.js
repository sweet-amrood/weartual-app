const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. imports
if (!content.includes('ThemeProvider')) {
  content = content.replace(
    /import \{ shellTheme \} from ".\/src\/theme\/shellTheme";/,
    'import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";\nimport type { Theme } from "./src/theme/shellTheme";'
  );
  
  // also add Ionicons
  if (!content.includes('@expo/vector-icons')) {
    content = 'import { Ionicons } from "@expo/vector-icons";\n' + content;
  }

  // 2. rename App to AppInner
  content = content.replace(/export default function App\(\) \{/, 'function AppInner() {\n  const { theme, isDark, toggleTheme } = useTheme();\n  const styles = useMemo(() => getStyles(theme), [theme]);\n');

  // useMemo
  if (!content.includes('useMemo')) {
    content = content.replace(/import \{ useEffect, useRef, useState \} from "react";/, 'import { useEffect, useRef, useState, useMemo } from "react";');
  }

  // 3. change styles
  content = content.replace(/const styles = StyleSheet.create\(\{/, 'const getStyles = (shellTheme: Theme) => StyleSheet.create({');

  // 4. export default App
  content += '\nexport default function App() {\n  return (\n    <ThemeProvider>\n      <AppInner />\n    </ThemeProvider>\n  );\n}\n';
  
  // 5. Theme toggle button in header
  // Let's find <View style={styles.header}>
  content = content.replace(
    /(\<View style=\{styles\.brandCenter\}\>[\s\S]*?\<\/View\>)/,
    `$1\n            <Pressable onPress={toggleTheme} style={{ marginRight: 16 }}>\n              <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={shellTheme.textSecondary} />\n            </Pressable>`
  );
  // Wait, in AppInner `shellTheme` reference in `<Ionicons ... color={shellTheme...}` should be `theme.textSecondary`.
  content = content.replace(/color=\{shellTheme\.textSecondary\}/g, 'color={theme.textSecondary}');
  
  // And fix Statusbar
  content = content.replace(/\<StatusBar style="dark" \/\>/, '<StatusBar style={isDark ? "light" : "dark"} />');
}

fs.writeFileSync(filePath, content);
console.log('Refactored App.tsx');
