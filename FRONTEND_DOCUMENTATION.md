# REACT WEB FRONTEND - COMPREHENSIVE DOCUMENTATION

**Project:** AssurGo Insurance Portal  
**Tech Stack:** React 18.3 + Vite + React Router v7 + i18next  
**Workspace:** `front-end/src`  

---

## 1. PROJECT STRUCTURE & FILE ORGANIZATION

```
src/
├── App.jsx                    # Main routing & layout orchestration
├── main.jsx                   # Entry point (Vite)
├── i18n.js                    # i18next config (French/English)
├── styles.css                 # Global CSS + theme variables
│
├── pages/
│   ├── AdminPage.jsx          # Admin dashboard (multi-section)
│   ├── AgentPage.jsx          # Agent portal
│   ├── AgencesPage.jsx        # Agency listing & filtering
│   ├── HomePage.jsx           # Landing page
│   ├── LoginPage.jsx          # Auth login
│   ├── RegisterPage.jsx       # Auth signup
│   ├── ProfilePage.jsx        # User profile & contracts
│   ├── ChatPage.jsx           # Messaging interface
│   ├── SinistreTypePage.jsx   # Claim type detail pages
│   ├── AssistancePage.css     # Assistance info
│   ├── ContactPage.css        # Contact form
│   ├── BulletinPage.css       # Newsletter/Bulletin
│   ├── DeclarationSinistrePage.jsx # Claim declaration
│   ├── ContractRequiredPage.jsx    # Access restriction page
│   │
│   # Product Pages (using shared ProductPages.css)
│   ├── MaVoiturePage.jsx      # Car insurance product
│   ├── MonHabitationPage.jsx  # Home insurance product
│   ├── MonVoyagePage.jsx      # Travel insurance product
│   ├── MaPrevoyancePage.jsx   # Life insurance product
│   │
│   ├── AgencesPage.css        # Agency page styles
│   ├── ProductPages.css       # Shared product page styles
│   └── [PageName].css         # Individual page stylesheets
│
├── components/
│   ├── ChatWidget.jsx         # Floating AI chat assistant
│   ├── ChatWidget.css         # Chat widget styles
│   ├── SinistreFixedCta.jsx   # Fixed CTA button
│   
├── hooks/
│   └── [custom hooks - empty currently]
│
├── utils/
│   ├── chatUnread.js          # Unread message counting logic
│   ├── phoneNumberValidator.js # Phone validation (libphonenumber-js)
│   └── sinistreTypeMeta.js    # Claim type metadata & routing
│
├── locales/
│   ├── en.json               # English translations (complete)
│   └── fr.json               # French translations (complete)
│
├── api/                       # EMPTY - API calls are inline in components
│
└── assets/
    └── assurgo-logo_Version2.svg
```

---

## 2. ROUTING STRUCTURE

### Routes (React Router v7)

| Path | Component | Auth Required | Role | Purpose |
|------|-----------|---|------|---------|
| `/` | HomePage | No | All | Landing page with product showcase |
| `/ma-voiture` | MaVoiturePage | Conditional | User | Car insurance product page |
| `/mon-habitation` | MonHabitationPage | Conditional | User | Home insurance product page |
| `/mon-voyage` | MonVoyagePage | Conditional | User | Travel insurance product page |
| `/ma-prevoyance` | MaPrevoyancePage | Conditional | User | Life insurance product page |
| `/sinistre/:code` | SinistreTypePage | Conditional | User | Claim type detail page |
| `/declaration-sinistre` | DeclarationSinistrePage | Yes | User | Claim declaration form |
| `/assistance` | AssistancePage | No | All | Assistance/help page |
| `/agences` | AgencesPage | No | All | Agency finder & list |
| `/contact` | ContactPage | No | All | Contact form |
| `/bulletin` | BulletinPage | No | All | Bulletin/Newsletter |
| `/se-connecter` | LoginPage | No | All | Login |
| `/creer-compte` | RegisterPage | No | All | Registration |
| `/messagerie` | ChatPage | Yes | User | Messaging/Chat |
| `/profile` | ProfilePage | Yes | User | User profile |
| `/admin` | AdminPage | Yes | ADMIN | Admin dashboard |
| `/agent` | AgentPage | Yes | AGENT | Agent portal |

**Conditional Access:** Routes redirect to `ContractRequiredPage` if user doesn't have matching contract type.

---

## 3. ADMIN DASHBOARD (`AdminPage.jsx`)

### Dashboard Sections (via `activeAdminSection` state)

| Section | Key | Purpose |
|---------|-----|---------|
| Dashboard | `dashboard` | Overview with charts & statistics |
| Contracts | `contrats` | CRUD operations for contracts |
| Users | `utilisateurs` | User management |
| Sinistre Types | `sinistreTypes` | Claim type management |
| Publications | `publications` | News/bulletin management |
| Agencies | `agences` | Agency management |
| Documents | `documents` | Document/PDF management |
| Messages | `messages` | Contact form message replies |
| Profile | `profile` | Admin account settings |

### Admin Dashboard Forms

#### A. CONTRACT FORM (`emptyContratForm`)
```javascript
{
  nomAgence: '',           // String: Agency name
  cin: '',                 // String: 8 digits (validated)
  numeroContrat: '',       // String: Contract number (unique)
  typeContrat: '',         // String: Contract type
  dateDebutContrat: '',    // Date: Start date
  dateFinContrat: ''       // Date: End date
}
```
**Validation:** CIN = 8 digits exactly, Contract number must be unique

#### B. PUBLICATION FORM (`emptyPublicationForm`)
```javascript
{
  titreFr: '',             // String: French title
  titreEn: '',             // String: English title
  categorieFr: '',         // String: French category
  categorieEn: '',         // String: English category
  imageUrl: '',            // String: Image URL
  descriptionFr: '',       // String: French description
  descriptionEn: '',       // String: English description
  datePublication: '',     // Date: Publication date
  aLaUne: false            // Boolean: Featured/featured
}
```
**Bilingual:** Forms have language toggle (`publicationFormLanguage` state)

#### C. DOCUMENT FORM (`emptyDocumentForm`)
```javascript
{
  typeDocument: '',        // Select: Document type (auto-mapped from sinistre types)
  file: null               // File: PDF only
}
```
**Validation:** PDF files only

#### D. AGENCY FORM (`emptyAgenceForm`)
```javascript
{
  nomAgence: '',           // String: Agency name
  ville: '',               // Select: City (24 Tunisian cities)
  adresse: '',             // String: Address
  telephone: '',           // String: Phone number (validated)
  horaires: '',            // String: Opening hours
  sotadmin: '',            // String: Manager/Agent name
  emailSotadmin: '',       // Email: Manager email
  password: '',            // Password: Manager password (optional if editing)
  roleSotadmin: 'AGENT'    // Select: Role (default AGENT)
}
```
**City Options:** Ariana, Béja, Ben Arous, Bizerte, Gabès, Gafsa, Jendouba, Kairouan, Kasserine, Kébili, Le Kef, Mahdia, La Manouba, Médenine, Monastir, Nabeul, Sfax, Sidi Bouzid, Siliana, Sousse, Tataouine, Tozeur, Tunis, Zaghouan

#### E. ADMIN PROFILE FORM (`emptyAdminProfileForm`)
```javascript
{
  email: '',               // Email: Admin email
  currentPassword: '',     // Password: For validation
  newPassword: '',         // Password: New password
  confirmNewPassword: ''   // Password: Confirmation
}
```
**Split into 2 forms:** Email form + Password form (separate state management)

#### F. SINISTRE TYPE FORM
```javascript
{
  code: '',                // String: Unique code
  label: '',               // String: French label
  labelEn: '',             // String: English label
  pageKicker: '',          // String: FR kicker text
  pageKickerEn: '',        // String: EN kicker text
  heroTitle: '',           // String: Hero title FR
  heroTitleEn: '',         // String: Hero title EN
  heroTag: '',             // String: Hero tag FR
  heroTagEn: '',           // String: Hero tag EN
  heroHeadline: '',        // String: Hero headline FR
  heroHeadlineEn: '',      // String: Hero headline EN
  heroDescription: '',     // String: Description FR
  heroDescriptionEn: '',   // String: Description EN
  heroImageUrl: '',        // String: Hero image URL
  
  // Guarantees section
  guaranteesTitle: 'Nos garanties',      // String
  guaranteesTitleEn: 'Our coverages',    // String
  guaranteesRaw: '',       // Multi-line: 'icon|title|description' per line
  guaranteesRawEn: '',     // Multi-line EN version
  
  // Services section
  servicesKicker: '',      // String FR
  servicesKickerEn: '',    // String EN
  servicesTitle: 'Des services penses pour votre mobilite',
  servicesTitleEn: 'Services designed for your mobility',
  servicesRaw: '',         // Multi-line: 'title|description|imageUrl'
  servicesRawEn: '',       // Multi-line EN version
  
  // Flow/Journey section
  flowKicker: 'Parcours sinistre',
  flowKickerEn: 'Claim journey',
  flowTitle: '',           // String FR
  flowTitleEn: '',         // String EN
  stepsRaw: '',            // Multi-line: 'step|title|description'
  stepsRawEn: '',          // Multi-line EN version
  
  // Stats section
  statsTitle: '',          // String FR
  statsTitleEn: '',        // String EN
  statsDescription: '',    // String FR
  statsDescriptionEn: '',  // String EN
  statsRaw: '',            // Multi-line: 'value|label'
  statsRawEn: ''           // Multi-line EN version
}
```
**Language Toggle:** `sinistreTypeFormLanguage` state switches between 'fr' and 'en'

### Admin Dashboard Features
- **Dashboard Metrics:**
  - Total users, contracts, agencies
  - Recent contracts & users tables
  - Charts: Line (contracts by month), Pie (status distribution), Bar (contracts by agency)
  - Using **Recharts** library for visualization

- **Search & Filter:**
  - CIN-based user search
  - City filter for agencies
  - Publication search
  - Document search
  - Sinistre type search

- **Modals:** Delete confirmations, edit/create operations
- **Real-time Chat Unread:** Poll every 15s + WebSocket subscription

---

## 4. AGENCIES PAGE (`AgencesPage.jsx`)

### Features
- **Fetch:** `GET /api/agences` - displays agency list
- **Filtering:** City dropdown (dynamically generated from agency list)
- **Card Display:** Each agency shows:
  - Agency name
  - City
  - Address
  - Phone (clickable tel: link)
  - Opening hours
  
### Styling
- Hero section with gradient background
- Responsive grid layout
- Metrics display (total agencies, cities covered, 24/7 support)
- Image with fallback to logo

---

## 5. PRODUCT PAGES (Shared Template Pattern)

### Pages Using `ProductPages.css`
- `MaVoiturePage.jsx` - Car insurance
- `MonHabitationPage.jsx` - Home insurance
- `MonVoyagePage.jsx` - Travel insurance
- `MaPrevoyancePage.jsx` - Life insurance

### Common Structure
Each product page contains:
1. **Hero Section** - Title, description, CTA buttons, metrics
2. **Guarantees/Coverages** - Icon + title + description cards
3. **Services** - Service cards with images
4. **Process/Journey** - Step-by-step guide (3 steps)
5. **Stats/Chiffres** - Key statistics

### Contract Check
- Verifies user has matching contract type via `GET /api/utilisateurs/me`
- Shows conditional button ("Declare a claim" or grayed out)
- Error state: shows button anyway with tooltip

### Example: `MaPrevoyancePage.jsx`
```javascript
{
  icon: '👨‍👩‍👧',          // Emoji
  title: 'Protection famille',
  desc: 'Préservez l\'équilibre de vos proches...'
}
```

---

## 6. STYLING SYSTEM

### CSS Architecture
- **Global:** `styles.css` + CSS variables (theming)
- **Component-scoped:** Each page has `.css` file
- **No Tailwind:** Pure CSS with custom design system

### CSS Variables (Root & Dark Theme)

#### Light Mode (default)
```css
:root {
  --font-main: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --bg-primary: #f0f3f6;        /* Main background */
  --bg-secondary: #ffffff;      /* Cards/panels */
  --bg-card: #ffffff;
  --text-primary: #0b204b;      /* Dark navy text */
  --text-secondary: #5a6b8d;    /* Gray text */
  --text-white: #ffffff;
  --border: #dfe5ec;
  --primary: #00cccc;           /* Cyan accent */
  --accent: #38b2ac;
  --success-bg: #d7f5e3;
  --success-text: #21a95d;
  --danger-bg: #ffe6e6;
  --danger-text: #e05f5f;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

#### Dark Mode
```css
:root[data-theme='dark'] {
  --bg-primary: #0d1117;        /* Dark background */
  --bg-secondary: #161b22;
  --bg-card: #21262d;
  --text-primary: #c9d1d9;      /* Light text */
  --text-secondary: #8b949e;
  --primary: #58a6ff;           /* Light blue */
  --accent: #1f6feb;
  --border: #30363d;
  --success-bg: rgba(33, 169, 93, 0.2);
  --success-text: #4ade80;
  --danger-bg: rgba(224, 95, 95, 0.2);
  --danger-text: #f87171;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 16px rgba(0, 0, 0, 0.5);
}
```

### Color Palette Summary
| Usage | Light | Dark |
|-------|-------|------|
| **Primary Brand** | #00cccc | #58a6ff |
| **Text Primary** | #0b204b | #c9d1d9 |
| **Text Secondary** | #5a6b8d | #8b949e |
| **Background** | #f0f3f6 | #0d1117 |
| **Card** | #ffffff | #21262d |
| **Border** | #dfe5ec | #30363d |
| **Success** | #d7f5e3 | rgba(33,169,93,0.2) |
| **Danger** | #ffe6e6 | rgba(224,95,95,0.2) |

### Theme Implementation
- **Storage:** `localStorage.getItem('theme')` - defaults to 'light'
- **Attribute:** `document.documentElement.setAttribute('data-theme', theme)`
- **Toggle:** `App.jsx` has `toggleTheme()` function
- **UI:** Theme toggle button in navbar (sun/moon icon)
- **CSS Selectors:** `:root[data-theme='dark'] .class-name` for dark-specific styles

### Common Component Classes
- `.container` - max-width 1280px, centered
- `.agences-btn` / `.agences-btn-primary` / `.agences-btn-secondary` - buttons
- `.nav-wrap` - navbar flex layout
- `.section` - page sections with padding
- `.text-muted` - secondary text styling
- `.admin-side-btn` / `.admin-side-dropdown-item` - admin sidebar items

### Responsive Design
- Uses `clamp()` for fluid typography
- Grid layouts with `minmax(0, 1fr)`
- Mobile-first media queries
- Example: `font-size: clamp(1.8rem, 3.9vw, 3rem)`

---

## 7. DARK/LIGHT MODE IMPLEMENTATION

### Theme Toggle Logic (App.jsx)
```javascript
const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}, [theme])

const toggleTheme = () => {
  setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
}
```

### Theme Passed to Pages
- Props: `theme` and `toggleTheme` passed to AdminPage and AgentPage
- Button in navbar for user-facing toggle
- Automatic CSS variable switching via `data-theme` attribute

### No Dark Mode Hook
- No `useDarkMode()` hook - directly managed in App.jsx
- Centralized state at root level

---

## 8. INTERNATIONALIZATION (i18n)

### Setup (`i18n.js`)
```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import translationEN from './locales/en.json'
import translationFR from './locales/fr.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: translationEN }, fr: { translation: translationFR } },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    }
  })
```

### Usage Pattern
```javascript
const { t, i18n } = useTranslation()
const isEn = String(i18n.resolvedLanguage || i18n.language || 'fr').toLowerCase().startsWith('en')

// In JSX
<button onClick={() => i18n.changeLanguage('fr')}>FR</button>
<h1>{t('home.hero.title')}</h1>
```

### Translation Keys Structure
```javascript
// en.json & fr.json structure
{
  "nav": { "home", "services", "login", ... },
  "auth": { "login": { "title", "email", ... }, "register": {...} },
  "profile": { "title", "contracts", "claims", ... },
  "admin": { 
    "sidebar": {...}, 
    "dashboard": {...}, 
    "table": {...}, 
    "fields": {...},
    "modal": {...},
    "form": {...},
    "feedback": {...},
    "status": {...}
  },
  "agent": { "header", "feedback", "agency", "contracts", "users" },
  "messenger": {...},
  "contact": {...},
  "common": {...},
  "home": {"hero", "products", "news", "demarches", "stats", "footerTop"}
}
```

### Language Detection
1. **localStorage:** Checks `i18nextLng` key
2. **Navigator:** Falls back to browser language
3. **Default:** 'en' fallback
4. Persisted in localStorage

### Bilingual Admin Forms
- Toggle buttons switch between FR/EN editing modes
- Example: Publication form has `publicationFormLanguage` state
- Labels dynamically change: `editingFr` vs `editingEn`

---

## 9. COMPONENT STRUCTURE & REUSABILITY

### Reusable Components

#### A. `ChatWidget.jsx`
- **Purpose:** Floating AI assistant widget
- **Props:** `unreadCount` (number)
- **State:** Open/closed, messages, file selection, loading
- **Features:**
  - AI greeting message
  - Message history
  - Image attachment (claim photos)
  - Markdown rendering of AI responses
  - Loading indicator
  - Icons from lucide-react

**API Integration:** 
```javascript
axios.post('/api/ai/analyze', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

#### B. Product Page Template (Pattern, not a component)
All 4 product pages (`Ma*Page.jsx`) follow identical structure:
1. Hero card with image/fallback
2. Guarantees section (mapped from data)
3. Services section (mapped from data)
4. Process/Journey section
5. Stats/Chiffres section

**Reusability:** CSS shared, structure replicated, data object-driven

#### C. `SinistreFixedCta.jsx`
- Fixed CTA button for claim declaration

### Component Patterns

#### Modal Management
```javascript
const [isModalOpen, setIsModalOpen] = useState(false)
const [itemToDelete, setItemToDelete] = useState(null)
const [editingItemId, setEditingItemId] = useState(null)

// Usage: Multiple modals via conditional rendering
{activeAdminSection === 'agences' && (
  <AgenceModal open={isAgenceModalOpen} onClose={() => setIsAgenceModalOpen(false)} />
)}
```

#### Form State Management
```javascript
const [form, setForm] = useState(emptyForm)
const [errors, setErrors] = useState({})
const [touched, setTouched] = useState({})

// Validation on blur
const handleFieldBlur = (field) => {
  setTouched({ ...touched, [field]: true })
  // Validate...
}
```

#### Search/Filter Pattern
```javascript
const [searchTerm, setSearchTerm] = useState('')

const filtered = useMemo(() => {
  return data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [data, searchTerm])
```

---

## 10. API INTEGRATION

### API Endpoints Called

#### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/utilisateur/login` - User login
- `POST /api/agent/login` - Agent login
- `POST /api/auth/register` - User registration

#### User/Profile
- `GET /api/utilisateurs/me` - Current user profile (contracts, info)
- `GET /api/utilisateurs` - All users (admin only)
- `PATCH /api/utilisateurs/me` - Update profile
- `PATCH /api/admin/profile` - Update admin profile

#### Contracts
- `GET /api/contrats` - All contracts (admin)
- `POST /api/contrats` - Create contract (admin)
- `PATCH /api/contrats/:id` - Update contract (admin)
- `DELETE /api/contrats/:id` - Delete contract (admin)

#### Agencies
- `GET /api/agences` - Public agency list
- `POST /api/agences` - Create agency (admin)
- `PATCH /api/agences/:id` - Update agency (admin)
- `DELETE /api/agences/:id` - Delete agency (admin)

#### Publications/News
- `GET /api/publications` - All publications
- `POST /api/publications` - Create publication (admin)
- `PATCH /api/publications/:id` - Update publication (admin)
- `DELETE /api/publications/:id` - Delete publication (admin)

#### Documents
- `GET /api/documents` - All documents (admin)
- `POST /api/documents` - Upload document (admin)
- `DELETE /api/documents/:id` - Delete document (admin)

#### Sinistre Types
- `GET /api/sinistre-types` - List claim types
- `POST /api/sinistre-types` - Create type (admin)
- `PATCH /api/sinistre-types/:id` - Update type (admin)
- `DELETE /api/sinistre-types/:id` - Delete type (admin)

#### Messaging
- `GET /api/contact-messages/admin` - Admin inbox (admin only)
- `GET /api/contact-messages/mine` - User messages
- `POST /api/contact-messages` - Send contact message
- `GET /api/contact-messages/:id/replies` - Get message replies
- `POST /api/contact-messages/:id/replies` - Reply to message
- `GET /api/chat/all-my-messages/:userId` - User chat messages
- `GET /api/chat/unread-count/:userId` - Unread count

#### AI/Claims
- `POST /api/ai/analyze` - Analyze claim photo (ChatWidget)

### Request Headers
```javascript
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})
```

### Real-time Updates (WebSocket)
- **Technology:** STOMP + SockJS
- **Connection:** `new Client({ webSocketFactory: () => new SockJS('/ws') })`
- **Subscriptions:**
  - `/user/queue/messages` - Receive messages (Admin dashboard)
  - `/user/{userId}/queue/messages` - User messages (Chat)
  - Chat polling every 15 seconds as fallback

---

## 11. FORM VALIDATION

### Validation Patterns

#### Phone Number Validation
```javascript
import { validatePhoneNumberOrEmpty } from '../utils/phoneNumberValidator'

// Uses libphonenumber-js
const error = validatePhoneNumberOrEmpty(phone, 'TN') // Tunisia
```

#### CIN Validation
```javascript
const isCinValid = (cin) => {
  // 8 digits exactly
  return /^\d{8}$/.test(String(cin).trim())
}
```

#### Email Validation
```javascript
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

#### Sinistre Type Code Normalization
```javascript
const normalizeSinistreTypeCode = (value) => {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .toUpperCase()
}
```

### Form State Management Approach
1. **Initial State:** `emptyForm` objects for reset
2. **Touched Tracking:** `touched` state to show errors only after user interaction
3. **Error State:** `errors` object keyed by field name
4. **Auto-clear:** Success/error messages auto-dismiss after 5-7 seconds

---

## 12. DEPENDENCIES

### package.json
```json
{
  "dependencies": {
    "@stomp/stompjs": "^7.3.0",          // WebSocket messaging
    "axios": "^1.13.6",                  // HTTP client
    "i18next": "^26.0.4",                // i18n core
    "i18next-browser-languagedetector": "^8.2.1",
    "libphonenumber-js": "^1.12.41",     // Phone validation
    "lucide-react": "^0.577.0",          // Icons (SVG)
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^17.0.2",
    "react-markdown": "^10.1.0",         // Markdown rendering
    "react-router-dom": "^7.13.1",
    "recharts": "^3.8.1",                // Charts library
    "sockjs-client": "^1.6.1"            // WebSocket fallback
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Key Libraries
- **Routing:** React Router v7 (nested routes, route guards)
- **State:** React Hooks (useState, useEffect, useCallback, useRef, useMemo)
- **Styling:** Plain CSS + variables (no preprocessor)
- **Charts:** Recharts (LineChart, BarChart, PieChart)
- **Icons:** lucide-react (MessageCircle, X, Send, User, Mail, Lock, etc.)
- **HTTP:** Axios + Fetch API
- **Messaging:** STOMP/SockJS
- **Markdown:** react-markdown (for AI responses)

---

## 13. AUTHENTICATION & AUTHORIZATION

### User Roles
- **ADMIN** - Administrative panel access
- **AGENT** - Agent/Agency panel access
- **UTILISATEUR** (or no role) - Regular user
- **Public** - Non-authenticated users

### Authentication Flow
1. **Login:** `/api/auth/login`, `/api/auth/utilisateur/login`, `/api/agent/login`
2. **Token Storage:** JWT token in `localStorage.token`
3. **User Info Storage:**
   - `localStorage.token` - JWT token
   - `localStorage.userId` - User ID
   - `localStorage.userRole` - User role (ADMIN, AGENT, etc.)
   - `localStorage.userEmail` - User email
   - `localStorage.userDisplayName` - Display name
4. **Route Protection:** Conditional rendering in App.jsx based on auth state
5. **Header Injection:** `Authorization: Bearer {token}` in all authenticated requests

### Role-based Routing
```javascript
// Admin only
<Route path="/admin" element={
  userRole === 'ADMIN' ? <AdminPage /> : <Navigate to="/profile" />
} />

// User only
<Route path="/profile" element={
  isAuthenticated && userRole !== 'ADMIN' ? <ProfilePage /> : <Navigate to="/se-connecter" />
} />

// Conditional contract access
<Route path="/ma-voiture" element={
  canAccessCode('AUTO') === false ? <ContractRequiredPage /> : <MaVoiturePage />
} />
```

---

## 14. LAYOUT & NAVIGATION

### Navbar (All Pages Except Admin/Agent)
- **Left:** Brand logo + company name
- **Center:** Navigation links (public links)
- **Right Actions:**
  - Theme toggle button (sun/moon icon)
  - Language switcher (FR/EN buttons)
  - Messenger icon (with unread badge) - authenticated users only
  - User profile dropdown - authenticated
  - Login/Register buttons - unauthenticated

### Admin/Agent Sidebar
- Collapsible sidebar with sections
- Hamburger menu for mobile
- Hover expansion on desktop
- Nested dropdowns for "Gestion" and "Consultations"
- Active state highlighting

### Fixed Elements
- **Right Floating Button Bar:** Product links (authenticated users only)
- **ChatWidget:** Floating AI assistant (bottom right, toggleable)

---

## 15. KEY FEATURES & FLOW

### User Flow
1. **Landing Page** → Browse products/agencies
2. **Authentication** → Login/Register
3. **Profile** → View contracts, personal info
4. **Claim Declaration** → Select claim type → Fill form → Submit
5. **Chat/Messaging** → Contact support or admin
6. **Product Pages** → View insurance details → Declare claim

### Admin Flow
1. **Dashboard** → View overview/metrics
2. **Manage:** Contracts, Users, Publications, Agencies, Documents
3. **Messages** → Reply to contact form submissions
4. **Profile** → Change email/password
5. **Sinistre Types** → Configure claim type pages

### Agent Flow
1. **Agency Info** → View/edit agency details
2. **Contracts** → Add/edit contracts for agency
3. **Clients** → Manage users under agency
4. **Messaging** → Internal messaging

---

## 16. SUMMARY TABLE: FORM FIELDS

### Admin Contracts
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| nomAgence | Text | No | - |
| cin | Text | Yes | Exactly 8 digits |
| numeroContrat | Text | Yes | Must be unique |
| typeContrat | Select | Yes | - |
| dateDebutContrat | Date | No | - |
| dateFinContrat | Date | No | - |

### Admin Publications
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| titreFr | Text | Yes | - |
| titreEn | Text | Yes | - |
| categorieFr | Text | Yes | - |
| categorieEn | Text | Yes | - |
| imageUrl | URL | No | - |
| descriptionFr | Textarea | Yes | - |
| descriptionEn | Textarea | Yes | - |
| datePublication | Date | No | - |
| aLaUne | Checkbox | No | Boolean |

### Admin Agencies
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| nomAgence | Text | Yes | - |
| ville | Select | Yes | 24 cities |
| adresse | Text | Yes | - |
| telephone | Phone | Yes | libphonenumber validation |
| horaires | Text | No | - |
| sotadmin | Text | Yes | Manager name |
| emailSotadmin | Email | Yes | Valid email format |
| password | Password | Conditional | Required if creating |
| roleSotadmin | Select | No | Default: AGENT |

### Admin Sinistre Types
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| code | Text | Yes | Alphanumeric + underscores |
| label | Text | Yes | FR label |
| labelEn | Text | Yes | EN label |
| heroImageUrl | URL | No | - |
| guaranteesRaw | Textarea | No | Multi-line format |
| servicesRaw | Textarea | No | Multi-line format |
| stepsRaw | Textarea | No | Multi-line format |
| statsRaw | Textarea | No | Multi-line format |
| [24+ other fields] | Mixed | No | Various FR/EN pairs |

---

## 17. PERFORMANCE & OPTIMIZATION

### Data Loading
- **Parallel requests:** Promise.all() in AdminPage `loadData()`
- **Conditional loading:** Check auth state before fetching
- **Memoization:** `useMemo` for derived data (city options, filtered lists)
- **Lazy loading:** Product page contract checks only on mount

### Message Polling
- **Polling interval:** 15 seconds for unread count
- **WebSocket fallback:** STOMP + SockJS for real-time
- **Cleanup:** Proper unsubscribe and client deactivate on unmount

### Chart Rendering
- **Recharts:** Responsive containers with `ResponsiveContainer`
- **Data update:** State-based re-render on data fetch

### CSS Optimization
- **CSS variables:** Single source of truth for theme
- **No CSS-in-JS:** Compiled static CSS files
- **Scoped styles:** Component-level `.css` files

---

## 18. FILE REFERENCES

### Key Files for Reference
- **Main App:** [App.jsx](front-end/src/App.jsx)
- **Admin Dashboard:** [AdminPage.jsx](front-end/src/pages/AdminPage.jsx)
- **Agencies:** [AgencesPage.jsx](front-end/src/pages/AgencesPage.jsx)
- **Styling:** [styles.css](front-end/src/styles.css), [ProductPages.css](front-end/src/pages/ProductPages.css)
- **i18n:** [i18n.js](front-end/src/i18n.js)
- **Chat:** [ChatWidget.jsx](front-end/src/components/ChatWidget.jsx)
- **Translations:** [en.json](front-end/src/locales/en.json), [fr.json](front-end/src/locales/fr.json)
- **Package:** [package.json](front-end/package.json)

---

## 19. QUICK REFERENCE: COLOR SCHEME

### Primary Colors
- **Cyan/Turquoise:** `#00cccc` (light), `#58a6ff` (dark)
- **Navy:** `#0b204b` (text light), `#07224f` (headings light)
- **Light Gray:** `#f0f3f6` (bg light), `#c9d1d9` (text dark)
- **Dark Gray:** `#5a6b8d` (secondary text light), `#8b949e` (secondary text dark)

### Status Colors
- **Success Green:** `#21a95d` (text), `#d7f5e3` (background)
- **Error Red:** `#e05f5f` (text), `#ffe6e6` (background)

### Button Variants
- **Primary:** Cyan background, white text
- **Secondary:** Transparent, border, text color

---

## 20. DEPLOYMENT & BUILD

### Build Process
```bash
npm run build  # Vite build → dist/
npm run dev    # Local dev server on http://localhost:5173
```

### Environment Variables
- **Dev:** Uses relative API URLs (proxy to backend on :8080)
- **Build:** `import.meta.env.DEV` check for API base URL

### Backend Proxy
- All API calls use relative paths: `/api/...`
- Backend expected on `http://localhost:8080` or same origin

---

END OF DOCUMENTATION
