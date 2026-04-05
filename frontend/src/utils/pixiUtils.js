import * as PIXI from 'pixi.js'
import { AVATAR_CONFIG, COLORS } from '../config'

/**
 * Safely parses a hex color string into a PIXI-compatible integer.
 * Prevents ticker crashes from malformed color data.
 * 
 * @param {string} hex The color hex (e.g., "#ffffff" or "0xffffff")
 * @param {number} fallback The fallback color integer
 * @returns {number} The parsed color integer
 */
export const safeColorToInt = (hex, fallback = COLORS.BLUE) => {
  if (!hex || typeof hex !== 'string') return fallback
  try {
    const cleanHex = hex.replace('#', '').replace('0x', '')
    const parsed = parseInt(cleanHex, 16)
    return isNaN(parsed) ? fallback : parsed
  } catch (e) {
    return fallback
  }
}

/**
 * Creates a visually rich PixiJS Container for a user avatar.
 * Includes proximity rings, glow effects, and labels.
 * 
 * @param {Object} user User data from the store
 * @param {boolean} isLocal Whether this is the local reactive user
 * @returns {PIXI.Container} The composite avatar container
 */
export const createUserSprite = (user, isLocal = false) => {
  const container = new PIXI.Container()
  const colorInt = safeColorToInt(user.color, COLORS.BLUE)

  // 1. Proximity Indicator (Local Only)
  if (isLocal) {
    const ring = new PIXI.Graphics()
    ring.name = 'proximityRing'
    container.addChild(ring)
  }

  // 2. Active Connection Indicator (Ring)
  const connRing = new PIXI.Graphics()
  connRing.name = 'connectionRing'
  connRing.visible = false
  container.addChild(connRing)

  // 3. Ambient Glow
  const glow = new PIXI.Graphics()
  glow.beginFill(colorInt, 0.15)
  glow.drawCircle(0, 0, AVATAR_CONFIG.RADIUS + 10)
  glow.endFill()
  glow.name = 'glow'
  container.addChild(glow)

  // 4. Core Avatar Circle
  const circle = new PIXI.Graphics()
  circle.beginFill(colorInt, 0.9)
  circle.lineStyle(2, COLORS.WHITE, 0.25)
  circle.drawCircle(0, 0, AVATAR_CONFIG.RADIUS)
  circle.endFill()
  container.addChild(circle)

  // 5. Initial Character
  const safeName = user.username || 'Explorer'
  const initialChar = (safeName[0] || '?').toUpperCase()
  const initial = new PIXI.Text(initialChar, new PIXI.TextStyle({
    fontFamily: 'Space Mono, monospace',
    fontSize: 14,
    fontWeight: 'bold',
    fill: COLORS.WHITE,
  }))
  initial.anchor.set(0.5)
  container.addChild(initial)

  // 6. Username Label
  const label = new PIXI.Text(isLocal ? `${safeName} (you)` : safeName, new PIXI.TextStyle({
    fontFamily: 'Space Mono, monospace',
    fontSize: 10,
    fill: isLocal ? COLORS.CYAN : 0xe2e8f0,
    align: 'center',
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 6,
    dropShadowDistance: 1,
  }))
  label.anchor.set(0.5, 0)
  label.position.set(0, AVATAR_CONFIG.RADIUS + 7)
  label.name = 'label'
  container.addChild(label)

  container.position.set(user.x, user.y)
  return container
}

/**
 * Updates an existing avatar sprite based on connection state.
 */
export const updateUserSprite = (sprite, user, isConnected) => {
  if (!sprite) return
  
  const connRing = sprite.getChildByName('connectionRing')
  if (connRing) {
    connRing.clear()
    if (isConnected) {
      const c = safeColorToInt(user.color, COLORS.BLUE)
      connRing.lineStyle(2.5, c, 0.9)
      connRing.drawCircle(0, 0, AVATAR_CONFIG.RADIUS + 16)
      connRing.visible = true
    } else {
      connRing.visible = false
    }
  }

  const glow = sprite.getChildByName('glow')
  if (glow) glow.alpha = isConnected ? 0.5 : 0.15
}
