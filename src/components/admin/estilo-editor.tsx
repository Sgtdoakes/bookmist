'use client'

import {
  FONDO_LABEL,
  TAMANO_LABEL,
  RADIO_LABEL,
  ALINEACION_LABEL,
  type ColorFondo,
  type Tamano,
  type Radio,
  type Alineacion,
  type EstiloBloque,
} from '@/lib/estilo-secciones'

type Props = {
  estilo: EstiloBloque
  onChange: (estilo: EstiloBloque) => void
  conAlineacion?: boolean
}

// Editor de estilo compartido por los bloques libres (texto/productos/banner)
// — mismo control para los 3, así el resultado visual es consistente.
export function EstiloEditor({ estilo, onChange, conAlineacion = true }: Props) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <Grupo
        label="Fondo"
        opciones={FONDO_LABEL}
        valor={estilo.fondo ?? 'transparente'}
        onChange={(v) => onChange({ ...estilo, fondo: v as ColorFondo })}
      />
      <Grupo
        label="Tamaño"
        opciones={TAMANO_LABEL}
        valor={estilo.tamano ?? 'md'}
        onChange={(v) => onChange({ ...estilo, tamano: v as Tamano })}
      />
      <Grupo
        label="Bordes redondeados"
        opciones={RADIO_LABEL}
        valor={estilo.radio ?? 'ninguno'}
        onChange={(v) => onChange({ ...estilo, radio: v as Radio })}
      />
      {conAlineacion && (
        <Grupo
          label="Alineación"
          opciones={ALINEACION_LABEL}
          valor={estilo.alineacion ?? 'centro'}
          onChange={(v) => onChange({ ...estilo, alineacion: v as Alineacion })}
        />
      )}
    </div>
  )
}

function Grupo({
  label,
  opciones,
  valor,
  onChange,
}: {
  label: string
  opciones: Record<string, string>
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(opciones).map(([valorOpcion, etiqueta]) => (
          <button
            key={valorOpcion}
            type="button"
            onClick={() => onChange(valorOpcion)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              valor === valorOpcion
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>
    </div>
  )
}
