// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child, Stdio};
use std::sync::Mutex;
use std::path::PathBuf;
use std::os::windows::process::CommandExt;
use tauri::Manager;

// State to hold the backend process
struct BackendState {
    process: Mutex<Option<Child>>,
    started_by_app: Mutex<bool>,
}

const BACKEND_URL: &str = "http://127.0.0.1:8000";
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn check_backend_health() -> bool {
    match reqwest::blocking::get(format!("{}/health", BACKEND_URL)) {
        Ok(res) => res.status().is_success(),
        Err(_) => false,
    }
}

fn get_app_data_dir() -> PathBuf {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(appdata).join("MyLife")
}

fn ensure_app_directories() {
    let app_data = get_app_data_dir();
    
    // Create directories
    std::fs::create_dir_all(&app_data).ok();
    std::fs::create_dir_all(app_data.join("db")).ok();
    std::fs::create_dir_all(app_data.join("storage").join("photos")).ok();
    std::fs::create_dir_all(app_data.join("storage").join("backups_tmp")).ok();
    std::fs::create_dir_all(app_data.join("models")).ok();
    
    println!("App data directory: {:?}", app_data);
}

fn main() {
  tauri::Builder::default()
    .manage(BackendState {
        process: Mutex::new(None),
        started_by_app: Mutex::new(false),
    })
    .setup(|app| {
        // Ensure app data directories exist
        ensure_app_directories();
        
        // 1. Check if backend is already running
        if check_backend_health() {
            println!("Backend already running at {}", BACKEND_URL);
            return Ok(());
        }

        println!("Starting backend...");
        
        // 2. Determine if running in development or production
        let backend_exe = if cfg!(debug_assertions) {
            // Development mode: use Python uvicorn
            None
        } else {
            // Production mode: check for bundled exe in resources
            app.path_resolver()
                .resolve_resource("resources/mylife-backend.exe")
        };
        
        let child_process = if let Some(exe_path) = backend_exe {
            // Production: Launch bundled backend.exe
            println!("Launching bundled backend: {:?}", exe_path);
            
            Command::new(exe_path)
                .creation_flags(CREATE_NO_WINDOW)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| {
                    eprintln!("Failed to start bundled backend: {}", e);
                    e
                })
                .ok()
        } else {
            // Development: Use Python + uvicorn
            println!("Development mode: Using Python backend");
            
            // Try to use venv Python
            let backend_dir = std::path::Path::new("../../backend");
            let venv_python = backend_dir.join("venv").join("Scripts").join("python.exe");
            
            let (command, args): (&str, Vec<&str>) = if venv_python.exists() {
                (
                    venv_python.to_str().unwrap(),
                    vec!["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"]
                )
            } else {
                ("python", vec!["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"])
            };
            
            Command::new(command)
                .args(&args)
                .current_dir(backend_dir)
                .creation_flags(CREATE_NO_WINDOW)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| {
                    eprintln!("Failed to start Python backend: {}", e);
                    e
                })
                .ok()
        };
        
        if let Some(child) = child_process {
            // Store the process
            *app.state::<BackendState>().process.lock().unwrap() = Some(child);
            *app.state::<BackendState>().started_by_app.lock().unwrap() = true;
            
            // Wait for backend to be ready
            println!("Waiting for backend to start...");
            for attempt in 1..=30 {
                std::thread::sleep(std::time::Duration::from_millis(500));
                if check_backend_health() {
                    println!("Backend ready after {} attempts", attempt);
                    break;
                }
            }
        } else {
            eprintln!("Failed to start backend process");
        }
        
        Ok(())
    })
    .on_window_event(|event| {
        if let tauri::WindowEvent::Destroyed = event.event() {
            // Cleanup: Kill backend if we started it
            let state = event.window().state::<BackendState>();
            
            let started_by_us = *state.started_by_app.lock().unwrap();
            if started_by_us {
                if let Some(mut proc) = state.process.lock().unwrap().take() {
                    println!("Shutting down backend...");
                    proc.kill().ok();
                }
            }
        }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
