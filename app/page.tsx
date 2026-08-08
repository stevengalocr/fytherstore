import Link from 'next/link'
import { getProducts, getCategories } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import RevealInit from '@/components/RevealInit'
import { placeholderBg } from '@/lib/format'

export const revalidate = 60 // el catálogo se refresca cada 60 s sin redeploy

const CATEGORY_META: Record<string, { desc: string }> = {
  'Ropa deportiva': { desc: 'Camisetas, hoodies, leggings' },
  'Accesorios 3D':  { desc: 'Llaveros, agitadores, grips' },
  'Suplementos':    { desc: 'Proteína, creatina y más' },
}

const MARQUEE =
  'CALIDAD PREMIUM  ✦  ENVÍOS A TODA COSTA RICA  ✦  PRODUCTOS PERSONALIZABLES  ✦  IMPRESIÓN 3D DE PRECISIÓN  ✦  '

export default async function HomePage() {
  const products = await getProducts()
  const featured = products.filter(p => p.featured).slice(0, 4)
  const categories = getCategories(products)

  return (
    <>
      <RevealInit />

      {/* HERO */}
      <section className="hero">
        <video autoPlay muted loop playsInline src="/video-presentacion.mp4" poster="/home.jpeg" />
        <div className="hero-scrim" />
        <div className="hero-content">
          <div className="hero-title">FYTHER</div>
          <div className="hero-subtitle">STORE</div>
          <p className="hero-copy">
            Ropa deportiva y accesorios de gimnasio de altísima calidad. Diseñados para rendir, hechos para durar.
          </p>
          <div className="hero-ctas">
            <Link href="/catalogo" className="btn-neon-a btn-link">VER CATÁLOGO</Link>
            <Link href="/catalogo?filtro=personalizable" className="btn-neon-b-outline btn-link">PERSONALIZA EL TUYO</Link>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="marquee-track">
          <span>{MARQUEE}</span>
          <span>{MARQUEE}</span>
        </div>
      </div>

      {/* CATEGORÍAS (en vivo, desde el catálogo de BilBildin) */}
      {categories.length > 0 && (
        <section className="section">
          <div className="section-head" data-reveal>
            <h2 className="section-title">EXPLORA POR CATEGORÍA</h2>
            <Link href="/catalogo" className="see-all">Ver todo →</Link>
          </div>
          <div className="cat-grid">
            {categories.map(cat => {
              const sample = products.find(p => p.category === cat && p.images?.[0])
              const image = sample?.images?.[0] ?? null
              return (
                <Link key={cat} href={`/catalogo?cat=${encodeURIComponent(cat)}`} className="cat-card" data-reveal>
                  <div className="cat-card-img" style={image ? undefined : { background: placeholderBg(cat) }}>
                    {image
                      ? <img src={image} alt={cat} loading="lazy" />
                      : <span className="ph-label">[ foto: {cat.toLowerCase()} ]</span>}
                  </div>
                  <div className="cat-card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span className="cat-card-name">{cat.toUpperCase()}</span>
                      <span className="cat-card-desc">
                        {CATEGORY_META[cat]?.desc ??
                          `${products.filter(p => p.category === cat).length} ${products.filter(p => p.category === cat).length === 1 ? 'producto' : 'productos'}`}
                      </span>
                    </div>
                    <span className="cat-card-arrow">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* DESTACADOS (en vivo) */}
      {featured.length > 0 && (
        <section className="section section--tight">
          <h2 className="section-title" data-reveal style={{ marginBottom: 34 }}>DESTACADOS</h2>
          <div className="prod-grid">
            {featured.map(p => <ProductCard key={p.id} product={p} reveal />)}
          </div>
        </section>
      )}

      {/* PERSONALIZACIÓN */}
      <section className="custom-section">
        <div className="custom-inner">
          <div data-reveal style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="plate">
              <div className="plate-hole" />
              <span className="plate-name">TU NOMBRE</span>
              <span className="plate-weight">25<small>KG</small></span>
              <span className="plate-brand">FYTHER</span>
            </div>
          </div>
          <div className="custom-copy" data-reveal>
            <span className="eyebrow">IMPRESIÓN 3D A LA MEDIDA</span>
            <h2 className="custom-title">HAZLO<br />TUYO.</h2>
            <p className="custom-text">
              Llaveros de placa, agitadores y accesorios con tu nombre, tu peso y tus colores.
              Cada pieza se imprime bajo pedido con acabado premium.
            </p>
            <Link href="/catalogo?filtro=personalizable" className="btn-neon-b btn-link">CREAR EL MÍO</Link>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="section">
        <div className="perk-grid">
          {[
            { t: 'Calidad garantizada', d: 'Materiales premium y control de calidad pieza por pieza. Si no te encanta, lo devolvemos.', dot: '#35dfe0' },
            { t: 'Hecho a tu medida', d: 'Personalización real: tu nombre, tus colores, tu estilo, impreso en 3D bajo pedido.', dot: '#ff7fc0' },
            { t: 'Envío rápido en CR', d: 'Despachamos en 24 h. Gratis en pedidos sobre ₡50.000 a todo el país.', dot: '#35dfe0' },
          ].map(k => (
            <div key={k.t} className="perk-card" data-reveal>
              <span className="perk-dot" style={{ background: k.dot, boxShadow: `0 0 12px ${k.dot}` }} />
              <span className="perk-title">{k.t}</span>
              <span className="perk-desc">{k.d}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
