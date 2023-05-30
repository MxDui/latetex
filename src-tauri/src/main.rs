// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command as ProcessCommand;
use std::io::Write;
use std::fs::File;
use std::path::Path;
use tempfile::NamedTempFile;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}

#[derive(serde::Deserialize)]
struct CompileLatexArgs {
  code: String,
}

#[tauri::command]
fn compile_latex(args: CompileLatexArgs) -> Result<String, String> {
  // Create a temporary file with the LaTeX code
  let mut temp_file = NamedTempFile::new().map_err(|e| format!("Failed to create temp file: {}", e))?;
  writeln!(temp_file, "{}", args.code).map_err(|e| format!("Failed to write to temp file: {}", e))?;

  // Compile the LaTeX code with latexmk
  let output = ProcessCommand::new("latexmk")
    .arg("-pdf")
    .arg(temp_file.path())
    .output()
    .map_err(|e| format!("Failed to run latexmk: {}", e))?;

  if !output.status.success() {
    return Err(format!("latexmk failed: {}", String::from_utf8_lossy(&output.stderr)));
  }

  // Read the resulting PDF file
  let pdf_path = temp_file.path().with_extension("pdf");
  let pdf_bytes = std::fs::read(&pdf_path).map_err(|e| format!("Failed to read PDF file: {}", e))?;

  // Delete the temporary files
  std::fs::remove_file(temp_file.path()).map_err(|e| format!("Failed to delete temp file: {}", e))?;
  std::fs::remove_file(&pdf_path).map_err(|e| format!("Failed to delete PDF file: {}", e))?;

  // Return the PDF bytes as a base64 encoded string
  Ok(base64::encode(pdf_bytes))
}