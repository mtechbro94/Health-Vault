import React, { useState, useRef } from 'react';
import { addMedicalRecord } from '../utils/api';
import { formatDate, getFileIcon, getFileType, fileToBase64 } from '../utils/helpers';

const MedicalRecords = ({ patient, records, onUpdate, canUpload, uploaderType = 'patient', uploaderName = 'You' }) => {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Please upload a PDF or image file (JPG, PNG, GIF, WebP)' });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'File size must be less than 5MB' });
            return;
        }

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const fileData = await fileToBase64(file);

            await addMedicalRecord({
                patientId: patient.patientId,
                fileName: file.name,
                fileData,
                fileType: getFileType(file.name),
                uploadedBy: patient.patientId,
                uploadedByType: uploaderType,
                uploadedByName: uploaderName,
                uploadDate: new Date().toISOString()
            });

            setMessage({ type: 'success', text: 'Medical record uploaded successfully!' });
            if (onUpdate) onUpdate();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload file. Please try again.' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const openFile = (record) => {
        // Create a new window/tab with the file
        const newWindow = window.open();
        if (record.fileType === 'pdf') {
            newWindow.document.write(`
        <html>
          <head><title>${record.fileName}</title></head>
          <body style="margin:0">
            <embed src="${record.fileData}" type="application/pdf" width="100%" height="100%">
          </body>
        </html>
      `);
        } else {
            newWindow.document.write(`
        <html>
          <head><title>${record.fileName}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1f2937">
            <img src="${record.fileData}" style="max-width:100%;max-height:100vh" alt="${record.fileName}">
          </body>
        </html>
      `);
        }
    };

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title">📁 Medical Records</h2>
                <span className="badge badge-primary">{records.length} Records</span>
            </div>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
                    <span>{message.text}</span>
                </div>
            )}

            {/* Upload Section */}
            {canUpload && (
                <div
                    className="file-upload"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ marginBottom: '2rem' }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                    <div className="file-upload-icon">📤</div>
                    <div className="file-upload-text">
                        {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </div>
                    <div className="file-upload-hint">
                        PDF or Images (JPG, PNG, GIF, WebP) • Max 5MB
                    </div>
                </div>
            )}

            {/* Records List */}
            {records.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <div className="empty-state-text">No medical records yet</div>
                    <div className="empty-state-subtext">
                        {canUpload
                            ? 'Upload your first medical document to get started'
                            : 'No records have been uploaded for this patient'}
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Upload Date</th>
                                <th>Uploaded By</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(record => (
                                <tr key={record.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{getFileIcon(record.fileType)}</span>
                                            <div>
                                                <div style={{ fontWeight: 500, color: 'white' }}>{record.fileName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                                                    {record.fileType}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{formatDate(record.uploadDate)}</td>
                                    <td>
                                        <span className={`badge ${record.uploadedByType === 'patient' ? 'badge-primary' : 'badge-purple'}`}>
                                            {record.uploadedByType === 'patient' ? '👤 Patient' : '🏥 Hospital'}
                                        </span>
                                        {record.uploadedByType === 'hospital' && record.uploadedByName && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                                {record.uploadedByName}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openFile(record)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MedicalRecords;
