import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { useCosmosStore } from '../store/cosmosStore'
import { publish, Topics } from '../utils/stomp'
import { WORLD_CONFIG, AVATAR_CONFIG, COLORS } from '../config'
import { createUserSprite, updateUserSprite, safeColorToInt, createReactionSprite } from '../utils/pixiUtils'

/**
 * Main PixiJS rendering hook for the Cosmos virtual interaction space.
 * Manages the WebGL lifecycle, local user input, and per-frame interpolation for remote users.
 * 
 * @param {React.MutableRefObject} containerRef Div reference for the PixiJS canvas
 */
export function usePixiRenderer(containerRef) {
  const appRef = useRef(null)
  const worldRef = useRef(null)
  const localSpriteRef = useRef(null)
  const userSpritesRef = useRef({})
  const linksLayerRef = useRef(null)
  const keysRef = useRef({})
  const lastEmitRef = useRef(0)
  const reactionsRef = useRef([]) // { sprite, startTime, userId }

  const localUser = useCosmosStore(s => s.localUser)
  const users = useCosmosStore(s => s.users)
  const connections = useCosmosStore(s => s.connections)
  const updateLocalPosition = useCosmosStore(s => s.updateLocalPosition)

  /**
   * Builds the cosmic background layer with stars, nebulas, and grids.
   */
  const buildBackground = useCallback((world) => {
    const bg = new PIXI.Graphics()
    bg.beginFill(WORLD_CONFIG.BG_COLOR)
    bg.drawRect(0, 0, WORLD_CONFIG.WIDTH, WORLD_CONFIG.HEIGHT)
    bg.endFill()

    // Grid System
    bg.lineStyle(1, COLORS.DARK_BLUE, 0.3)
    for (let x = 0; x <= WORLD_CONFIG.WIDTH; x += WORLD_CONFIG.GRID_SIZE) { bg.moveTo(x, 0); bg.lineTo(x, WORLD_CONFIG.HEIGHT) }
    for (let y = 0; y <= WORLD_CONFIG.HEIGHT; y += WORLD_CONFIG.GRID_SIZE) { bg.moveTo(0, y); bg.lineTo(WORLD_CONFIG.WIDTH, y) }

    bg.lineStyle(1, COLORS.ACCENT_BLUE, 0.07)
    for (let x = 0; x <= WORLD_CONFIG.WIDTH; x += WORLD_CONFIG.MAJOR_GRID_SIZE) { bg.moveTo(x, 0); bg.lineTo(x, WORLD_CONFIG.HEIGHT) }
    for (let y = 0; y <= WORLD_CONFIG.HEIGHT; y += WORLD_CONFIG.MAJOR_GRID_SIZE) { bg.moveTo(0, y); bg.lineTo(WORLD_CONFIG.WIDTH, y) }

    world.addChildAt(bg, 0)

    // Cosmic Atmosphere (Stars)
    const stars = new PIXI.Graphics()
    for (let i = 0; i < 350; i++) {
      const alpha = Math.random() * 0.6 + 0.2
      stars.beginFill(COLORS.WHITE, alpha)
      stars.drawCircle(Math.random() * WORLD_CONFIG.WIDTH, Math.random() * WORLD_CONFIG.HEIGHT, Math.random() * 1.4 + 0.3)
      stars.endFill()
    }
    world.addChild(stars)

    // Nebulae
    const nebulaColors = [0x2563eb, 0x06b6d4, 0x818cf8, 0x1d4ed8, 0x0891b2]
    for (let i = 0; i < 7; i++) {
      const g = new PIXI.Graphics()
      g.beginFill(nebulaColors[i % nebulaColors.length], 0.04)
      g.drawEllipse(0, 0, 150 + Math.random() * 320, 80 + Math.random() * 220)
      g.endFill()
      g.position.set(Math.random() * WORLD_CONFIG.WIDTH, Math.random() * WORLD_CONFIG.HEIGHT)
      g.rotation = Math.random() * Math.PI
      world.addChild(g)
    }

    const border = new PIXI.Graphics()
    border.lineStyle(2, COLORS.ACCENT_BLUE, 0.5)
    border.drawRect(0, 0, WORLD_CONFIG.WIDTH, WORLD_CONFIG.HEIGHT)
    world.addChild(border)
  }, [])

  // 1. LIFECYCLE: Initialization
  useEffect(() => {
    if (!containerRef.current || !localUser) return

    // Create Application with explicit resizing awareness
    const app = new PIXI.Application({
      width: containerRef.current.clientWidth || window.innerWidth,
      height: containerRef.current.clientHeight || window.innerHeight,
      backgroundColor: WORLD_CONFIG.BG_COLOR,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    
    containerRef.current.appendChild(app.view)
    appRef.current = app

    const world = new PIXI.Container()
    app.stage.addChild(world)
    worldRef.current = world

    buildBackground(world)

    const linksLayer = new PIXI.Graphics()
    world.addChild(linksLayer)
    linksLayerRef.current = linksLayer

    // Initialize Local Avatar
    const localSprite = createUserSprite(localUser, true)
    if (localSprite) {
      world.addChild(localSprite)
      localSpriteRef.current = localSprite
    }

    // Input handlers
    const onKeyDown = e => { keysRef.current[e.key.toLowerCase()] = true; keysRef.current[e.code?.toLowerCase()] = true }
    const onKeyUp = e => { keysRef.current[e.key.toLowerCase()] = false; keysRef.current[e.code?.toLowerCase()] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const onReaction = (e) => {
      const { userId, emoji } = e.detail
      const world = worldRef.current
      if (!world) return
      
      const reactionSprite = createReactionSprite(emoji)
      world.addChild(reactionSprite)
      reactionsRef.current.push({
        sprite: reactionSprite,
        startTime: Date.now(),
        userId
      })
    }
    window.addEventListener('cosmos:reaction', onReaction)

    const onResize = () => {
      if (!containerRef.current || !appRef.current) return
      const { clientWidth, clientHeight } = containerRef.current
      if (clientWidth > 0 && clientHeight > 0) {
        appRef.current.renderer.resize(clientWidth, clientHeight)
      }
    }
    window.addEventListener('resize', onResize)
    onResize() // Force immediately

    // 2. TICKER: Animation Loop (60 FPS)
    let tick = 0
    app.ticker.add(() => {
      tick++
      const keys = keysRef.current
      const sprite = localSpriteRef.current
      if (!sprite) return

      // --- Local User Movement ---
      let dx = 0, dy = 0
      if (keys['arrowleft'] || keys['a'] || keys['keya']) dx -= AVATAR_CONFIG.MOVE_SPEED
      if (keys['arrowright'] || keys['d'] || keys['keyd']) dx += AVATAR_CONFIG.MOVE_SPEED
      if (keys['arrowup'] || keys['w'] || keys['keyw']) dy -= AVATAR_CONFIG.MOVE_SPEED
      if (keys['arrowdown'] || keys['s'] || keys['keys']) dy += AVATAR_CONFIG.MOVE_SPEED

      if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }

      if (dx !== 0 || dy !== 0) {
        const newX = Math.max(AVATAR_CONFIG.RADIUS, Math.min(WORLD_CONFIG.WIDTH - AVATAR_CONFIG.RADIUS, sprite.x + dx))
        const newY = Math.max(AVATAR_CONFIG.RADIUS, Math.min(WORLD_CONFIG.HEIGHT - AVATAR_CONFIG.RADIUS, sprite.y + dy))
        sprite.position.set(newX, newY)
        updateLocalPosition(newX, newY)

        const now = Date.now()
        if (now - lastEmitRef.current > AVATAR_CONFIG.THROTTLE_MS) {
          lastEmitRef.current = now
          publish(Topics.MOVE, { x: newX, y: newY })
        }
      }

      // --- Remote User Interpolation ---
      for (const [uid, user] of Object.entries(users)) {
        if (!localUser || uid === localUser.id) continue
        const remoteSprite = userSpritesRef.current[uid]
        if (!remoteSprite) continue
        
        remoteSprite.x += (user.x - remoteSprite.x) * AVATAR_CONFIG.LERP_ALPHA
        remoteSprite.y += (user.y - remoteSprite.y) * AVATAR_CONFIG.LERP_ALPHA
        
        updateUserSprite(remoteSprite, user, connections.has(uid))
      }

      // --- Camera ---
      const sw = app.renderer.width, sh = app.renderer.height
      const cx = sw / 2, cy = sh / 2
      world.x += (cx - sprite.x - world.x) * 0.08
      world.y += (cy - sprite.y - world.y) * 0.08

      // Visual Effects (Safe Access)
      const ring = sprite.getChildByName('proximityRing')
      if (ring) {
        ring.clear()
        const dashCount = 60, angleStep = (Math.PI * 2) / dashCount
        const rotationOffset = tick * 0.01
        ring.lineStyle(2, COLORS.CYAN, 0.15 + Math.sin(tick * 0.05) * 0.05)
        for (let i = 0; i < dashCount; i += 2) {
          const startAngle = i * angleStep + rotationOffset
          const endAngle = (i + 1) * angleStep + rotationOffset
          ring.arc(0, 0, AVATAR_CONFIG.PROXIMITY_RADIUS, startAngle, endAngle)
        }
      }

      const links = linksLayerRef.current
      if (links) {
        links.clear()
        for (const uid of connections) {
          const other = userSpritesRef.current[uid]
          if (other) {
            const user = users[uid]
            const colorInt = safeColorToInt(user?.color, COLORS.BLUE)
            links.lineStyle(1.5, colorInt, 0.2 + Math.sin(tick * 0.08) * 0.1)
            links.moveTo(sprite.x, sprite.y)
            links.lineTo(other.x, other.y)
          }
        }
      }

      const glow = sprite.getChildByName('glow')
      if (glow) {
        glow.alpha = 0.18 + Math.sin(tick * 0.04) * 0.1
        glow.scale.set(1 + Math.sin(tick * 0.03) * 0.05)
      }

      // --- Reactions Animation ---
      const now = Date.now()
      reactionsRef.current = reactionsRef.current.filter(r => {
        const elapsed = now - r.startTime
        const life = 1000 // 1 second lifetime
        if (elapsed > life) {
          world.removeChild(r.sprite)
          return false
        }

        const progress = elapsed / life
        const targetSprite = r.userId === localUser.id ? localSpriteRef.current : userSpritesRef.current[r.userId]
        
        if (targetSprite) {
          r.sprite.x = targetSprite.x
          r.sprite.y = targetSprite.y - AVATAR_CONFIG.RADIUS - 20 - (progress * 40)
        }
        
        r.sprite.alpha = 1 - progress
        r.sprite.scale.set(0.8 + Math.sin(progress * Math.PI) * 0.4)
        return true
      })
    })

    return () => {
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('cosmos:reaction', onReaction)
      if (appRef.current) appRef.current.destroy(true, { children: true })
      appRef.current = null; worldRef.current = null; localSpriteRef.current = null; userSpritesRef.current = {}
    }
  }, [localUser?.id])

  // 3. EFFECT: Sync remote users (Add/Remove)
  useEffect(() => {
    const world = worldRef.current
    if (!world || !localUser) return

    const currentIds = new Set(Object.keys(users))

    // Cleanup stale sprites
    for (const uid of Object.keys(userSpritesRef.current)) {
      if (!currentIds.has(uid)) {
        world.removeChild(userSpritesRef.current[uid])
        delete userSpritesRef.current[uid]
      }
    }

    // Add new remote users
    for (const [uid, user] of Object.entries(users)) {
      if (uid !== localUser.id && !userSpritesRef.current[uid]) {
        const sprite = createUserSprite(user)
        if (sprite) {
          world.addChild(sprite)
          userSpritesRef.current[uid] = sprite
        }
      }
    }

    // Update visibility/visuals for all
    for (const [uid, user] of Object.entries(users)) {
      if (uid === localUser.id) continue
      const sprite = userSpritesRef.current[uid]
      if (sprite) updateUserSprite(sprite, user, connections.has(uid))
    }
  }, [users, connections, localUser])

  return { WORLD_WIDTH: WORLD_CONFIG.WIDTH, WORLD_HEIGHT: WORLD_CONFIG.HEIGHT }
}
