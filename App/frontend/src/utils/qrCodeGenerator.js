// QR Code data generator for trolley labels
// This utility helps generate QR code data for printing on trolley labels

export const generateQRCodeData = (trolleyId, baseUrl = 'http://localhost:3000') => {
  // QR code can contain:
  // 1. Full URL with parameter
  // 2. Just the trolley ID
  
  // Full URL format (recommended for deployment)
  const fullUrl = `${baseUrl}/connect?trolley_id=${trolleyId}`;
  
  return {
    trolleyId,
    qrCodeData: fullUrl,
    alternativeData: trolleyId, // Fallback if URL doesn't work
    instructions: {
      format: 'URL',
      content: fullUrl,
      description: 'Full URL that opens the app with trolley connected',
      alternativeFormat: 'Plain Text',
      alternativeContent: trolleyId,
      alternativeDescription: 'Just the trolley ID for manual entry'
    }
  };
};

// Example usage:
// const qrData = generateQRCodeData('TROLLEY_01', 'https://smart-trolley.app');
// console.log(qrData.qrCodeData); // Full URL for QR code
// console.log(qrData.alternativeData); // Fallback ID

// For generating actual QR code images, use a library like:
// - qrcode.react (React component)
// - qrcode (Node.js backend)
// - Online tools like qr-server.com

export const getQRCodeImageUrl = (data) => {
  // Generate QR code image URL using qr-server.com
  // Encode the data properly
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
};

export default {
  generateQRCodeData,
  getQRCodeImageUrl,
};
