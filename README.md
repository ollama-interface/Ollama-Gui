# Ollama GUI

Welcome to Ollama GUI, this is interface for ollama cli to make it easier to chat with, this also includes other features such as persisted conversation, switch between conversations and more.

<img src="./.github/docs/preview-1.png" />

<br />
<br />

## Create a build to fully self host it and offline use

1.  Clone the repo
2.  `pnpm install`
3.  `pnpm build`
4.  Go to `/src-tauri/target/release/bundle/dmg/*.dmg` and install the program with the .dmg file.

<br />

You as well you need to install [Ollama](https://ollama.ai) and after you installed it, you can run your local server with this command `OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11435 ollama serve`.

<br />
<br />

This is not affiliated with Ollama.ai but just giving value to the comunnity from me.
<br />

For any questions, please contact [Twan Luttik (Twitter - X)](twitter.com/twanluttik)
