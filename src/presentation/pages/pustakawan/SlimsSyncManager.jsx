import React, { useState, useEffect } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { RefreshCw, Database, Clock, CheckCircle, AlertCircle, History } from 'lucide-react';
import { getSyncStatus, getSyncLogs, triggerSync } from '../../../data/services/sync.service';
import './SlimsSyncManager.css';

const SlimsSyncManager = () => {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentStatus = await getSyncStatus();
      const currentLogs = await getSyncLogs();
      setStatus(currentStatus);
      setLogs(currentLogs);
    } catch (error) {
      console.error('Failed to fetch sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type = 'Incremental') => {
    setIsSyncing(true);
    setProgress(0);
    try {
      const result = await triggerSync(type, (p) => setProgress(p));
      if (result.success) {
        setStatus(result.status);
        setLogs([result.log, ...logs]);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
      setProgress(0);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <RefreshCw className="spin text-cyan" size={32} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="sync-manager-container">
        <div>
          <h1 className="gradient-text">SLiMS Sync Manager</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Kelola sinkronisasi data dari SLiMS Master Database ke Firebase Firestore.
          </p>
        </div>

        {/* Status Dashboard */}
        <div className="sync-status-cards">
          <Card className="status-card" glowColor="cyan">
            <div className="status-icon-wrapper">
              <Database size={24} className="text-cyan" />
            </div>
            <div className="status-info">
              <span className="status-label">Total Buku Tersinkronisasi</span>
              <span className="status-value">{status?.totalBooks?.toLocaleString('id-ID')}</span>
            </div>
          </Card>
          
          <Card className="status-card" glowColor="purple">
            <div className="status-icon-wrapper">
              <Clock size={24} className="text-purple" />
            </div>
            <div className="status-info">
              <span className="status-label">Terakhir Sinkronisasi</span>
              <span className="status-value">{formatDate(status?.lastSync)}</span>
            </div>
          </Card>

          <Card className="status-card" glowColor={status?.status === 'idle' ? 'cyan' : 'purple'}>
            <div className="status-icon-wrapper">
              {status?.status === 'idle' ? (
                <CheckCircle size={24} className="text-cyan" />
              ) : (
                <RefreshCw size={24} className="text-purple spin" />
              )}
            </div>
            <div className="status-info">
              <span className="status-label">Status Saat Ini</span>
              <span className="status-value" style={{ textTransform: 'capitalize' }}>
                {isSyncing ? 'Syncing...' : status?.status || 'Idle'}
              </span>
            </div>
          </Card>
        </div>

        {/* Action Controls */}
        <Card className="sync-actions-card">
          <div className="sync-actions-header">
            <h2>Kontrol Sinkronisasi</h2>
            <div className="sync-buttons">
              <Button 
                variant="outline" 
                onClick={() => handleSync('Incremental')}
                disabled={isSyncing}
                icon={<RefreshCw size={18} className={isSyncing ? 'spin' : ''} />}
              >
                Incremental Sync
              </Button>
              <Button 
                variant="primary" 
                onClick={() => handleSync('Full Sync')}
                disabled={isSyncing}
                icon={<Database size={18} />}
              >
                Full Sync
              </Button>
            </div>
          </div>
          
          {isSyncing && (
            <div className="progress-container">
              <div className="progress-header">
                <span>Sinkronisasi sedang berjalan...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </Card>

        {/* Sync Logs */}
        <Card className="sync-logs-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <History size={20} className="text-cyan" />
            <h2>Riwayat Sinkronisasi</h2>
          </div>
          
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Tipe Sinkronisasi</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>{log.type}</td>
                      <td>
                        <span className={`status-badge ${log.status.toLowerCase()}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      Belum ada riwayat sinkronisasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default SlimsSyncManager;
