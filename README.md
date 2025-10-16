# MCP Multi-User VNC Project


## Overview
This project creates per-user Docker containers running Playwright + MCP + Xvfb + x11vnc + noVNC. The orchestrator (server) validates login credentials, spawns containers for sessions, returns a noVNC URL, and routes chat calls to the session's MCP endpoint.


## Run locally
1. Build and start orchestrator:


```bash
# from repo root
docker compose build
docker compose up -d"# POC-MCP-PLAYWRIGHT" 
