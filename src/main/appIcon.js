import { nativeImage, nativeTheme } from 'electron'
import { join } from 'path'

// Compartilhado entre a janela principal e a janela do Designer, para que
// ambas usem o mesmo ícone do KronTech (em vez do ícone padrão do Electron)
// e acompanhem o tema claro/escuro do Windows.
//
// O ícone é neutro (cinza-azulado), não a cor de destaque personalizável:
// testado exaustivamente (setIcon() em runtime, arquivo .ico real gravado em
// disco + relaunch, reinstalação completa, e até reinício do Explorer/
// IconCache do Windows) e a barra de tarefas do Windows não reflete um ícone
// dinâmico de forma confiável — só a janela/Alt+Tab mudam. Um ícone neutro
// combina com qualquer cor de personalização escolhida, sem essa limitação.
export function getIcon() {
  const name = nativeTheme.shouldUseDarkColors ? 'icon.ico' : 'icon-light.ico'
  return nativeImage.createFromPath(join(__dirname, '../../resources', name))
}
