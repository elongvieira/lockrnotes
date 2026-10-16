# Contributing

Thanks for helping improve Lockr Notes.

## Who can push

The repository is public, so anyone can read it, fork it, and open a pull request.

Only the maintainer and collaborators who were explicitly granted access can create branches or push commits on `elongvieira/lockrnotes`. A fork is the way to propose a change if you do not have that access. Nothing from a fork is merged until a maintainer accepts the pull request.

Do not push directly to `main`.

## Branches

Use a short, lowercase name:

- `feat/short-description` for a new behavior
- `fix/short-description` for a bug fix
- `chore/short-description` for tooling, dependency, or maintenance work

## Commits

This repository uses [Conventional Commits](https://www.conventionalcommits.org/) so `semantic-release` can version `main`:

```text
feat: add a web login entry
fix: keep the sidebar tree from crashing
chore: update the test workflow
feat!: replace the import flow
```

A `feat` commit bumps the minor version. A `fix` commit bumps the patch version. A breaking change (`feat!:` or `BREAKING CHANGE:`) bumps the major version.

## Local checks

```bash
npm install
npm run lint
npm test
```

## Pull requests

- Explain the user-facing change and how you tested it.
- Keep secrets, local notes, and `config.json` out of the diff. Those paths are gitignored on purpose.
- Fill in the pull request template.

## Security

Report vulnerabilities through a [private security advisory](https://github.com/elongvieira/lockrnotes/security/advisories/new). Do not file a public issue for a security problem.
