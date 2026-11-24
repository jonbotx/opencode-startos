<p align="center">
  <img src="icon.svg" alt="OpenCode Logo" width="21%">
</p>

# OpenCode on StartOS

> Everything not listed in this document should behave the same as upstream
> OpenCode. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[OpenCode](https://github.com/anomalyco/opencode) is an open-source AI coding
agent. This package runs the OpenCode server and its browser interface on
StartOS, so coding sessions in a repository are driven from a web page on the
network instead of a terminal on the same machine.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The package builds a thin image on top of the upstream OpenCode image
(`ghcr.io/anomalyco/opencode`), pinned to a released tag in the package's
`Dockerfile`. The upstream image is a slim Alpine base that ships neither `git`
nor `bash`, and OpenCode shells out to `git` for repositories, diffs, and
worktrees and to a shell for its terminal tool — so the package Dockerfile adds
`git`, `bash`, and `openssh-client` (for `ssh` git remotes). Architectures are
`x86_64` and `aarch64`, matching the architectures upstream publishes.

One subcontainer, `opencode-sub`, runs the server. The image's entrypoint is the
`opencode` binary itself; the package overrides only the command, to
`serve --hostname 0.0.0.0 --port 4096`. The container runs as `root` with
`HOME=/root`.

## Volume and Data Layout

The package declares two volumes.

| Volume    | Mount point          | Contents                                                                                                                 |
| --------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `main`    | `/root` (read-write) | The container's entire home: sessions, credentials, repositories, projects, and OpenCode's own config, state, and cache. |
| `startos` | not mounted          | StartOS-side state: `store.json`, holding the generated login password and the configured providers' API keys.           |

`main` is mounted over the image's home directory, so everything OpenCode writes
under `/root` persists across restarts and updates:

- `~/.local/share/opencode/` — the sessions database (`opencode.db`) plus its `-shm`/`-wal` files, `log/`, and `repos/`.
- `~/.config/opencode/` — OpenCode's global configuration.
- `~/.local/state/opencode/` and `~/.cache/opencode/` — state and cache.

`/tmp/opencode` (OpenCode's temporary directory) is **not** on a volume and is
lost on restart; treat anything only in there as scratch.

The `startos` volume is deliberately not mounted into `opencode-sub`, so the
running server never sees the file itself — it receives the login password as
`OPENCODE_PASSWORD` and each configured provider's API key as an
`OPENCODE_KEY_<ID>` variable instead.

## File Models

The package owns two file models.

| File                                  | Format | Keys                            | Seeded by                                | Rewritten by                 |
| ------------------------------------- | ------ | ------------------------------- | ---------------------------------------- | ---------------------------- |
| `startos/store.json`                  | JSON   | `adminPassword`, `providerKeys` | the **Set Admin Password** action        | the two actions, on each run |
| `main/.config/opencode/opencode.json` | JSON   | `$schema`, `providers`, `model` | the **Configure Model Providers** action | the same action, on each run |

`adminPassword` is stored in clear text because the server reads it verbatim
from `OPENCODE_PASSWORD` and cannot be given a hash. There is no default: it is
absent until the user runs the action, which is what the [task](#tasks) waits
for. `providerKeys` maps a configured provider's id to its API key, and has no
default either.

Both schemas are permissive (`z.looseObject`, every key optional), and the
package writes each file only from an action — never at startup, and never to
normalize or repair it. A hand edit therefore survives:

- In `store.json`, the running server watches the file and restarts with the new
  value.
- In `opencode.json`, OpenCode watches the file and reloads it without a restart.
  The package leaves every key it does not own — including whatever OpenCode
  writes there itself — as it found it.

`opencode.json` is OpenCode's own global configuration, at the path OpenCode
reads it from. The package models it so the Configure Model Providers action can
write provider entries; it is not generated, replaced, or seeded otherwise.

## Dependencies

None. The package declares no service dependencies and mounts no dependency
volumes. OpenCode reaches model providers and git remotes over its own outbound
network connection.

## Network Access and Interfaces

The service exposes a single interface.

| Interface | Type | Internal port | Protocol | Path | Purpose                                                                                                       |
| --------- | ---- | ------------- | -------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| `ui`      | `ui` | 4096          | HTTP     | `/`  | The OpenCode web app and, under `/api/*`, the OpenCode HTTP API (its OpenAPI document is at `/openapi.json`). |

The interface is not masked: the URL itself contains no credential. Access is
gated by the server's own login rather than by anything in the address, so what
the user opens, and how, is up to the user's gateway choices.

## Installation and First-Run Flow

Installing the package raises a single **critical** task — see [Tasks](#tasks) —
and the daemon does not start until it is cleared. There is no setup wizard to
complete and nothing to configure on disk.

1. The user runs the **Set Admin Password** action, which generates and stores
   the login password and returns it.
2. The daemon starts with `OPENCODE_PASSWORD` set to that value.
3. The user opens the `ui` interface, signs in on the web page with the username
   `opencode` and that password.

Model providers are not preconfigured; connecting one happens after install,
through the **Configure Model Providers** action rather than during it. Nothing
upstream is disabled or skipped, and the package adds no files OpenCode did not
already expect.

## Actions

Two user-facing actions. The OS carries each one's id, name, description,
warning, and status gating; what follows is what the metadata cannot express.

### `set-admin-password` — Set Admin Password

- **When to run it.** On a fresh install, to satisfy the first-run task. Later,
  whenever the password should be rotated.
- **What it changes.** Writes `adminPassword` to `startos/store.json`, which
  restarts the running server so it picks up the new value. It touches no other
  file or volume.
- **Cost.** A few seconds, and the service restarts. The upstream server signs
  every existing web session out when its password changes, so anyone already
  signed in must sign in again with the new password.
- **Repeat safety.** Repeatable. Each run mints a fresh password and replaces the
  previous one; it never accumulates. A `warning` is shown before it runs once a
  password already exists.
- **Outputs.** The username `opencode` (unmasked, copyable) and the new password
  (masked, copyable).

### `configure-providers` — Configure Model Providers

- **When to run it.** After install, and whenever the set of models OpenCode can
  use changes. It is the only way to connect a model: the packaged OpenCode web
  interface has no provider screen of its own.
- **What it changes.** For each provider in the form, an entry in the `providers`
  map of `main/.config/opencode/opencode.json`, and its API key under
  `providerKeys` in `startos/store.json`. The `model` key is set to the provider
  whose **Default** toggle is on, or dropped if that provider is removed. A new
  or changed API key restarts the service, because the server receives it as an
  `OPENCODE_KEY_<ID>` environment variable; a change that touches no key is
  picked up by the running server without a restart.
- **Cost.** Seconds. Nothing outside the two files above is touched, and no
  session, repository, or project is affected.
- **Repeat safety.** The form is prefilled from the current configuration and is
  the authority for it: what the form lists is what the file holds afterwards, so
  saving it unchanged changes nothing and leaving a provider out disconnects it.
  An empty form therefore disconnects every provider.
- **Outputs.** Each provider with the model IDs it serves, and the default model
  when one is set.

## Tasks

One task, raised by `startos/init/watchCredentials.ts`.

| Severity   | Raised when                                 | Cleared by                     |
| ---------- | ------------------------------------------- | ------------------------------ |
| `critical` | `adminPassword` is absent from `store.json` | running **Set Admin Password** |

Because it is `critical`, it blocks the service from starting and suspends the
ordinary controls until it is satisfied — this is what the user sees first, and
why nothing is reachable before a password exists. It is idempotent on its replay
key, so ordinary rebuilds do not re-raise it. It returns only if the stored
password is lost — most plausibly a restore that brought back `main` without the
`startos` volume, in which case a new password must be set (and existing sessions
are invalidated).

## Health Checks

One check, the readiness probe for the `opencode` daemon.

| Check      | Probes                              | Display       | Grace period |
| ---------- | ----------------------------------- | ------------- | ------------ |
| `opencode` | a listening TCP socket on port 4096 | Web Interface | default      |

A failure means nothing is listening on the interface port. During the grace
period that is normal startup; the probe only reports a hard failure once the
server has had time to bind. A persistent failure after startup means the daemon
exited — read the service logs, where OpenCode prints its startup error, and
confirm the container's data volume is writable before concluding the process is
at fault.

## Backups and Restore

The backup strategy is a **whole-volume snapshot**:
`sdk.Backups.ofVolumes('main', 'startos')`. StartOS stops the service before the
backup and restarts it afterward, so the SQLite database (including its `-wal`
and `-shm` files) is captured quiesced; no logical dump is involved. A restore
therefore reconstructs each volume by its files, not by replaying anything.

Both volumes are captured and nothing is excluded:

- `main` restores every session, provider credential, cloned repository, project,
  and OpenCode setting.
- `startos` restores the generated login password, so a restored instance is
  usable with the password in use at backup time.

Because both are taken together, a restore is self-contained: no dependency needs
to be present first, no credential has to be re-entered, and no resync is
required.

## Limitations and Differences

1. **Only the server and its web interface are packaged.** OpenCode's terminal
   TUI and its desktop and mobile apps are not part of this package; you drive
   sessions through the web page.
2. **The `opencode pair` pairing-link flow is not wired up.** Sign in with the
   password from the **Set Admin Password** action instead of a one-time pairing
   link or QR code.
3. **Model providers are configured from StartOS, not from the app.** The
   packaged OpenCode web interface has no provider screen, so providers are added
   with the **Configure Model Providers** action. It covers OpenAI-compatible
   endpoints — your own vLLM, LM Studio, or Ollama server, or a hosted API such
   as OpenRouter. Provider families outside that shape are not configured by the
   package.
4. **OpenCode's self-updater is disabled** in the container. The server is updated
   by updating the StartOS package, not from inside the app.
5. **The container runs as `root`.** The upstream image does, and the package does
   not change its user.
6. **The service opens its own outbound connections** — to model providers and to
   git repositories it clones or fetches. Those are made from the server's
   outbound route, independently of whichever address the web interface is
   published on.

---

## Quick Reference for AI Consumers

```yaml
package_id: opencode
image: ghcr.io/anomalyco/opencode
architectures: [x86_64, aarch64]
subcontainers: [opencode-sub]
volumes:
  main: /root
  startos: unmounted
file_models:
  - startos/store.json
  - main/.config/opencode/opencode.json
startos_managed_env_vars:
  - OPENCODE_PASSWORD
  - OPENCODE_DISABLE_AUTOUPDATE
  - OPENCODE_KEY_<PROVIDER_ID>
dependencies: none
interfaces:
  ui: { type: ui, port: 4096 }
actions:
  - set-admin-password
  - configure-providers
tasks:
  - { action: set-admin-password, severity: critical }
health_checks:
  - opencode
```
