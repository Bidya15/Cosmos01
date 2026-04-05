import React from 'react'
import { useCosmosStore } from './store/cosmosStore'
import { useSocket } from './hooks/useSocket'
import JoinScreen from './components/JoinScreen'
import CosmosCanvas from './components/CosmosCanvas'
import HUD from './components/HUD'
import ChatPanel from './components/ChatPanel'
import ProximityToast from './components/ProximityToast'
import AuthScreen from './components/AuthScreen'

function CosmosApp() {
  const localUser = useCosmosStore(s => s.localUser)

  // Real-time synchronization (includes proximity events)
  useSocket(localUser)

  return (
    <div className="relative w-full h-full overflow-hidden">
      <CosmosCanvas />
      <HUD />
      <ProximityToast />
      <ChatPanel />
    </div>
  )
}

export default function App() {
  const user = useCosmosStore(s => s.user)
  const isJoined = useCosmosStore(s => s.isJoined)

  if (!user) return <AuthScreen />
  if (!isJoined) return <JoinScreen />
  return <CosmosApp />
}
