import { authenticator } from 'otplib'
import QRCode from 'qrcode'

const PERIODO_SEGUNDOS = 30

// Gera um secret novo (base32, RFC 4226/6238) — usado quando o usuário
// clica "Gerar nova chave" pela primeira vez num registro.
export function gerarSecret() {
  return authenticator.generateSecret()
}

// Código de 6 dígitos atual + segundos restantes até o próximo, calculado
// sempre no main — nunca reimplementado no renderer (evita duplicar
// HMAC/base32 no bundle do frontend).
export function gerarCodigoAtual(secret) {
  const codigo = authenticator.generate(secret)
  const segundosDecorridos = Math.floor(Date.now() / 1000) % PERIODO_SEGUNDOS
  return { codigo, segundosRestantes: PERIODO_SEGUNDOS - segundosDecorridos }
}

// QR code sempre gerado on-the-fly (dataURL, nunca salvo em disco) — evita
// duplicar o segredo TOTP em mais um lugar além do campo cifrado no banco.
export async function gerarQrCodeDataUrl(secret, label, issuer = 'KronTech') {
  const uri = authenticator.keyuri(label || 'credencial', issuer, secret)
  return QRCode.toDataURL(uri)
}
