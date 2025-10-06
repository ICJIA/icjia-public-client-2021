# ICJIA Public Client 2021

[![Netlify Status](https://api.netlify.com/api/v1/badges/e6614e77-00b4-4772-8034-a3b9c9c9986d/deploy-status)](https://app.netlify.com/sites/icjia-public/deploys) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Front-end client.

| :warning: This is a work in progress. The site is still in development. :warning: |
| --------------------------------------------------------------------------------- |

## Requirements

**Node.js 16.x is required for this project.**

This project uses Vue CLI 4 and Webpack 4, which are incompatible with Node.js 17+. You must use Node.js 16 for local development and builds.

### Install Node 16 using nvm

```bash
# Install nvm if you don't have it
# See: https://github.com/nvm-sh/nvm

# Install Node 16
nvm install 16

# Use Node 16
nvm use 16

# Verify version
node --version  # Should show v16.x.x
```

### Automatic Node Version Switching (Recommended)

This project includes a `.nvmrc` file. To automatically switch to Node 16 when entering this directory:

**For bash, add to `~/.bashrc`:**

```bash
# Auto-switch Node version based on .nvmrc
cd() {
  builtin cd "$@" || return
  if [[ -f .nvmrc ]]; then
    nvm use
  fi
}
```

**For zsh, add to `~/.zshrc`:**

```bash
# Auto-switch Node version based on .nvmrc
autoload -U add-zsh-hook
load-nvmrc() {
  if [[ -f .nvmrc ]]; then
    nvm use
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

**Or use a plugin:**

- **zsh:** [zsh-nvm](https://github.com/lukechilds/zsh-nvm) (auto-switches on directory change)
- **bash/zsh:** [avn](https://github.com/wbyoung/avn) (automatic version switching)

## Project setup

```bash
# Make sure you're using Node 16
nvm use 16

# Install dependencies
npm install
```

### Compiles and hot-reloads for development

```bash
# Make sure you're using Node 16
nvm use 16

# Start development server
npm run serve
```

The dev server will be available at http://localhost:8080

### Compiles and minifies for production

```bash
# Make sure you're using Node 16
nvm use 16

# Build for production
npm run build
```

The production build will be output to the `dist/` directory.

### Lints and fixes files

```
npm run lint
```

### Environment variables

Rename `.env.example` to `.env` and fill in the values.

### Security

View the [security policy here](https://github.com/ICJIA/icjia-public-2021/blob/main/SECURITY.md).

### Changelog

[View changelog here](https://github.com/ICJIA/icjia-public-client-2021/blob/main/CHANGELOG.md).

### Production URL

https://icjia.illinois.gov
