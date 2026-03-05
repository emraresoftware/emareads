# 📢 Emare Ads — Çok Yetenekli Tarayıcı Eklentisi

> 🔗 **Ortak Hafıza:** [`EMARE_ORTAK_HAFIZA.md`](/Users/emre/Desktop/Emare/EMARE_ORTAK_HAFIZA.md) — Tüm Emare ekosistemi, sunucu bilgileri, standartlar ve proje envanteri için bak.

## 📋 Proje Kimliği

- **Proje Adı:** Emare Ads
- **Kategori:** Tool / Browser Extension
- **Durum:** 🔵 Development (Planlama Aşaması)
- **Kod Deposu:** `/Users/emre/Desktop/Emare/emareads`
- **İkon:** 📢
- **Renk Kodu:** `#f59e0b`

## 🎯 Amaç ve Vizyon

Çok yetenekli tarayıcı eklentisi — web'de güçlü özellikler sunan kapsamlı browser extension.

### Olası Özellikler (Planlama):
- 🔍 **Akıllı Analiz:** Sayfa içeriği analizi ve öneriler
- 📊 **Data Collection:** Web verilerini topla ve işle
- 🤖 **AI Entegrasyonu:** Sayfa içi AI asistan (Emare AI ile entegre)
- 🛡️ **Güvenlik:** Reklam engelleme, tracker engelleme
- 📋 **Productivity:** Not alma, yer imi yönetimi, otomatik form doldurma
- 🎨 **Customization:** Dark mode, tema değiştirme, UI modifikasyonu
- 📡 **Sync:** Tüm cihazlarda senkronizasyon (cloud backend)

## 🏗️ Teknoloji Stack (Önerilen)

### Frontend (Extension)
- **Manifest V3** (Chrome Extension API - v2 deprecated)
- **TypeScript** (type safety)
- **React** veya **Vue 3** (popup ve options UI)
- **Tailwind CSS** (styling)
- **Webpack** veya **Vite** (bundling)

### Extension Components
```
emareads/
├── manifest.json          # Extension manifest (v3)
├── background/
│   └── service-worker.ts  # Background service worker
├── content/
│   └── content-script.ts  # Page injection script
├── popup/
│   ├── popup.html
│   ├── popup.tsx          # React/Vue popup
│   └── popup.css
├── options/
│   ├── options.html
│   └── options.tsx        # Settings page
├── assets/
│   ├── icons/
│   └── images/
└── utils/
    ├── storage.ts         # Chrome storage API wrapper
    ├── messaging.ts       # Message passing
    └── api.ts             # Backend API calls
```

### Backend (Sync & Data Storage)
- **FastAPI** (Python) veya **Node.js + Express**
- **PostgreSQL** veya **MongoDB** (user data, settings sync)
- **Redis** (session, cache)
- **WebSocket** (real-time updates)

## 🔌 Diğer Projelerle Entegrasyon

### → Emare AI (emareai)
- Extension içinden AI API'sine istek gönder
- Sayfa içeriğini AI'a analiz ettir
- Akıllı öneriler ve özetleme

### → Emare Asistan
- WhatsApp/Telegram entegrasyonu (web'den mesaj gönder)
- Notification sync (browser → WhatsApp)

### → EmareCloud
- User data backup (cloud storage)
- Multi-device sync

### → Emare Ulak
- İki browser extension birleşebilir (Ulak chat monitor, Ads general purpose)
- Ortak altyapı kullanımı

## 📦 Kurulum ve Geliştirme

```bash
# Proje kurulumu
cd /Users/emre/Desktop/Emare/emareads
npm init -y
npm install --save-dev typescript webpack webpack-cli @types/chrome

# Development build
npm run dev

# Production build
npm run build

# Chrome'a yükleme
# 1. chrome://extensions/ aç
# 2. "Developer mode" aktif et
# 3. "Load unpacked" tıkla
# 4. dist/ klasörünü seç
```

## 🛠️ Manifest V3 Örnek

```json
{
  "manifest_version": 3,
  "name": "Emare Ads",
  "version": "1.0.0",
  "description": "Çok yetenekli tarayıcı eklentisi",
  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "http://*/*",
    "https://*/*"
  ],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon16.png",
      "48": "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    }
  },
  "options_page": "options/options.html",
  "web_accessible_resources": [
    {
      "resources": ["assets/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

## 🔐 Güvenlik

- **Content Security Policy (CSP):** Manifest V3'te zorunlu
- **API Key Management:** Extension'da API key saklamayın, backend üzerinden
- **Permissions:** Minimum gerekli izinler
- **Code Injection:** XSS'e karşı sanitize (DOMPurify)

## 📊 Chrome Web Store Yayınlama

1. **Developer Account:** $5 one-time fee
2. **Store Listing:** İkon, screenshot, açıklama
3. **Privacy Policy:** Zorunlu (data collection varsa)
4. **Review:** Google 1-3 gün içinde onaylar

## 🎯 Roadmap

### Phase 1 (Q1 2026)
- [ ] Proje setup (TypeScript + React + Webpack)
- [ ] Manifest V3 boilerplate
- [ ] Basit popup UI (hello world)
- [ ] Content script injection testi

### Phase 2 (Q2 2026)
- [ ] Backend API (FastAPI + PostgreSQL)
- [ ] User authentication (JWT)
- [ ] Settings sync (chrome.storage.sync)
- [ ] 3-5 core feature implementasyonu

### Phase 3 (Q3 2026)
- [ ] Emare AI entegrasyonu
- [ ] Beta test (50 kullanıcı)
- [ ] Performance optimization
- [ ] Chrome Web Store submit

### Phase 4 (Q4 2026)
- [ ] Production release
- [ ] Firefox, Edge, Safari extension'ları
- [ ] Premium features (ücretli plan)
- [ ] 1000+ active users

## 📚 Kaynaklar

- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration:** https://developer.chrome.com/docs/extensions/mv3/intro/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **React:** https://react.dev/

## 🔄 Son Güncelleme

**Tarih:** 4 Mart 2026  
**Durum:** Planlama aşaması, proje setup başlayacak  
**Next Action:** Teknoloji stack finalize et, boilerplate oluştur

---

**Not:** emareeklenti klasörü bu proje ile birleştirilecek (duplicate).
