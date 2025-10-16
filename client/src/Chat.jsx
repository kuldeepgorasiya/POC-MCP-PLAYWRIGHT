import React, { useState, useEffect } from 'react'

export default function Chat({ user, onLogout }) {
    const [text, setText] = useState('')
    const [messages, setMessages] = useState([])

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`http://localhost:8080/history/${user.username}`)
                const data = await res.json()
                if (Array.isArray(data)) setMessages(data)
                else if (data.history) setMessages(data.history)
            } catch (err) {
                console.warn('No history found')
            }
        }
        fetchHistory()
    }, [user.username])

    async function sendMessage(e) {
        e.preventDefault()
        if (!text.trim()) return


        const body = { username: user.username, text }
        try {
            const res = await fetch('http://localhost:8080/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })


            if (res.status === 401) {
                alert('Session expired, please log in again.')
                return onLogout()
            }


            const data = await res.json()
            setMessages(prev => [...prev, { from: 'You', text }, { from: 'Bot', text: data.reply || JSON.stringify(data) }])
            setText('')
        } catch (e) {
            console.error('Error sending chat message', e)
        }
    }


    async function handleLogout() {
        await fetch('http://localhost:8080/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username })
        })
        onLogout()
    }


    return (
        <div style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>{user.username}</h4>
                <button onClick={handleLogout}>Logout</button>
            </div>


            <div style={{ height: '70vh', overflowY: 'auto', margin: '12px 0', background: '#f9f9f9', padding: 8 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                        <strong>{m.from}:</strong> {m.text}
                    </div>
                ))}
            </div>


            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: 8 }}
                />
                <button type="submit">Send</button>
            </form>
        </div>
    )
}