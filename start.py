#!/usr/bin/env python3
"""
Startup script for the Form Conversion webapp.
This script starts the Flask backend first, detects its host/port,
then starts the React frontend with proper proxy configuration.
"""

import os
import sys
import time
import signal
import socket
import subprocess
from pathlib import Path

def find_free_port(start_port=5001):
    """Find a free port starting from the given port."""
    port = start_port
    while port < 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('localhost', port))
                return port
            except OSError:
                port += 1
    raise RuntimeError("No free port found")

def wait_for_server(host, port, timeout=30):
    """Wait for server to be ready."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex((host, port))
                if result == 0:
                    return True
        except:
            pass
        time.sleep(0.5)
    return False

def update_vite_config(backend_port):
    """Update vite.config.js with the correct backend port."""
    vite_config_path = Path("ui/vite.config.js")
    if not vite_config_path.exists():
        print(f"❌ Vite config not found at {vite_config_path}")
        return False

    content = vite_config_path.read_text()

    # Update the proxy target
    new_target = f'"http://localhost:{backend_port}"'

    # Replace the target line
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'target:' in line and 'localhost' in line:
            # Extract the indentation
            indent = line[:line.index('target:')]
            lines[i] = f'{indent}target: {new_target},'
            break

    vite_config_path.write_text('\n'.join(lines))
    print(f"✅ Updated Vite proxy to target http://localhost:{backend_port}")
    return True

def start_backend():
    """Start the Flask backend server."""
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return None, None

    # Find a free port for the backend
    backend_port = find_free_port(5001)

    print(f"🚀 Starting Flask backend on port {backend_port}...")

    # Set environment variable for Flask port
    env = os.environ.copy()
    env['FLASK_PORT'] = str(backend_port)

    # Start Flask server
    process = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=backend_dir,
        env=env,
        universal_newlines=True
    )

    # Wait for Flask to start
    if wait_for_server('localhost', backend_port):
        print(f"✅ Backend ready at http://localhost:{backend_port}")
        return process, backend_port
    else:
        print("❌ Backend failed to start")
        process.terminate()
        return None, None

def start_frontend(backend_port):
    """Start the React frontend."""
    frontend_dir = Path("ui")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return None

    # Update Vite config with backend port
    if not update_vite_config(backend_port):
        return None

    print("🚀 Starting React frontend...")

    # Start Vite dev server
    process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        universal_newlines=True
    )

    # Wait a bit for Vite to start
    time.sleep(3)

    if process.poll() is None:  # Process is still running
        print("✅ Frontend ready at http://localhost:3000")
        return process
    else:
        print("❌ Frontend failed to start")
        return None

def main():
    """Main startup function."""
    print("🔄 Starting Form Conversion Web App...")
    print("=" * 50)

    # Start backend first
    backend_process, backend_port = start_backend()
    if not backend_process:
        print("❌ Failed to start backend. Exiting.")
        return 1

    # Start frontend
    frontend_process = start_frontend(backend_port)
    if not frontend_process:
        print("❌ Failed to start frontend. Stopping backend.")
        backend_process.terminate()
        return 1

    print("\n" + "=" * 50)
    print("🎉 App is ready!")
    print(f"🌐 Frontend: http://localhost:3000")
    print(f"🔧 Backend API: http://localhost:{backend_port}")
    print("Press Ctrl+C to stop the servers")
    print("=" * 50 + "\n")

    def signal_handler(_sig, _frame):
        print("\n🛑 Stopping servers...")
        frontend_process.terminate()
        backend_process.terminate()

        # Wait for processes to end
        frontend_process.wait()
        backend_process.wait()
        print("✅ Servers stopped")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        # Keep the script running and monitor processes
        while True:
            if backend_process.poll() is not None:
                print("❌ Backend process died unexpectedly")
                frontend_process.terminate()
                break

            if frontend_process.poll() is not None:
                print("❌ Frontend process died unexpectedly")
                backend_process.terminate()
                break

            time.sleep(1)

    except KeyboardInterrupt:
        signal_handler(None, None)

    return 0

if __name__ == "__main__":
    # Check if we're in the right directory
    if not Path("backend").exists() or not Path("ui").exists():
        print("❌ Please run this script from the form-conversion root directory")
        print("Expected directory structure:")
        print("  form-conversion/")
        print("  ├── backend/")
        print("  ├── ui/")
        print("  └── start.py")
        sys.exit(1)

    sys.exit(main())