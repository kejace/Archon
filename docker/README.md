# Running Archon in Docker

A fully containerized Archon: the image bakes in the entire `archon setup`
dependency surface — the Lean toolchain (`elan`/`lean`/`lake`), `uv`, Claude
Code, the Codex CLI, Node.js + the pre-built dashboard, `leanblueprint`, and a
full TeX Live + graphviz stack — so the only runtime steps are `archon init`
and `archon loop` against a project you mount in.

The README recommends running Archon in a container precisely because
`archon loop` invokes Claude Code with `--dangerously-skip-permissions`. The
image runs as a non-root user (`archon`) and sets `IS_SANDBOX=1`, satisfying
Claude Code's guardrails.

## Build

```bash
docker compose build           # ~one-time; downloads Lean, TeX, Node, npm deps
mkdir -p workspace             # host dir mounted at /workspace
```

> The base is `texlive/texlive:latest` (Debian-testing, full TeX Live). The
> first build is large and slow; subsequent builds reuse cached layers unless
> you change the dependency layers.

## Authenticate Claude Code

Archon drives Claude Code, which needs an Anthropic credential. Either:

- **Interactive login** — start a shell and run `claude` once:
  ```bash
  docker compose run --rm archon
  # inside the container:
  claude            # follow the login prompt
  ```
  Auth is persisted in the `archon-claude` named volume, so you only do this
  once.
- **API key** — copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`
  (plus any of `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`,
  `MOONSHOT_API_KEY`, `OPENROUTER_API_KEY` you use). Compose passes them
  through automatically.

## Run

```bash
docker compose run --rm archon          # interactive shell in /workspace
```

Then, inside the container:

```bash
archon doctor                           # verify the setup
archon init /workspace/myproject        # scaffold or adopt a Lean project
archon loop /workspace/myproject        # the main plan → prove → review loop
```

`archon loop` auto-launches the web dashboard on a free port in **8080–8099**
and prints the URL. That range is published to the host, so the printed
`http://localhost:<port>` is reachable from your browser.

## What's where

| Host                    | Container             | Purpose                          |
|-------------------------|-----------------------|----------------------------------|
| `./workspace`           | `/workspace`          | Your Lean project(s)             |
| `archon-claude` volume  | `/home/archon/.claude`| Persisted Claude Code auth/state |
| `.env`                  | env vars              | API keys (all optional)          |

## Notes

- **Mathlib** is fetched per-project by `archon init`, not baked into the
  image — the first `init` on a fresh project downloads it.
- The `lean-lsp` MCP server and `lean4@archon-local` skills are registered
  per-project by `archon init` (project scope), so they don't appear until you
  initialize a project.
- The Codex harness (`loop.harness: "codex"`) is available out of the box;
  it needs `OPENAI_API_KEY` at runtime.
- To run a one-off command without a shell:
  `docker compose run --rm archon archon doctor`.
