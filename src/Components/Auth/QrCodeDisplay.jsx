import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function QrCodeDisplay({ backendUrl }) {
    if (!backendUrl) return <p>Loading QR code...</p>;

    return (
        <div style={{ display: "flex", flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
            <h3>Scan the QR Code</h3>
            {/* Renders the URL received from the backend as a QR code */}
            <QRCodeSVG
                value={backendUrl}
                size={200}
                level={"H"} // Error correction level (L, M, Q, H)
                includeMargin={true}
            />
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', wordWrap: 'break-word', width: '80%' }}>{backendUrl}</p>
        </div>
    );
}

export default QrCodeDisplay;