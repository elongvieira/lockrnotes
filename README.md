<h1 align="center">Lockr Notes</h1>

<br>

<p>
  Lockr Notes is built with <a href="https://electronjs.org/">Electron</a> and <a href="https://react.dev/">React</a>.
</p>

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.gg/Fjy3vfgy5q)

[![Website](https://img.shields.io/badge/website-lockrnotes.com-blue)](https://lockrnotes.com)

</div>

## Install

Clone the repo and install dependencies:

```bash
git clone --depth 1 --branch main https://github.com/elongvieira/lockrnotes.git
cd lockrnotes
npm install
```

Issues or feedback? Open an issue on the repo or visit https://lockrnotes.com

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

## Semantic Release

This repository uses `semantic-release` on pushes to `main`.

Use Conventional Commits so the next version can be calculated automatically:

```bash
feat: add SSH terminal shortcuts
fix: prevent sidebar tree crash
feat!: replace legacy import flow
```

Version bumps happen in CI after the commit reaches `main`, not at local commit time.

## Docs

Visit https://lockrnotes.com for updates and docs

## Community

Website: https://lockrnotes.com

Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately, as described in [SECURITY.md](SECURITY.md).

## About

Lockr Notes is a lightweight, fast note-taking app. Learn more at https://lockrnotes.com

## 🧩 Sobre o projeto base

Este projeto foi **construído a partir do** [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate),  
um projeto open source licenciado sob a **MIT License**.

As modificações e novas funcionalidades foram desenvolvidas por **Elon G. Vieira (2025)**.

## License

MIT © 2025 Elon Gomes Vieira

Consulte o arquivo `LICENSE` para mais detalhes.
