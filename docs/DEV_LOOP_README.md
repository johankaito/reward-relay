# 🎯 Reward Relay Multi-Agent Development Loop

## Overview

This development loop system uses multiple parallel agents to automatically test features as they're built, ensuring quality and tracking progress through the todo list.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ORCHESTRATOR                       │
│  (Interactive dashboard - tracks todos & progress)   │
└────────────────┬────────────────────────────────────┘
                 │ Manages & Monitors
    ┌────────────┼────────────┬─────────────┐
    ▼            ▼            ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   DEV    │ │   TEST   │ │ MONITOR  │ │   YOU    │
│  SERVER  │ │  RUNNER  │ │  AGENT   │ │(Coding)  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
  Port 3000   Tests/30s    Screenshots  Implements
```

## Quick Start

```bash
# Navigate to app directory
cd app

# Start the development loop
./dev-loop.sh start

# This will:
# 1. Start Next.js dev server
# 2. Start automated test runner
# 3. Start page monitor
# 4. Launch interactive orchestrator
```

## Available Commands

### Main Script (`dev-loop.sh`)

```bash
./dev-loop.sh start    # Start all agents and orchestrator
./dev-loop.sh stop     # Stop all background agents
./dev-loop.sh status   # Check agent status
./dev-loop.sh logs     # Tail all logs
./dev-loop.sh restart  # Restart everything
./dev-loop.sh clean    # Stop and clean up temp files
./dev-loop.sh test     # Run tests once (standalone)
```

### Orchestrator Interactive Commands

When running, the orchestrator provides an interactive dashboard:

- `s` - Show current status
- `t` - Trigger test run
- `l` - Show recent logs
- `r` - Restart all agents
- `n` - Mark next todo as in progress
- `q` - Quit and shutdown

## Development Workflow

### 1. Start the Loop

```bash
cd app
./dev-loop.sh start
```

### 2. Pick a Todo

In the orchestrator, press `n` to mark the next todo as "in progress"

### 3. Implement the Feature

Code the feature in your editor. The system will:
- Keep dev server running
- Auto-test every 30 seconds
- Take screenshots for verification
- Update todo status when tests pass

### 4. Monitor Progress

The orchestrator dashboard shows:
- Agent status (🟢 running, 🔴 stopped)
- Todo progress (✅ complete, 🔄 in progress, 🧪 testing)
- Test results and errors

### 5. Review Results

Test results are saved in `/tmp/reward-relay/`:
- `test-results/` - Test outcomes and screenshots
- `logs/` - Agent output logs
- `monitor/` - Page screenshots

## Todo Implementation Guide

### Todo #1: Wire up AddCardForm

**What to implement:**
1. Make AddCardForm actually save to database
2. Handle form submission
3. Show success/error messages
4. Redirect to dashboard after save

**Test verifies:**
- Form submission works
- Card appears in dashboard
- Database contains new record

### Todo #2: Edit/Delete Cards

**What to implement:**
1. Add edit button to card items
2. Create edit modal/form
3. Add delete button with confirmation
4. Update database on save/delete

**Test verifies:**
- Edit button opens form
- Changes are saved
- Delete removes card

### Todo #3: Churn History Tracking

**What to implement:**
1. Add cancellation date field
2. Create "Mark as Cancelled" action
3. Display cancelled cards differently
4. Show churn history view

**Test verifies:**
- Can mark cards as cancelled
- Cancellation date is saved
- History view shows cancelled cards

## File Locations

### Source Files
- `test-runner.ts` - Automated test suite
- `orchestrator.ts` - Main controller
- `monitor.ts` - Page monitoring
- `dev-loop.sh` - Launch script

### Output Files
- `/tmp/reward-relay/logs/` - Agent logs
- `/tmp/reward-relay/test-results/` - Test results
- `/tmp/reward-relay/pids/` - Process IDs
- `/tmp/rewardify-monitor/` - Screenshots

## Troubleshooting

### Dev Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill any existing process
kill -9 <PID>
```

### Tests Failing
```bash
# Check test output
cat /tmp/reward-relay/test-results/summary.json | jq
# View screenshots
open /tmp/reward-relay/test-results/*.png
```

### Agents Crashing
```bash
# Check status
./dev-loop.sh status
# View logs
tail -f /tmp/reward-relay/logs/*.log
# Restart everything
./dev-loop.sh restart
```

### Clean Start
```bash
# Remove all temp files and restart
./dev-loop.sh clean
./dev-loop.sh start
```

## Tips

1. **Keep dev server console visible** - Open a second terminal to monitor dev server output directly
2. **Watch test results** - Tests run every 30 seconds, check `/tmp/reward-relay/test-results/`
3. **Use screenshots** - Monitor takes screenshots to verify UI changes
4. **Check logs on failure** - All output is logged to `/tmp/reward-relay/logs/`
5. **Restart if stuck** - Use `./dev-loop.sh restart` if agents get confused

## Next Steps

1. Start the development loop
2. Begin with Todo #1 (Wire up AddCardForm)
3. Code until tests pass
4. Move to next todo
5. Continue until all features complete!

The system will automatically track your progress and mark todos as complete when their tests pass.