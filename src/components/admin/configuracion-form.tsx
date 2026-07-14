'use client'

import { useState } from 'react'
import { useForm, Controller, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/admin/image-uploader'
import { marcaFormSchema, type MarcaFormInput, type MarcaFormOutput } from '@/lib/validations'
import type { MarcaConfig } from '@/lib/configuracion'
import { guardarMarcaConfig } from '@/app/admin/configuracion/actions'

const COLOR_PRIMARIO_DEFECTO = '#6b5b95'
const COLOR_SECUNDARIO_DEFECTO = '#9d8fb8'
const COLOR_ACENTO_DEFECTO = '#9d8fb8'

function aFormulario(marca: MarcaConfig): MarcaFormInput {
  return {
    nombre: marca.nombre,
    taglineHeader: marca.taglineHeader,
    taglineFooter: marca.taglineFooter,
    copyright: marca.copyright,
    email: marca.email,
    whatsapp: marca.whatsapp,
    instagram: marca.instagram,
    instagramHandle: marca.instagramHandle,
    tiktok: marca.tiktok,
    colorPrimario: marca.colorPrimario ?? COLOR_PRIMARIO_DEFECTO,
    colorSecundario: marca.colorSecundario ?? COLOR_SECUNDARIO_DEFECTO,
    colorAcento: marca.colorAcento ?? COLOR_ACENTO_DEFECTO,
    metodosPago: marca.metodosPago.join(', '),
    metodosEnvio: marca.metodosEnvio.join(', '),
  }
}

function aLista(valor: string): string[] {
  return valor
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function ConfiguracionForm({ marcaInicial }: { marcaInicial: MarcaConfig }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(marcaInicial.logoUrl)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(marcaInicial.faviconUrl)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MarcaFormInput, unknown, MarcaFormOutput>({
    resolver: zodResolver(marcaFormSchema),
    defaultValues: aFormulario(marcaInicial),
  })

  async function onSubmit(datos: MarcaFormOutput) {
    const marca: MarcaConfig = {
      nombre: datos.nombre,
      logoUrl,
      faviconUrl,
      taglineHeader: datos.taglineHeader,
      taglineFooter: datos.taglineFooter,
      copyright: datos.copyright,
      email: datos.email,
      whatsapp: datos.whatsapp,
      instagram: datos.instagram,
      instagramHandle: datos.instagramHandle,
      tiktok: datos.tiktok,
      colorPrimario: datos.colorPrimario,
      colorSecundario: datos.colorSecundario,
      colorAcento: datos.colorAcento,
      metodosPago: aLista(datos.metodosPago),
      metodosEnvio: aLista(datos.metodosEnvio),
    }
    const r = await guardarMarcaConfig(marca)
    if (!r.ok) return toast.error(r.error)
    toast.success('Configuración guardada')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-lg border p-5">
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Identidad</h2>
        <div>
          <Label>Logo (ícono al lado del nombre, header y footer)</Label>
          <p className="mb-1 text-xs text-muted-foreground">Sin logo cargado, se usa el ícono decorativo actual.</p>
          <ImageUploader
            carpeta="secciones"
            entidadId="marca-logo"
            portada={logoUrl}
            onPortadaChange={setLogoUrl}
            soloPortada
          />
        </div>
        <div>
          <Label>Ícono de la pestaña del navegador (favicon)</Label>
          <p className="mb-1 text-xs text-muted-foreground">
            Versión chiquita del logo para la pestaña. Sin nada cargado, se usa el logo de arriba.
          </p>
          <ImageUploader
            carpeta="secciones"
            entidadId="marca-favicon"
            portada={faviconUrl}
            onPortadaChange={setFaviconUrl}
            soloPortada
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="marca-nombre">Nombre de la marca</Label>
            <Input id="marca-nombre" {...register('nombre')} className="mt-1" />
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="marca-tagline-header">Tagline (header, debajo del nombre)</Label>
            <Input id="marca-tagline-header" {...register('taglineHeader')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="marca-tagline-footer">Tagline (footer, debajo del nombre)</Label>
            <Input id="marca-tagline-footer" {...register('taglineFooter')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="marca-copyright">Texto de copyright (después del año)</Label>
            <Input id="marca-copyright" {...register('copyright')} className="mt-1" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Contacto y redes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="marca-email">Email de contacto</Label>
            <Input id="marca-email" type="email" {...register('email')} className="mt-1" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="marca-whatsapp">WhatsApp (solo dígitos, ej: 5491122334455)</Label>
            <Input id="marca-whatsapp" {...register('whatsapp')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="marca-instagram">URL de Instagram</Label>
            <Input id="marca-instagram" {...register('instagram')} className="mt-1" />
            {errors.instagram && <p className="mt-1 text-xs text-destructive">{errors.instagram.message}</p>}
          </div>
          <div>
            <Label htmlFor="marca-instagram-handle">@ de Instagram (para mostrar)</Label>
            <Input id="marca-instagram-handle" {...register('instagramHandle')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="marca-tiktok">URL de TikTok</Label>
            <Input id="marca-tiktok" {...register('tiktok')} className="mt-1" />
            {errors.tiktok && <p className="mt-1 text-xs text-destructive">{errors.tiktok.message}</p>}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Colores de acento</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField id="marca-color-primario" label="Primario" name="colorPrimario" control={control} />
          <ColorField id="marca-color-secundario" label="Secundario" name="colorSecundario" control={control} />
          <ColorField id="marca-color-acento" label="Acento" name="colorAcento" control={control} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Métodos (footer)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="marca-metodos-pago">Métodos de pago (separados por coma)</Label>
            <Input id="marca-metodos-pago" {...register('metodosPago')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="marca-metodos-envio">Métodos de envío (separados por coma)</Label>
            <Input id="marca-metodos-envio" {...register('metodosEnvio')} className="mt-1" />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={(!isDirty && logoUrl === marcaInicial.logoUrl) || isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar
      </Button>
    </form>
  )
}

function ColorField({
  id,
  label,
  name,
  control,
}: {
  id: string
  label: string
  name: 'colorPrimario' | 'colorSecundario' | 'colorAcento'
  control: Control<MarcaFormInput>
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <Label htmlFor={id}>{label}</Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id={id}
              type="color"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              className="h-9 w-12 rounded border bg-transparent p-0.5"
            />
            <Input value={field.value} onChange={field.onChange} onBlur={field.onBlur} className="font-mono text-sm" />
          </div>
        </div>
      )}
    />
  )
}
