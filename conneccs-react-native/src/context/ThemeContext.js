import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false); // Default to light mode

  const theme = {
    dark: {
      bg: '#1a1510',
      bg2: '#2a2318',
      bg3: '#3a3120',
      border: '#4a3f28',
      border2: '#5a4d30',
      text: '#f5f0e8',
      text2: '#d4c8b0',
      text3: '#a89878',
      accent: '#f4c430',
      accent2: '#e6b422',
      green: '#a8c070',
      red: '#e07070',
      orange: '#e89850',
      yellow: '#f4d03f',
      teal: '#78b8a0',
      blue: '#6ba3d8',
    },
    light: {
      bg: '#fffef8',
      bg2: '#fffbf0',
      bg3: '#fff8e8',
      border: '#f0e8d0',
      border2: '#e8d8b8',
      text: '#2a2010',
      text2: '#5a4830',
      text3: '#8a7050',
      accent: '#f4c430',
      accent2: '#e6b422',
      green: '#88a050',
      red: '#d05050',
      orange: '#d88030',
      yellow: '#f4d03f',
      teal: '#58987f',
      blue: '#5b8fc7',
    },
  };

  const toggleTheme = () => setIsDark(!isDark);

  const colors = isDark ? theme.dark : theme.light;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
