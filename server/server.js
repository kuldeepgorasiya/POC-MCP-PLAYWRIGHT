import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";


// Basic orchestrator that spawns per-session containers
const app = express();
app.use(cors());
app.use(express.json());


// Structured users (username/password)
const USERS = [
    { username: "admin", password: "admin123" },
    { username: "kuldeep", password: "password123" },
    { username: "test", password: "1234" }
];


// Sessions: maps username -> session info
const sessions = new Map();
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
let nextVncPort = 6901; // dynamic allocation starting
let nextMcpPort = 8831 + 100; // offset for MCP inside container mapping


// Helper to run shell commands (returns child process)
function runCommand(cmd, args = []) {
    console.log("CMD:", cmd, args.join(" "));
    return spawn(cmd, args);
}


function findUser(username, password) {
    return USERS.find(u => u.username === username && u.password === password);
}


async function createContainer(username) {
    const sessionId = uuidv4();
    const vncPortHost = nextVncPort++;
    const mcpPortHost = nextMcpPort++;
    const containerName = `mcp_${username}_${sessionId.slice(0, 6)}`;


    const dockerArgs = [
        '-p', `${mcpPortHost}:8831`,
        'mcp-session-image:latest'
    ];


    // Spawn docker run
    const proc = runCommand('docker', dockerArgs);
    proc.stdout?.on('data', d => console.log(d.toString()));
    proc.stderr?.on('data', d => console.error(d.toString()));


    // Wait for a short time to let container start (simple approach)
    await new Promise(r => setTimeout(r, 3000));


    const vncUrl = `http://localhost:${vncPortHost}/vnc.html?host=localhost&port=${vncPortHost}`;
    const mcpUrl = `http://localhost:${mcpPortHost}`;


    const session = {
        username,
        sessionId,
        containerName,
        vncPortHost,
        mcpPortHost,
        vncUrl,
        mcpUrl,
        createdAt: Date.now(),
        lastActive: Date.now()
    };
    sessions.set(username, session);
    console.log(`Created session ${sessionId} for ${username} -> vnc ${vncUrl} mcp ${mcpUrl}`);
    return session;
}


async function getOrCreateSession(username) {
    const s = sessions.get(username);
    if (s && (Date.now() - s.lastActive) < SESSION_TIMEOUT) {
        s.lastActive = Date.now();
        console.log(`Reusing session for ${username}`);
        return s;
    }
    if (s) {
        await destroySession(s);
    }
    return createContainer(username);
}

async function destroySession(session) {
    try {
        console.log(`Stopping container ${session.containerName}`);
        runCommand('docker', ['stop', session.containerName]);
    } catch (e) {
        console.error('Error stopping container', e);
    }
    sessions.delete(session.username);
}


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });


    const user = findUser(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });


    try {
        const session = await getOrCreateSession(username);
        res.json({ sessionId: session.sessionId, vncUrl: session.vncUrl, mcpUrl: session.mcpUrl });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create session' });
    }
});


app.post('/logout', async (req, res) => {
    const { username } = req.body;
    const s = sessions.get(username);
    if (s) {
        await destroySession(s);
    }
    res.json({ ok: true });
});


app.post('/chat', async (req, res) => {
    const { username, text } = req.body;
    const s = sessions.get(username);
    if (!s) return res.status(401).json({ error: 'Session expired or not found' });


    // Proxy to the session's MCP endpoint - simple POST to /chat on container
    try {
        const resp = await fetch(`${s.mcpUrl}/chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, text })
        });
        const data = await resp.json();
        s.lastActive = Date.now();
        res.json(data);
    } catch (e) {
        console.error('Error proxying chat', e);
        res.status(500).json({ error: 'Chat proxy failed' });
    }
});


app.get('/history/:username', async (req, res) => {
    const username = req.params.username;
    const s = sessions.get(username);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    try {
        const resp = await fetch(`${s.mcpUrl}/history/${username}`);
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});


// Cleanup loop
setInterval(() => {
    const now = Date.now();
    for (const s of sessions.values()) {
        if ((now - s.lastActive) > SESSION_TIMEOUT) {
            console.log('Session expired:', s.username);
            destroySession(s);
        }
    }
}, 60_000);


app.listen(8080, () => console.log('Orchestrator listening on 8080'));