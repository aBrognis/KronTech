import { LayoutGrid } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

// Resolve o nome de ícone salvo (kebab-case, ex: "credit-card") pro
// componente Lucide correspondente (PascalCase, ex: CreditCard). Usado por
// TelasPage.jsx e ModulosPage.jsx para o mesmo propósito: ícone de tela ou
// módulo do Designer.
export default function TilaIcon({ nome, size = 15, cor = 'var(--or)' }) {
  const key  = (nome || 'layout').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  const Icon = LucideIcons[key] || LayoutGrid
  return <Icon size={size} color={cor} />
}
