# Ollama Chat App 🐐

A modern, feature-rich desktop application for interacting with Ollama models. Built with Tauri, React, and TypeScript for a seamless cross-platform experience.

[![Build and Deploy](https://github.com/ollama-interface/Ollama-Gui/actions/workflows/build-and-deploy.yml/badge.svg?branch=main)](https://github.com/ollama-interface/Ollama-Gui/actions/workflows/build-and-deploy.yml)

## Overview

Ollama Chat App is a user-friendly interface for the [Official Ollama CLI](https://ollama.ai) that makes it easy to chat with large language models locally. Whether you're a developer, researcher, or AI enthusiast, this app provides an intuitive way to interact with Ollama without touching the command line.

## ✨ Features

- **🎨 Modern UI** – Clean, intuitive interface built with React and Tailwind CSS
- **💬 Multiple Conversations** – Manage and organize multiple chat sessions
- **🤖 Auto-detect Models** – Automatically discover available Ollama models
- **🖥️ Flexible Host Configuration** – Connect to Ollama running on any host
- **⏰ Auto-start Server** – Automatically start the Ollama server when needed
- **💾 Persistent Storage** – All conversations are saved locally using SQLite
- **📤 Import & Export** – Easily backup and share your conversations
- **🌗 Light & Dark Theme** – Choose your preferred visual style
- **⚡ Cross-platform** – Available for macOS (Intel & Apple Silicon) and Windows

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Rust](https://www.rust-lang.org/tools/install)
- [Ollama](https://ollama.ai) installed and running

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ollama-interface/Ollama-Gui.git
cd Ollama-Gui
```

2. Install dependencies:

```bash
pnpm install
```

3. Run in development mode:

```bash
pnpm tauri dev
```

### Building

Build for your platform:

```bash
# macOS (Apple Silicon)
pnpm build:app:silicon

# macOS (Intel)
pnpm build:app:intell

# macOS (Universal - both architectures)
pnpm build:app:universal

# Windows
pnpm build:app:windows
```

## �️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Desktop**: Tauri 2
- **Backend**: Rust
- **Database**: SQLite with sqlx
- **UI Components**: Radix UI, shadcn/ui

## 📋 Roadmap

- [ ] Linux support
- [ ] Improved settings interface
- [ ] Additional model parameters customization
- [ ] Conversation search and filtering
- [ ] Model management UI

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

## � License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## 💬 Contact

For questions or feedback, reach out to [Twan Luttik on X/Twitter](https://twitter.com/twanluttik)
