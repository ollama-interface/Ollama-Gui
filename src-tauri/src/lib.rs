use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
pub struct OllamaStatus {
    installed: bool,
    running: bool,
    error: Option<String>,
    path: Option<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn check_ollama_installed() -> OllamaStatus {
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "ollama -v"])
            .output()
    } else {
        Command::new("sh")
            .arg("-c")
            .arg("ollama -v")
            .output()
    };

    match output {
        Ok(result) => {
            let stderr_str = String::from_utf8_lossy(&result.stderr);
            let stdout_str = String::from_utf8_lossy(&result.stdout);
            let output_str = format!("{}{}", stdout_str, stderr_str);

            eprintln!("[Ollama] Version check output: {}", output_str);

            let installed = !output_str.is_empty();
            let running = !output_str.contains("could not connect to a running Ollama instance");

            if installed {
                OllamaStatus {
                    installed: true,
                    running,
                    error: None,
                    path: None,
                }
            } else {
                OllamaStatus {
                    installed: false,
                    running: false,
                    error: Some("Ollama not found".to_string()),
                    path: None,
                }
            }
        }
        Err(e) => {
            eprintln!("[Ollama] Error during detection: {}", e);
            OllamaStatus {
                installed: false,
                running: false,
                error: Some(format!("Detection error: {}", e)),
                path: None,
            }
        }
    }
}

#[tauri::command]
fn start_ollama_server() -> OllamaStatus {
    eprintln!("[Ollama] Attempting to start server...");
    
    let result = if cfg!(target_os = "windows") {
        eprintln!("[Ollama] Using Windows command");
        Command::new("cmd")
            .args(&["/C", "ollama serve"])
            .spawn()
    } else {
        eprintln!("[Ollama] Using Unix shell command");
        Command::new("sh")
            .arg("-c")
            .arg("OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11434 ollama serve")
            .spawn()
    };

    match result {
        Ok(child) => {
            eprintln!("[Ollama] Server process spawned with PID: {:?}", child.id());
            OllamaStatus {
                installed: true,
                running: true,
                error: None,
                path: None,
            }
        }
        Err(e) => {
            eprintln!("[Ollama] Failed to start server: {}", e);
            OllamaStatus {
                installed: true,
                running: false,
                error: Some(format!("Failed to start Ollama: {}", e)),
                path: None,
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_ollama_installed,
            start_ollama_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
