import React, { useState, useRef } from "react";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Package,
  Percent,
  Star,
  Instagram,
  Mail,
  MessageCircle,
  ShoppingBag,
  Image as ImageIcon,
  ArrowRight,
  Quote,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Paleta de marca Bookmist (Manual de Marca)                         */
/* ------------------------------------------------------------------ */
const c = {
  deep: "#3D3258", // Violeta Oscuro
  medium: "#6B5B95", // Violeta Medio
  lavender: "#9D8FB8", // Lavanda
  lilac: "#C9BEDF", // Lila Suave
  cream: "#EDE8F5", // Crema Violeta
};

const NAV_LINKS = [
  "Inicio",
  "Productos",
  "Contactos",
  "Preguntas frecuentes",
  "Política de devolución",
];

/* ------------------------------------------------------------------ */
/*  Elementos gráficos de marca: manchas de acuarela + ilustraciones   */
/*  a lápiz, tal como describe el manual ("Calidez artesanal")         */
/* ------------------------------------------------------------------ */
function Blob({ className, style }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      <path
        fill="currentColor"
        d="M45.3,-58.4C58.5,-49.9,68.7,-35.6,72.7,-19.6C76.8,-3.6,74.7,14.1,66.7,28.5C58.7,42.9,44.8,54,29.1,61.5C13.4,69,-4.1,72.9,-20.5,69.6C-36.9,66.3,-52.2,55.8,-62.1,41.5C-72,27.2,-76.5,9.1,-74.5,-8.2C-72.5,-25.5,-64,-42,-51,-51.2C-38,-60.4,-19,-62.3,-1,-60.9C17,-59.5,34,-66.9,45.3,-58.4Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

function BookDoodle({ className, style }) {
  return (
    <svg viewBox="0 0 64 40" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 9 C25 5.5, 13 5, 5 8.5 V33 C13 29.5, 25 30, 32 33.5 C39 30, 51 29.5, 59 33 V8.5 C51 5, 39 5.5, 32 9 Z" />
      <path d="M32 9 V33.5" />
    </svg>
  );
}

function FeatherDoodle({ className, style }) {
  return (
    <svg viewBox="0 0 40 64" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 4 C10 14 6 30 10 46 C13 56 18 60 20 62 C22 58 20 50 24 44 C30 36 32 20 20 4Z" />
      <path d="M20 10 L20 58" />
      <path d="M20 20 L12 26 M20 30 L11 37 M20 40 L13 47" />
    </svg>
  );
}

function TikTokIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.5 3v10.9a3.6 3.6 0 1 1-3.6-3.6" />
      <path d="M15.5 3.2c.4 2.4 2.2 4.2 4.5 4.5" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center gap-4 py-1" aria-hidden="true">
      <span className="h-px w-14 md:w-24" style={{ backgroundColor: c.lilac }} />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.lavender} strokeWidth="1.3">
        <path d="M12 2C8 6 6 10 8 15C9.5 18.5 12 20 12 22C12 20 14.5 18.5 16 15C18 10 16 6 12 2Z" />
        <path d="M12 6V19" />
      </svg>
      <span className="h-px w-14 md:w-24" style={{ backgroundColor: c.lilac }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Placeholder de imagen — reemplaza fotografía real en el wireframe  */
/* ------------------------------------------------------------------ */
function ImgPlaceholder({ label, className = "", dark = false, iconSize = 26 }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden ${className}`}
      style={{
        backgroundImage: dark
          ? `repeating-linear-gradient(135deg, ${c.deep} 0px, ${c.deep} 10px, #493c6b 10px, #493c6b 20px)`
          : `repeating-linear-gradient(135deg, ${c.cream} 0px, ${c.cream} 10px, #ded3f0 10px, #ded3f0 20px)`,
      }}
    >
      <ImageIcon size={iconSize} strokeWidth={1.3} style={{ color: dark ? c.lilac : c.medium }} />
      <span
        className="text-xs uppercase tracking-wide font-semibold px-4 text-center"
        style={{ color: dark ? c.cream : c.medium, fontFamily: "Nunito, sans-serif" }}
      >
        {label}
      </span>
    </div>
  );
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button className={`btn-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold tracking-wide ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */
export default function BookmistLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const scrollerRef = useRef(null);

  const scrollProducts = (dir) => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  const products = [
    { name: "Kit Terror en la Bruma", price: "$24.900" },
    { name: "Caja Manga · Edición Luna", price: "$19.500" },
    { name: "Kit Thriller Nocturno", price: "$22.300" },
    { name: "Set Marcapáginas de Otoño", price: "$8.900" },
  ];

  const reviews = [
    {
      name: "Martina R.",
      text: "Abrí la caja y sentí que me abrazaban. Cada detalle tiene alma, se nota que está pensado con cariño.",
    },
    {
      name: "Lucía G.",
      text: "El marcapáginas de plumas es precioso, y el libro que eligieron para mí fue exactamente lo que necesitaba leer.",
    },
    {
      name: "Sofía P.",
      text: "Se nota el cuidado en cada textura. Mi rincón de lectura ahora es muchísimo más lindo gracias a Bookmist.",
    },
  ];

  return (
    <div className="w-full" style={{ fontFamily: "Nunito, sans-serif", color: c.cream, backgroundColor: c.deep }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,500&family=Caveat:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap');

        .font-heading { font-family: 'Playfair Display', serif; }
        .font-script { font-family: 'Caveat', cursive; }

        .btn-primary { background-color: ${c.medium}; color: ${c.cream}; transition: background-color .3s ease, transform .3s ease; }
        .btn-primary:hover { background-color: ${c.deep}; transform: translateY(-2px); }

        .btn-outline { border: 1.5px solid rgba(237,232,245,0.45); color: ${c.cream}; transition: all .3s ease; }
        .btn-outline:hover { background-color: ${c.cream}; color: ${c.deep}; border-color: ${c.cream}; }

        .nav-link { position: relative; color: ${c.cream}; transition: color .3s ease; }
        .nav-link:hover { color: ${c.lilac}; }
        .nav-link::after { content:''; position:absolute; left:0; bottom:-4px; width:0; height:1.5px; background-color:${c.lilac}; transition: width .3s ease; }
        .nav-link:hover::after { width:100%; }

        .card-lift { transition: transform .35s ease, box-shadow .35s ease; }
        .card-lift:hover { transform: translateY(-6px); box-shadow: 0 24px 48px -18px rgba(61,50,88,.35); }

        .cat-card { position: relative; overflow: hidden; }
        .cat-card img, .cat-card .fill { transition: transform .6s ease; }
        .cat-card:hover .fill { transform: scale(1.06); }

        .blob-float { animation: floaty 10s ease-in-out infinite; }
        .blob-float-slow { animation: floaty 14s ease-in-out infinite; animation-delay: -4s; }
        @keyframes floaty { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-16px) rotate(6deg); } }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        .dot { transition: all .3s ease; }

        .benefit-item { border-color: ${c.lilac} !important; }

        .wa-pulse { position: relative; }
        .wa-pulse::before { content:''; position:absolute; inset:0; border-radius:9999px; background:#25D366; opacity:.55; animation: pulse 2.4s ease-out infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity:.55; } 100% { transform: scale(1.9); opacity:0; } }

        .ig-tile { transition: transform .4s ease, opacity .4s ease; }
        .ig-tile:hover { transform: scale(1.03); }

        .footer-link { transition: color .25s ease; }
        .footer-link:hover { color: ${c.cream} !important; }

        .social-btn { background-color: rgba(237,232,245,0.07); color: ${c.lilac}; border: 1px solid rgba(237,232,245,0.16); transition: all .3s ease; }
        .social-btn:hover { background-color: ${c.cream}; color: ${c.deep}; border-color: ${c.cream}; transform: translateY(-2px); }

        .payment-badge { border: 1px solid rgba(237,232,245,0.16); color: ${c.lavender}; font-size: 11px; font-weight: 700; letter-spacing: .03em; padding: 6px 13px; border-radius: 999px; background-color: rgba(237,232,245,0.03); transition: all .3s ease; }
        .payment-badge:hover { border-color: ${c.lilac}; color: ${c.cream}; }
      `}</style>

      {/* ============================================================ */}
      {/* 1. TOP BAR                                                    */}
      {/* ============================================================ */}
      <div className="w-full py-2.5 text-center text-xs md:text-sm font-semibold tracking-wide" style={{ backgroundColor: c.deep, color: c.cream }}>
        ✨ 10% de descuento con transferencia ✨
      </div>

      {/* ============================================================ */}
      {/* 2. HEADER                                                     */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full border-b" style={{ backgroundColor: c.deep, borderColor: "rgba(237,232,245,0.12)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between py-4">
          {/* Logo placeholder */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: c.cream }}>
              <BookDoodle className="w-5 h-5" style={{ color: c.deep }} />
            </div>
            <div className="leading-none">
              <p className="font-heading text-xl md:text-2xl font-semibold" style={{ color: c.cream }}>Bookmist</p>
              <p className="font-script text-xs -mt-0.5" style={{ color: c.lilac }}>Editorial</p>
            </div>
          </div>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-9">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="nav-link text-sm font-semibold">
                {link}
              </a>
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-full"
            style={{ color: c.cream }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Nav mobile */}
        {menuOpen && (
          <div className="lg:hidden px-6 pb-5 flex flex-col gap-4 border-t" style={{ borderColor: "rgba(237,232,245,0.12)" }}>
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="text-sm font-semibold pt-3" style={{ color: c.cream }}>
                {link}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* 3. HERO SECTION                                               */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.deep} 0%, ${c.medium} 100%)` }}>
        <Blob className="blob-float absolute -top-16 -left-20 w-72 h-72 opacity-20" style={{ color: c.lilac }} />
        <Blob className="blob-float-slow absolute -bottom-24 -right-16 w-96 h-96 opacity-10" style={{ color: c.cream }} />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="fade-up">
            <p className="font-script text-2xl md:text-3xl mb-2" style={{ color: c.lilac }}>Bookmist Editorial</p>
            <h1 className="font-heading text-4xl md:text-6xl font-semibold leading-tight mb-5" style={{ color: c.cream }}>
              Palabras que se sienten en las manos
            </h1>
            <p className="text-base md:text-lg mb-8 max-w-md" style={{ color: c.lilac }}>
              Kits literarios pensados para pausar el ruido y perderte, otra vez, en una buena historia.
            </p>
            <PrimaryButton>
              Descubrir los kits <ArrowRight size={17} />
            </PrimaryButton>
          </div>

          <div className="relative">
            <ImgPlaceholder
              label="Imagen / Carrusel — Kit literario"
              dark
              iconSize={34}
              className="w-full h-72 md:h-96 rounded-3xl shadow-2xl"
            />
            {/* Dots simulando carrusel */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => setActiveDot(i)}
                  className="dot rounded-full"
                  style={{
                    width: activeDot === i ? 22 : 8,
                    height: 8,
                    backgroundColor: activeDot === i ? c.cream : "rgba(237,232,245,0.4)",
                  }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. BARRA DE BENEFICIOS                                        */}
      {/* ============================================================ */}
      <section className="w-full py-8 md:py-12" style={{ backgroundColor: c.deep }}>
        <div className="max-w-7xl mx-auto px-4 md:px-10 grid grid-cols-3">
          {[
            { text: "3 cuotas sin interés +$75.000", emoji: "💳" },
            { text: "Envíos a todo el país", emoji: "📦" },
            { text: "10% OFF transferencia", emoji: "💸" },
          ].map((b, i) => (
            <div
              key={i}
              className={`benefit-item flex flex-col items-center justify-center text-center gap-1.5 md:gap-2 py-2 px-2 md:px-4 ${i !== 0 ? "border-l" : ""}`}
            >
              <span className="text-lg md:text-2xl">{b.emoji}</span>
              <p className="text-xs leading-tight md:text-sm font-bold" style={{ color: c.cream }}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ============================================================ */}
      {/* 5. GRILLA DE CATEGORÍAS                                       */}
      {/* ============================================================ */}
      <section className="w-full py-14 md:py-24" style={{ backgroundColor: c.deep }}>
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="text-center mb-8 md:mb-12">
            <p className="font-script text-xl md:text-2xl mb-1" style={{ color: c.lilac }}>Explorá</p>
            <h2 className="font-heading text-2xl md:text-4xl font-semibold" style={{ color: c.cream }}>Nuestras categorías</h2>
          </div>

          <div className="grid grid-cols-3 gap-2.5 md:gap-7">
            {[
              { title: "Kits literarios", sub: "Libro + objetos elegidos para vivir la historia" },
              { title: "Cajas literarias", sub: "Papelería y detalles para tu rincón de lectura" },
              { title: "Marcapáginas", sub: "Pequeños detalles hechos a mano" },
            ].map((cat) => (
              <div key={cat.title} className="cat-card card-lift rounded-xl md:rounded-3xl h-44 sm:h-64 md:h-96 shadow-lg cursor-pointer">
                <div className="fill absolute inset-0">
                  <ImgPlaceholder label={cat.title} dark iconSize={16} className="w-full h-full" />
                </div>
                <div
                  className="absolute inset-0 rounded-xl md:rounded-3xl flex flex-col justify-end p-2.5 md:p-7"
                  style={{ background: "linear-gradient(to top, rgba(61,50,88,0.92) 0%, rgba(61,50,88,0.15) 55%, rgba(61,50,88,0) 100%)" }}
                >
                  <h3 className="font-heading text-xs sm:text-lg md:text-2xl font-semibold mb-0.5 md:mb-1 leading-tight" style={{ color: c.cream }}>{cat.title}</h3>
                  <p className="hidden sm:block text-xs md:text-sm" style={{ color: c.lilac }}>{cat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. MÁS VENDIDOS                                               */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24 border-t" style={{ backgroundColor: c.deep, borderColor: "rgba(237,232,245,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="font-script text-2xl mb-1" style={{ color: c.lilac }}>Los favoritos de la comunidad</p>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold" style={{ color: c.cream }}>Más vendidos</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => scrollProducts(-1)} className="btn-outline w-10 h-10 rounded-full flex items-center justify-center" aria-label="Anterior">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scrollProducts(1)} className="btn-outline w-10 h-10 rounded-full flex items-center justify-center" aria-label="Siguiente">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div ref={scrollerRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
            {products.map((p) => (
              <div key={p.name} className="card-lift flex-shrink-0 w-64 md:w-72 rounded-2xl bg-white shadow-md overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                <ImgPlaceholder label="Imagen producto" className="w-full h-56" />
                <div className="p-5">
                  <h3 className="font-semibold text-sm mb-1.5 leading-snug" style={{ color: c.deep }}>{p.name}</h3>
                  <p className="font-heading text-xl font-semibold mb-4" style={{ color: c.medium }}>{p.price}</p>
                  <PrimaryButton className="w-full justify-center">
                    <ShoppingBag size={16} /> Agregar
                  </PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SOBRE MÍ                                                   */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: c.deep }}>
        <Blob className="absolute top-10 right-0 w-64 h-64 opacity-10 blob-float-slow" style={{ color: c.lilac }} />
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-14 items-center relative">
          <div className="relative">
            <ImgPlaceholder label="Foto de perfil / taller" className="w-full h-80 md:h-96 rounded-3xl shadow-xl" />
            <FeatherDoodle className="absolute -bottom-6 -right-6 w-14 h-20 hidden md:block" style={{ color: c.lilac }} />
          </div>

          <div>
            <p className="font-script text-2xl mb-1" style={{ color: c.lilac }}>Sobre mí</p>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-5" style={{ color: c.cream }}>Hola, soy Daniela</h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: c.cream }}>
              Soy Daniela, y este emprendimiento nace de mi pasión por descubrir historias increíbles. Siempre fui de sumergirme en el terror, los thrillers, la ficción contemporánea y el manga...
            </p>
            <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(237,232,245,0.75)" }}>
              Este es un proyecto que armo con las manos y con calma, pensando cada kit como si fuera un regalo para una amiga lectora.
            </p>
            <p className="font-script text-2xl" style={{ color: c.lilac }}>— Daniela, fundadora de Bookmist</p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ============================================================ */}
      {/* 8. RESEÑAS                                                    */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24" style={{ backgroundColor: c.deep }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <p className="font-script text-2xl mb-1" style={{ color: c.lilac }}>Lo que dicen nuestras lectoras</p>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold" style={{ color: c.cream }}>Reseñas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {reviews.map((r) => (
              <div key={r.name} className="card-lift rounded-2xl p-7 bg-white shadow-md relative" style={{ backgroundColor: "#FFFFFF" }}>
                <Quote size={26} style={{ color: c.lilac }} className="mb-3" />
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={c.medium} style={{ color: c.medium }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: c.deep }}>{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full" style={{ backgroundColor: c.lilac }} />
                  <p className="text-sm font-bold" style={{ color: c.medium }}>{r.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. INSTAGRAM                                                  */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24 border-t" style={{ backgroundColor: c.deep, borderColor: "rgba(237,232,245,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-center gap-2.5 mb-10">
            <Instagram size={22} style={{ color: c.lilac }} />
            <h2 className="font-heading text-2xl md:text-3xl font-semibold" style={{ color: c.cream }}>Seguinos en @bookmist.ar</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ig-tile aspect-square rounded-xl overflow-hidden cursor-pointer">
                <ImgPlaceholder label="Post Instagram" className="w-full h-full" iconSize={20} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="w-full pt-16 md:pt-20 pb-8 relative overflow-hidden" style={{ backgroundColor: c.deep }}>
        <Blob className="absolute -bottom-32 -left-28 w-96 h-96 opacity-[0.05] pointer-events-none" style={{ color: c.lilac }} />

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative">
          {/* Marca */}
          <div className="flex items-center gap-2.5 mb-12 md:mb-16">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: c.medium }}>
              <BookDoodle className="w-5 h-5" style={{ color: c.cream }} />
            </div>
            <div className="leading-none">
              <p className="font-heading text-xl font-semibold" style={{ color: c.cream }}>Bookmist</p>
              <p className="font-script text-xs -mt-0.5" style={{ color: c.lilac }}>Historias que se sienten en las manos</p>
            </div>
          </div>

          {/* Páginas / Contactanos / Redes — misma distribución que la referencia */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12 pb-14 md:pb-16">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] mb-5" style={{ color: c.cream }}>
                Páginas
              </h3>
              <ul className="flex flex-col gap-3">
                {NAV_LINKS.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer-link text-sm font-medium" style={{ color: c.lavender }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] mb-5" style={{ color: c.cream }}>
                Contactanos
              </h3>
              <a
                href="mailto:hola@bookmist.ar"
                className="footer-link inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: c.lavender }}
              >
                <Mail size={15} style={{ color: c.lilac }} />
                hola@bookmist.ar
              </a>
            </div>

            <div className="col-span-2 md:col-span-1 flex items-end md:items-start md:flex-col justify-between gap-5">
              <h3 className="hidden md:block text-xs font-bold uppercase tracking-[0.16em] mb-5" style={{ color: c.cream }}>
                Seguinos
              </h3>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="social-btn w-8 h-8 rounded-full flex items-center justify-center">
                  <Instagram size={14} />
                </a>
                <a href="#" aria-label="TikTok" className="social-btn w-9 h-9 rounded-full flex items-center justify-center">
                  <TikTokIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Método de pago / Método de envío */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 py-10 border-t"
            style={{ borderColor: "rgba(237,232,245,0.12)" }}
          >
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] mb-4" style={{ color: c.cream }}>
                <CreditCard size={14} style={{ color: c.lilac }} />
                Método de pago
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Transferencia", "Visa", "Mastercard", "Cabal", "Naranja X", "Mercado Pago"].map((m) => (
                  <span key={m} className="payment-badge">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] mb-4" style={{ color: c.cream }}>
                <Package size={14} style={{ color: c.lilac }} />
                Método de envío
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Correo Argentino", "Andreani"].map((m) => (
                  <span key={m} className="payment-badge">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div
            className="pt-8 border-t flex flex-col-reverse md:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(237,232,245,0.12)" }}
          >
            <p className="text-xs text-center md:text-left" style={{ color: "rgba(237,232,245,0.5)" }}>
              © {new Date().getFullYear()} Bookmist — Hecho con calma y buena tinta.
            </p>
            <p className="font-script text-sm" style={{ color: c.lilac }}>
              Palabras que se sienten en las manos
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* 11. BOTÓN FLOTANTE — WHATSAPP                                 */}
      {/* ============================================================ */}
      <div className="fixed bottom-6 right-6 z-50 wa-pulse rounded-full">
        <button
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
          style={{ backgroundColor: "#25D366" }}
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={26} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
        </button>
      </div>
    </div>
  );
}
