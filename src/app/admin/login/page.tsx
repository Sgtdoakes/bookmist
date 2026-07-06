'use client'

import { useActionState } from 'react'
import { BookOpen } from 'lucide-react'
import { iniciarSesion, type LoginState } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { storeConfig } from '@/lib/store-config'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(iniciarSesion, null)

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <BookOpen className="h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold">{storeConfig.nombre}</h1>
        <p className="text-muted-foreground">Panel de administración</p>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg border p-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1"
          />
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </div>
  )
}
