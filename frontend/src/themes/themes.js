export const themes = {
  female: {
    name: 'Femenino',
    colors: {
      primary: 'bg-rose-400',
      primaryHover: 'hover:bg-rose-500',
      secondary: 'bg-pink-400',
      secondaryHover: 'hover:bg-pink-500',
      accent: 'bg-purple-400',
      accentHover: 'hover:bg-purple-500',
      text: 'text-gray-800',
      border: 'border-rose-300',
      background: 'bg-rose-50',
      card: 'bg-white/80',
      gradient: 'from-rose-400 to-pink-400'
    },
    emojis: {
      player: '👩',
      impostor: '👸',
      civil: '👱',
      host: '👑',
      alive: '💖',
      dead: '💀',
      vote: '🗳️',
      create: '🎮',
      join: '🔗'
    },
    styles: {
      rounded: 'rounded-full',
      fontSize: 'text-sm'
    }
  },
  
  male: {
    name: 'Masculino',
    colors: {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      secondary: 'bg-sky-600',
      secondaryHover: 'hover:bg-sky-700',
      accent: 'bg-indigo-600',
      accentHover: 'hover:bg-indigo-700',
      text: 'text-blue-900',
      border: 'border-blue-400',
      background: 'bg-blue-50',
      card: 'bg-white/80',
      gradient: 'from-blue-600 to-sky-600'
    },
    emojis: {
      player: '👨',
      impostor: '👹',
      civil: '👤',
      host: '👑',
      alive: '🟢',
      dead: '💀',
      vote: '🗳️',
      create: '⚡',
      join: '�'
    },
    styles: {
      rounded: 'rounded-lg',
      fontSize: 'text-base'
    }
  },
  
  unisex: {
    name: 'Unisex',
    colors: {
      primary: 'bg-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
      secondary: 'bg-orange-600',
      secondaryHover: 'hover:bg-orange-700',
      accent: 'bg-green-500',
      accentHover: 'hover:bg-green-600',
      text: 'text-gray-100',
      border: 'border-gray-500',
      background: 'bg-gray-900',
      card: 'bg-gray-800/50',
      gradient: 'from-gray-700 to-gray-800'
    },
    emojis: {
      player: '🧑',
      impostor: '👹',
      civil: '👤',
      host: '👑',
      alive: '🟢',
      dead: '💀',
      vote: '🗳️',
      create: '🎮',
      join: '🔗'
    },
    styles: {
      rounded: 'rounded-md',
      fontSize: 'text-sm'
    }
  }
};

export function getTheme(themeName) {
  return themes[themeName] || themes.unisex;
}
