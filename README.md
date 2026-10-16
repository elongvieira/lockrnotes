<h1 align="center">Lockr Notes</h1>

<p align="center">
  Aplicativo de anotações local, com foco em privacidade, criptografia opcional e código aberto.
</p>

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.gg/Fjy3vfgy5q)

</div>

<br>

## O que é

**Lockr Notes** é um app desktop para guardar notas e dados estruturados no **seu próprio computador**. Você escolhe a pasta de armazenamento, organiza arquivos em árvore de pastas e pode proteger conteúdo com criptografia quando fizer sentido para você.

O projeto é **open source** ([MIT](LICENSE)) e o código está em [github.com/elongvieira/lockrnotes](https://github.com/elongvieira/lockrnotes).

## Recursos principais

- **Armazenamento local** — por padrão, pasta `LockrNotes` em Documentos (caminho configurável).
- **Notas em texto** (`.txt`) e **entradas JSON** (`.json`) para dados estruturados (logins, SSH, RDP, etc.).
- **Criptografia gerenciada** — AES-256-GCM; chave mestra protegida no cofre do Windows ou, opcionalmente, na pasta do app.
- **Criptografia manual** — arquivos protegidos com senha definida por você.
- **Interface** — tema escuro, abas, auto-save, idiomas **pt-BR** e **en**.
- **Integrações opcionais** — terminal SSH, RDP, login web in-app (só quando você usar esses recursos).
- **Importar / exportar** — backup e migração da sua pasta de notas.

## Privacidade e segurança

Lockr Notes foi pensado para quem quer **controle local** sobre as próprias anotações:

| Aspecto | Comportamento |
|--------|----------------|
| **Onde ficam os dados** | Nas pastas que você define no disco; o app não hospeda suas notas em servidor próprio. |
| **Configuração do app** | Arquivo `config.enc` criptografado na pasta de dados do usuário (Electron `userData`). |
| **Criptografia de arquivos** | Opcional. AES-256-GCM. Arquivos novos usam HKDF (criptografia gerenciada) ou PBKDF2 com 600 mil iterações (senha). Arquivos antigos continuam abrindo. |
| **Chave de criptografia** | Modo recomendado: cofre do sistema (`safeStorage`: DPAPI no Windows, Keychain no macOS). Guardar a chave na pasta não torna o cofre portátil: o arquivo continua cifrado pelo sistema, preso a este usuário e a este computador. |
| **Sem recuperação da chave** | Reinstalar o sistema ou perder o cofre deixa a criptografia gerenciada ilegível. Não há senha de recuperação. Para notas que precisam sobreviver a isso, use criptografia manual com senha. |
| **Exportação** | O ZIP de exportação contém as notas em claro. O app pede confirmação antes de gerá-lo. |
| **Telemetria de conteúdo** | O app **não envia o texto das suas notas** para serviços do Lockr Notes. |
| **Rede** | Conexões podem ocorrer quando **você** usa login web, SSH, RDP ou quando a **versão instalada** verifica atualizações no GitHub. |
| **Backups** | **Sua responsabilidade.** Perda de disco, exclusão acidental ou perda da chave pode tornar dados irrecuperáveis. |

Leia também [TERMS.md](TERMS.md) (termos de uso) e [SECURITY.md](SECURITY.md) (como reportar vulnerabilidades em privado).

> **Importante:** Criptografia e boas práticas reduzem riscos, mas nenhum software elimina todos os cenários de perda de dados ou uso indevido. Use por sua conta e risco.

## Feedback

- **Issues e ideias:** [github.com/elongvieira/lockrnotes/issues](https://github.com/elongvieira/lockrnotes/issues)
- **Discord:** [discord.gg/Fjy3vfgy5q](https://discord.gg/Fjy3vfgy5q)

Contribuições seguem [CONTRIBUTING.md](CONTRIBUTING.md) e o [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Desenvolvimento

Stack: [Electron](https://electronjs.org/) + [React](https://react.dev/) + TypeScript.

### Clonar e instalar

```bash
git clone --depth 1 --branch main https://github.com/elongvieira/lockrnotes.git
cd lockrnotes
npm install
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Equivalente a `npm start` (webpack + Electron).

### Empacotar

```bash
npm run package
```

### Testes e lint

```bash
npm test
npm run lint
```

### Semantic Release

Commits na `main` seguem [Conventional Commits](https://www.conventionalcommits.org/) para versionamento automático via CI:

```bash
feat: add a new entry type
fix: prevent sidebar crash on empty folder
chore: update dependencies
```

---

## Projeto base

Este repositório evoluiu a partir do [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) (MIT).  
Modificações e funcionalidades atuais: **Elon Gomes Vieira**.

## Licença

MIT © 2025 Elon Gomes Vieira — veja [LICENSE](https://github.com/elongvieira/lockrnotes/blob/main/LICENSE).

[github-actions-status]: https://github.com/elongvieira/lockrnotes/workflows/Test/badge.svg
[github-actions-url]: https://github.com/elongvieira/lockrnotes/actions
[github-tag-image]: https://img.shields.io/github/tag/elongvieira/lockrnotes.svg?label=version
[github-tag-url]: https://github.com/elongvieira/lockrnotes/tags
