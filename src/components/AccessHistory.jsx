import React from 'react';
import { formatDate } from '../utils/helpers';

const AccessHistory = ({ logs }) => {
    const getAccessIcon = (accessType) => {
        switch (accessType) {
            case 'hospital':
                return '🏥';
            case 'emergency_qr':
                return '🚨';
            default:
                return '👁️';
        }
    };

    const getAccessLabel = (accessType) => {
        switch (accessType) {
            case 'hospital':
                return 'Hospital Access';
            case 'emergency_qr':
                return 'Emergency QR Scan';
            default:
                return 'Unknown Access';
        }
    };

    const getAccessBadgeClass = (accessType) => {
        switch (accessType) {
            case 'hospital':
                return 'badge-purple';
            case 'emergency_qr':
                return 'badge-danger';
            default:
                return 'badge-primary';
        }
    };

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title">📋 Access History</h2>
                <span className="badge badge-primary">{logs.length} Events</span>
            </div>

            <p style={{ color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                Track when your health information was accessed by healthcare providers or via emergency QR scans.
            </p>

            {logs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔒</div>
                    <div className="empty-state-text">No access events yet</div>
                    <div className="empty-state-subtext">
                        Your access history will appear here when hospitals view your profile or your QR code is scanned.
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Accessed By</th>
                                <th>Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{getAccessIcon(log.accessType)}</span>
                                            <span className={`badge ${getAccessBadgeClass(log.accessType)}`}>
                                                {getAccessLabel(log.accessType)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        {log.accessedByName || (log.accessType === 'emergency_qr' ? 'Anonymous Scanner' : 'Unknown')}
                                    </td>
                                    <td>{formatDate(log.accessDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AccessHistory;
