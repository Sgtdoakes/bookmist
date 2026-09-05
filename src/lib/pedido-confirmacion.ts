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
    mensaje: 'Tu pedido fue recibido. Revisá cómo completar el pago más abajo.',
  }
}

// ¿Esta visita a la página del pedido es una compra recién hecha, la que hay
// que registrar como venta en Analytics? Dos señales, y alcanza con una:
//   - `recienComprado`: este mismo navegador creó el pedido (quedó guardado
//     en sessionStorage al salir del checkout).
//   - `status`: la visita vuelve de Mercado Pago, que es el único que pone
//     ese query param, en las back_urls de la preferencia (lib/mercadopago).
//
// La segunda señal es la que faltaba y por eso Analytics registraba solo las
// compras por transferencia: esas nunca salen del sitio (el checkout navega
// con router.push y el sessionStorage sigue ahí), mientras que la vuelta de
// Mercado Pago cae muchas veces en otra pestaña o en el navegador de la app
// de MP, donde ese sessionStorage no existe.
//
// Abrir el link de seguimiento del mail días después no trae ninguna de las
// dos, así que una compra no se vuelve a contar cada vez que su dueño mira
// cómo viene el pedido. Un pago rechazado tampoco cuenta; uno pendiente sí,
// porque el pedido igual se creó.
export function esVisitaDeCompra(status: string | null, recienComprado: boolean): boolean {
  if (resolverVistaPedido(status).tipo === 'rechazado') return false
  return recienComprado || !!status
}
