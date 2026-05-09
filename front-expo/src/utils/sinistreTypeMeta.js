export const DEFAULT_SINISTRE_TYPES = [
  {
    code: 'AUTO',
    label: 'Accident automobile',
    labelEn: 'Car accident',
    pageKicker: 'Ma voiture',
    pageKickerEn: 'My car'
  },
  {
    code: 'HABITATION',
    label: 'Sinistre habitation',
    labelEn: 'Home claim',
    pageKicker: 'Mon habitation',
    pageKickerEn: 'My home'
  },
  {
    code: 'VOYAGE',
    label: 'Sinistre voyage',
    labelEn: 'Travel claim',
    pageKicker: 'Mon voyage',
    pageKickerEn: 'My travel'
  },
  {
    code: 'PREVOYANCE',
    label: 'Sinistre prevoyance',
    labelEn: 'Life claim',
    pageKicker: 'Ma prevoyance',
    pageKickerEn: 'My life coverage'
  }
]

const stripDiacritics = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const normalizeTypeCode = (value) => stripDiacritics(value)
  .trim()
  .toUpperCase()
  .replace(/\s+/g, '_')
  .replace(/[^A-Z0-9_]/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '')

export const normalizeTypeToken = (value) => stripDiacritics(value)
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ')

export const normalizeSinistreTypes = (types) => {
  const source = Array.isArray(types) ? types : []

  const normalized = source
    .map((item) => ({
      ...item,
      code: normalizeTypeCode(item?.code),
      label: String(item?.label || '').trim(),
      labelEn: String(item?.labelEn || '').trim(),
      pageKicker: String(item?.pageKicker || '').trim(),
      pageKickerEn: String(item?.pageKickerEn || '').trim()
    }))
    .filter((item) => item.code && (item.label || item.labelEn))

  return normalized.length > 0 ? normalized : DEFAULT_SINISTRE_TYPES
}

export const getSinistreRoute = (code) => `/sinistre/${encodeURIComponent(normalizeTypeCode(code) || 'AUTO')}`

export const getDeclarationRoute = (code) => `/declaration-sinistre?type=${encodeURIComponent(normalizeTypeCode(code) || 'AUTO')}`

export const getProductRoute = (code) => {
  const normalized = normalizeTypeCode(code)
  if (normalized === 'AUTO') return '/ma-voiture'
  if (normalized === 'HABITATION') return '/mon-habitation'
  if (normalized === 'VOYAGE') return '/mon-voyage'
  if (normalized === 'PREVOYANCE') return '/ma-prevoyance'
  return '/profile'
}

const DISPLAY_LABEL_BY_CODE = {
  fr: {
    AUTO: 'Ma voiture',
    HABITATION: 'Mon habitation',
    VOYAGE: 'Mon voyage',
    PREVOYANCE: 'Ma prevoyance'
  },
  en: {
    AUTO: 'My car',
    HABITATION: 'My home',
    VOYAGE: 'My travel',
    PREVOYANCE: 'My life coverage'
  }
}

const isEnglish = (language) => String(language || 'fr').toLowerCase().startsWith('en')

const getLocalizedTypeText = (typeItem, frKey, enKey, language) => {
  const useEn = isEnglish(language)
  return String(typeItem?.[useEn ? enKey : frKey] || '').trim()
}

export const getSinistreDisplayLabel = (typeItem, language = 'fr') => {
  const customDisplayLabel = getLocalizedTypeText(typeItem, 'pageKicker', 'pageKickerEn', language)
  if (customDisplayLabel) {
    return customDisplayLabel
  }

  const code = normalizeTypeCode(typeItem?.code)
  const labelsByCode = isEnglish(language) ? DISPLAY_LABEL_BY_CODE.en : DISPLAY_LABEL_BY_CODE.fr
  if (labelsByCode[code]) {
    return labelsByCode[code]
  }

  const label = getLocalizedTypeText(typeItem, 'label', 'labelEn', language)
  return label || code || (isEnglish(language) ? 'Claim type' : 'Type sinistre')
}

const CONTRACT_ALIASES_BY_CODE = {
  AUTO: ['auto', 'automobile', 'voiture', 'vehicule'],
  HABITATION: ['habitation', 'logement', 'maison', 'home'],
  VOYAGE: ['voyage', 'travel'],
  PREVOYANCE: ['prevoyance', 'protection', 'life']
}

export const matchContractToSinistreType = (contractType, typeItem) => {
  const contract = normalizeTypeToken(contractType)
  if (!contract) {
    return false
  }

  const code = normalizeTypeCode(typeItem?.code)
  const label = normalizeTypeToken(typeItem?.label)
  const labelEn = normalizeTypeToken(typeItem?.labelEn)
  const aliases = CONTRACT_ALIASES_BY_CODE[code] || []

  if (aliases.some((alias) => contract.includes(alias) || alias.includes(contract))) {
    return true
  }

  if (label && (contract.includes(label) || label.includes(contract))) {
    return true
  }

  if (labelEn && (contract.includes(labelEn) || labelEn.includes(contract))) {
    return true
  }

  if (code) {
    const codeAsWord = normalizeTypeToken(code.replace(/_/g, ' '))
    if (codeAsWord && (contract.includes(codeAsWord) || codeAsWord.includes(contract))) {
      return true
    }
  }

  return false
}
