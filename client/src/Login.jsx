import React, { useState } from 'react'


export default function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')


    async function submit(e) {
        e.preventDefault()
        setError('')
        try {
            const res = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const data = await res.json()
            if (!res.ok) return setError(data.error || 'Invalid credentials')
            onLogin({ username, sessionId: data.sessionId, vncUrl: data.vncUrl, mcpUrl: data.mcpUrl })
        } catch (e) {
            setError('Network error, please try again')
        }
    }


    return (
        <form onSubmit={submit} style={{ width: 360, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ textAlign: 'center' }}>Login</h3>
            <input
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: 8, marginBottom: 10 }}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: 8, marginBottom: 10 }}
            />
            {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
            <button type="submit" style={{ width: '100%', padding: 10 }}>Login</button>
        </form>
    )
}