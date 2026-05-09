# ADMIN FORMS - COMPLETE FIELD REFERENCE

## 1. CONTRACT FORM

| Field | Type | Required | Max Length | Validation | Notes |
|-------|------|----------|-----------|-----------|-------|
| nomAgence | Text | No | - | - | Agency name (optional) |
| cin | Text | Yes | 8 | Exactly 8 digits | Customer ID |
| numeroContrat | Text | Yes | - | Must be unique | Contract number |
| typeContrat | Select | Yes | - | From sinistre types | Dropdown |
| dateDebutContrat | Date | No | - | - | Start date |
| dateFinContrat | Date | No | - | - | End date |

**API:** POST `/api/contrats`, PATCH `/api/contrats/:id`, DELETE `/api/contrats/:id`

---

## 2. PUBLICATION FORM (Bilingual)

| Field | Type | Required | Language | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| titreFr | Text | Yes | FR | - | French title |
| titreEn | Text | Yes | EN | - | English title |
| categorieFr | Text | Yes | FR | - | French category |
| categorieEn | Text | Yes | EN | - | English category |
| descriptionFr | Textarea | Yes | FR | - | French description |
| descriptionEn | Textarea | Yes | EN | - | English description |
| imageUrl | URL | No | - | Valid URL | Image link |
| datePublication | Date | No | - | - | Publication date |
| aLaUne | Checkbox | No | - | Boolean | Featured flag |

**Mode Toggle:** `publicationFormLanguage` state (fr/en)
**API:** POST `/api/publications`, PATCH `/api/publications/:id`, DELETE `/api/publications/:id`

---

## 3. AGENCY FORM

| Field | Type | Required | Options | Validation | Notes |
|-------|------|----------|---------|-----------|-------|
| nomAgence | Text | Yes | - | - | Agency name |
| ville | Select | Yes | 24 cities | - | Dropdown list |
| adresse | Text | Yes | - | - | Street address |
| telephone | Phone | Yes | - | libphonenumber (TN) | Tunisia format |
| horaires | Text | No | - | - | Opening hours |
| sotadmin | Text | Yes | - | - | Manager/Agent name |
| emailSotadmin | Email | Yes | - | Valid email regex | Manager email |
| password | Password | Conditional | - | 6+ chars if creating | Optional on edit |
| roleSotadmin | Select | No | AGENT (default) | - | User role |

**Cities (24 Tunisian):** Ariana, Béja, Ben Arous, Bizerte, Gabès, Gafsa, Jendouba, Kairouan, Kasserine, Kébili, Le Kef, Mahdia, La Manouba, Médenine, Monastir, Nabeul, Sfax, Sidi Bouzid, Siliana, Sousse, Tataouine, Tozeur, Tunis, Zaghouan

**API:** POST `/api/agences`, PATCH `/api/agences/:id`, DELETE `/api/agences/:id`

---

## 4. DOCUMENT FORM

| Field | Type | Required | Format | Validation | Notes |
|-------|------|----------|--------|-----------|-------|
| typeDocument | Select | Yes | - | From sinistre types | Auto-mapped |
| file | File | Yes | PDF | PDF only | Upload field |

**API:** POST `/api/documents`, DELETE `/api/documents/:id`

---

## 5. ADMIN PROFILE FORM (Split into 2 sections)

### Email Section
| Field | Type | Required | Validation | Notes |
|-------|------|----------|-----------|-------|
| email | Email | Yes | Valid email regex | Admin email |

### Password Section
| Field | Type | Required | Validation | Notes |
|-------|------|----------|-----------|-------|
| currentPassword | Password | Yes* | - | *Only if changing password |
| newPassword | Password | Conditional | 6+ chars | Required if changing |
| confirmNewPassword | Password | Conditional | Match newPassword | Required if changing |

**Note:** Split form with separate state management & error handling
**API:** PATCH `/api/admin/profile`

---

## 6. SINISTRE TYPE FORM (Complex, Bilingual)

### Basic Info
| Field | Type | Required | Validation | Notes |
|-------|------|----------|-----------|-------|
| code | Text | Yes | Alphanumeric + underscores | Unique, normalized |
| label | Text | Yes | - | French label |
| labelEn | Text | Yes | - | English label |

### Hero Section (Both Languages)
| Field | Type | FR | EN | Notes |
|-------|------|----|----|-------|
| heroTitle | Text | heroTitle | heroTitleEn | Main hero title |
| heroTag | Text | heroTag | heroTagEn | Small tag above title |
| heroHeadline | Text | heroHeadline | heroHeadlineEn | Subtitle/headline |
| heroDescription | Text | heroDescription | heroDescriptionEn | Full description |
| heroImageUrl | URL | - | - | Image (shared) |
| pageKicker | Text | pageKicker | pageKickerEn | Kicker text |

### Guarantees/Coverages Section
| Field | Type | Format | Notes |
|-------|------|--------|-------|
| guaranteesTitle | Text | | FR title (default: "Nos garanties") |
| guaranteesTitleEn | Text | | EN title (default: "Our coverages") |
| guaranteesRaw | Textarea | Multiline | Format: `icon\|title\|description` per line |
| guaranteesRawEn | Textarea | Multiline | EN version |

### Services Section
| Field | Type | Format | Notes |
|-------|------|--------|-------|
| servicesKicker | Text | | FR kicker |
| servicesKickerEn | Text | | EN kicker |
| servicesTitle | Text | | FR (default: "Des services penses...") |
| servicesTitleEn | Text | | EN (default: "Services designed...") |
| servicesRaw | Textarea | Multiline | Format: `title\|description\|imageUrl` |
| servicesRawEn | Textarea | Multiline | EN version |

### Flow/Journey Section
| Field | Type | Format | Notes |
|-------|------|--------|-------|
| flowKicker | Text | | FR (default: "Parcours sinistre") |
| flowKickerEn | Text | | EN (default: "Claim journey") |
| flowTitle | Text | | FR title |
| flowTitleEn | Text | | EN title |
| stepsRaw | Textarea | Multiline | Format: `step#\|title\|description` (3 steps) |
| stepsRawEn | Textarea | Multiline | EN version |

### Stats Section
| Field | Type | Format | Notes |
|-------|------|--------|-------|
| statsTitle | Text | | FR stats title |
| statsTitleEn | Text | | EN stats title |
| statsDescription | Text | | FR description |
| statsDescriptionEn | Text | | EN description |
| statsRaw | Textarea | Multiline | Format: `value\|label` (4 stats) |
| statsRawEn | Textarea | Multiline | EN version |

**Mode Toggle:** `sinistreTypeFormLanguage` state (fr/en)  
**Normalization:** Code auto-normalizes to `UPPERCASE_UNDERSCORES`  
**API:** POST `/api/sinistre-types`, PATCH `/api/sinistre-types/:id`, DELETE `/api/sinistre-types/:id`

---

## FORM STATE OBJECTS

### emptyContratForm
```javascript
{
  nomAgence: '',
  cin: '',
  numeroContrat: '',
  typeContrat: '',
  dateDebutContrat: '',
  dateFinContrat: ''
}
```

### emptyPublicationForm
```javascript
{
  titreFr: '',
  titreEn: '',
  categorieFr: '',
  categorieEn: '',
  imageUrl: '',
  descriptionFr: '',
  descriptionEn: '',
  datePublication: '',
  aLaUne: false
}
```

### emptyAgenceForm
```javascript
{
  nomAgence: '',
  ville: '',
  adresse: '',
  telephone: '',
  horaires: '',
  sotadmin: '',
  emailSotadmin: '',
  password: '',
  roleSotadmin: 'AGENT'
}
```

### emptyDocumentForm
```javascript
{
  typeDocument: '',
  file: null
}
```

### emptyAdminProfileForm
```javascript
{
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
}
```

### createEmptySinistreTypeForm()
```javascript
{
  code: '',
  label: '',
  labelEn: '',
  pageKicker: '',
  pageKickerEn: '',
  heroTitle: '',
  heroTitleEn: '',
  heroTag: '',
  heroTagEn: '',
  heroHeadline: '',
  heroHeadlineEn: '',
  heroDescription: '',
  heroDescriptionEn: '',
  heroImageUrl: '',
  guaranteesTitle: 'Nos garanties',
  guaranteesTitleEn: 'Our coverages',
  guaranteesRaw: '[default multi-line]',
  guaranteesRawEn: '[default multi-line EN]',
  servicesKicker: '',
  servicesKickerEn: '',
  servicesTitle: 'Des services penses pour votre mobilite',
  servicesTitleEn: 'Services designed for your mobility',
  servicesRaw: '[default multi-line]',
  servicesRawEn: '[default multi-line EN]',
  flowKicker: 'Parcours sinistre',
  flowKickerEn: 'Claim journey',
  flowTitle: '',
  flowTitleEn: '',
  stepsRaw: '[default 3 steps]',
  stepsRawEn: '[default 3 steps EN]',
  statsTitle: '',
  statsTitleEn: '',
  statsDescription: '',
  statsDescriptionEn: '',
  statsRaw: '[default 4 stats]',
  statsRawEn: '[default 4 stats EN]'
}
```

---

## VALIDATION RULES SUMMARY

### Required Fields by Form
- **Contracts:** cin, numeroContrat, typeContrat
- **Publications:** titreFr, titreEn, categorieFr, categorieEn, descriptionFr, descriptionEn
- **Agencies:** nomAgence, ville, adresse, telephone, sotadmin, emailSotadmin
- **Documents:** typeDocument, file
- **Sinistre Types:** code, label, labelEn

### Custom Validators
```javascript
// CIN: 8 digits exactly
/^\d{8}$/

// Email: basic regex
/^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone: libphonenumber-js with country TN
validatePhoneNumberOrEmpty(value, 'TN')

// Sinistre code: alphanumeric + underscores, uppercase
String(value)
  .trim()
  .replace(/\s+/g, '_')
  .replace(/[^A-Za-z0-9_]/g, '_')
  .toUpperCase()
```

---

## FORM STATE MANAGEMENT PATTERN

```javascript
// State for form data
const [form, setForm] = useState(emptyForm)

// State for errors
const [errors, setErrors] = useState({})

// State for touched fields (show errors only after interaction)
const [touched, setTouched] = useState({})

// State for loading
const [isSaving, setIsSaving] = useState(false)

// State for success/error messages
const [success, setSuccess] = useState('')
const [error, setError] = useState('')

// Auto-clear messages
useEffect(() => {
  let timer = null
  if (success) timer = setTimeout(() => setSuccess(''), 5000)
  return () => timer && clearTimeout(timer)
}, [success])

// Handle field change
const handleChange = (field, value) => {
  setForm(prev => ({ ...prev, [field]: value }))
  if (touched[field]) validateField(field, value)
}

// Handle field blur
const handleBlur = (field) => {
  setTouched(prev => ({ ...prev, [field]: true }))
  validateField(field, form[field])
}

// Validate field
const validateField = (field, value) => {
  const newErrors = { ...errors }
  // Validation logic
  setErrors(newErrors)
}

// Submit
const handleSubmit = async (e) => {
  e.preventDefault()
  validateForm() // Validate all fields
  if (Object.keys(errors).length > 0) return
  
  setIsSaving(true)
  try {
    await fetch(...) // API call
    setSuccess('Success message')
    setForm(emptyForm)
    setErrors({})
    setTouched({})
  } catch (err) {
    setError(err.message)
  } finally {
    setIsSaving(false)
  }
}
```

---

## SPECIAL FEATURES

### Bilingual Forms (Publications, Sinistre Types)
```javascript
const [form, setForm] = useState(createEmptySinistreTypeForm)
const [formLanguage, setFormLanguage] = useState('fr')

// Toggle button in UI
<button onClick={() => setFormLanguage(prev => prev === 'fr' ? 'en' : 'fr')}>
  {formLanguage === 'fr' ? 'Editing FR - Switch to EN' : 'Editing EN - Switch to FR'}
</button>

// Conditional field display in render
{formLanguage === 'fr' && (
  <input value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
)}
{formLanguage === 'en' && (
  <input value={form.labelEn} onChange={e => setForm({...form, labelEn: e.target.value})} />
)}
```

### Search/Filter with Memoization
```javascript
const [searchTerm, setSearchTerm] = useState('')

const filtered = useMemo(() => {
  return data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [data, searchTerm])

// or with conditional logic
const filteredAgences = useMemo(() => {
  if (selectedCity === 'all') return agences
  return agences.filter(item => String(item.ville || '').trim() === selectedCity)
}, [agences, selectedCity])
```

### Modal Management
```javascript
const [isModalOpen, setIsModalOpen] = useState(false)
const [editingId, setEditingId] = useState(null)
const [itemToDelete, setItemToDelete] = useState(null)

// Open for edit
const handleEdit = (item) => {
  setForm(item)
  setEditingId(item.id)
  setIsModalOpen(true)
}

// Conditional API call
const handleSave = async () => {
  const url = editingId ? `/api/resource/${editingId}` : '/api/resource'
  const method = editingId ? 'PATCH' : 'POST'
  // Call API
}
```

---

## DROPDOWN OPTIONS

### Contract Type (`typeContrat`)
Dynamically loaded from `/api/sinistre-types` at admin load time

### City (`ville`) in Agencies
Fixed list of 24 Tunisian cities:
```
Ariana, Béja, Ben Arous, Bizerte, Gabès, Gafsa, Jendouba, 
Kairouan, Kasserine, Kébili, Le Kef, Mahdia, La Manouba, 
Médenine, Monastir, Nabeul, Sfax, Sidi Bouzid, Siliana, 
Sousse, Tataouine, Tozeur, Tunis, Zaghouan
```

### Document Type (`typeDocument`)
Auto-mapped from contract types:
```javascript
documentTypeOptions = sinistreTypes
  .map(typeItem => ({
    code: normalizeDocumentTypeCode(typeItem?.code),
    label: code
  }))
  .filter(item, index, array => 
    array.findIndex(other => other.code === item.code) === index
  )
```

### Agency Role (`roleSotadmin`)
Currently: Only `AGENT` (default)

---
