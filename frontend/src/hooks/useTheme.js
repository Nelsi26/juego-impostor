import { useGameStore } from '../store/useGameStore';
import { getTheme } from '../themes/themes';

export function useTheme() {
  const theme = useGameStore((s) => s.theme);
  const currentTheme = getTheme(theme);
  
  return {
    ...currentTheme,
    isTheme: (themeName) => theme === themeName,
    css: currentTheme.colors,
    emojis: currentTheme.emojis,
    styles: currentTheme.styles
  };
}
