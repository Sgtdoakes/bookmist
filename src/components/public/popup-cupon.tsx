'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PrimaryButton } from '@/components/public/buttons'

// Se guarda en localStorage (no es un dato sensible, solo una preferencia de
// UI) para no volver a mostrar el popup en este navegador una vez que
// alguien lo cerró o ya se suscribió.
const STORAGE_KEY = 'bookmist_popup_cupon_visto'
const DEMORA_MS = 4000

// Popup "Suscribite y recibí un regalo" (Fase 8e) — solo se monta cuando el
// cupón está activo (ver getCuponBienvenida, gateado desde el layout
// público). Un único código general para todos, sin verificación de email:
// se manda por mail apenas se suscribe (ver /api/newsletter).
export function PopupCupon({ pct }: { pct: number }) {
  const [open, setOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [yaSuscripto, setYaSuscripto] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [cumpleanos, setCumpleanos] = useState('')
  const [provincia, setProvincia] = useState('')

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const id = setTimeout(() => setOpen(true), DEMORA_MS)
    return () => clearTimeout(id)
  }, [])

  function cerrar() {
    setOpen(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nombre,
          cumpleanos: cumpleanos.trim() || null,
          provincia: provincia.trim() || null,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'No pudimos procesar tu suscripción.')
        return
      }
      setYaSuscripto(!!data.ya_suscripto)
      setEnviado(true)
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      setError('No pudimos conectar. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cerrar())}>
      <DialogContent className="sm:max-w-md">
        {enviado ? (
          <div className="py-4 text-center">
            <DialogTitle className="font-heading text-xl">
              {yaSuscripto ? 'Ya estás en la lista 👋' : '¡Listo! 🎉'}
            </DialogTitle>
            <DialogDescription className="mt-2 text-base text-popover-foreground/75">
              {yaSuscripto
                ? 'Ese mail ya estaba suscripto — revisá la casilla, ya te habíamos mandado tu cupón antes.'
                : `Revisá tu email — te mandamos tu cupón de ${pct}% OFF para tu primera compra.`}
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">¡Suscribite y recibí un regalo! 🎁</DialogTitle>
              <DialogDescription className="text-popover-foreground/75">
                Sumate a la comunidad de Bookmist y llevate {pct}% OFF en tu primera compra.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label htmlFor="popup-cupon-email">Email</Label>
                <Input
                  id="popup-cupon-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="popup-cupon-nombre">Nombre</Label>
                <Input
                  id="popup-cupon-nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="popup-cupon-cumple">Cumpleaños (DD/MM)</Label>
                  <Input
                    id="popup-cupon-cumple"
                    placeholder="15/08"
                    value={cumpleanos}
                    onChange={(e) => setCumpleanos(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="popup-cupon-provincia">Provincia</Label>
                  <Input
                    id="popup-cupon-provincia"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <PrimaryButton type="submit" disabled={enviando} className="w-full justify-center">
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Suscribirme
              </PrimaryButton>
              <p className="text-center text-xs text-popover-foreground/60">Recibirás un mail con tu cupón.</p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
