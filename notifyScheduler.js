/**
 * Simple in-process scheduler for sending FCM notifications at a future time.
 * Note: this is in-memory and will not survive process restarts. Suitable for dev/testing.
 */
const timers = new Map();

function schedule(id, sendAtMs, fn) {
  // cancel any existing
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }

  const delay = Math.max(0, sendAtMs - Date.now());
  const handle = setTimeout(async () => {
    try {
      await fn();
    } catch (e) {
      console.warn('notifyScheduler: scheduled job failed', e && e.message ? e.message : e);
    } finally {
      timers.delete(id);
    }
  }, delay);
  timers.set(id, handle);
  return handle;
}

function cancel(id) {
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    return true;
  }
  return false;
}

module.exports = { schedule, cancel };
