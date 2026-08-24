// Cómo tarifa Andreani un bulto: por el MAYOR entre el peso real y el peso
// "por volumen" (aforo). Un marcapáginas de 20 g declarado como un cubo de
// 20×20×20 se cobra como si pesara casi 3 kg — exactamente el bug del pedido
// de prueba del 2026-08-24 (4 marcapáginas → $21.348 en vez de ~$9.600).
//
// El factor exacto no está publicado en la API PyME; ~1 kg cada 3.000 cm³
// reproduce las tarifas reales medidas contra /Pyme/rates ese mismo día
// (origen CP 1676, varios pesos y volúmenes). Es un ESTIMADO para avisar en
// el panel cuando las medidas encarecen el envío — la cotización que se
// cobra la da siempre la API con estos mismos datos, acá no se calcula
// ningún precio.

const CM3_POR_GRAMO = 3

export function pesoVolumetricoGramos(altoCm: number, anchoCm: number, largoCm: number): number {
  return Math.round((altoCm * anchoCm * largoCm) / CM3_POR_GRAMO)
}

export function pesoFacturableGramos(
  pesoGramos: number,
  altoCm: number,
  anchoCm: number,
  largoCm: number,
): number {
  return Math.max(pesoGramos, pesoVolumetricoGramos(altoCm, anchoCm, largoCm))
}

// "2667 g" no le dice nada a nadie; "unos 2,7 kg" sí. Por debajo del kilo se
// queda en gramos, que es como se cargan.
export function formatPesoLegible(gramos: number): string {
  if (gramos < 1000) return `${gramos} g`
  const kg = gramos / 1000
  return `${kg.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg`
}
