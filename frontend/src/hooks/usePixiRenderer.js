import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { useCosmosStore } from '../store/cosmosStore'
import { publish, Topics } from '../utils/stomp'
import { WORLD_CONFIG, AVATAR_CONFIG, COLORS } from '../config'
import { createUserSprite, updateUserSprite, safeColorToInt, createReactionSprite } from '../utils/pixiUtils'

export function usePixiRenderer(containerRef) {
  const appRef = useRef(null)
  const worldRef = useRef(null)
  const localSpriteRef = useRef(null)
  const userSpritesRef = useRef({})
  const linksLayerRef = useRef(null)
  const keysRef = useRef({})
  const lastEmitRef = useRef(0)
  const reactionsRef = useRef([])

  const localUser = useCosmosStore(state => state.localUser)
  const users = useCosmosStore(state => state.users)
  const connections = useCosmosStore(state => state.connections)
  const updateLocalPosition = useCosmosStore(state => state.updateLocalPosition)

  // Builds the visual environment (stars, grid, and atmosphere)
  const buildBackground = useCallback((world) => {
    const background = new PIXI.Graphics()
    background.beginFill(WORLD_CONFIG.BG_COLOR)
    background.drawRect(0, 0, WORLD_CONFIG.WIDTH, WORLD_CONFIG.HEIGHT)
    background.endFill()

    background.lineStyle(1, COLORS.DARK_BLUE, 0.3)
    for (let x = 0; x <= WORLD_CONFIG.WIDTH; x += WORLD_CONFIG.GRID_SIZE) { background.moveTo(x, 0); background.lineTo(x, WORLD_CONFIG.HEIGHT) }
    for (let y = 0; y <= WORLD_CONFIG.HEIGHT; y += WORLD_CONFIG.GRID_SIZE) { background.moveTo(0, y); background.lineTo(WORLD_CONFIG.WIDTH, y) }

    background.lineStyle(1, COLORS.ACCENT_BLUE, 0.07)
    for (let x = 0; x <= WORLD_CONFIG.WIDTH; x += WORLD_CONFIG.MAJOR_GRID_SIZE) { background.moveTo(x, 0); background.lineTo(x, WORLD_CONFIG.HEIGHT) }
    for (let y = 0; y <= WORLD_CONFIG.HEIGHT; y += WORLD_CONFIG.MAJOR_GRID_SIZE) { background.moveTo(0, y); background.lineTo(WORLD_CONFIG.WIDTH, y) }

    world.addChildAt(background, 0)

    const stars = new PIXI.Graphics()
    for (let i = 0; i < 350; i++) {
      const alpha = Math.random() * 0.6 + 0.2
      stars.beginFill(COLORS.WHITE, alpha)
      stars.drawCircle(Math.random() * WORLD_CONFIG.WIDTH, Math.random() * WORLD_CONFIG.HEIGHT, Math.random() * 1.4 + 0.3)
      stars.endFill()
    }
    world.addChild(stars)

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

  // Initialize the WebGL canvas and world container
  useEffect(() => {
    if (!containerRef.current || !localUser) return

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

    const localSprite = createUserSprite(localUser, true)
    if (localSprite) {
      world.addChild(localSprite)
      localSpriteRef.current = localSprite
    }

    const onKeyDown = event => { keysRef.current[event.key.toLowerCase()] = true; keysRef.current[event.code?.toLowerCase()] = true }
    const onKeyUp = event => { keysRef.current[event.key.toLowerCase()] = false; keysRef.current[event.code?.toLowerCase()] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const onReaction = (event) => {
      const { userId, emoji } = event.detail
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
    onResize()

    let tickCount = 0
    app.ticker.add(() => {
      tickCount++
      const keys = keysRef.current
      const sprite = localSpriteRef.current
      if (!sprite) return

      // Handle local player movement
      let deltaX = 0, deltaY = 0
      if (keys['arrowleft'] || keys['a'] || keys['keya']) deltaX -= AVATAR_CONFIG.MOVE_SPEED
      if (keys['arrowright'] || keys['d'] || keys['keyd']) deltaX += AVATAR_CONFIG.MOVE_SPEED
      if (keys['arrowup'] || keys['w'] || keys['keyw']) deltaY -= AVATAR_CONFIG.MOVE_SPEED
      if (keys['arrowdown'] || keys['s'] || keys['keys']) deltaY += AVATAR_CONFIG.MOVE_SPEED

      // Normalize diagonal speed
      if (deltaX !== 0 && deltaY !== 0) { deltaX *= 0.707; deltaY *= 0.707 }

      if (deltaX !== 0 || deltaY !== 0) {
        const newX = Math.max(AVATAR_CONFIG.RADIUS, Math.min(WORLD_CONFIG.WIDTH - AVATAR_CONFIG.RADIUS, sprite.x + deltaX))
        const newY = Math.max(AVATAR_CONFIG.RADIUS, Math.min(WORLD_CONFIG.HEIGHT - AVATAR_CONFIG.RADIUS, sprite.y + deltaY))
        sprite.position.set(newX, newY)
        updateLocalPosition(newX, newY)

        const now = Date.now()
        if (now - lastEmitRef.current > AVATAR_CONFIG.THROTTLE_MS) {
          lastEmitRef.current = now
          publish(Topics.MOVE, { x: newX, y: newY })
        }
      }

      // Smoothly interpolate remote user positions
      for (const [userId, user] of Object.entries(users)) {
        if (!localUser || userId === localUser.id) continue
        const remoteSprite = userSpritesRef.current[userId]
        if (!remoteSprite) continue
        
        remoteSprite.x += (user.x - remoteSprite.x) * AVATAR_CONFIG.LERP_ALPHA
        remoteSprite.y += (user.y - remoteSprite.y) * AVATAR_CONFIG.LERP_ALPHA
        
        updateUserSprite(remoteSprite, user, connections.has(userId))
      }

      // Follow local player with a smooth camera delay
      const screenWidth = app.renderer.width, screenHeight = app.renderer.height
      const centerX = screenWidth / 2, centerY = screenHeight / 2
      world.x += (centerX - sprite.x - world.x) * 0.08
      world.y += (centerY - sprite.y - world.y) * 0.08

      // Visual pulse for the proximity indicator
      const proximityRing = sprite.getChildByName('proximityRing')
      if (proximityRing) {
        proximityRing.clear()
        const dashCount = 60, angleStep = (Math.PI * 2) / dashCount
        const rotationOffset = tickCount * 0.01
        proximityRing.lineStyle(2, COLORS.CYAN, 0.15 + Math.sin(tickCount * 0.05) * 0.05)
        for (let i = 0; i < dashCount; i += 2) {
          const startAngle = i * angleStep + rotationOffset
          const endAngle = (i + 1) * angleStep + rotationOffset
          proximityRing.arc(0, 0, AVATAR_CONFIG.PROXIMITY_RADIUS, startAngle, endAngle)
        }
      }

      // Draw connection lines between nearby users
      const linksLayer = linksLayerRef.current
      if (linksLayer) {
        linksLayer.clear()
        for (const connectedUserId of connections) {
          const remoteSprite = userSpritesRef.current[connectedUserId]
          if (remoteSprite) {
            const user = users[connectedUserId]
            const colorInt = safeColorToInt(user?.color, COLORS.BLUE)
            linksLayer.lineStyle(1.5, colorInt, 0.2 + Math.sin(tickCount * 0.08) * 0.1)
            linksLayer.moveTo(sprite.x, sprite.y)
            linksLayer.lineTo(remoteSprite.x, remoteSprite.y)
          }
        }
      }

      // Animate atmospheric glow
      const glowEffect = sprite.getChildByName('glow')
      if (glowEffect) {
        glowEffect.alpha = 0.18 + Math.sin(tickCount * 0.04) * 0.1
        glowEffect.scale.set(1 + Math.sin(tickCount * 0.03) * 0.05)
      }

      // Manage floating reactions lifecycle
      const now = Date.now()
      reactionsRef.current = reactionsRef.current.filter(reaction => {
        const elapsed = now - reaction.startTime
        const lifetime = 1000
        if (elapsed > lifetime) {
          world.removeChild(reaction.sprite)
          return false
        }

        const progress = elapsed / lifetime
        const targetSprite = reaction.userId === localUser.id ? localSpriteRef.current : userSpritesRef.current[reaction.userId]
        
        if (targetSprite) {
          reaction.sprite.x = targetSprite.x
          reaction.sprite.y = targetSprite.y - AVATAR_CONFIG.RADIUS - 20 - (progress * 40)
        }
        
        reaction.sprite.alpha = 1 - progress
        reaction.sprite.scale.set(0.8 + Math.sin(progress * Math.PI) * 0.4)
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

  // Sync remote user list whenever the store updates
  useEffect(() => {
    const world = worldRef.current
    if (!world || !localUser) return

    const currentIds = new Set(Object.keys(users))

    for (const userId of Object.keys(userSpritesRef.current)) {
      if (!currentIds.has(userId)) {
        world.removeChild(userSpritesRef.current[userId])
        delete userSpritesRef.current[userId]
      }
    }

    for (const [userId, user] of Object.entries(users)) {
      if (userId !== localUser.id && !userSpritesRef.current[userId]) {
        const sprite = createUserSprite(user)
        if (sprite) {
          world.addChild(sprite)
          userSpritesRef.current[userId] = sprite
        }
      }
    }

    for (const [userId, user] of Object.entries(users)) {
      if (userId === localUser.id) continue
      const sprite = userSpritesRef.current[userId]
      if (sprite) updateUserSprite(sprite, user, connections.has(userId))
    }
  }, [users, connections, localUser])

  return { WORLD_WIDTH: WORLD_CONFIG.WIDTH, WORLD_HEIGHT: WORLD_CONFIG.HEIGHT }
}
