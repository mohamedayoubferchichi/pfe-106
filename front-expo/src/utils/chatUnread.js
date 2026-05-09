const STORAGE_PREFIX = 'assurgo:chat:lastSeen:'
const seenMap = new Map()

const normalizeRole = (role) => String(role || '').trim().toUpperCase()

const getConversationKey = (userId, partnerId) => [String(userId || '').trim(), String(partnerId || '').trim()].sort().join('::')

const getSeenStorageKey = (userId, partnerId) => `${STORAGE_PREFIX}${getConversationKey(userId, partnerId)}`

const parseTimestamp = (value) => {
  const time = new Date(value || 0).getTime()
  return Number.isNaN(time) ? 0 : time
}

export const getConversationSeenAt = (userId, partnerId) => {
  const key = getSeenStorageKey(userId, partnerId)

  if (typeof globalThis !== 'undefined' && globalThis?.localStorage) {
    return Number(globalThis.localStorage.getItem(key) || 0)
  }

  return Number(seenMap.get(key) || 0)
}

export const markConversationAsSeen = (userId, partnerId, timestamp) => {
  const key = getSeenStorageKey(userId, partnerId)
  const seenAt = parseTimestamp(timestamp) || Date.now()

  if (typeof globalThis !== 'undefined' && globalThis?.localStorage) {
    globalThis.localStorage.setItem(key, String(seenAt))
    return
  }

  seenMap.set(key, seenAt)
}

export const getUnreadStatsByPartner = (messages, userId, allowedRoles = []) => {
  const currentUserId = String(userId || '').trim()
  if (!currentUserId || !Array.isArray(messages)) {
    return {}
  }

  const allowed = allowedRoles.length > 0 ? allowedRoles.map(normalizeRole) : null
  const stats = {}

  messages.forEach((message) => {
    const senderId = String(message?.senderId || '').trim()
    const receiverId = String(message?.receiverId || '').trim()
    if (!senderId || receiverId !== currentUserId || senderId === currentUserId) {
      return
    }

    const senderRole = normalizeRole(message?.senderRole)
    if (allowed && !allowed.includes(senderRole)) {
      return
    }

    const messageTime = parseTimestamp(message?.createdAt)
    if (!messageTime) {
      return
    }

    const seenAt = getConversationSeenAt(currentUserId, senderId)
    if (messageTime > seenAt) {
      stats[senderId] = (stats[senderId] || 0) + 1
    }
  })

  return stats
}

export const getUnreadTotal = (stats) => Object.values(stats || {}).reduce((sum, count) => sum + count, 0)