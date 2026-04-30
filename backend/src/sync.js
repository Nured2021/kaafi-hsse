const queue = [];

export function enqueueSyncJob(type, payload) {
  const job = {
    id: crypto.randomUUID(),
    type,
    payload,
    status: "queued",
    created_at: new Date().toISOString(),
  };

  queue.push(job);
  return job;
}

export const queueSyncItem = enqueueSyncJob;

export function getSyncStatus() {
  return {
    online: true,
    queued: queue.filter((job) => job.status === "queued").length,
    jobs: queue,
  };
}

export function flushSyncQueue() {
  for (const job of queue) {
    if (job.status === "queued") {
      job.status = "synced";
      job.synced_at = new Date().toISOString();
    }
  }

  return getSyncStatus();
}
