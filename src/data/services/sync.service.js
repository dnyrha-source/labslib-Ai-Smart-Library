// src/data/services/sync.service.js

// Kunci penyimpanan local storage untuk simulasi
const SYNC_LOGS_KEY = 'mock_sync_logs';
const SYNC_STATUS_KEY = 'mock_sync_status';

// Inisialisasi status jika kosong
if (!localStorage.getItem(SYNC_STATUS_KEY)) {
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
    lastSync: new Date(Date.now() - 86400000).toISOString(), // Kemarin
    totalBooks: 12450,
    status: 'idle', // idle, syncing, failed
  }));
}

// Inisialisasi logs jika kosong
if (!localStorage.getItem(SYNC_LOGS_KEY)) {
  const initialLogs = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'Incremental',
      status: 'Success',
      details: 'Synced 15 new books, updated 3.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      type: 'Full Sync',
      status: 'Success',
      details: 'Synced 12432 books from SLiMS.',
    }
  ];
  localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(initialLogs));
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getSyncStatus = async () => {
  await delay(300); // Simulate network
  return JSON.parse(localStorage.getItem(SYNC_STATUS_KEY));
};

export const getSyncLogs = async () => {
  await delay(300);
  return JSON.parse(localStorage.getItem(SYNC_LOGS_KEY));
};

export const triggerSync = async (type = 'Incremental', onProgress) => {
  // Update status to syncing
  const status = JSON.parse(localStorage.getItem(SYNC_STATUS_KEY));
  status.status = 'syncing';
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));

  // Simulasi proses sinkronisasi dengan progress callback
  const totalSteps = 10;
  for (let i = 1; i <= totalSteps; i++) {
    await delay(500); // 500ms per step
    if (onProgress) {
      onProgress(Math.floor((i / totalSteps) * 100));
    }
  }

  // Selesai sync
  const newBooksCount = type === 'Full Sync' ? 12450 : Math.floor(Math.random() * 20) + 1;
  const updatedStatus = {
    lastSync: new Date().toISOString(),
    totalBooks: type === 'Full Sync' ? newBooksCount : status.totalBooks + newBooksCount,
    status: 'idle',
  };
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updatedStatus));

  // Tambah log baru
  const logs = JSON.parse(localStorage.getItem(SYNC_LOGS_KEY));
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    status: 'Success',
    details: type === 'Full Sync' ? `Synced ${newBooksCount} books from SLiMS.` : `Synced ${newBooksCount} new books.`,
  };
  const updatedLogs = [newLog, ...logs];
  localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(updatedLogs));

  return { success: true, log: newLog, status: updatedStatus };
};
