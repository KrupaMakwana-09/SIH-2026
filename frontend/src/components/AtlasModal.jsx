import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, X, Server, Sparkles, RefreshCw, Copy } from 'lucide-react';
import { api } from '../utils/api';
export default function AtlasModal({
  isOpen,
  onClose
}) {
  const [dbStatus, setDbStatus] = useState(null);
  const [mongoUri, setMongoUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    message: ''
  });
  const fetchStatus = async () => {
    try {
      const res = await api.getDBStatus();
      setDbStatus(res);
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setFeedback({
        type: '',
        message: ''
      });
    }
  }, [isOpen]);
  if (!isOpen) return null;
  const handleConnect = async e => {
    e.preventDefault();
    if (!mongoUri) return;
    setLoading(true);
    setFeedback({
      type: '',
      message: ''
    });
    try {
      const res = await api.connectAtlas(mongoUri);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Connected to MongoDB Atlas successfully!'
        });
        fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to connect. Please check credentials and IP whitelist in Atlas.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Connection attempt timed out. Check network and MongoDB connection string.'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSeed = async () => {
    setSeedLoading(true);
    setFeedback({
      type: '',
      message: ''
    });
    try {
      const res = await api.seedAtlas();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Failed to populate database.'
      });
    } finally {
      setSeedLoading(false);
    }
  };
  return <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
      <div className="glass-panel" style={{
      width: '100%',
      maxWidth: '640px',
      padding: '26px',
      position: 'relative'
    }}>
        {/* Header */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
            <div style={{
            padding: '10px'
          }}>
              <Database size={24} />
            </div>
            <div>
              <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 800
            }}>
                MongoDB Atlas Configuration
              </h3>
              <p style={{
              fontSize: '0.8rem'
            }}>
                Connect your cloud cluster or run in dynamic hybrid memory storage.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
          border: 'none',
          padding: '6px',
          cursor: 'pointer'
        }}>
            <X size={18} color="#4b5563" />
          </button>
        </div>

        {/* Current Status Box */}
        <div style={{
        padding: '16px',
        border: "1px solid #000",
        marginBottom: '18px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
            <span style={{
            fontSize: '0.82rem',
            fontWeight: 600
          }}>Active Storage Engine:</span>
            <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: `1px solid ${dbStatus?.isConnected ? '#86efac' : '#a7f3d0'}`
          }}>
              <Server size={13} />
              <span>{dbStatus?.isConnected ? '🟢 MongoDB Atlas Cloud Cluster' : '⚡ Dynamic In-Memory / Seed Mode'}</span>
            </div>
          </div>
          <div style={{
          fontSize: '0.78rem'
        }}>
            <strong>Connection String:</strong> {dbStatus?.uriMasked || 'Default Memory Store'}
          </div>
        </div>

        {/* Form to enter custom Atlas URI */}
        <form onSubmit={handleConnect} style={{
        marginBottom: '18px'
      }}>
          <label style={{
          display: 'block',
          fontSize: '0.82rem',
          fontWeight: 700,
          marginBottom: '6px'
        }}>
            Enter MongoDB Atlas Connection String:
          </label>
          <div style={{
          display: 'flex',
          gap: '8px'
        }}>
            <input type="text" placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/gramin_arogya" value={mongoUri} onChange={e => setMongoUri(e.target.value)} style={{
            flex: 1,
            padding: '10px 14px',
            border: "1px solid #000",
            fontSize: '0.85rem',
            outline: 'none'
          }} />
            <button type="submit" disabled={loading || !mongoUri} className="btn-primary" style={{
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}>
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
          <p style={{
          fontSize: '0.72rem',
          marginTop: '6px'
        }}>
            💡 Tip: Make sure your MongoDB Atlas cluster has <strong>Network Access (0.0.0.0/0)</strong> enabled.
          </p>
        </form>

        {/* Seed button */}
        <div style={{
        padding: '16px',
        border: "1px solid #000",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
          <div>
            <div style={{
            fontSize: '0.88rem',
            fontWeight: 700
          }}>
              Populate SIH Rural Health Demo Dataset
            </div>
            <div style={{
            fontSize: '0.75rem'
          }}>
              Seeds realistic PHCs, CHCs, medicine stocks, and patients.
            </div>
          </div>
          <button type="button" onClick={handleSeed} disabled={seedLoading} className="btn-secondary" style={{
          padding: '7px 14px',
          fontSize: '0.8rem'
        }}>
            <Sparkles size={14} color="#059669" />
            <span>{seedLoading ? 'Seeding...' : 'Seed Database'}</span>
          </button>
        </div>

        {/* Feedback alert */}
        {feedback.message && <div style={{
        marginTop: '14px',
        padding: '10px 14px',
        fontSize: '0.82rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>}

        <div style={{
        marginTop: '18px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>;
}