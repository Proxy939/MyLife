// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child, Stdio};
use std::sync::Mutex;
use std::path::Path;
use std::os::windows::process::CommandExt;
use tauri::Manager;

// State to hold the backend process
struct BackendState {
    process: Mutex<Option<Child>>,
}

const BACKEND_URL: &str = "http://127.0.0.1:8000";
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn check_backend_health() -> bool {
    match reqwest::blocking::get(format!("{}/health", BACKEND_URL)) {
        Ok(res) => res.status().is_success(),
        Err(_) => false,
    }
}

fn main() {
  tauri::Builder::default()
    .manage(BackendState {
        process: Mutex::new(None),
    })
    .setup(|app| {
        // 1. Check if backend is running
        if check_backend_health() {
            println!("Backend already running.");
            return Ok(());
        }

        println!("Starting backend...");
        
        // 2. Resolve Path
        // Assuming we rely on 'uvicorn' in PATH and running from dev environment
        // Dev Path: panic if we can't find the backend folder
        // We look for "backend" sibling to "frontend" (src-tauri's grandparent)
        // ../../backend
        let backend_dir = Path::new("../../backend");
        
        if config_is_dev() && backend_dir.exists() {
             let child = Command::new("uvicorn")
                .args(&["app.main:app", "--host", "127.0.0.1", "--port", "8000"])
                .current_dir(backend_dir)
                .creation_flags(CREATE_NO_WINDOW) // Windows only: Hide terminal
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();

            match child {
                Ok(c) => {
                    println!("Backend process started: id={}", c.id());
                    let state = app.state::<BackendState>();
                    *state.process.lock().unwrap() = Some(c);
                }
                Err(e) => {
                    eprintln!("Failed to start backend: {}", e);
                    // We don't panic, let the frontend show error or retry
                }
            }
        } else {
            // In Production Request: The user only asked for "Start FastAPI Backend" via uvicorn command.
            // A real prod app would bundle the executable. 
            // For this step, we keep the dev logic as "running local backend".
            // If we needed to support prod, we'd look for a sidecar.
            println!("Production mode or backend dir not found - skipping auto-start logic for now.");
        }

        Ok(())
    })
    .on_window_event(|event| {
        match event.event() {
             // Handle window events if needed
             _ => {}
        }
    })
    .build(tauri::generate_context!())
    .expect("error while running tauri application")
    .run(|app_handle, event| {
        match event {
            tauri::RunEvent::Exit => {
                // Kill Backend on Exit
                let state = app_handle.state::<BackendState>();
                let mut process = state.process.lock().unwrap();
                if let Some(mut child) = process.take() {
                    println!("Killing backend process...");
                    let _ = child.kill();
                }
            }
            _ => {}
        }
    });
}

// Simple heuristic for dev mode (if we can see the backend source)
fn config_is_dev() -> bool {
    #[cfg(debug_assertions)]
    return true;
    #[cfg(not(debug_assertions))]
    return false;
}
