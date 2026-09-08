// Le a dimensao (largura x altura) de uma imagem a partir do cabecalho
// binario, sem dependencia externa. Suporta PNG, JPEG, GIF, BMP, WEBP.
// Retorna { largura, altura } ou null se nao reconhecer.
//
// Usado pra decidir se uma imagem inline de e-mail e assinatura/logo
// (pequena) ou conteudo de verdade (print colado, grande).

export function lerDimensaoImagem(buf) {
  if (!buf || buf.length < 24) return null

  // PNG: assinatura 89 50 4E 47 0D 0A 1A 0A, depois IHDR com w/h em BE nos
  // offsets 16 e 20.
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) }
  }

  // GIF: "GIF87a"/"GIF89a", w/h em LE nos offsets 6 e 8.
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { largura: buf.readUInt16LE(6), altura: buf.readUInt16LE(8) }
  }

  // BMP: "BM", w/h em LE nos offsets 18 e 22.
  if (buf[0] === 0x42 && buf[1] === 0x4d) {
    return { largura: buf.readUInt32LE(18), altura: Math.abs(buf.readInt32LE(22)) }
  }

  // JPEG: FF D8, varrer segmentos ate um SOF (FFC0..FFC3, FFC5..FFC7,
  // FFC9..FFCB, FFCD..FFCF). Altura no offset+5, largura no offset+7 (BE).
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) { off++; continue }
      const marcador = buf[off + 1]
      // SOF markers
      if (
        (marcador >= 0xc0 && marcador <= 0xc3) ||
        (marcador >= 0xc5 && marcador <= 0xc7) ||
        (marcador >= 0xc9 && marcador <= 0xcb) ||
        (marcador >= 0xcd && marcador <= 0xcf)
      ) {
        const altura = buf.readUInt16BE(off + 5)
        const largura = buf.readUInt16BE(off + 7)
        return { largura, altura }
      }
      // Marcadores sem payload (RSTn, SOI, EOI, TEM)
      if (marcador === 0xd8 || marcador === 0xd9 || (marcador >= 0xd0 && marcador <= 0xd7) || marcador === 0x01) {
        off += 2
        continue
      }
      // Segmento com tamanho
      const tam = buf.readUInt16BE(off + 2)
      if (tam < 2) break
      off += 2 + tam
    }
    return null
  }

  // WEBP: "RIFF"...."WEBP". VP8 / VP8L / VP8X.
  if (
    buf.length >= 30 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    const fmt = buf.toString('ascii', 12, 16)
    if (fmt === 'VP8 ') {
      // frame tag em 23..25 (LE 14 bits cada, com escala 0x3FFF)
      const largura = buf.readUInt16LE(26) & 0x3fff
      const altura = buf.readUInt16LE(28) & 0x3fff
      return { largura, altura }
    }
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21)
      return { largura: (b & 0x3fff) + 1, altura: ((b >> 14) & 0x3fff) + 1 }
    }
    if (fmt === 'VP8X') {
      const largura = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16))
      const altura = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16))
      return { largura, altura }
    }
  }

  return null
}
