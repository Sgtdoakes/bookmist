'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  datosTransferenciaFormSchema,
  type DatosTransferenciaFormInput,
  type DatosTransferenciaFormOutput,
} from '@/lib/validations'
import type { DatosTransferencia } from '@/lib/configuracion'
import { guardarDatosTransferencia } from '@/app/admin/configuracion/actions'

export function DatosTransferenciaForm({ datosIniciales }: { datosIniciales: DatosTransferencia }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DatosTransferenciaFormInput, unknown, DatosTransferenciaFormOutput>({
    resolver: zodResolver(datosTransferenciaFormSchema),
    defaultValues: datosIniciales,
  })

  async function onSubmit(datos: DatosTransferenciaFormOutput) {
    const r = await guardarDatosTransferencia(datos)
    if (!r.ok) return toast.error(r.error)
    toast.success('Datos de pago guardados')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Datos de transferencia / depósito
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mientras falte el titular y el CBU o alias, el checkout oculta las opciones &quot;Transferencia
          bancaria&quot; y &quot;Depósito bancario&quot; — nunca se le muestra al cliente una cuenta a medio
          cargar.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pago-titular">Titular de la cuenta</Label>
          <Input id="pago-titular" {...register('titular')} className="mt-1" />
          {errors.titular && <p className="mt-1 text-xs text-destructive">{errors.titular.message}</p>}
        </div>
        <div>
          <Label htmlFor="pago-banco">Banco</Label>
          <Input id="pago-banco" {...register('banco')} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="pago-cbu">CBU (22 dígitos)</Label>
          <Input id="pago-cbu" {...register('cbu')} className="mt-1 font-mono" />
          {errors.cbu && <p className="mt-1 text-xs text-destructive">{errors.cbu.message}</p>}
        </div>
        <div>
          <Label htmlFor="pago-alias">Alias</Label>
          <Input id="pago-alias" {...register('alias')} className="mt-1 font-mono" />
        </div>
      </div>
      <Button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar
      </Button>
    </form>
  )
}
