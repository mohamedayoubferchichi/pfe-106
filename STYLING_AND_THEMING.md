# STYLING & THEMING GUIDE

## COLOR PALETTE

### Light Mode (Default)
```css
:root {
  /* Backgrounds */
  --bg-primary: #f0f3f6;        /* Main page background (light blue-gray) */
  --bg-secondary: #ffffff;      /* Card/panel background (white) */
  --bg-card: #ffffff;           /* Alias for secondary */
  
  /* Text */
  --text-primary: #0b204b;      /* Dark navy (headers, main text) */
  --text-secondary: #5a6b8d;    /* Medium gray (secondary text) */
  --text-white: #ffffff;        /* White text for contrast */
  
  /* Accents & Brand */
  --primary: #00cccc;           /* Cyan/turquoise (buttons, highlights) */
  --accent: #38b2ac;            /* Teal (secondary accent) */
  
  /* Borders */
  --border: #dfe5ec;            /* Light border color */
  
  /* Status Colors */
  --success-bg: #d7f5e3;        /* Light green background */
  --success-text: #21a95d;      /* Dark green text */
  --danger-bg: #ffe6e6;         /* Light red background */
  --danger-text: #e05f5f;       /* Dark red text */
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  /* Fonts */
  --font-main: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

### Dark Mode
```css
:root[data-theme='dark'] {
  /* Backgrounds */
  --bg-primary: #0d1117;        /* Very dark background */
  --bg-secondary: #161b22;      /* Dark secondary */
  --bg-card: #21262d;           /* Dark card (lighter than primary) */
  
  /* Text */
  --text-primary: #c9d1d9;      /* Light gray (main text) */
  --text-secondary: #8b949e;    /* Medium gray (secondary) */
  
  /* Accents & Brand */
  --primary: #58a6ff;           /* Light blue (buttons, highlights) */
  --accent: #1f6feb;            /* Darker blue accent */
  
  /* Borders */
  --border: #30363d;            /* Dark border */
  
  /* Status Colors */
  --success-bg: rgba(33, 169, 93, 0.2);   /* Transparent green */
  --success-text: #4ade80;      /* Light green */
  --danger-bg: rgba(224, 95, 95, 0.2);   /* Transparent red */
  --danger-text: #f87171;       /* Light red */
  
  /* Shadows (stronger) */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 16px rgba(0, 0, 0, 0.5);
}
```

---

## COLOR USAGE GUIDE

### Semantic Colors
| Concept | Light | Dark |
|---------|-------|------|
| **Primary Brand** | #00cccc | #58a6ff |
| **Main Background** | #f0f3f6 | #0d1117 |
| **Cards/Surfaces** | #ffffff | #21262d |
| **Primary Text** | #0b204b | #c9d1d9 |
| **Secondary Text** | #5a6b8d | #8b949e |
| **Borders** | #dfe5ec | #30363d |
| **Success** | #21a95d / #d7f5e3 | #4ade80 / rgba(33,169,93,0.2) |
| **Error** | #e05f5f / #ffe6e6 | #f87171 / rgba(224,95,95,0.2) |

### Component Colors
- **Buttons**: Primary color (`--primary`) for background, white text
- **Links**: Inherit text color, no underline by default
- **Inputs**: Border = `--border`, background = `--bg-secondary`
- **Cards**: Background = `--bg-card`, border = `--border`, shadow = `--shadow-md`
- **Badges/Tags**: Primary color background with white text

---

## TYPOGRAPHY

### Font Family
**Primary:** `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- System font stack (no web fonts)
- Fast loading, consistent across platforms

### Font Sizes
**Responsive using `clamp()`:**
```css
h1 { font-size: clamp(1.8rem, 3.9vw, 3rem); }     /* ~24px → 48px */
h2 { font-size: clamp(1.4rem, 2.8vw, 2.2rem); }   /* ~22px → 35px */
h3 { font-size: clamp(1.1rem, 2.2vw, 1.8rem); }   /* ~18px → 28px */
p  { font-size: 1rem; }                            /* 16px */
.small { font-size: 0.875rem; }                    /* 14px */
```

### Font Weights
- **Regular:** 400
- **Medium:** 600
- **Bold:** 700
- **Extra Bold:** 800 (for kickers, labels)

### Line Heights
- **Headings:** 1.1
- **Body:** 1.5-1.65
- **Dense:** 1.2

---

## SPACING SYSTEM

### Margin/Padding Scale
```css
--space-xs:  0.25rem;   /* 4px */
--space-sm:  0.5rem;    /* 8px */
--space-md:  0.75rem;   /* 12px */
--space-lg:  1rem;      /* 16px */
--space-xl:  1.2rem;    /* 19px */
--space-2xl: 1.3rem;    /* 21px */
--space-3xl: 1.5rem;    /* 24px */
--space-4xl: 2rem;      /* 32px */
--space-5xl: 2.3rem;    /* 37px */
```

### Common Patterns
- **Page padding:** `2.3rem` bottom, `0` top (after navbar)
- **Container:** `max-width: 1280px`, `margin: 0 auto`, `width: min(1280px, 92%)`
- **Section gap:** `1.2rem` between elements
- **Card padding:** `1.35rem`
- **Hero card grid gap:** `1.2rem`

---

## BORDER RADIUS

### Common Values
- **Sharp:** `0px`
- **Subtle:** `6px` (inputs, small elements)
- **Medium:** `10px` (cards, dropdowns)
- **Large:** `12px` (buttons, larger cards)
- **Extra Large:** `30px` (hero sections)

---

## SHADOWS

### Light Mode
- **Small:** `0 1px 3px rgba(0, 0, 0, 0.1)`
- **Medium:** `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- **Hero:** `0 16px 38px rgba(8, 31, 66, 0.12)`

### Dark Mode
- **Small:** `0 1px 3px rgba(0, 0, 0, 0.4)`
- **Medium:** `0 8px 16px rgba(0, 0, 0, 0.5)`
- **Hero:** `0 16px 38px rgba(0, 0, 0, 0.48)`

---

## LAYOUT PATTERNS

### Container
```css
.container {
  width: min(1280px, 92%);  /* Max 1280px or 92% of viewport */
  margin: 0 auto;            /* Centered */
}
```

### Grid Layouts
**Hero Sections (2 columns):**
```css
.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 1.2rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

**Service/Feature Cards (3 columns):**
```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.2rem;
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}
```

### Flexbox Patterns
**Navigation:**
```css
.nav-wrap {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  min-height: 78px;
}
```

**Centered Actions:**
```css
.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
```

---

## BUTTON STYLES

### Primary Button
```css
.btn-primary {
  background: var(--primary);     /* #00cccc light, #58a6ff dark */
  color: #ffffff;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--primary);
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 0.6rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: var(--bg-primary);
  border-color: var(--primary);
}
```

### Language Switcher
```css
.lang-switcher button {
  background: none;
  border: 1px solid var(--border);
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.lang-switcher button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.lang-switcher button:hover:not(.active) {
  background: var(--bg-primary);
  border-color: var(--primary);
}
```

---

## INPUT STYLES

### Text Input / Textarea
```css
input, textarea, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: var(--font-main);
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 204, 204, 0.1);
}

input:disabled {
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Error state */
input.error, textarea.error {
  border-color: var(--danger-text);
}
```

### Label
```css
label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

label.required::after {
  content: ' *';
  color: var(--danger-text);
}
```

---

## CARD STYLES

### Base Card
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.35rem;
  box-shadow: var(--shadow-md);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Hero Card
```css
.hero-card {
  border-radius: 30px;
  background: linear-gradient(130deg, #ffffff 0%, #f2f8fd 50%, #eef4ff 100%);
  box-shadow: 0 16px 38px rgba(8, 31, 66, 0.12);
  padding: 1.35rem;
}

:root[data-theme='dark'] .hero-card {
  background: linear-gradient(130deg, #131d2b 0%, #102033 50%, #1b2b42 100%);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.48);
}
```

---

## THEME TOGGLE IMPLEMENTATION

### HTML Attribute
```html
<!-- Light mode (default) -->
<html data-theme="light">

<!-- Dark mode -->
<html data-theme="dark">
```

### CSS Selectors
```css
/* Light mode specific (explicit, optional) */
:root { /* --variables */ }

/* Dark mode specific */
:root[data-theme='dark'] {
  --bg-primary: #0d1117;
  /* ... dark variables ... */
}

/* Example: Conditional class styling */
:root[data-theme='dark'] .card {
  background: var(--bg-card);  /* Uses dark --bg-card */
}
```

### React Implementation
```javascript
// In App.jsx
const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}, [theme])

const toggleTheme = () => {
  setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
}

// In JSX
<button onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}>
  {theme === 'light' ? <MoonIcon /> : <SunIcon />}
</button>
```

---

## RESPONSIVE DESIGN PATTERNS

### Breakpoints (Implicit, no defined variables)
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Fluid Sizing (clamp)
```css
/* Font that scales from 24px (1.5rem) to 48px (3rem) */
font-size: clamp(1.5rem, 3.9vw, 3rem);

/* Padding that scales from 16px to 32px */
padding: clamp(1rem, 2vw, 2rem);

/* Container width: max 1280px or 92% of viewport */
width: min(1280px, 92%);
```

### Media Queries (Examples)
```css
@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-nav { display: flex; }
  .grid-3-cols { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .grid-3-cols, .grid-2-cols { grid-template-columns: 1fr; }
  h1 { font-size: clamp(1.5rem, 5vw, 2rem); }
}
```

---

## ANIMATIONS & TRANSITIONS

### Smooth Transitions
```css
/* Standard transition */
transition: all 0.2s;              /* 200ms */
transition: background 0.3s, color 0.3s;  /* Multiple properties */
transition: transform 0.15s ease-out;  /* With easing */

/* On focus/hover */
input:focus {
  transition: border-color 0.2s, box-shadow 0.2s;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 204, 204, 0.1);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### No Heavy Animations
- Subtly used (hover effects, focus states)
- No page transitions or loaders
- Performance-focused (no keyframe animations)

---

## UTILITY CLASSES

### Visibility
```css
.text-muted { color: var(--text-secondary); }
.hidden { display: none; }
.invisible { visibility: hidden; }
.sr-only { /* Screen reader only */ }
```

### Alignment
```css
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.m-auto { margin: auto; }
```

### Spacing (Margin/Padding)
```css
.m-0 { margin: 0; }
.p-0 { padding: 0; }
.gap-1 { gap: 0.5rem; }
.gap-2 { gap: 1rem; }
```

---

## DARK MODE GRADIENT BACKGROUNDS

### Agences/Product Pages
```css
/* Light mode */
.page {
  background:
    radial-gradient(circle at 8% -10%, rgba(0, 204, 204, 0.13), transparent 36%),
    radial-gradient(circle at 92% 0%, rgba(11, 43, 97, 0.12), transparent 42%);
}

/* Dark mode */
:root[data-theme='dark'] .page {
  background:
    radial-gradient(circle at 8% -10%, rgba(88, 166, 255, 0.2), transparent 36%),
    radial-gradient(circle at 92% 0%, rgba(31, 111, 235, 0.22), transparent 42%);
}
```

---

## TOPBAR (NAVBAR)

```css
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  transition: background 0.3s, border-color 0.3s;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-height: 78px;
}

:root[data-theme='dark'] .topbar {
  background: rgba(15, 18, 24, 0.85);  /* Semitransparent dark */
}
```

---

## ACCESSIBILITY

### Focus States
All interactive elements must have visible focus indicators:
```css
:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Contrast
- **Text on background:** Min 4.5:1 ratio
- **Light mode:** #0b204b text on #f0f3f6 ✅
- **Dark mode:** #c9d1d9 text on #0d1117 ✅

### Labels
- All form fields must have associated labels
- Use `htmlFor` attribute in React

---

## COMMON CSS CLASSES

### Navigation
- `.topbar` - Sticky navbar
- `.nav-wrap` - Navbar flex container
- `.brand` - Logo area
- `.nav-links` - Navigation links
- `.nav-actions` - Right actions (theme, lang, auth)
- `.nav-profile-dropdown` - Profile menu

### Layout
- `.container` - Max-width centered container
- `.section` - Page section with padding
- `.admin-side-nav` - Sidebar navigation
- `.admin-side-btn` - Sidebar button

### Forms
- `.form-group` - Form field wrapper
- `.label` - Field label
- `.input` - Text input
- `.select` - Dropdown
- `.textarea` - Textarea
- `.form-error` - Error message

### Cards & Content
- `.card` - Base card styling
- `.hero-card` - Large hero section card
- `.agence-card` - Agency listing card
- `.product-hero-card` - Product page hero

### Buttons
- `.btn` - Base button
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-disabled` - Disabled button

### Utilities
- `.text-muted` - Secondary text
- `.loading` - Loading indicator
- `.error` - Error styling
- `.success` - Success styling

---
