import QRCode from 'qrcode'

const WIDTH = 600
const HEIGHT = 750
const QR_SIZE = 340
const GREEN = '#16a34a'
const GREEN_DARK = '#166534'
const GREEN_LIGHT = '#86efac'

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function renderShareCard(
  exportText: string,
  missingCount: number,
  duplicateCount: number
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!

  const scale = (n: number) => Math.round(n * (canvas.width / WIDTH))

  // Background
  ctx.fillStyle = '#f0fdf4'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Card with shadow
  drawRoundedRect(ctx, 15, 15, WIDTH - 30, HEIGHT - 30, 24)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.stroke()

  // Header
  drawRoundedRect(ctx, 15, 15, WIDTH - 30, 140, 24)
  ctx.fillStyle = GREEN_DARK
  ctx.fill()

  // Clip header bottom corners to be square
  ctx.fillStyle = GREEN_DARK
  ctx.fillRect(15, 155 - 24, WIDTH - 30, 24)

  // Title
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${scale(28)}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('App Figuritas del Boli', canvas.width / 2, 65)

  // Subtitle
  ctx.font = `${scale(15)}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = GREEN_LIGHT
  ctx.fillText('(que nadie quiere usar)', canvas.width / 2, 95)

  // Soccer ball icon
  ctx.font = `${scale(36)}px system-ui`
  ctx.fillStyle = '#ffffff'
  ctx.fillText('⚽', canvas.width / 2, 138)

  // Summary section
  const summaryY = 185
  ctx.textAlign = 'left'

  // Missing box
  drawRoundedRect(ctx, 40, summaryY, 245, 60, 12)
  ctx.fillStyle = '#fff7ed'
  ctx.fill()
  ctx.strokeStyle = '#fed7aa'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#c2410c'
  ctx.font = `bold ${scale(12)}px system-ui, -apple-system, sans-serif`
  ctx.fillText('Me faltan', 58, summaryY + 24)

  ctx.font = `bold ${scale(22)}px system-ui, -apple-system, sans-serif`
  ctx.fillText(String(missingCount), 58, summaryY + 46)

  // Duplicates box
  drawRoundedRect(ctx, 310, summaryY, 245, 60, 12)
  ctx.fillStyle = '#eff6ff'
  ctx.fill()
  ctx.strokeStyle = '#bfdbfe'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#2563eb'
  ctx.font = `bold ${scale(12)}px system-ui, -apple-system, sans-serif`
  ctx.fillText('Repetidas', 328, summaryY + 24)

  ctx.font = `bold ${scale(22)}px system-ui, -apple-system, sans-serif`
  ctx.fillText(String(duplicateCount), 328, summaryY + 46)

  // QR code on a separate small canvas
  const qrCanvas = document.createElement('canvas')
  try {
    await QRCode.toCanvas(qrCanvas, exportText, {
      width: QR_SIZE,
      margin: 2,
      color: { dark: GREEN, light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch {
    await QRCode.toCanvas(qrCanvas, 'Texto muy largo para QR', {
      width: QR_SIZE,
      margin: 2,
      color: { dark: GREEN, light: '#ffffff' },
    })
  }

  // Draw QR
  const qrX = Math.round((WIDTH - QR_SIZE) / 2)
  const qrY = 270
  ctx.drawImage(qrCanvas, qrX, qrY, QR_SIZE, QR_SIZE)

  // QR border
  drawRoundedRect(ctx, qrX - 8, qrY - 8, QR_SIZE + 16, QR_SIZE + 16, 16)
  ctx.strokeStyle = GREEN
  ctx.lineWidth = 2
  ctx.stroke()

  // Bottom text
  ctx.textAlign = 'center'
  ctx.fillStyle = '#6b7280'
  ctx.font = `${scale(13)}px system-ui, -apple-system, sans-serif`
  ctx.fillText('Escanea el QR para ver mis figuritas', canvas.width / 2, qrY + QR_SIZE + 50)

  // Bottom sub text
  ctx.fillStyle = '#9ca3af'
  ctx.font = `${scale(11)}px system-ui, -apple-system, sans-serif`
  ctx.fillText('o copia y pega el texto en la app', canvas.width / 2, qrY + QR_SIZE + 72)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
}

export async function shareAsImage(
  exportText: string,
  missingCount: number,
  duplicateCount: number
): Promise<void> {
  const blob = await renderShareCard(exportText, missingCount, duplicateCount)
  const file = new File([blob], 'figuritas-del-boli.png', { type: 'image/png' })

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Figuritas del Boli',
        text: 'Mira mis figuritas!',
        files: [file],
      })
      return
    } catch (e: any) {
      if (e?.name === 'AbortError') return
    }
  }

  // Fallback: download image
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'figuritas-del-boli.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
