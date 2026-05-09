import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useDarkMode = () => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme');
        if (saved !== null) {
          setIsDark(saved === 'dark');
        } else {
          setIsDark(systemColorScheme === 'dark');
        }
      } catch (err) {
        console.log('Error loading theme:', err);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDark;
      setIsDark(newMode);
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (err) {
      console.log('Error saving theme:', err);
    }
  };

  return { isDark, toggleDarkMode };
};
