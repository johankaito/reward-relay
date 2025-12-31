#!/usr/bin/env tsx

/**
 * Orchestrator for Reward Relay Multi-Agent Development Loop
 *
 * Manages all agents, tracks todo progress, and coordinates development
 */

import { spawn, ChildProcess } from 'child_process';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const BASE_DIR = '/tmp/reward-relay';
const LOG_DIR = join(BASE_DIR, 'logs');
const RESULTS_DIR = join(BASE_DIR, 'test-results');

interface Agent {
  name: string;
  command: string;
  args: string[];
  process?: ChildProcess;
  status: 'stopped' | 'running' | 'error';
  restarts: number;
  output: string[];
}

interface TodoItem {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'testing' | 'completed' | 'failed';
  testsPassed: boolean;
  lastTestRun?: string;
  errors?: string[];
}

class Orchestrator {
  private agents: Map<string, Agent> = new Map();
  private todos: TodoItem[] = [];
  private isRunning = false;
  private rl?: readline.Interface;

  constructor() {
    this.initializeAgents();
    this.initializeTodos();
  }

  private initializeAgents(): void {
    // Define all background agents
    this.agents.set('dev-server', {
      name: 'Next.js Dev Server',
      command: 'pnpm',
      args: ['dev'],
      status: 'stopped',
      restarts: 0,
      output: [],
    });

    this.agents.set('test-runner', {
      name: 'Test Runner',
      command: 'tsx',
      args: ['test-runner.ts'],
      status: 'stopped',
      restarts: 0,
      output: [],
    });

    this.agents.set('monitor', {
      name: 'Page Monitor',
      command: 'tsx',
      args: ['monitor.ts'],
      status: 'stopped',
      restarts: 0,
      output: [],
    });
  }

  private initializeTodos(): void {
    this.todos = [
      {
        id: 1,
        name: 'Wire up AddCardForm to save user cards',
        status: 'pending',
        testsPassed: false,
      },
      {
        id: 2,
        name: 'Add edit/delete functionality for user cards',
        status: 'pending',
        testsPassed: false,
      },
      {
        id: 3,
        name: 'Implement churn history tracking',
        status: 'pending',
        testsPassed: false,
      },
      {
        id: 4,
        name: 'Build eligibility calculator',
        status: 'pending',
        testsPassed: false,
      },
      {
        id: 5,
        name: 'Create card comparison with net values',
        status: 'pending',
        testsPassed: false,
      },
      {
        id: 6,
        name: 'Add churning calendar view',
        status: 'pending',
        testsPassed: false,
      },
      {
        id: 7,
        name: 'Implement email reminders',
        status: 'pending',
        testsPassed: false,
      },
      {
        id: 8,
        name: 'Build spending tracker',
        status: 'pending',
        testsPassed: false,
      },
    ];
  }

  async setup(): Promise<void> {
    console.log('🎯 Reward Relay Development Loop Orchestrator');
    console.log('=' .repeat(60));

    // Create necessary directories
    await mkdir(BASE_DIR, { recursive: true });
    await mkdir(LOG_DIR, { recursive: true });
    await mkdir(RESULTS_DIR, { recursive: true });

    console.log(`📁 Working directory: ${BASE_DIR}`);
    console.log(`📝 Logs directory: ${LOG_DIR}`);
    console.log(`🧪 Test results: ${RESULTS_DIR}\n`);

    // Setup readline interface for user interaction
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private async startAgent(key: string): Promise<void> {
    const agent = this.agents.get(key);
    if (!agent) return;

    console.log(`🚀 Starting ${agent.name}...`);

    const logFile = join(LOG_DIR, `${key}.log`);

    agent.process = spawn(agent.command, agent.args, {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    agent.status = 'running';

    // Capture output
    agent.process.stdout?.on('data', (data) => {
      const output = data.toString();
      agent.output.push(output);
      if (agent.output.length > 100) {
        agent.output.shift(); // Keep only last 100 lines
      }
      this.writeToLog(logFile, `[STDOUT] ${output}`);
    });

    agent.process.stderr?.on('data', (data) => {
      const output = data.toString();
      agent.output.push(`ERROR: ${output}`);
      this.writeToLog(logFile, `[STDERR] ${output}`);
    });

    agent.process.on('exit', (code) => {
      console.log(`⚠️ ${agent.name} exited with code ${code}`);
      agent.status = code === 0 ? 'stopped' : 'error';

      // Auto-restart if it crashed (up to 3 times)
      if (code !== 0 && agent.restarts < 3 && this.isRunning) {
        agent.restarts++;
        console.log(`🔄 Restarting ${agent.name} (attempt ${agent.restarts}/3)...`);
        setTimeout(() => this.startAgent(key), 5000);
      }
    });

    console.log(`✅ ${agent.name} started (PID: ${agent.process.pid})`);
  }

  private async writeToLog(file: string, content: string): Promise<void> {
    try {
      await writeFile(file, `${new Date().toISOString()} ${content}\n`, { flag: 'a' });
    } catch (error) {
      // Ignore log write errors
    }
  }

  private async stopAgent(key: string): Promise<void> {
    const agent = this.agents.get(key);
    if (!agent || !agent.process) return;

    console.log(`🛑 Stopping ${agent.name}...`);
    agent.process.kill('SIGTERM');
    agent.status = 'stopped';
    agent.process = undefined;
  }

  async startAllAgents(): Promise<void> {
    console.log('\n🚀 Starting all agents...\n');

    // Start dev server first
    await this.startAgent('dev-server');

    // Wait for server to be ready
    await this.waitForServer();

    // Start other agents
    await this.startAgent('test-runner');
    await this.startAgent('monitor');

    this.isRunning = true;
    console.log('\n✅ All agents started successfully!\n');
  }

  private async waitForServer(retries = 30): Promise<void> {
    console.log('⏳ Waiting for dev server to be ready...');
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch('http://localhost:3000', { method: 'GET' });
        if (res.ok) {
          console.log('✅ Dev server is ready!');
          return;
        }
      } catch {
        process.stdout.write('.');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Dev server failed to start');
  }

  async stopAllAgents(): Promise<void> {
    console.log('\n🛑 Stopping all agents...\n');
    this.isRunning = false;

    for (const [key, _] of this.agents) {
      await this.stopAgent(key);
    }

    console.log('✅ All agents stopped\n');
  }

  async checkTestResults(): Promise<void> {
    const resultsFile = join(RESULTS_DIR, 'summary.json');

    if (!existsSync(resultsFile)) {
      return;
    }

    try {
      const content = await readFile(resultsFile, 'utf-8');
      const results = JSON.parse(content);

      // Update todo statuses based on test results
      for (const testResult of results.todos) {
        const todo = this.todos.find(t => t.id === testResult.id);
        if (!todo) continue;

        todo.lastTestRun = results.timestamp;

        if (testResult.status === 'complete') {
          todo.testsPassed = true;
          if (todo.status !== 'completed') {
            todo.status = 'completed';
            console.log(`✅ Todo #${todo.id} "${todo.name}" - Tests PASSED!`);
          }
        } else {
          todo.testsPassed = false;
          todo.errors = testResult.errors;
          if (todo.status === 'in_progress') {
            todo.status = 'testing';
          }
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  private displayStatus(): void {
    console.clear();
    console.log('🎯 Reward Relay Development Loop - Status Dashboard');
    console.log('=' .repeat(60));

    // Display agent status
    console.log('\n📡 Agent Status:');
    for (const [key, agent] of this.agents) {
      const statusIcon = agent.status === 'running' ? '🟢' :
                        agent.status === 'error' ? '🔴' : '⚪';
      console.log(`  ${statusIcon} ${agent.name}: ${agent.status}`);
    }

    // Display todo progress
    console.log('\n📋 Todo Progress:');
    for (const todo of this.todos) {
      const statusIcon = todo.status === 'completed' ? '✅' :
                         todo.status === 'in_progress' ? '🔄' :
                         todo.status === 'testing' ? '🧪' :
                         todo.status === 'failed' ? '❌' : '⏳';

      console.log(`  ${statusIcon} #${todo.id}: ${todo.name}`);
      if (todo.errors && todo.errors.length > 0) {
        console.log(`      └─ Errors: ${todo.errors[0]}`);
      }
    }

    // Display summary
    const completed = this.todos.filter(t => t.status === 'completed').length;
    const inProgress = this.todos.filter(t => t.status === 'in_progress').length;
    const testing = this.todos.filter(t => t.status === 'testing').length;
    const total = this.todos.length;

    console.log('\n📊 Summary:');
    console.log(`  Completed: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
    console.log(`  In Progress: ${inProgress}`);
    console.log(`  Testing: ${testing}`);

    console.log('\n💡 Commands:');
    console.log('  [s] Show agent status    [t] Run tests now');
    console.log('  [l] Show logs            [r] Restart agents');
    console.log('  [n] Next todo            [q] Quit');
    console.log('\nCommand: ');
  }

  private async handleCommand(cmd: string): Promise<void> {
    switch (cmd.toLowerCase().trim()) {
      case 's':
        this.displayStatus();
        break;

      case 't':
        console.log('🧪 Triggering test run...');
        // The test runner is already running continuously
        console.log('Tests are running continuously. Check /tmp/reward-relay/test-results/');
        break;

      case 'l':
        console.log('\n📜 Recent logs:');
        for (const [key, agent] of this.agents) {
          console.log(`\n${agent.name}:`);
          const recentLogs = agent.output.slice(-5);
          recentLogs.forEach(log => console.log(`  ${log.trim()}`));
        }
        break;

      case 'r':
        await this.stopAllAgents();
        await this.startAllAgents();
        break;

      case 'n':
        const nextTodo = this.todos.find(t => t.status === 'pending');
        if (nextTodo) {
          nextTodo.status = 'in_progress';
          console.log(`\n🎯 Next todo: #${nextTodo.id} - ${nextTodo.name}`);
          console.log('Start implementing this feature. Tests will run automatically.');
        } else {
          console.log('\n✅ All todos completed or in progress!');
        }
        break;

      case 'q':
        await this.shutdown();
        break;

      default:
        console.log('Unknown command. Press Enter to continue...');
    }
  }

  async startInteractiveMode(): Promise<void> {
    // Start monitoring loop
    setInterval(async () => {
      await this.checkTestResults();
    }, 5000);

    // Display initial status
    this.displayStatus();

    // Handle user input
    this.rl?.on('line', async (input) => {
      await this.handleCommand(input);

      if (this.isRunning) {
        setTimeout(() => this.displayStatus(), 1000);
      }
    });
  }

  async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down orchestrator...');

    await this.stopAllAgents();

    if (this.rl) {
      this.rl.close();
    }

    // Save final state
    const state = {
      timestamp: new Date().toISOString(),
      todos: this.todos,
      agents: Array.from(this.agents.entries()).map(([key, agent]) => ({
        key,
        name: agent.name,
        status: agent.status,
        restarts: agent.restarts,
      })),
    };

    await writeFile(
      join(BASE_DIR, 'final-state.json'),
      JSON.stringify(state, null, 2)
    );

    console.log('✅ Orchestrator stopped');
    console.log(`📊 Final state saved to ${join(BASE_DIR, 'final-state.json')}`);

    process.exit(0);
  }
}

// Main execution
async function main() {
  const orchestrator = new Orchestrator();

  try {
    await orchestrator.setup();
    await orchestrator.startAllAgents();
    await orchestrator.startInteractiveMode();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await orchestrator.shutdown();
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await orchestrator.shutdown();
  });

  process.on('SIGTERM', async () => {
    await orchestrator.shutdown();
  });
}

// Only run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { Orchestrator };