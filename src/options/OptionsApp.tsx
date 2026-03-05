import React, { useEffect, useState } from 'react';
import { Save, Server, Key, Code, Download, Upload, Trash2, Database } from 'lucide-react';
import { storage, downloadFile } from '@shared/utils';
import { STORAGE_KEYS } from '@shared/constants';
import type { EmareConfig, CustomRule } from '@shared/types';

const OptionsApp: React.FC = () => {
  const [config, setConfig] = useState<EmareConfig | null>(null);
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [customCSS, setCustomCSS] = useState('');
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'backend' | 'rules' | 'css' | 'data'>('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const cfg = await storage.get<EmareConfig>(STORAGE_KEYS.CONFIG);
    const rulesData = await storage.get<CustomRule[]>(STORAGE_KEYS.RULES) || [];
    const css = await storage.get<string>(STORAGE_KEYS.CUSTOM_CSS) || '';
    
    setConfig(cfg);
    setRules(rulesData);
    setCustomCSS(css);
  };

  const saveSettings = async () => {
    if (!config) return;
    
    await storage.set(STORAGE_KEYS.CONFIG, config);
    await storage.set(STORAGE_KEYS.RULES, rules);
    await storage.set(STORAGE_KEYS.CUSTOM_CSS, customCSS);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateConfig = (key: string, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const addRule = () => {
    const newRule: CustomRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      enabled: true,
      pattern: '*://*.example.com/*',
      action: 'block'
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const deleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const exportData = async () => {
    const data = {
      config,
      rules,
      customCSS,
      exportedAt: new Date().toISOString()
    };
    
    await downloadFile(
      JSON.stringify(data, null, 2),
      `emare-ads-backup-${Date.now()}.json`,
      'application/json'
    );
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.config) setConfig(data.config);
      if (data.rules) setRules(data.rules);
      if (data.customCSS) setCustomCSS(data.customCSS);
      
      alert('✅ Data imported successfully!');
    };
    input.click();
  };

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
    
    await storage.clear();
    alert('✅ All data cleared!');
    window.location.reload();
  };

  if (!config) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="options-container">
      {/* Header */}
      <div className="options-header">
        <div className="header-content">
          <h1>⚙️ Emare Ads Settings</h1>
          <p>Configure your browser extension</p>
        </div>
        <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={saveSettings}>
          <Save size={18} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="options-layout">
        {/* Sidebar */}
        <div className="options-sidebar">
          <button 
            className={`sidebar-item ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSection('general')}
          >
            <Server size={18} />
            General
          </button>
          <button 
            className={`sidebar-item ${activeSection === 'backend' ? 'active' : ''}`}
            onClick={() => setActiveSection('backend')}
          >
            <Key size={18} />
            Backend API
          </button>
          <button 
            className={`sidebar-item ${activeSection === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveSection('rules')}
          >
            <Code size={18} />
            Custom Rules
          </button>
          <button 
            className={`sidebar-item ${activeSection === 'css' ? 'active' : ''}`}
            onClick={() => setActiveSection('css')}
          >
            <Code size={18} />
            Custom CSS
          </button>
          <button 
            className={`sidebar-item ${activeSection === 'data' ? 'active' : ''}`}
            onClick={() => setActiveSection('data')}
          >
            <Database size={18} />
            Data Management
          </button>
        </div>

        {/* Content */}
        <div className="options-content">
          {activeSection === 'general' && (
            <div className="section">
              <h2>General Settings</h2>
              
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={config.userId || ''}
                  onChange={(e) => updateConfig('userId', e.target.value)}
                  placeholder="Enter your user ID"
                />
                <span className="help-text">Used for backend sync and remote management</span>
              </div>

              <h3>Feature Toggles</h3>
              <div className="toggles-grid">
                {Object.entries(config.features).map(([key, value]) => (
                  <label key={key} className="toggle-label">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateConfig('features', {
                        ...config.features,
                        [key]: e.target.checked
                      })}
                    />
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'backend' && (
            <div className="section">
              <h2>Backend API Configuration</h2>
              
              <div className="form-group">
                <label>API URL</label>
                <input
                  type="url"
                  value={config.apiUrl}
                  onChange={(e) => updateConfig('apiUrl', e.target.value)}
                  placeholder="http://localhost:8000"
                />
              </div>

              <div className="form-group">
                <label>WebSocket URL</label>
                <input
                  type="url"
                  value={config.wsUrl}
                  onChange={(e) => updateConfig('wsUrl', e.target.value)}
                  placeholder="ws://localhost:8000/ws"
                />
              </div>

              <div className="form-group">
                <label>API Key</label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => updateConfig('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                />
              </div>

              <div className="alert alert-info">
                <strong>ℹ️ Info:</strong> Configure backend connection to enable remote management and data sync features.
              </div>
            </div>
          )}

          {activeSection === 'rules' && (
            <div className="section">
              <div className="section-header">
                <h2>Custom Rules</h2>
                <button className="add-btn" onClick={addRule}>+ Add Rule</button>
              </div>

              {rules.length === 0 ? (
                <div className="empty-state">
                  No custom rules yet. Click "Add Rule" to create one.
                </div>
              ) : (
                <div className="rules-list">
                  {rules.map((rule, index) => (
                    <div key={rule.id} className="rule-card">
                      <div className="rule-header">
                        <input
                          type="text"
                          value={rule.name}
                          onChange={(e) => updateRule(index, 'name', e.target.value)}
                          className="rule-name"
                        />
                        <label className="toggle-small">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(e) => updateRule(index, 'enabled', e.target.checked)}
                          />
                          <span>Enabled</span>
                        </label>
                        <button className="delete-btn" onClick={() => deleteRule(index)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="rule-body">
                        <input
                          type="text"
                          value={rule.pattern}
                          onChange={(e) => updateRule(index, 'pattern', e.target.value)}
                          placeholder="URL pattern (e.g., *://*.example.com/*)"
                          className="rule-pattern"
                        />
                        
                        <select
                          value={rule.action}
                          onChange={(e) => updateRule(index, 'action', e.target.value)}
                          className="rule-action"
                        >
                          <option value="block">Block</option>
                          <option value="redirect">Redirect</option>
                          <option value="modify">Modify</option>
                          <option value="inject">Inject</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'css' && (
            <div className="section">
              <h2>Custom CSS</h2>
              <p>Inject custom CSS into all pages</p>
              
              <textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder="/* Your custom CSS here */&#10;body {&#10;  background-color: #1a1a1a;&#10;}"
                className="css-editor"
                rows={20}
              />
              
              <div className="alert alert-warning">
                <strong>⚠️ Warning:</strong> Custom CSS will be injected into all websites. Use with caution.
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="section">
              <h2>Data Management</h2>
              
              <div className="data-actions">
                <button className="data-btn export" onClick={exportData}>
                  <Upload size={18} />
                  Export All Data
                </button>
                
                <button className="data-btn import" onClick={importData}>
                  <Download size={18} />
                  Import Data
                </button>
                
                <button className="data-btn clear" onClick={clearAllData}>
                  <Trash2 size={18} />
                  Clear All Data
                </button>
              </div>

              <div className="alert alert-info">
                Export your settings, rules, and custom CSS to a JSON file for backup or transfer.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptionsApp;
