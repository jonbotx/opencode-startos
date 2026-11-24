# OpenCode

## Documentation

- [Web interface](https://opencode.ai/docs/cli/web/) ([markdown](https://opencode.ai/docs/cli/web.md)) — the browser interface, the server address and password, and how to reach the server.
- [Providers](https://opencode.ai/docs/providers/) ([markdown](https://opencode.ai/docs/providers.md)) — connecting the model provider you want OpenCode to use.
- [Configuration](https://opencode.ai/docs/config/) ([markdown](https://opencode.ai/docs/config.md)) — the OpenCode configuration file and its options.
- [Agents](https://opencode.ai/docs/agents/) ([markdown](https://opencode.ai/docs/agents.md)) — the built-in agents and how to add your own.

## What you get on StartOS

This package runs the OpenCode server and its web interface as a service on your
StartOS server. You use it from a browser:

- It exposes one **Web Interface** that serves both the OpenCode web app and its
  HTTP API.
- Everything OpenCode keeps — sessions, provider credentials, cloned
  repositories, and the projects you open — is stored on your server, in the
  service's data volume, and is included in backups.
- The web interface is protected by a password the package generates for you.
  There is no default password and none is written into any documentation.

## Getting set up

1. On install, the service shows a task: **Set the admin password before signing
   in**. Run the **Set Admin Password** action and copy the password it returns.
   The username is always `opencode`.
2. Open the **Web Interface** from the service's Interfaces tab (enable an
   address there if none is enabled yet).
3. On the **Connect to a server** screen, click **Use password**. The server
   address is already filled in — leave it as it is — paste the password, and
   click **Connect**.
4. Before OpenCode can answer anything it needs a model to use. From StartOS, run
   the **Configure Model Providers** action and add your provider — see
   [Connecting a model provider](#connecting-a-model-provider).
5. Back on the home screen, click **Add project** and choose a folder to work in.
   Pick a folder inside your home directory (`~/…`, shown as `root` when you
   browse from `/`) — that is where your server keeps data across restarts.
   Anything outside it is lost when the service restarts.

## Using OpenCode

The web app is the whole interface: start a session, point it at a project, and
chat with the agent. The agent edits files, runs commands, and uses tools in the
project folder you opened.

### The web interface

Open the **Web Interface** address in any browser on your network and sign in.
Once signed in, a browser remembers the connection; you can add more projects,
open past sessions, and change settings from the sidebar. The same address also
serves the HTTP API under `/api/*`, if you want to drive the server from your own
scripts.

### Connecting a model provider

OpenCode talks to any OpenAI-compatible endpoint — a vLLM, LM Studio, or Ollama
server you run yourself, or a hosted API such as OpenRouter. You add one from
StartOS, not from the web app, with the **Configure Model Providers** action.
Each entry asks for:

- **ID** — a short name used to identify the provider (`vllm`). Lowercase
  letters, digits, and dashes.
- **Name** — how the provider appears in OpenCode's model list (`Lab vLLM`).
- **Base URL** — the endpoint's API root, including `/v1`, for example
  `http://192.168.1.50:8000/v1`.
- **API Key** — only if the endpoint checks one. Leave it blank for a local
  server that accepts any request. It is kept on the StartOS side and is never
  written into the configuration file.
- **Models** — one entry per model ID the endpoint serves, for example
  `glm-5.3`. If you are not sure of the exact IDs, the endpoint lists them under
  `/v1/models`.
- **Default** — turn this on to make the first model in the list the one new
  sessions start on.

Save, and the models are available in the web app right away — refresh the page
if the picker still looks empty.

Run the action again to change an endpoint or add another provider, and delete a
provider by removing its entry from the list. The API key of a provider you have
already configured is filled in when the form opens, so leave it as it is unless
you are replacing it.

### Changing the password

Run **Set Admin Password** again at any time to generate a new password. The
service restarts with it, and any browser already signed in has to sign in again
with the new one.

### Backups

The service's data volume, and the generated password, are included in StartOS
backups. A restore brings your sessions, projects, provider credentials, and
login password back as they were.

## Limitations

- **Sign-in uses the password, not a pairing link.** Upstream's `opencode pair`
  command, which prints a one-time link and QR code, is not exposed here; use the
  password from the **Set Admin Password** action instead.
- **The server does not update itself.** OpenCode's in-app update check is turned
  off; update the service by updating this package in StartOS.
- **Providers are configured from StartOS, not from the app.** The web app in this
  version has no provider screen — use the **Configure Model Providers** action.
  It connects OpenAI-compatible endpoints, such as vLLM, LM Studio, Ollama, and
  OpenRouter.

### If you publish the interface through a tunnel

OpenCode opens its own connections out — to the model provider you configure and
to any git repository it clones or fetches. If you publish the web interface
through a tunnel to keep your home IP private, send the service's outbound
traffic through that tunnel too, or those providers and git hosts will see your
home IP address even though your browser sessions do not.
