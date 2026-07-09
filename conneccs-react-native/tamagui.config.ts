import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      bg: '#fffef8',
      bg2: '#fffbf0',
      bg3: '#fff8e8',
      text: '#2a2010',
      text2: '#5a4830',
      text3: '#8a7050',
      border: '#f0e8d0',
      accent: '#f4c430',
      green: '#88a050',
      red: '#d05050',
      yellow: '#f4d03f',
      orange: '#d88030',
      teal: '#58987f',
    },
    dark: {
      bg: '#1a1510',
      bg2: '#2a2318',
      bg3: '#3a3120',
      text: '#f5f0e8',
      text2: '#d4c8b0',
      text3: '#a89878',
      border: '#4a3f28',
      accent: '#f4c430',
      green: '#a8c070',
      red: '#e07070',
      yellow: '#f4d03f',
      orange: '#e89850',
      teal: '#78b8a0',
    },
  },
})

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig
