// ═══════════════════════════════════════════════════════════════════════════
// Alta de FYTHER STORE en BilBildin — ejecutar UNA vez con: npm run provision
//
// Qué hace (idempotente — se puede volver a correr sin duplicar nada):
//   1. Crea el usuario dueño en Supabase Auth (correo confirmado).
//   2. Crea el negocio en `businesses` (activo, con marca FYTHER y renovación a 30 días).
//   3. Siembra el catálogo inicial FYTHER (12 productos + tallas) si está vacío.
//   4. Escribe .env.local de este proyecto con el business_id generado.
//   5. Imprime las credenciales de acceso al admin de BilBildin.
//
// Las claves se leen del .env.local del repo BilBildin (o de este proyecto si ya existe).
// Replica el flujo oficial: registerBusiness (app/registro/actions.ts) + approveBusiness.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BILBILDIN_ENV = process.env.BILBILDIN_ENV_PATH
  ?? 'C:/Users/steve/OneDrive/Desktop/Bilbildin/bilbildin-repo/.env.local'

const OWNER_EMAIL = 'stevengalocr+fyther@gmail.com'
const STORE_NAME  = 'FYTHER STORE'

function parseEnv(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(
    readFileSync(path, 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.trim().startsWith('#')).map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
  )
}

// Claves: primero el .env.local propio, después el del repo BilBildin.
const own = parseEnv(join(ROOT, '.env.local'))
const bil = parseEnv(BILBILDIN_ENV)
const SUPABASE_URL = own.NEXT_PUBLIC_SUPABASE_URL || bil.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY     = own.NEXT_PUBLIC_SUPABASE_ANON_KEY || bil.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY  = own.SUPABASE_SERVICE_ROLE_KEY || bil.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('✗ No se encontraron las claves de Supabase.')
  console.error(`  Buscado en: ${join(ROOT, '.env.local')} y ${BILBILDIN_ENV}`)
  process.exit(1)
}

const service = createClient(SUPABASE_URL, SERVICE_KEY)

// Contraseña fuerte generada localmente (solo se imprime en TU terminal).
function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(18)
  return 'Fyther-' + Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
}

const THEME_CONFIG = {
  store_name:        STORE_NAME,
  store_description: 'Ropa deportiva y accesorios de gimnasio premium. Hecho con precisión, pensado para atletas.',
  whatsapp:          '+506 7287 4779',
  email:             'stevengalocr@gmail.com',
  primary_color:     '#101214',
  accent_color:      '#35dfe0',
  bg_color:          '#f6f4f0',
  alert_color:       '#e5589a',
  currency:          'CRC',
  language:          'es',
  timezone:          'America/Costa_Rica',
  sinpe_number:      '7287 4779',
  sinpe_name:        'Steven Galo',
  cash_instructions: 'El pago se realiza en efectivo al momento de la entrega.',
}

// Catálogo inicial (el mismo del diseño FYTHER). Editá todo desde el admin.
// Nota: cost_price queda sin definir — completalo en el admin para que los
// reportes de ganancia sean reales.
const SEED_PRODUCTS = [
  { slug: 'camiseta-performance-dry', name: 'Camiseta Performance Dry', category: 'Ropa deportiva', price: 14900, featured: true, sizes: true,
    desc: 'Tejido técnico de secado rápido con costuras planas. Corte atlético que acompaña cada movimiento sin restringir. Ideal para entrenamientos de alta intensidad.' },
  { slug: 'hoodie-oversize-fyther', name: 'Hoodie Oversize FYTHER', category: 'Ropa deportiva', price: 28900, featured: true, sizes: true,
    desc: 'Algodón premium de 400 g con interior perchado. Logo bordado en el pecho. Tu capa favorita antes y después del gym.' },
  { slug: 'leggings-sculpt-high-rise', name: 'Leggings Sculpt High-Rise', category: 'Ropa deportiva', price: 24900, sizes: true,
    desc: 'Compresión media con cintura alta y bolsillo lateral. Opacidad garantizada en sentadilla. Tejido de 4 direcciones.' },
  { slug: 'shorts-training-2-en-1', name: 'Shorts Training 2-en-1', category: 'Ropa deportiva', price: 18900, sizes: true,
    desc: 'Short exterior liviano con licra interior de compresión. Bolsillo con cierre para llaves o tarjeta.' },
  { slug: 'llavero-placa-personalizada', name: 'Llavero Placa de Peso Personalizada', category: 'Accesorios 3D', price: 5900, featured: true, custom: true,
    desc: 'Placa de peso en miniatura impresa en 3D con tu nombre y color favorito. Acabado mate premium y argolla metálica reforzada. Indica el texto y color al finalizar tu compra.' },
  { slug: 'llavero-mancuerna-3d', name: 'Llavero Mancuerna 3D', category: 'Accesorios 3D', price: 4500,
    desc: 'Mini mancuerna hexagonal de alta resolución. El recordatorio diario de que hoy también se entrena.' },
  { slug: 'mini-agitador-portaproteina', name: 'Mini Agitador Portaproteína', category: 'Accesorios 3D', price: 7900, featured: true, custom: true,
    desc: 'Contenedor hermético para una porción de proteína o creatina, con tu nombre impreso. Cabe en cualquier bolso.' },
  { slug: 'push-up-bars-pro', name: 'Push-Up Bars Pro', category: 'Accesorios 3D', price: 16900,
    desc: 'Barras de flexiones con geometría estable y agarre antideslizante. Soportan más de 150 kg.' },
  { slug: 'hand-gripper-resorte', name: 'Hand Gripper Resorte', category: 'Accesorios 3D', price: 8900,
    desc: 'Agarrador de mano con resorte intercambiable en tres niveles de resistencia.' },
  { slug: 'set-cucharas-medidoras', name: 'Set Cucharas Medidoras 3–10 g', category: 'Accesorios 3D', price: 6500,
    desc: 'Juego de cucharas calibradas para creatina y suplementos. Medidas exactas de 3 a 10 gramos.' },
  { slug: 'proteina-whey-premium-1kg', name: 'Proteína Whey Premium 1 kg', category: 'Suplementos', price: 32900,
    desc: 'Aislado de suero con 27 g de proteína por porción. Sabor vainilla o chocolate. Certificación de pureza.' },
  { slug: 'creatina-monohidratada-500g', name: 'Creatina Monohidratada 500 g', category: 'Suplementos', price: 19900,
    desc: 'Creatina micronizada 200 mesh, sin sabor ni aditivos. 100 porciones de 5 g.' },
]

async function ensureAuthUser(password) {
  const { data, error } = await service.auth.admin.createUser({
    email: OWNER_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { name: 'Steven Galo' },
  })
  if (error) {
    if (/already|registered|exist/i.test(error.message)) return { created: false }
    throw new Error('Auth: ' + error.message)
  }
  return { created: true, userId: data.user.id }
}

async function ensureBusiness() {
  const { data: existing } = await service
    .from('businesses').select('id, account_status').eq('owner_email', OWNER_EMAIL).maybeSingle()
  if (existing) return { id: existing.id, created: false }

  const next = new Date()
  next.setDate(next.getDate() + 30)
  const { data: biz, error } = await service.from('businesses').insert({
    name:              STORE_NAME,
    owner_email:       OWNER_EMAIL,
    plan_type:         'starter',
    account_status:    'active',
    next_payment_date: next.toISOString(),
    theme_config:      THEME_CONFIG,
  }).select('id').single()
  if (error || !biz) throw new Error('Business: ' + (error?.message ?? 'sin fila'))
  return { id: biz.id, created: true }
}

async function seedCatalog(businessId) {
  const { count } = await service
    .from('products').select('id', { count: 'exact', head: true }).eq('business_id', businessId)
  if ((count ?? 0) > 0) return { seeded: 0, skipped: true }

  let seeded = 0
  for (const p of SEED_PRODUCTS) {
    const { data: prod, error } = await service.from('products').insert({
      business_id:       businessId,
      name:              p.name,
      slug:              p.slug,
      description:       p.desc,
      short_description: p.desc.split('. ')[0] + '.',
      price:             p.price,
      images:            [],
      status:            'visible',
      category:          p.category,
      tags:              [],
      attributes:        p.custom ? { custom: true } : {},
      featured:          !!p.featured,
      stock_quantity:    25,
    }).select('id').single()
    if (error || !prod) throw new Error(`Producto "${p.name}": ` + (error?.message ?? 'sin fila'))
    seeded++

    if (p.sizes) {
      const variants = ['S', 'M', 'L', 'XL'].map(size => ({
        product_id:     prod.id,
        name:           `Talla ${size}`,
        price_modifier: 0,
        stock_quantity: 25,
        attributes:     {},
        images:         [],
      }))
      const { error: vErr } = await service.from('product_variants').insert(variants)
      if (vErr) throw new Error(`Variantes de "${p.name}": ` + vErr.message)
    }
  }
  return { seeded, skipped: false }
}

function writeEnvLocal(businessId) {
  const content = [
    '# ── FYTHER STORE · conexión a BilBildin (generado por npm run provision) ──',
    '# Públicas (seguras en el navegador)',
    `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
    `NEXT_PUBLIC_BUSINESS_ID=${businessId}`,
    '',
    '# Privada — SOLO servidor. JAMÁS con prefijo NEXT_PUBLIC_. No subir a git.',
    `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
    '',
  ].join('\n')
  writeFileSync(join(ROOT, '.env.local'), content, 'utf8')
}

async function main() {
  console.log('── Alta de FYTHER STORE en BilBildin ──\n')

  const password = generatePassword()
  const user = await ensureAuthUser(password)
  console.log(user.created
    ? '✓ Usuario dueño creado en Supabase Auth'
    : '• El usuario dueño ya existía (la contraseña anterior sigue vigente)')

  const biz = await ensureBusiness()
  console.log(biz.created
    ? `✓ Negocio creado y ACTIVO — business_id: ${biz.id}`
    : `• El negocio ya existía — business_id: ${biz.id}`)

  const seed = await seedCatalog(biz.id)
  console.log(seed.skipped
    ? '• Catálogo ya tenía productos — no se sembró nada'
    : `✓ Catálogo inicial sembrado: ${seed.seeded} productos (+ tallas S–XL en ropa)`)

  writeEnvLocal(biz.id)
  console.log('✓ .env.local escrito con el business_id\n')

  console.log('════════════════════════════════════════════════════════')
  console.log('  ACCESO AL ADMIN DE BILBILDIN (guardá esto)')
  console.log('════════════════════════════════════════════════════════')
  console.log(`  URL:        <tu deploy de BilBildin>/store/admin/login`)
  console.log(`  Usuario:    ${OWNER_EMAIL}`)
  if (user.created) {
    console.log(`  Contraseña: ${password}`)
    console.log('  (cambiala luego si querés — este es el único lugar donde se muestra)')
  } else {
    console.log('  Contraseña: la que se generó la primera vez que corriste este script')
  }
  console.log(`  business_id: ${biz.id}`)
  console.log('════════════════════════════════════════════════════════\n')
  console.log('Siguiente paso: npm run dev  →  http://localhost:3000')
}

main().catch(e => { console.error('\n✗ ERROR:', e.message); process.exit(1) })
