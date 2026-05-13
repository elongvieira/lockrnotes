// Constantes padronizadas de espaçamento
// Use estas constantes em vez de valores hardcoded para manter consistência visual

export const SPACING = {
  XS: 0.3,  // Muito pequeno - ex: pequenos gaps
  SM: 0.5,  // Pequeno - ex: gap entre ícone e texto
  MD: 1,    // Médio - padrão para margens/padding
  LG: 2,    // Grande - seções principais
  XL: 2.5,  // Extra grande - grandes espaçamentos
  XXL: 3,   // Muito grande - espaçamentos generosos
} as const;

export const GAPS = {
  ICON: 0.5,    // Entre ícone e texto
  ITEM: 1,      // Entre itens de lista
  SECTION: 2,   // Entre seções principais
} as const;

export const MARGINS = {
  INDENT_1: 4,  // Indentação padrão
} as const;

// Exemplo de uso:
// sx={{ mt: SPACING.MD, mb: SPACING.SM, gap: GAPS.ITEM }}
