import * as PIXI from 'pixi.js'
import { AVATAR_CONFIG, COLORS } from '../config'

// Converts a hex color string to a PixiJS-ready integer safely
export const safeColorToInt = (hex, fallback = COLORS.BLUE) => {
  if (!hex || typeof hex !== 'string') return fallback
  try {
    const cleanHex = hex.replace('#', '').replace('0x', '')
    const parsed = parseInt(cleanHex, 16)
    return isNaN(parsed) ? fallback : parsed
  } catch (error) {
    return fallback
  }
}

// Creates a composite PixiJS container representing a user avatar
export const createUserSprite = (user, isLocal = false) => {
  const container = new PIXI.Container()
  const colorInt = safeColorToInt(user.color, COLORS.BLUE)

  // Radar-like ring for the local user
  if (isLocal) {
    const proximityRing = new PIXI.Graphics()
    proximityRing.name = 'proximityRing'
    container.addChild(proximityRing)
  }

  // Connection indicator that appears when users are within range
  const connectionRing = new PIXI.Graphics()
  connectionRing.name = 'connectionRing'
  connectionRing.visible = false
  container.addChild(connectionRing)

  // Soft ambient glow surrounding the avatar
  const glowEffect = new PIXI.Graphics()
  glowEffect.beginFill(colorInt, 0.15)
  glowEffect.drawCircle(0, 0, AVATAR_CONFIG.RADIUS + 10)
  glowEffect.endFill()
  glowEffect.name = 'glow'
  container.addChild(glowEffect)

  // The main solid body of the avatar
  const mainCircle = new PIXI.Graphics()
  mainCircle.beginFill(colorInt, 0.9)
  mainCircle.lineStyle(2, COLORS.WHITE, 0.25)
  mainCircle.drawCircle(0, 0, AVATAR_CONFIG.RADIUS)
  mainCircle.endFill()
  container.addChild(mainCircle)

  // Display the first letter of the username inside the avatar
  const safeName = user.username || 'Explorer'
  const initialChar = (safeName[0] || '?').toUpperCase()
  const initialText = new PIXI.Text(initialChar, new PIXI.TextStyle({
    fontFamily: 'Space Mono, monospace',
    fontSize: 14,
    fontWeight: 'bold',
    fill: COLORS.WHITE,
  }))
  initialText.anchor.set(0.5)
  container.addChild(initialText)

  // Username label positioned below the avatar
  const nameLabel = new PIXI.Text(isLocal ? `${safeName} (you)` : safeName, new PIXI.TextStyle({
    fontFamily: 'Space Mono, monospace',
    fontSize: 10,
    fill: isLocal ? COLORS.CYAN : 0xe2e8f0,
    align: 'center',
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 6,
    dropShadowDistance: 1,
  }))
  nameLabel.anchor.set(0.5, 0)
  nameLabel.position.set(0, AVATAR_CONFIG.RADIUS + 7)
  nameLabel.name = 'label'
  container.addChild(nameLabel)

  container.position.set(user.x, user.y)
  return container
}

// Updates visual states (like connection rings) for a sprite
export const updateUserSprite = (sprite, user, isConnected) => {
  if (!sprite) return
  
  const connectionRing = sprite.getChildByName('connectionRing')
  if (connectionRing) {
    connectionRing.clear()
    if (isConnected) {
      const colorInt = safeColorToInt(user.color, COLORS.BLUE)
      connectionRing.lineStyle(2.5, colorInt, 0.9)
      connectionRing.drawCircle(0, 0, AVATAR_CONFIG.RADIUS + 16)
      connectionRing.visible = true
    } else {
      connectionRing.visible = false
    }
  }

  const glow = sprite.getChildByName('glow')
  if (glow) glow.alpha = isConnected ? 0.5 : 0.15
}

// Creates a temporary text sprite for reactions (emojis)
export const createReactionSprite = (emoji) => {
  const reactionText = new PIXI.Text(emoji, new PIXI.TextStyle({
    fontSize: 28,
    align: 'center',
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 4,
    dropShadowDistance: 2,
  }))
  reactionText.anchor.set(0.5)
  return reactionText
}
