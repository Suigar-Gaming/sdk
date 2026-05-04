# CLAUDE.md

This repository uses the same project guidance as `AGENTS.md`.

Read `AGENTS.md` first for:

- repository structure
- `npm` build, test, and release commands
- Suigar client architecture
- current public package exports for `@suigar/sdk`, `@suigar/sdk/games`, and `@suigar/sdk/utils`
- Suigar-specific SDK rules
- the branch-level changeset rule: when any file under `packages/sdk/src/` is modified, create one `.changeset/*.md` file for that branch and reuse it for subsequent SDK source edits on the same branch unless multiple release notes are explicitly needed
- repo-local skills in `.agents/skills/`

Claude Code skill compatibility:

- `.claude/skills` is a symlink to `.agents/skills`
- update `.agents/skills/`; separate edits under `.claude/skills/` are unnecessary
