#!/bin/bash

# Reward Relay Multi-Agent Development Loop Launcher
#
# Usage:
#   ./dev-loop.sh start    - Start all agents and orchestrator
#   ./dev-loop.sh stop     - Stop all agents
#   ./dev-loop.sh status   - Check status of all agents
#   ./dev-loop.sh logs     - Tail all agent logs
#   ./dev-loop.sh clean    - Clean up temp files and logs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
BASE_DIR="/tmp/reward-relay"
LOG_DIR="$BASE_DIR/logs"
PID_DIR="$BASE_DIR/pids"
RESULTS_DIR="$BASE_DIR/test-results"

# Ensure directories exist
mkdir -p "$LOG_DIR" "$PID_DIR" "$RESULTS_DIR"

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a process is running
is_running() {
    pid_file=$1
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to start the dev server
start_dev_server() {
    print_color "$BLUE" "🚀 Starting Next.js dev server..."

    if is_running "$PID_DIR/dev-server.pid"; then
        print_color "$YELLOW" "   Dev server already running"
        return
    fi

    # Start dev server in background
    nohup pnpm dev > "$LOG_DIR/dev-server.log" 2>&1 &
    echo $! > "$PID_DIR/dev-server.pid"

    print_color "$GREEN" "   ✅ Dev server started (PID: $(cat $PID_DIR/dev-server.pid))"
}

# Function to start the test runner
start_test_runner() {
    print_color "$BLUE" "🧪 Starting test runner..."

    if is_running "$PID_DIR/test-runner.pid"; then
        print_color "$YELLOW" "   Test runner already running"
        return
    fi

    # Wait for dev server to be ready first
    sleep 5

    # Start test runner in background
    nohup tsx test-runner.ts > "$LOG_DIR/test-runner.log" 2>&1 &
    echo $! > "$PID_DIR/test-runner.pid"

    print_color "$GREEN" "   ✅ Test runner started (PID: $(cat $PID_DIR/test-runner.pid))"
}

# Function to start the monitor
start_monitor() {
    print_color "$BLUE" "📸 Starting page monitor..."

    if is_running "$PID_DIR/monitor.pid"; then
        print_color "$YELLOW" "   Monitor already running"
        return
    fi

    # Start monitor in background
    nohup tsx monitor.ts > "$LOG_DIR/monitor.log" 2>&1 &
    echo $! > "$PID_DIR/monitor.pid"

    print_color "$GREEN" "   ✅ Monitor started (PID: $(cat $PID_DIR/monitor.pid))"
}

# Function to start the orchestrator (foreground)
start_orchestrator() {
    print_color "$BLUE" "🎯 Starting orchestrator (interactive mode)..."

    # The orchestrator runs in foreground for user interaction
    tsx orchestrator.ts
}

# Function to stop a process
stop_process() {
    name=$1
    pid_file="$PID_DIR/$name.pid"

    if is_running "$pid_file"; then
        pid=$(cat "$pid_file")
        print_color "$YELLOW" "🛑 Stopping $name (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null || true

        # Wait for process to stop
        timeout=10
        while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
            sleep 1
            timeout=$((timeout - 1))
        done

        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            print_color "$RED" "   Force killing $name..."
            kill -9 "$pid" 2>/dev/null || true
        fi

        rm -f "$pid_file"
        print_color "$GREEN" "   ✅ $name stopped"
    else
        print_color "$YELLOW" "   $name not running"
    fi
}

# Function to stop all agents
stop_all() {
    print_color "$RED" "\n🛑 Stopping all agents...\n"

    stop_process "dev-server"
    stop_process "test-runner"
    stop_process "monitor"

    print_color "$GREEN" "\n✅ All agents stopped\n"
}

# Function to check status
check_status() {
    print_color "$BLUE" "\n📊 Agent Status:\n"

    # Check dev server
    if is_running "$PID_DIR/dev-server.pid"; then
        print_color "$GREEN" "  🟢 Dev Server: Running (PID: $(cat $PID_DIR/dev-server.pid))"
    else
        print_color "$RED" "  🔴 Dev Server: Stopped"
    fi

    # Check test runner
    if is_running "$PID_DIR/test-runner.pid"; then
        print_color "$GREEN" "  🟢 Test Runner: Running (PID: $(cat $PID_DIR/test-runner.pid))"
    else
        print_color "$RED" "  🔴 Test Runner: Stopped"
    fi

    # Check monitor
    if is_running "$PID_DIR/monitor.pid"; then
        print_color "$GREEN" "  🟢 Monitor: Running (PID: $(cat $PID_DIR/monitor.pid))"
    else
        print_color "$RED" "  🔴 Monitor: Stopped"
    fi

    # Check for test results
    if [ -f "$RESULTS_DIR/summary.json" ]; then
        print_color "$BLUE" "\n📋 Latest Test Results:"
        last_run=$(jq -r '.timestamp' "$RESULTS_DIR/summary.json" 2>/dev/null || echo "Unknown")
        passed=$(jq -r '.passed' "$RESULTS_DIR/summary.json" 2>/dev/null || echo "0")
        failed=$(jq -r '.failed' "$RESULTS_DIR/summary.json" 2>/dev/null || echo "0")
        total=$(jq -r '.totalTests' "$RESULTS_DIR/summary.json" 2>/dev/null || echo "0")

        print_color "$NC" "  Last run: $last_run"
        print_color "$GREEN" "  Passed: $passed/$total"

        if [ "$failed" -gt "0" ]; then
            print_color "$RED" "  Failed: $failed"
        fi
    fi

    echo ""
}

# Function to tail logs
tail_logs() {
    print_color "$BLUE" "📜 Tailing all logs (Ctrl+C to stop)...\n"

    # Use multitail if available, otherwise use regular tail
    if command -v multitail &> /dev/null; then
        multitail -i "$LOG_DIR/dev-server.log" \
                  -i "$LOG_DIR/test-runner.log" \
                  -i "$LOG_DIR/monitor.log"
    else
        tail -f "$LOG_DIR"/*.log
    fi
}

# Function to clean up
cleanup() {
    print_color "$YELLOW" "🧹 Cleaning up temporary files...\n"

    # Stop all processes first
    stop_all

    # Remove directories
    rm -rf "$BASE_DIR"

    print_color "$GREEN" "✅ Cleanup complete\n"
}

# Main script logic
case "$1" in
    start)
        print_color "$GREEN" "🎯 Reward Relay Development Loop\n"
        print_color "$NC" "Starting all agents and orchestrator...\n"

        # Start background agents
        start_dev_server
        sleep 3  # Wait for dev server to initialize

        start_test_runner
        start_monitor

        print_color "$GREEN" "\n✅ All background agents started!"
        print_color "$BLUE" "\n📋 Starting orchestrator for interactive control...\n"

        # Start orchestrator in foreground
        start_orchestrator
        ;;

    stop)
        stop_all
        ;;

    status)
        check_status
        ;;

    logs)
        tail_logs
        ;;

    clean)
        cleanup
        ;;

    restart)
        print_color "$YELLOW" "🔄 Restarting all agents...\n"
        stop_all
        sleep 2
        exec "$0" start
        ;;

    test)
        # Run tests once
        print_color "$BLUE" "🧪 Running tests once...\n"
        tsx test-runner.ts once
        ;;

    *)
        print_color "$BLUE" "Reward Relay Development Loop Manager\n"
        print_color "$NC" "Usage: $0 {start|stop|status|logs|restart|clean|test}\n"
        echo "  start   - Start all agents and enter interactive mode"
        echo "  stop    - Stop all background agents"
        echo "  status  - Check status of all agents"
        echo "  logs    - Tail all agent logs"
        echo "  restart - Restart all agents"
        echo "  clean   - Stop agents and clean up temp files"
        echo "  test    - Run tests once (without starting agents)"
        echo ""
        exit 1
        ;;
esac