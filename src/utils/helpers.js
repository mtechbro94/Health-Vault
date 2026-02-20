// Helper utility functions

// Format date for display
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// Format date only (no time)
export const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

// Get file type from filename
export const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const pdfExtensions = ['pdf'];

    if (imageExtensions.includes(extension)) return 'image';
    if (pdfExtensions.includes(extension)) return 'pdf';
    return 'document';
};

// Convert file to base64
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// Get file icon based on type
export const getFileIcon = (fileType) => {
    switch (fileType) {
        case 'image':
            return '🖼️';
        case 'pdf':
            return '📄';
        default:
            return '📁';
    }
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Blood group options
export const BLOOD_GROUPS = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

// Get initials from email
export const getInitials = (email) => {
    if (!email) return '?';
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Validate email format
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Generate emergency page URL
export const getEmergencyUrl = (patientId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/emergency/${patientId}`;
};
