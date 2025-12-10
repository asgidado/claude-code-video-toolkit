# Contributing to claude-code-video-toolkit

Thank you for your interest in contributing! This toolkit is designed to help people create videos with Claude Code assistance.

## Ways to Contribute

### Report Issues
- Bug reports
- Feature requests
- Documentation improvements

### Submit Pull Requests
- Bug fixes
- New templates
- New skills or commands
- Documentation updates

## Development Setup

1. Fork and clone the repository
2. Set up your environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r tools/requirements.txt
   ```
3. Add your ElevenLabs API key to `.env`

## Project Structure

```
├── .claude/skills/     # Domain knowledge for Claude Code
├── .claude/commands/   # Guided workflow commands
├── tools/              # Python CLI tools
├── templates/          # Video templates
├── brands/             # Brand profiles
└── docs/               # Documentation
```

## Adding a New Template

1. Create a new folder in `templates/`
2. Include a working Remotion project
3. Add a `README.md` explaining the template
4. Register it in `_internal/toolkit-registry.json`
5. Test with `npm run studio` and `npm run render`

## Adding a New Skill

1. Create a folder in `.claude/skills/`
2. Add `SKILL.md` with the skill definition
3. Optionally add `reference.md` for detailed docs
4. Register it in `_internal/toolkit-registry.json`
5. Test by asking Claude Code questions about the domain

## Adding a New Command

1. Create a markdown file in `.claude/commands/`
2. Follow the existing command format
3. Register it in `_internal/toolkit-registry.json`
4. Test by running the command in Claude Code

## Code Style

- Use clear, descriptive names
- Comment complex logic
- Follow existing patterns in the codebase

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a PR with a clear description

## Questions?

Open an issue for questions or discussions.
