// Ícones Lucide: conversão de nomes e componente genérico
import * as LucideIcons from 'lucide-react'

export function toPascal(s) {
  return (s || '').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}
export function toKebab(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function LucideIcon({ name, size = 16, color, strokeWidth = 1.75 }) {
  if (!name) return null
  // Sempre converter para PascalCase (bug fix: 'gauge' → 'Gauge')
  const pascal = toPascal(name)
  const Icon = LucideIcons[pascal]
  if (Icon) return <Icon size={size} color={color} strokeWidth={strokeWidth} />
  // Fallback emoji
  if (name.length <= 2) return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{name}</span>
  return <span style={{ fontSize: size * 0.65, fontWeight: 700, color: color || 'currentColor' }}>{name.charAt(0).toUpperCase()}</span>
}

// Retorna todos os nomes de ícones Lucide disponíveis (kebab-case)
export function getAllIcons() {
  return Object.entries(LucideIcons)
    .filter(([k, v]) => v && /^[A-Z]/.test(k) && k !== 'createLucideIcon')
    .map(([k]) => toKebab(k))
    .sort()
}
