import React, { useRef, useEffect } from 'react'
import { usePixiRenderer } from '../hooks/usePixiRenderer'
import { useCosmosStore } from '../store/cosmosStore'

export default function CosmosCanvas() {
  const containerRef = useRef(null)
  const localUser = useCosmosStore(s => s.localUser)
  
  usePixiRenderer(containerRef)

  return (
    <div
      ref={containerRef}
      id="cosmos-canvas"
      className="absolute inset-0 w-full h-full"
      tabIndex={0}
      style={{ outline: 'none', cursor: 'default' }}
    />
  )
}
