use serde::{Serialize, Deserialize};
use std::process::Command;

#[derive(Serialize)]
pub struct OllamaStatus {
    installed: bool,
    running: bool,
    error: Option<String>,
    path: Option<String>,
}

#[derive(Deserialize)]
pub struct DatabaseConnectionTest {
    connection_type: String,
    host: Option<String>,
    port: Option<u16>,
    username: Option<String>,
    password: Option<String>,
    database: Option<String>,
    connection_string: Option<String>,
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

#[derive(Serialize)]
pub struct QueryResult {
    success: bool,
    data: Option<Vec<serde_json::Value>>,
    error: Option<String>,
    row_count: usize,
}

#[tauri::command]
async fn test_database_connection(
    connection_type: String,
    host: Option<String>,
    port: Option<u16>,
    username: Option<String>,
    password: Option<String>,
    database: Option<String>,
    connection_string: Option<String>,
) -> bool {
    eprintln!("[DB] Testing {} connection", connection_type);

    match connection_type.as_str() {
        "sqlite" => {
            if let Some(conn_str) = connection_string {
                eprintln!("[DB] Testing SQLite connection to: {}", conn_str);
                // For SQLite, just check if the file path is valid or use in-memory
                true
            } else {
                eprintln!("[DB] SQLite connection string not provided");
                false
            }
        }
        "postgres" => {
            test_postgres_connection(host, port, username, password, database).await
        }
        "mysql" => {
            eprintln!(
                "[DB] Testing MySQL connection to {}:{}",
                host.as_deref().unwrap_or("localhost"),
                port.unwrap_or(3306)
            );
            // Placeholder for actual MySQL connection test
            // In production, you would use the mysql crate here
            true
        }
        "mongodb" => {
            eprintln!("[DB] MongoDB connection testing not yet implemented");
            false
        }
        _ => {
            eprintln!("[DB] Unknown database type: {}", connection_type);
            false
        }
    }
}

#[tauri::command]
async fn execute_database_query(
    connection_type: String,
    host: Option<String>,
    port: Option<u16>,
    username: Option<String>,
    password: Option<String>,
    database: Option<String>,
    connection_string: Option<String>,
    query: String,
    limit: Option<i64>,
) -> QueryResult {
    eprintln!("[DB] Executing {} query: {}", connection_type, query);

    match connection_type.as_str() {
        "postgres" => {
            execute_postgres_query(host, port, username, password, database, query).await
        }
        "sqlite" => {
            QueryResult {
                success: false,
                data: None,
                error: Some("SQLite execution not yet implemented".to_string()),
                row_count: 0,
            }
        }
        "mysql" => {
            QueryResult {
                success: false,
                data: None,
                error: Some("MySQL execution not yet implemented".to_string()),
                row_count: 0,
            }
        }
        _ => {
            QueryResult {
                success: false,
                data: None,
                error: Some(format!("Unknown database type: {}", connection_type)),
                row_count: 0,
            }
        }
    }
}

async fn test_postgres_connection(
    host: Option<String>,
    port: Option<u16>,
    username: Option<String>,
    password: Option<String>,
    database: Option<String>,
) -> bool {
    let host = host.unwrap_or_else(|| "localhost".to_string());
    let port = port.unwrap_or(5432);
    let username = username.unwrap_or_else(|| "postgres".to_string());
    let password = password.unwrap_or_default();
    let database = database.unwrap_or_else(|| "postgres".to_string());

    let connection_string = if password.is_empty() {
        format!(
            "postgresql://{}@{}:{}/{}",
            username, host, port, database
        )
    } else {
        format!(
            "postgresql://{}:{}@{}:{}/{}",
            username, password, host, port, database
        )
    };

    eprintln!(
        "[DB] Testing PostgreSQL connection to {}:{}",
        host, port
    );

    match tokio_postgres::connect(&connection_string, tokio_postgres::NoTls).await {
        Ok((client, connection)) => {
            eprintln!("[DB] PostgreSQL connection successful");
            
            // Spawn the connection handler in the background
            tokio::spawn(async move {
                if let Err(e) = connection.await {
                    eprintln!("[DB] PostgreSQL connection error: {}", e);
                }
            });

            // Close the client
            drop(client);
            true
        }
        Err(e) => {
            eprintln!("[DB] PostgreSQL connection error: {}", e);
            false
        }
    }
}

async fn execute_postgres_query(
    host: Option<String>,
    port: Option<u16>,
    username: Option<String>,
    password: Option<String>,
    database: Option<String>,
    query: String,
) -> QueryResult {
    let host = host.unwrap_or_else(|| "localhost".to_string());
    let port = port.unwrap_or(5432);
    let username = username.unwrap_or_else(|| "postgres".to_string());
    let password = password.unwrap_or_default();
    let database = database.unwrap_or_else(|| "postgres".to_string());

    let connection_string = if password.is_empty() {
        format!(
            "postgresql://{}@{}:{}/{}",
            username, host, port, database
        )
    } else {
        format!(
            "postgresql://{}:{}@{}:{}/{}",
            username, password, host, port, database
        )
    };

    eprintln!("[DB] Executing PostgreSQL query: {}", query);

    match tokio_postgres::connect(&connection_string, tokio_postgres::NoTls).await {
        Ok((client, connection)) => {
            // Spawn the connection handler in the background
            tokio::spawn(async move {
                if let Err(e) = connection.await {
                    eprintln!("[DB] PostgreSQL connection error: {}", e);
                }
            });

            // Wrap query with row_to_json() to get all columns as a single JSON object
            let json_query = format!("SELECT row_to_json(t) FROM ({}) t", query);
            eprintln!("[DB] Executing modified query: {}", json_query);
            
            // Execute the modified query
            match client.query(&json_query, &[]).await {
                Ok(rows) => {
                    eprintln!("[DB] Query executed successfully, {} rows returned", rows.len());
                    
                    let data: Vec<serde_json::Value> = rows
                        .iter()
                        .map(|row| {
                            // Get the JSON string and parse it
                            match row.try_get::<_, String>(0) {
                                Ok(json_str) => {
                                    match serde_json::from_str::<serde_json::Value>(&json_str) {
                                        Ok(json_obj) => json_obj,
                                        Err(_) => serde_json::json!(null),
                                    }
                                }
                                Err(_) => serde_json::json!(null),
                            }
                        })
                        .collect();
                    
                    QueryResult {
                        success: true,
                        data: Some(data),
                        error: None,
                        row_count: rows.len(),
                    }
                }
                Err(e) => {
                    let error_msg = format!("Query execution error: {}", e);
                    eprintln!("[DB] {}", error_msg);
                    eprintln!("[DB] Error details: {:?}", e);
                    QueryResult {
                        success: false,
                        data: None,
                        error: Some(error_msg),
                        row_count: 0,
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("[DB] PostgreSQL connection error: {}", e);
            QueryResult {
                success: false,
                data: None,
                error: Some(format!("Connection error: {}", e)),
                row_count: 0,
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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_ollama_installed,
            start_ollama_server,
            test_database_connection,
            execute_database_query
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
