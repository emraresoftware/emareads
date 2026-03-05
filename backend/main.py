"""
Emare Ads Backend - Main FastAPI Application
Merkezi yönetim sistemi için backend API
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import asyncio
import logging
from datetime import datetime
import json

from models import User, ScrapedPage, Screenshot, ExtensionConfig, RemoteCommand
from database import engine, Base, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Emare Ads Backend",
    description="Merkezi yönetim ve senkronizasyon API'si",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da spesifik origin'ler kullan
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected")

    async def send_command(self, user_id: str, command: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(command)
            return True
        return False

manager = ConnectionManager()

# Create tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

# Health check
@app.get("/")
async def root():
    return {
        "service": "Emare Ads Backend",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# User management
@app.post("/api/users")
async def create_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Create or get user"""
    result = await db.execute(select(User).where(User.user_id == user_id))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        return {"user": existing_user, "created": False}
    
    user = User(user_id=user_id)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {"user": user, "created": True}

# Scraping
@app.post("/api/scrape")
async def save_scrape(data: dict, db: AsyncSession = Depends(get_db)):
    """Save scraped page data"""
    scrape = ScrapedPage(
        user_id=data.get("user_id", "anonymous"),
        url=data.get("url"),
        title=data.get("title"),
        content=data.get("content"),
        html=data.get("html"),
        page_metadata=json.dumps(data.get("metadata", {}))
    )
    
    db.add(scrape)
    await db.commit()
    await db.refresh(scrape)
    
    logger.info(f"Saved scrape: {scrape.url}")
    return {"success": True, "id": scrape.id}

@app.get("/api/scrape")
async def get_scrapes(
    user_id: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get scraped pages"""
    query = select(ScrapedPage).order_by(ScrapedPage.created_at.desc()).limit(limit)
    
    if user_id:
        query = query.where(ScrapedPage.user_id == user_id)
    
    result = await db.execute(query)
    scrapes = result.scalars().all()
    
    return {"scrapes": scrapes, "count": len(scrapes)}

# Screenshots
@app.post("/api/screenshot")
async def save_screenshot(data: dict, db: AsyncSession = Depends(get_db)):
    """Save screenshot"""
    screenshot = Screenshot(
        user_id=data.get("user_id", "anonymous"),
        url=data.get("url"),
        data_url=data.get("dataUrl")
    )
    
    db.add(screenshot)
    await db.commit()
    await db.refresh(screenshot)
    
    logger.info(f"Saved screenshot: {screenshot.url}")
    return {"success": True, "id": screenshot.id}

@app.get("/api/screenshot")
async def get_screenshots(
    user_id: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get screenshots"""
    query = select(Screenshot).order_by(Screenshot.created_at.desc()).limit(limit)
    
    if user_id:
        query = query.where(Screenshot.user_id == user_id)
    
    result = await db.execute(query)
    screenshots = result.scalars().all()
    
    return {"screenshots": screenshots, "count": len(screenshots)}

# Config sync
@app.get("/api/sync")
async def sync_config(
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get user config for sync"""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    result = await db.execute(
        select(ExtensionConfig).where(ExtensionConfig.user_id == user_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        # Return default config
        return {
            "features": {
                "adBlocker": True,
                "trackerBlocker": True,
                "screenshot": True
            }
        }
    
    return json.loads(config.config_json)

@app.post("/api/sync")
async def save_config(data: dict, db: AsyncSession = Depends(get_db)):
    """Save user config"""
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    result = await db.execute(
        select(ExtensionConfig).where(ExtensionConfig.user_id == user_id)
    )
    config = result.scalar_one_or_none()
    
    if config:
        config.config_json = json.dumps(data.get("config", {}))
    else:
        config = ExtensionConfig(
            user_id=user_id,
            config_json=json.dumps(data.get("config", {}))
        )
        db.add(config)
    
    await db.commit()
    return {"success": True}

# Remote commands
@app.post("/api/command")
async def send_remote_command(command: dict):
    """Send remote command to extension"""
    user_id = command.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    remote_command = {
        "id": f"cmd-{datetime.now().timestamp()}",
        "command": command.get("command"),
        "params": command.get("params", {}),
        "timestamp": datetime.now().isoformat()
    }
    
    success = await manager.send_command(user_id, remote_command)
    
    if not success:
        raise HTTPException(status_code=404, detail="User not connected")
    
    logger.info(f"Sent command to {user_id}: {command.get('command')}")
    return {"success": True, "command": remote_command}

@app.get("/api/commands")
async def get_commands(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get pending commands for user"""
    query = select(RemoteCommand).where(
        RemoteCommand.user_id == user_id,
        RemoteCommand.executed_at == None
    ).order_by(RemoteCommand.created_at)
    
    result = await db.execute(query)
    commands = result.scalars().all()
    
    return {"commands": commands, "count": len(commands)}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, userId: str = "anonymous"):
    await manager.connect(userId, websocket)
    
    try:
        while True:
            # Receive command results from extension
            data = await websocket.receive_json()
            logger.info(f"Received from {userId}: {data}")
            
            # Process command result
            command_id = data.get("commandId")
            result = data.get("result")
            
            # Save to database or process
            logger.info(f"Command {command_id} result: {result}")
            
    except WebSocketDisconnect:
        manager.disconnect(userId)
        logger.info(f"User {userId} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(userId)

# Stats
@app.get("/api/stats")
async def get_stats(
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get user statistics"""
    from sqlalchemy import func
    
    scrape_count_query = select(func.count(ScrapedPage.id))
    screenshot_count_query = select(func.count(Screenshot.id))
    
    if user_id:
        scrape_count_query = scrape_count_query.where(ScrapedPage.user_id == user_id)
        screenshot_count_query = screenshot_count_query.where(Screenshot.user_id == user_id)
    
    scrape_count = (await db.execute(scrape_count_query)).scalar()
    screenshot_count = (await db.execute(screenshot_count_query)).scalar()
    
    return {
        "scrapes": scrape_count,
        "screenshots": screenshot_count,
        "active_users": len(manager.active_connections)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
