import React, { useState } from 'react'
import Login from './Login'
import VncView from './VncView'
import Chat from './Chat'


export default function App() {
    const [session, setSession] = useState(null)


    if (!session) return <Login onLogin={setSession} />


    return (
        <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: '70%' }}>
                <VncView vncUrl={session.vncUrl} />
            </div>
            <div style={{ width: '30%' }}>
                <Chat user={session} onLogout={() => setSession(null)} />
            </div>
        </div>
    )
}