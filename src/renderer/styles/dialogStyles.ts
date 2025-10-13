import { SxProps, Theme } from '@mui/material/styles';

// Estilos compartilhados para diálogos
export const dialogStyles = {
  // Paper principal do diálogo
  dialogPaper: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 8px 32px var(--shadow-medium)',
    backdropFilter: 'blur(10px)',
  } as SxProps<Theme>,

  // Título do diálogo
  dialogTitle: {
    color: 'var(--text-heading)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-primary)',
    pb: 2,
  } as SxProps<Theme>,

  // Conteúdo do diálogo
  dialogContent: {
    pt: 3,
  } as SxProps<Theme>,

  // Ações do diálogo
  dialogActions: {
    borderTop: '1px solid var(--border-primary)',
    pt: 2,
    gap: 1,
  } as SxProps<Theme>,

  // Campo de texto padrão
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'var(--bg-tree-container)',
      color: 'var(--text-primary)',
      '& fieldset': {
        borderColor: 'var(--border-secondary)',
      },
      '&:hover fieldset': {
        borderColor: 'var(--primary-blue)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--primary-blue)',
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'var(--text-secondary)',
      '&.Mui-focused': {
        color: 'var(--primary-blue)',
      },
    },
  } as SxProps<Theme>,

  // Botão cancelar
  cancelButton: {
    color: 'var(--text-secondary)',
    borderRadius: 'var(--border-radius-md)',
    textTransform: 'none' as const,
    fontWeight: 500,
    '&:hover': {
      backgroundColor: 'var(--hover-bg)',
      color: 'var(--text-primary)',
    },
  } as SxProps<Theme>,

  // Botão confirmar/criar
  confirmButton: {
    backgroundColor: 'var(--primary-blue)',
    color: '#ffffff',
    borderRadius: 'var(--border-radius-md)',
    textTransform: 'none' as const,
    fontWeight: 600,
    boxShadow: '0 2px 8px var(--shadow-primary)',
    '&:hover': {
      backgroundColor: 'var(--primary-blue-dark)',
      boxShadow: '0 4px 12px var(--shadow-primary)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  } as SxProps<Theme>,

  // Checkbox e radio buttons
  checkboxRadio: {
    color: 'var(--text-secondary)',
    '&.Mui-checked': {
      color: 'var(--primary-blue)',
    },
  } as SxProps<Theme>,

  // Texto primário
  primaryText: {
    color: 'var(--text-primary)',
  } as SxProps<Theme>,

  // Texto secundário
  secondaryText: {
    color: 'var(--text-secondary)',
  } as SxProps<Theme>,

  // Texto de título/heading
  headingText: {
    color: 'var(--text-heading)',
  } as SxProps<Theme>,

  // Container de fundo
  backgroundContainer: {
    backgroundColor: 'var(--bg-tree-container)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--border-radius-md)',
  } as SxProps<Theme>,

  // Divider
  divider: {
    borderColor: 'var(--border-primary)',
  } as SxProps<Theme>,

  // Alert warning
  warningAlert: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    color: '#ffc107',
    border: '1px solid rgba(255, 193, 7, 0.3)',
    '& .MuiAlert-icon': {
      color: '#ffc107',
    },
  } as SxProps<Theme>,
};
