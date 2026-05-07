---
trigger: always_on
---

# CODE STYLE GUIDE FOR IA

## CONTEXTO

Este projeto já possui padrões definidos.  
A IA deve priorizar seguir padrões existentes ao invés de criar novos.

---

## 🎨 STYLE

- Procurar usar os layouts default do sistema e estilos já criados
- Para Selects/Dropdowns, usar sempre `<TextField select>` ao invés de `FormControl` e `Select` soltos, aplicando os estilos existentes (ex: `sx={dialogStyles.textField}`) para garantir consistência visual.
- Evitar usar estilos diretamente em componentes, a menos que sejam casos específicos
- Caso não exista um estilo adequado, criar um novo seguindo o padrão existente
- Manter consistência visual em toda a aplicação

---

## 🧱 ARCHITECTURE

- Seguir a estrutura de pastas existente do projeto
- Não criar novas estruturas sem necessidade
- Respeitar separação de responsabilidades (component, service, repository, etc)
- Manter padrão arquitetural já adotado no projeto

---

## 🔗 API INTEGRATION

- Usar como guia os arquivos:
  - API_DOCUMENTATION.md
  - BACKEND_ENDPOINTS.md
- Não inventar endpoints
- Garantir que DTOs estejam compatíveis com o backend
- Seguir padrões existentes de integração com API

---

## 🧠 RULES (DECISÃO)

- Antes de criar algo novo, verificar se já existe implementação similar
- Preferir reutilização ao invés de duplicação
- Em caso de dúvida, seguir o padrão mais comum do projeto
- Manter o padrão de código já existente

---

## 🔤 NAMING CONVENTIONS

- Seguir padrão de nomes já utilizado no projeto
- Manter consistência entre arquivos relacionados
  - Ex: ProductService, ProductController, ProductDTO
- Evitar abreviações desnecessárias
- Usar nomes claros e descritivos

---

## 🧪 VALIDATION & ERROR HANDLING

- Sempre tratar erros de forma padronizada
- Seguir padrão existente de mensagens de erro
- Implementar validações conforme padrão do projeto
- Garantir consistência no tratamento de exceções

---

## 🧹 CLEAN CODE

- Evitar código desnecessário ou redundante
- Não adicionar comentários óbvios
- Manter funções pequenas e legíveis
- Priorizar clareza e simplicidade

---

## 🚫 DO NOT

- Não criar novos estilos globais sem necessidade
- Não modificar arquivos fora do escopo da tarefa
- Não alterar comportamento existente sem instrução explícita
- Não criar soluções fora do padrão do projeto

---

## ⚙️ IA BEHAVIOR

- Sempre explicar brevemente as alterações antes de aplicar
- Preferir mudanças incrementais ao invés de grandes refatorações
- Quando alterar múltiplos arquivos, manter consistência entre eles
- Priorizar previsibilidade e segurança nas alterações
