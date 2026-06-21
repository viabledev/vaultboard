# Contributing to VaultBoard

Thank you for your interest in contributing! VaultBoard is a community-driven plugin and welcomes contributions of all kinds.

## Ways to Contribute

- 🐛 **Report bugs** — Open an issue with steps to reproduce
- 💡 **Suggest features** — Start a discussion in GitHub Discussions
- 🌐 **Share templates** — Export and share your project templates in Discussions
- 🔧 **Submit code** — Fork, code, and open a pull request

## Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/vaultboard.git
cd vaultboard

# Install dependencies
npm install

# Start dev build (watches for changes)
npm run dev
```

Copy your plugin folder to `.obsidian/plugins/vaultboard/` in a test vault, then enable it. Use Obsidian's developer tools (`Ctrl+Shift+I`) to debug.

## Pull Request Guidelines

1. **One feature/fix per PR** — Keep changes focused
2. **Follow existing code style** — TypeScript, no heavy external deps
3. **Test in Obsidian** — Verify your changes work in a real vault
4. **Update CHANGELOG.md** — Add an entry under `[Unreleased]`
5. **Write descriptive commit messages** — Explain the *why*, not the *what*

## Commit Convention

```
feat: add kanban board view
fix: correct calendar day offset for Sunday start
docs: update README installation steps
style: improve dark mode contrast for stat cards
refactor: extract task rendering into shared helper
```

## Sharing Community Templates

The best way to contribute without coding is to share project templates. Export any project via **VaultBoard → Templates → Export Project**, then share the JSON in a GitHub Discussion. Popular templates may be included in future releases as built-ins.

## Questions?

Open a [GitHub Discussion](https://github.com/viabledev/vaultboard/discussions) — we're happy to help!
