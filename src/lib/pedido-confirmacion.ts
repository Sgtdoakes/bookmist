// Resuelve qué mostrar en la página de confirmación según el resultado del
// pago (vuelve como query param `status` desde Mercado Pago) o, si no hay
// status (pago manual: transferencia/efectivo), la confirmación genérica.
// Función pura para poder testear la lógica sin renderizar nada.

export type VistaPedidoTipo = 'rechazado' | 'pendiente' | 'aprobado' | 'generico'

export type VistaPedido = {
  tipo: VistaPedidoTipo
  titulo: string
  mensaje: string
}

export function resolverVistaPedido(status: string | null): VistaPedido {
  if (status === 'failure' || status === 'rejected') {
    return {
      tipo: 'rechazado',
      titulo: 'El pago no se completó',
      mensaje: 'No pudimos confirmar el pago. Podés intentar de nuevo o escribirnos para coordinar.',
    }
  }
  if (status === 'pending' || status === 'in_process') {
    return {
      tipo: 'pendiente',
      titulo: 'Tu pago está pendiente',
      mensaje: 'Estamos esperando la confirmación del pago. Te avisamos apenas se acredite.',
    }
  }
  if (status === 'approved') {
    return {
      tipo: 'aprobado',
      titulo: '¡Pago aprobado!',
      mensaje: 'Recibimos tu pago. Te vamos a contactar para coordinar el envío.',
    }
  }
  return {
    tipo: 'generico',
    titulo: '¡Gracias por tu pedido!',
    mensaje: 'Tu pedido fue recibido. Te vamos a contactar para coordinar el pago y el envío.',
  }
}
