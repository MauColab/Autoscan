// constants/theme.ts
import { Platform } from 'react-native';

// 1. Paleta de Colores Futurista (Cyberpunk/Enterprise)
export const COLORS = {
  background: '#050B14', // Negro azulado profundo
  surface: '#0F172A',    // Gris azulado oscuro
  surfaceHighlight: '#1E293B',
  primary: '#00F0FF',    // Cyan Neón
  secondary: '#7000FF',  // Violeta Neón
  success: '#00FF94',
  error: '#FF0055',
  text: '#F8FAFC',
  textDim: '#94A3B8',
  border: 'rgba(0, 240, 255, 0.3)',
};

// 2. Estilos Reutilizables
export const STYLES = {
  shadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  glass: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Un poco más opaco para legibilidad
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  }
};

// 3. Adaptador para que funcione con los Hooks de Expo (Forzamos Dark Mode siempre)
const tintColorLight = COLORS.primary;
const tintColorDark = COLORS.primary;

export const Colors = {
  light: {
    text: COLORS.text,
    background: COLORS.background,
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: COLORS.text,
    background: COLORS.background,
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};