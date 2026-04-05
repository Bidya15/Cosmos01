export function getDistance(user1, user2) {
  const dx = user1.x - user2.x
  const dy = user1.y - user2.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function isInProximity(user1, user2, radius) {
  return getDistance(user1, user2) < radius
}

export function detectProximityChanges(localUser, users, currentConnections, radius) {
  const entered = []
  const left = []

  for (const [userId, user] of Object.entries(users)) {
    if (userId === localUser.id) continue

    const inProximity = isInProximity(localUser, user, radius)
    const wasConnected = currentConnections.has(userId)

    if (inProximity && !wasConnected) {
      entered.push(userId)
    } else if (!inProximity && wasConnected) {
      left.push(userId)
    }
  }

  return { entered, left }
}

export function getProximityRatio(user1, user2, radius) {
  const dist = getDistance(user1, user2)
  return Math.max(0, Math.min(1, 1 - dist / radius))
}
