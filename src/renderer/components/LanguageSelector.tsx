import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  useDefaultSystemLanguage: boolean;
}

export default function LanguageSelector({
  value,
  onChange,
  useDefaultSystemLanguage = false,
}: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();

  // Detect system language on mount
  useEffect(() => {
    if (useDefaultSystemLanguage) {
      const systemLang = navigator.language || 'pt-BR';
      const supportedLang = systemLang.startsWith('pt') ? 'pt-BR' : 'en';
      onChange(supportedLang);
    }
  }, [useDefaultSystemLanguage, onChange]);

  const handleChange = (event: any) => {
    const newLang = event.target.value;
    onChange(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          ...dialogStyles.headingText,
          mb: 2,
        }}
      >
        {t('welcome.languageTitle') || 'Idioma do Sistema'}
      </Typography>
      <Typography variant="body2" sx={{ ...dialogStyles.secondaryText, mb: 2 }}>
        {t('welcome.languageDescription') ||
          'Escolha o idioma que será usado na interface do aplicativo.'}
      </Typography>

      <FormControl fullWidth>
        <InputLabel id="language-select-label" sx={dialogStyles.selectLabel}>
          {t('welcome.languageLabel') || 'Idioma'}
        </InputLabel>
        <Select
          labelId="language-select-label"
          id="language-select"
          value={value}
          label={t('welcome.languageLabel') || 'Idioma'}
          onChange={handleChange}
          sx={dialogStyles.select}
        >
          <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
          <MenuItem value="en">English</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
