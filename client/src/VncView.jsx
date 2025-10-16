import React from 'react'


export default function VncView({ vncUrl }) {
    if (!vncUrl) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <h4>No active VNC session</h4>
            </div>
        )
    }


    return (
        <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden', height: '90vh' }}>
            <iframe
                src={vncUrl}
                title="VNC Browser Session"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="clipboard-read; clipboard-write"
            />
        </div>
    )
}