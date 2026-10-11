import { useRef, useState, type ChangeEvent } from 'react'

import { Avatar, Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useAuth } from '../../context/useAuth'
import { resizeImageToDataUrl } from '../../lib/image'
import { useUpdateMyPhoto } from './photoHooks'

/** Tarjeta para subir, cambiar o quitar la propia foto de perfil.
 *
 *  Sirve para los tres roles: la foto vive en la sesion, no en el perfil
 *  profesional. El archivo se redimensiona en el navegador antes de subirlo. */
export function ProfilePhotoCard() {
  const { user } = useAuth()
  const updatePhoto = useUpdateMyPhoto()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!user) {
    return null
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim()

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setLocalError(null)

    try {
      const dataUrl = await resizeImageToDataUrl(file)
      await updatePhoto.mutateAsync(dataUrl)
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'No pudimos actualizar la foto.',
      )
    }
  }

  const handleRemove = async () => {
    setLocalError(null)

    try {
      await updatePhoto.mutateAsync(null)
    } catch {
      setLocalError('No pudimos quitar la foto.')
    }
  }

  return (
    <Card variant="outlined" padding="lg" className="mt-4">
      <h2 className="text-lg font-semibold text-sky-900">Foto de perfil</h2>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar name={fullName} src={user.photo ?? undefined} size="xl" />

        <div className="flex flex-col items-start gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={updatePhoto.isPending}
            className={buttonClasses({ size: 'sm', variant: 'outline' })}
          >
            {updatePhoto.isPending
              ? 'Guardando…'
              : user.photo
                ? 'Cambiar foto'
                : 'Subir foto'}
          </button>

          {user.photo && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={updatePhoto.isPending}
              className={buttonClasses({ size: 'sm', variant: 'ghost' })}
            >
              Quitar foto
            </button>
          )}

          <p className="text-xs text-slate-500">
            JPG o PNG. La recortamos a 256px antes de guardarla.
          </p>
        </div>
      </div>

      {localError && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {localError}
        </p>
      )}

      {updatePhoto.isError && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          No pudimos guardar la foto. Intentá de nuevo.
        </p>
      )}
    </Card>
  )
}
