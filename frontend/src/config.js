export const WORLD_CONFIG = {
  WIDTH: 2400,
  HEIGHT: 1800,
  BG_COLOR: 0x050811,
  GRID_SIZE: 80,
  MAJOR_GRID_SIZE: 400,
}

export const AVATAR_CONFIG = {
  RADIUS: 24,
  MOVE_SPEED: 3.5,
  THROTTLE_MS: 40,
  LERP_ALPHA: 0.15,
  PROXIMITY_RADIUS: 150,
}

export const COLORS = {
  CYAN: 0x06b6d4,
  BLUE: 0x3b82f6,
  DARK_BLUE: 0x1a2d54,
  ACCENT_BLUE: 0x2563eb,
  WHITE: 0xffffff,
  FALLBACK_USER: '#3b82f6',
}

export const COLORS_ARRAY = [
  "#3b82f6", "#06b6d4", "#818cf8", "#f59e0b", "#10b981", 
  "#ef4444", "#8b5cf6", "#f97316", "#14b8a6", "#e879f9"
]

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
export const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080'
