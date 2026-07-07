import { InstagramIcon, TikTokIcon } from '@/components/public/decorative'

export function SocialIcons({
  instagram,
  tiktok,
  className = '',
}: {
  instagram: string
  tiktok: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href={instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/16 bg-foreground/7 text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background"
      >
        <InstagramIcon className="h-3.5 w-3.5" />
      </a>
      <a
        href={tiktok}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/16 bg-foreground/7 text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background"
      >
        <TikTokIcon className="h-4 w-4" />
      </a>
    </div>
  )
}
