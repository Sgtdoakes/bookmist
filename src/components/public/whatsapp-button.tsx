import { MessageCircle } from 'lucide-react'
import { storeConfig } from '@/lib/store-config'
import { whatsappLink } from '@/lib/whatsapp'

export function WhatsAppButton() {
  if (!storeConfig.whatsapp) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-full">
      <span
        className="absolute inset-0 animate-[pulse-ring_2.4s_ease-out_infinite] rounded-full bg-[#25D366] opacity-55"
        aria-hidden="true"
      />
      <a
        href={whatsappLink(storeConfig.whatsapp, `Hola ${storeConfig.nombre}, quería consultar por una caja/kit.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-xl"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle size={26} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
      </a>
    </div>
  )
}
