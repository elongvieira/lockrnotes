import { createTheme } from '@mui/material/styles';

const tokens = {
  colors: {
    brand: '#3498dbff',
    brandDark: '#2C5282',
    background: '#021624ff',
    text: '#1A202C',
    muted: '#718096',
  },
};

const theme = createTheme({
  palette: {
    primary: {
      main: tokens.colors.background,
      dark: tokens.colors.background,
    },
    background: {
      default: tokens.colors.background,
      paper: tokens.colors.brand,
    },
    text: {
      primary: tokens.colors.text,
      secondary: tokens.colors.muted,
    },
  },
});

export const { colors } = tokens;
export default theme;
