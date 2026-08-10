import { nativeImage, nativeTheme } from 'electron'
import { join } from 'path'

// Compartilhado entre a janela principal e a janela do Designer, para que
// ambas usem o mesmo ícone do KronTech (em vez do ícone padrão do Electron)
// e acompanhem o tema claro/escuro do Windows.
export function getIcon() {
  const name = nativeTheme.shouldUseDarkColors ? 'icon.ico' : 'icon-light.ico'
  return nativeImage.createFromPath(join(__dirname, '../../resources', name))
}
