import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const b4rrhhPrimeNgThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    colorScheme: {
      light: {
        primary: {
          color:        '{primary.600}',
          inverseColor: '#ffffff',
          hoverColor:   '{primary.700}',
          activeColor:  '{primary.800}',
        },
        highlight: {
          background:      '{primary.50}',
          focusBackground: '{primary.100}',
          color:           '{primary.900}',
          focusColor:      '{primary.950}',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
    },
  },
});
