# Archon — fully containerized build.
#
# Bakes in the entire `archon setup` dependency surface (Lean toolchain, uv,
# Claude Code, Codex CLI, Node + the built dashboard, leanblueprint, graphviz)
# on top of an existing full TeX Live image, so the only runtime steps are
# `archon init` / `archon loop` against a mounted project.
#
# The base image (texlive/texlive) is Debian-testing based and already ships
# `latex`, `dvisvgm`, and `pdfcrop`; we add the remaining system packages via
# apt, then let Archon's own `archon setup --yes` (designed for containers)
# install elan/uv/claude/leanblueprint and build the dashboard. Because every
# dependency is pre-installed, setup short-circuits each check and performs no
# sudo/nvm work — it just validates and builds the dashboard.
FROM texlive/texlive:latest

ENV DEBIAN_FRONTEND=noninteractive

# ── System packages ───────────────────────────────────────────────────────
# - build-essential + python3-dev + libgraphviz-dev: pygraphviz (pulled in by
#   leanblueprint) compiles from source.
# - ghostscript + pdf2svg: complete the TeX/blueprint toolchain that the base
#   image doesn't already provide.
# - poppler-utils: pdftoppm/pdftotext so the Read tool can ingest PDF refs.
# - ripgrep: fast code search used by the agents.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        gnupg \
        sudo \
        build-essential \
        python3 \
        python3-dev \
        python3-venv \
        python3-pip \
        ripgrep \
        poppler-utils \
        graphviz \
        libgraphviz-dev \
        ghostscript \
        pdf2svg \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 LTS (NodeSource) ───────────────────────────────────────────
# Deterministic install so `archon setup` finds node/npm already present and
# skips its nvm path entirely.
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && node --version && npm --version

# ── Codex CLI ─────────────────────────────────────────────────────────────
# Optional alternative harness (loop.harness="codex"); needs an OpenAI key at
# runtime. Installed globally so it is on PATH for every user.
RUN npm install -g @openai/codex && codex --version

# ── Non-root user ─────────────────────────────────────────────────────────
# Claude Code refuses `--dangerously-skip-permissions` as root, so the loop
# must run unprivileged. The texlive base already ships a uid/gid-1000 user
# (`texlive`); rename it to `archon` so we keep the 1000 mapping (matching a
# typical host user) instead of fighting over the id. NOPASSWD sudo is a
# safety net for `archon setup` (--yes / sudo_mode=yes); with everything
# pre-installed it is never actually exercised.
ARG USERNAME=archon
RUN groupmod -n ${USERNAME} texlive \
    && usermod -l ${USERNAME} -d /home/${USERNAME} -m texlive \
    && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} \
    && chmod 0440 /etc/sudoers.d/${USERNAME}

# ── Archon package (into a venv; Debian is PEP-668 externally-managed) ─────
# leanblueprint/uv detect the active venv and install into it. Installing
# Archon pulls the leandag + claude-p git dependencies (needs network).
COPY . /opt/archon-src
RUN python3 -m venv /opt/archon-venv \
    && /opt/archon-venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/archon-venv/bin/pip install --no-cache-dir /opt/archon-src \
    && chown -R ${USERNAME}:${USERNAME} /opt/archon-venv /opt/archon-src

# venv first (archon, leanblueprint), then elan (lean/lake), then ~/.local/bin
# (uv, claude). VIRTUAL_ENV makes pip --user-free installs land in the venv.
ENV VIRTUAL_ENV=/opt/archon-venv
ENV PATH=/opt/archon-venv/bin:/home/${USERNAME}/.elan/bin:/home/${USERNAME}/.local/bin:$PATH
# Belt-and-suspenders: allow Claude Code's high-risk option even if something
# runs as root; we run as the non-root user regardless.
ENV IS_SANDBOX=1

USER ${USERNAME}
WORKDIR /home/${USERNAME}

# Install elan(+stable Lean)/uv/claude, leanblueprint into the venv, and build
# the dashboard (npm install + vite build). Node/graphviz/TeX/poppler/ripgrep
# are already present so each check short-circuits — no apt or nvm runs here.
RUN archon setup --yes

# The Docker ENV PATH above covers exec form and non-login shells, but a login
# shell re-sources /etc/profile and rebuilds PATH from scratch — dropping the
# venv. Re-assert the venv/elan/local bins via profile.d so `archon` works in
# login shells too. (Done as root, after the expensive setup layer, to keep
# the cache intact.)
USER root
RUN printf 'export PATH="/opt/archon-venv/bin:$HOME/.elan/bin:$HOME/.local/bin:$PATH"\n' \
        > /etc/profile.d/archon.sh \
    && chmod 0644 /etc/profile.d/archon.sh
USER ${USERNAME}

WORKDIR /workspace
CMD ["bash"]
