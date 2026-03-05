"""
Database models for Emare Ads Backend
"""

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), onupdate=func.now())

class ScrapedPage(Base):
    __tablename__ = "scraped_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), index=True, nullable=False)
    url = Column(Text, nullable=False)
    title = Column(Text)
    content = Column(Text)
    html = Column(Text)
    page_metadata = Column("metadata", Text)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Screenshot(Base):
    __tablename__ = "screenshots"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), index=True, nullable=False)
    url = Column(Text, nullable=False)
    data_url = Column(Text, nullable=False)  # base64 encoded image
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExtensionConfig(Base):
    __tablename__ = "extension_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), unique=True, index=True, nullable=False)
    config_json = Column(Text, nullable=False)  # JSON string
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class RemoteCommand(Base):
    __tablename__ = "remote_commands"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), index=True, nullable=False)
    command = Column(String(255), nullable=False)
    params = Column(Text)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    executed_at = Column(DateTime(timezone=True), nullable=True)
    result = Column(Text)  # JSON string
