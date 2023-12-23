# Ollama Chat App 🐐

[![Build and Deploy](https://github.com/ollama-interface/Ollama-Gui/actions/workflows/build-and-deploy.yml/badge.svg?branch=main)](https://github.com/ollama-interface/Ollama-Gui/actions/workflows/build-and-deploy.yml)

Welcome to Ollama Chat, this is an interface for the official Ollama CLI to make it easier to chat. It includes futures such as:

- Multiple conversations 💬
- Detecting which models are available to use 📋
- Auto-checking if Ollama is running ⏰
- Changing the host where Ollama runs 🖥️
- Persistence 📀
- Importing & Exporting Chats 🚛
- Light & Dark Themes 🌗

<br />

<img src="./.github/docs/preview-2.png" />

<br />

## How to build on your machine

### Requirements

- [Git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/en) LTS 18
- [pnpm](https://pnpm.io/) 8.8.0+
- [rust](https://www.rust-lang.org/) 1.72.1=

<br />

1.  Clone the repo `git clone git@github.com:ollama-interface/Ollama-Gui.git`
2.  `pnpm i`
3.  `pnpm build:app:silicon` (:silicon or :intell or :universal) depending on your machine
4.  Go to `/src-tauri/target/release/bundle/dmg/*.dmg` and install the program with the .dmg file.

<br />

You also need to install [Ollama](https://ollama.ai). After you install it, you can run your local server with this command `OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11435 ollama serve`.

<br />
<br />

For any questions, please contact [Twan Luttik (Twitter - X)](https://twitter.com/twanluttik)
