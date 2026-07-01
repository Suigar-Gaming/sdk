# Suigar Skills

This repository keeps source-controlled agent skills under `.agents/skills`.

To install the Suigar MCP skill from this checkout with the Skills CLI:

```bash
npx skills add .agents/skills/suigar-mcp --agent codex --global --yes
```

To install the standalone public skill repository instead:

```bash
npx skills add Suigar-Gaming/suigar-skill --agent codex --global --yes
```

After installing the skill, configure an MCP client with `@suigar/mcp`:

```json
{
	"mcpServers": {
		"suigar": {
			"command": "npx",
			"args": ["-y", "@suigar/mcp"]
		}
	}
}
```

Restart or reload the MCP client after editing its config.
