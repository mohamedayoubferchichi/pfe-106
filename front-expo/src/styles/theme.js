export const COLORS = {
  // Light mode (default)
  primary: '#00cccc',
  secondary: '#0b204b',
  bgPrimary: '#f0f3f6',
  bgSecondary: '#ffffff',
  textPrimary: '#0b204b',
  textSecondary: '#5a6b8d',
  border: '#dfe5ec',
  accent: '#38b2ac',
  white: '#ffffff',
  success: '#21a95d',
  successBg: '#d7f5e3',
  danger: '#e05f5f',
  dangerBg: '#ffe6e6',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  info: '#3b82f6',
  infoBg: '#dbeafe',
  
  // Dark mode
  dark: {
    primary: '#00e5e5',
    secondary: '#1a3a52',
    bgPrimary: '#0d1117',
    bgSecondary: '#161b22',
    bgCard: '#21262d',
    textPrimary: '#e6edf3',
    textSecondary: '#8b949e',
    border: '#30363d',
    accent: '#58a6ff',
    white: '#0d1117',
    success: '#3fb950',
    successBg: '#0d3917',
    danger: '#f85149',
    dangerBg: '#3d1f1a',
    warning: '#d29922',
    warningBg: '#3d2817',
    info: '#79c0ff',
    infoBg: '#1c2128',
  }
};

export const FONTS = {
  main: 'System', // Segoe UI is system on Windows, but on mobile we use system font or load custom
  bold: 'System',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  }
};
