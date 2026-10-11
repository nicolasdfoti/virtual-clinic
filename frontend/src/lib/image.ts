/** Redimensiona una imagen del navegador a un data URL cuadrado y liviano.
 *
 *  Se usa antes de subir la foto de perfil: el backend guarda un data URL en
 *  la base, asi que conviene mandar algo chico (256px) en vez del original.
 */

const MAX_SIZE = 256

export function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'))
      return
    }

    const reader = new FileReader()

    reader.onerror = () => reject(new Error('No pudimos leer la imagen.'))

    reader.onload = () => {
      const image = new Image()

      image.onerror = () => reject(new Error('No pudimos procesar la imagen.'))

      image.onload = () => {
        const scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('No pudimos procesar la imagen.'))
          return
        }

        context.drawImage(image, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }

      image.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}
