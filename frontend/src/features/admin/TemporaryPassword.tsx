import { useState } from 'react'

import { Button } from '../../components/ui'

/** Muestra la contraseña temporal una sola vez. No se vuelve a exponer. */
export function TemporaryPassword({ password }: { password: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-800">
        Contraseña temporal. Se muestra una sola vez: copiala y pasásela al
        profesional. Al ingresar va a tener que cambiarla.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code
          data-testid="temporary-password"
          className="min-w-0 flex-1 truncate rounded bg-white px-3 py-2 font-mono text-sm text-slate-800"
        >
          {password}
        </code>

        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? 'Copiada' : 'Copiar'}
        </Button>
      </div>
    </div>
  )
}
