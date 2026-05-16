import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme, lightTheme, darkTheme } from "./shellTheme";

type ThemeContextType = {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: lightTheme,
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = "weartual.theme.preference";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemTheme === "dark");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme !== null) {
          setIsDark(storedTheme === "dark");
        }
      } catch (error) {
        console.warn("Failed to load theme preference", error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    } catch (error) {
      console.warn("Failed to save theme preference", error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
