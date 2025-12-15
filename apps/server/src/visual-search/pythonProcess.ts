/**
 * Python Embedding Server Process Manager
 * Spawns and manages the Python embedding server as a child process
 */

import { type ChildProcess, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to Python directory
const PYTHON_DIR = join(__dirname, "..", "..", "python");
const PYTHON_PORT = process.env.PYTHON_EMBED_PORT || "8001";

// Use the venv's Python executable directly
const VENV_PYTHON = join(PYTHON_DIR, "jina_env", "Scripts", "python.exe");

let pythonProcess: ChildProcess | null = null;

/**
 * Start the Python embedding server
 * Runs the venv's Python directly with server.py
 */
export async function startPythonServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("[Python] Starting embedding server...");
    console.log(`[Python] Directory: ${PYTHON_DIR}`);
    console.log(`[Python] Python: ${VENV_PYTHON}`);

    // Run server.py directly using the venv's Python executable
    pythonProcess = spawn(VENV_PYTHON, ["server.py"], {
      cwd: PYTHON_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
      // Set PYTHONUNBUFFERED to get output immediately
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let started = false;

    pythonProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      console.log(`[Python] ${output.trim()}`);

      // Check if server started successfully
      if (
        output.includes("Uvicorn running") ||
        output.includes("Application startup complete")
      ) {
        started = true;
        resolve();
      }
    });

    pythonProcess.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      // Uvicorn logs to stderr by default
      console.log(`[Python] ${output.trim()}`);

      if (
        output.includes("Uvicorn running") ||
        output.includes("Application startup complete")
      ) {
        started = true;
        resolve();
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("[Python] Failed to start:", err);
      reject(err);
    });

    pythonProcess.on("exit", (code) => {
      console.log(`[Python] Process exited with code ${code}`);
      pythonProcess = null;
      if (!started) {
        reject(new Error(`Python process exited with code ${code}`));
      }
    });

    // Timeout after 120 seconds (model loading can take a while)
    setTimeout(() => {
      if (!started) {
        console.log("[Python] Startup timeout - assuming server is ready");
        resolve();
      }
    }, 120_000);
  });
}

/**
 * Stop the Python embedding server
 */
export function stopPythonServer(): void {
  if (pythonProcess) {
    console.log("[Python] Stopping embedding server...");
    pythonProcess.kill();
    pythonProcess = null;
  }
}

/**
 * Check if Python server is running
 */
export function isPythonServerRunning(): boolean {
  return pythonProcess !== null && !pythonProcess.killed;
}

// Handle process exit to cleanup Python server
process.on("exit", () => {
  stopPythonServer();
});

process.on("SIGINT", () => {
  stopPythonServer();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopPythonServer();
  process.exit(0);
});
