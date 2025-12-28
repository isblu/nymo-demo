import { type ChildProcess, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PYTHON_DIR = join(__dirname, "..", "..", "python");

const VENV_PYTHON = join(PYTHON_DIR, ".jina_env", "Scripts", "python.exe");

let pythonProcess: ChildProcess | null = null;

export function startPythonServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("[Python] Starting embedding server...");
    console.log(`[Python] Directory: ${PYTHON_DIR}`);
    console.log(`[Python] Python: ${VENV_PYTHON}`);

    pythonProcess = spawn(VENV_PYTHON, ["server.py"], {
      cwd: PYTHON_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let started = false;

    pythonProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      console.log(`[Python] ${output.trim()}`);

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

export function stopPythonServer(): void {
  if (pythonProcess) {
    console.log("[Python] Stopping embedding server...");
    pythonProcess.kill();
    pythonProcess = null;
  }
}

export function isPythonServerRunning(): boolean {
  return pythonProcess !== null && !pythonProcess.killed;
}

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
