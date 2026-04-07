import * as PIXI from 'pixi.js'
import { AVATAR_CONFIG, COLORS } from '../config'

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

export const createUserSprite = (user, isLocal = false) => {
  const container = new PIXI.Container()
  const colorInt = safeColorToInt(user.color, COLORS.BLUE)

  if (isLocal) {
    const ring = new PIXI.Graphics()
    ring.name = 'proximityRing'
    container.addChild(ring)
  }

  const connRing = new PIXI.Graphics()
  connRing.name = 'connectionRing'
  connRing.visible = false
  container.addChild(connRing)

  const glow = new PIXI.Graphics()
  glow.beginFill(colorInt, 0.15)
  glow.drawCircle(0, 0, AVATAR_CONFIG.RADIUS + 10)
  glow.endFill()
  glow.name = 'glow'
  container.addChild(glow)

  const circle = new PIXI.Graphics()
  circle.beginFill(colorInt, 0.9)
  circle.lineStyle(2, COLORS.WHITE, 0.25)
  circle.drawCircle(0, 0, AVATAR_CONFIG.RADIUS)
  circle.endFill()
  container.addChild(circle)

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

export const createReactionSprite = (emoji) => {
  const text = new PIXI.Text(emoji, new PIXI.TextStyle({
    fontSize: 28,
    align: 'center',
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 4,
    dropShadowDistance: 2,
  }))
  text.anchor.set(0.5)
  return text
}
