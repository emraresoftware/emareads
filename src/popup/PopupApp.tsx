import React, { useEffect, useState } from 'react';
import { 
  Activity, Settings, Download, Camera, FileText, 
  Zap, Globe, Shield, Code, Eye, Cookie, Network,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { sendMessage, storage, getCurrentTab } from '@shared/utils';
import { STORAGE_KEYS } from '@shared/constants';
import type { EmareConfig } from '@shared/types';

const PopupApp: React.FC = () => {
  const [config, setConfig] = useState<EmareConfig | null>(null);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [stats, setStats] = useState({
    scraped: 0,
    screenshots: 0,
    blocked: 0
  });
  const [activeTab, setActiveTab] = useState<'features' | 'actions' | 'stats'>('features');

  useEffect(() => {
    loadConfig();
    loadStats();
    loadCurrentTab();
  }, []);

  const loadConfig = async () => {
    const cfg = await storage.get<EmareConfig>(STORAGE_KEYS.CONFIG);
    setConfig(cfg);
  };

  const loadStats = async () => {
    const scraped = await storage.get(STORAGE_KEYS.SCRAPED_DATA) || [];
    const screenshots = await storage.get(STORAGE_KEYS.SCREENSHOTS) || [];
    
    setStats({
      scraped: scraped.length,
      screenshots: screenshots.length,
      blocked: 0
    });
  };

  const loadCurrentTab = async () => {
    const tab = await getCurrentTab();
    setCurrentTab(tab);
  };

  const toggleFeature = async (feature: keyof typeof config.features) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      features: {
        ...config.features,
        [feature]: !config.features[feature]
      }
    };
    
    await storage.set(STORAGE_KEYS.CONFIG, newConfig);
    setConfig(newConfig);
  };

  const handleScrapePage = async () => {
    try {
      const result = await sendMessage({ type: 'SCRAPE_PAGE' });
      if (result.success) {
        alert('✅ Page scraped successfully!');
        loadStats();
      }
    } catch (error) {
      alert('❌ Failed to scrape page');
    }
  };

  const handleScreenshot = async () => {
    try {
      const result = await sendMessage({ type: 'TAKE_SCREENSHOT' });
      if (result.success) {
        alert('✅ Screenshot captured!');
        loadStats();
      }
    } catch (error) {
      alert('❌ Failed to capture screenshot');
    }
  };

  const handleSync = async () => {
    try {
      const result = await sendMessage({ type: 'SYNC_SETTINGS' });
      if (result.success) {
        alert('✅ Synced with backend!');
        loadConfig();
      } else {
        alert('⚠️ Sync failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Sync error');
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (!config) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="header-top">
          <h1>
            <span className="logo">📢</span>
            Emare Ads
          </h1>
          <button className="icon-btn" onClick={openOptions}>
            <Settings size={18} />
          </button>
        </div>
        
        {currentTab && (
          <div className="current-page">
            <Globe size={14} />
            <span className="url">{new URL(currentTab.url || '').hostname}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <Zap size={16} />
          Features
        </button>
        <button 
          className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          <Activity size={16} />
          Actions
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <CheckCircle size={16} />
          Stats
        </button>
      </div>

      {/* Content */}
      <div className="popup-content">
        {activeTab === 'features' && (
          <div className="features-grid">
            <FeatureToggle
              icon={<Shield size={18} />}
              label="Ad Blocker"
              enabled={config.features.adBlocker}
              onToggle={() => toggleFeature('adBlocker')}
            />
            <FeatureToggle
              icon={<Eye size={18} />}
              label="Tracker Blocker"
              enabled={config.features.trackerBlocker}
              onToggle={() => toggleFeature('trackerBlocker')}
            />
            <FeatureToggle
              icon={<FileText size={18} />}
              label="Web Scraping"
              enabled={config.features.webScraping}
              onToggle={() => toggleFeature('webScraping')}
            />
            <FeatureToggle
              icon={<Camera size={18} />}
              label="Screenshot"
              enabled={config.features.screenshot}
              onToggle={() => toggleFeature('screenshot')}
            />
            <FeatureToggle
              icon={<Code size={18} />}
              label="Custom CSS"
              enabled={config.features.customCSS}
              onToggle={() => toggleFeature('customCSS')}
            />
            <FeatureToggle
              icon={<Cookie size={18} />}
              label="Cookie Manager"
              enabled={config.features.cookieManager}
              onToggle={() => toggleFeature('cookieManager')}
            />
            <FeatureToggle
              icon={<Network size={18} />}
              label="Network Interceptor"
              enabled={config.features.networkInterceptor}
              onToggle={() => toggleFeature('networkInterceptor')}
            />
            <FeatureToggle
              icon={<Zap size={18} />}
              label="AI Assistant"
              enabled={config.features.aiAssistant}
              onToggle={() => toggleFeature('aiAssistant')}
            />
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="actions-list">
            <ActionButton
              icon={<FileText size={18} />}
              label="Scrape Current Page"
              onClick={handleScrapePage}
            />
            <ActionButton
              icon={<Camera size={18} />}
              label="Take Screenshot"
              onClick={handleScreenshot}
            />
            <ActionButton
              icon={<Download size={18} />}
              label="Sync with Backend"
              onClick={handleSync}
            />
            <ActionButton
              icon={<Cookie size={18} />}
              label="Export Cookies"
              onClick={() => alert('Cookie export feature coming soon')}
            />
            <ActionButton
              icon={<Code size={18} />}
              label="Inject Custom CSS"
              onClick={() => alert('Navigate to Options to add custom CSS')}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-grid">
            <StatCard
              icon={<FileText size={24} />}
              label="Pages Scraped"
              value={stats.scraped}
              color="#10b981"
            />
            <StatCard
              icon={<Camera size={24} />}
              label="Screenshots"
              value={stats.screenshots}
              color="#3b82f6"
            />
            <StatCard
              icon={<Shield size={24} />}
              label="Ads Blocked"
              value={stats.blocked}
              color="#f59e0b"
            />
            <StatCard
              icon={<Clock size={24} />}
              label="Session Time"
              value="2h 15m"
              color="#8b5cf6"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="popup-footer">
        <div className="status">
          <div className="status-dot active"></div>
          <span>Connected to backend</span>
        </div>
      </div>
    </div>
  );
};

interface FeatureToggleProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({ icon, label, enabled, onToggle }) => {
  return (
    <div className={`feature-toggle ${enabled ? 'enabled' : ''}`} onClick={onToggle}>
      <div className="feature-icon">{icon}</div>
      <div className="feature-label">{label}</div>
      <div className={`toggle-switch ${enabled ? 'on' : 'off'}`}>
        <div className="toggle-knob"></div>
      </div>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick }) => {
  return (
    <button className="action-button" onClick={onClick}>
      <div className="action-icon">{icon}</div>
      <span>{label}</span>
    </button>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

export default PopupApp;
