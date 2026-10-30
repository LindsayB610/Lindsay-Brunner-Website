import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export function linuxProcessIsRunning(stat) {
  const state = stat.slice(stat.lastIndexOf(')') + 1).trim().split(/\s+/)[0];
  assert.match(state, /^[RSDZTWtXxKPI]$/, 'Unrecognized Linux process state');
  return !['Z', 'X', 'x'].includes(state);
}

// Container init may retain an exited orphan's PID until it reaps the process.
// Zombies cannot execute or be killed again; all live/unknown states fail cleanup.
export async function isProcessRunning(pid) {
  assert.ok(Number.isInteger(pid) && pid > 1, 'Expected an owned child PID');
  try {
    process.kill(pid, 0);
    if (process.platform === 'linux') {
      const stat = await readFile(`/proc/${pid}/stat`, 'utf8');
      const running = linuxProcessIsRunning(stat);
      if (!running) console.log(`Confirmed terminated container child ${pid}: ${stat.slice(stat.lastIndexOf(')') + 1).trim().split(/\s+/)[0]}`);
      return running;
    }
    return true;
  } catch (error) {
    if (error.code === 'ESRCH' || error.code === 'ENOENT') return false;
    throw error;
  }
}
