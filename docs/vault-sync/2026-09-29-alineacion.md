# vault-sync · 2026-09-29 · Alineación Total (unidad U06 · Fyther Store)

Puente repo → vault. Cada bloque se aplica tal cual a `..\obsidian\Cerebro2.0\02-Proyectos\BilBildin\Tiendas\Fyther-Store\`. Formato en `CLAUDE.md`.

### U06-a · Auditoría contra el Contrato de Alineación de Tiendas · commit 0f04406 · despliegue READY (Vercel `dpl_HN49Hm3TEbbybEcuUG4jqhZufrvE`, production, 2026-09-30)
**Pendientes.md** — nuevos: (b) leer `attributes.drop` y `attributes.max_per_order` en `mappers.ts`/`CartContext` (est. 2–3 h con pruebas); (g) el negocio no tiene `terms_url` ni documentos en `business_legal_documents` → cargar términos desde el panel (Steven); (h) decidir si `custom_domain` queda `fytherstore.com` (redirige 308 a `www.`; el CORE acepta las dos) o se cambia a `www.fytherstore.com`; cobro del plan vencido el 2026-09-08 (Steven); correr el círculo del paso 7 de `CONECTAR-UNA-TIENDA.md` con un pedido de prueba en `cash`, después limpiar. Para BilBildin: ninguno que exija cambiar el CORE.
**Decisiones.md** — no existe en el sub-nodo; ninguna decisión nueva de producto.
**Seguridad.md** — no existe en el sub-nodo. Hallazgos: la llave de servicio no viaja al cliente (`grep` sobre `.next/static` vacío tras el build); `lib/commerce/checkout.ts` (importado por un `'use client'`) solo nombra la variable en un tipo y la lee de un objeto `env` que le pasan, nunca de `process.env`. Sin cambios de estado.
**Otras páginas** — `Fyther-Store.md`: «falta conectar la landing» → «conectada por código desde el 2026-08-08 (`app/actions/checkout.ts` → `create_fyther_storefront_order`), en producción en `www.fytherstore.com`». `Fyther-Store.md`: «WhatsApp · SINPE: ninguno configurado» → «efectivo configurado (`cash_instructions`); SINPE, link y WhatsApp sin configurar (verificado 2026-09-30)». Se crean `Alineacion-Con-BilBildin.md`, `Integracion-Y-Estado.md`, `Arquitectura-Y-Codigo.md`, `Marca-Y-Catalogo.md`, `Cuentas-y-Accesos.md`, `Rendimiento-SEO-Y-Pendientes.md`, `Pendientes.md`, `index.md`, `log.md`.
**log.md** — `## [2026-09-29] ingest | Auditoría contra el contrato: la tienda ya estaba conectada por código`
- El vault del 2026-09-05 decía «landing sin conectar»; el repo demuestra lo contrario: checkout por RPC desde `512dbec`/`4a4fb39` (agosto), Server Action y lectura de pedidos con la llave de servicio.
- Veredicto a–k: ✅ a, c, d, e, f, i, j, k · ⚠️ b (no lee `drop`/`max_per_order`), g (código listo, negocio sin `terms_url`), h (`custom_domain` sin `www.`, el sitio redirige a `www.`).
- SQL de solo lectura sobre `wgicaiphzwppnshagxve`: `businesses` fila correcta; `terms_url` nulo; 0 `business_legal_documents`; 9 productos (7 visibles); 0 pedidos.
- Contradicción resuelta: la migración local `202608080001_…` no es la función que corre; manda `bilbildin/supabase/migrations/20260919_puertas_viejas_delegan.sql`.
Aplicado en vault: sí

### U06-b · Traducción de los ocho códigos, casilla de términos, contrato del RPC en pruebas, `.gitignore` · commit 0f04406 · despliegue READY (Vercel `dpl_HN49Hm3TEbbybEcuUG4jqhZufrvE`, production, verificado por API el 2026-09-30)
**Pendientes.md** — cierra: (c) faltaban `purchase_limit_exceeded`, `temporarily_unavailable`, `invalid_request`, `internal_error`, `invalid_product`; (g) lado tienda; (j) traducción de códigos sin prueba. Nuevo: ninguno.
**Decisiones.md** — ADR corto (queda en `Integracion-Y-Estado.md`): el checkout acepta el código **lanzado** por la puerta (`error.message`) y el **devuelto** por `crear_pedido` (`data.code`), para poder migrar a `rpc('crear_pedido')` sin tocar la traducción. `accepted_terms` viaja siempre (`true`/`false`); la versión la pone BilBildin.
**Seguridad.md** — `.gitignore` pasa de `.env` + `.env*.local` a `.env*` + `!.env.example` (antes un `.env.production` habría entrado al repo). Sin claves en el clon.
**Otras páginas** — `Alineacion-Con-BilBildin.md`: (c) ❌→✅, (g) ❌→⚠️ (solo falta el dato del negocio), (j) ⚠️→✅. `Arquitectura-Y-Codigo.md`: describe `CUSTOMER_MESSAGES`, `getTermsUrl`, la casilla y las pruebas nuevas (320 en total).
**log.md** — `## [2026-09-29] ingest | Corrección en código: códigos de error, términos y contrato del RPC`
- `app/actions/checkout.ts`: tabla `CUSTOMER_MESSAGES` con 12 códigos; `temporarily_unavailable` invita a reintentar; `internal_error` cae al genérico a propósito.
- `CheckoutClient.tsx`: casilla de términos solo si `theme_config.terms_url` existe; obligatoria; `aria-invalid` + foco; `acceptedTerms` en `CheckoutInput`.
- Pruebas: 12 traducciones, `data.code`, `accepted_terms`, columnas enumeradas del seguimiento, `getTermsUrl`, migración marcada histórica. typecheck 0 · lint 0 · test 320/320 · build 0 · knip 0.
Aplicado en vault: sí

### U06-c · `CLAUDE.md` del repo y este puente · commit (el siguiente a 0f04406) · despliegue n/a
**Pendientes.md** — cierra (k).
**Decisiones.md** — ninguna.
**Seguridad.md** — sin cambios.
**Otras páginas** — `Alineacion-Con-BilBildin.md`: (k) ❌→✅. `Fyther-Store.md`: repositorio con `CLAUDE.md` y `docs/vault-sync/`.
**log.md** — `## [2026-09-29] ingest | CLAUDE.md con protocolo de vault y puente vault-sync`
- `CLAUDE.md` nuevo: qué es, comandos en orden, mapa, variables, relación con BilBildin, reglas, trampas (migración histórica, tildes, `link`↔`card`, `drop`/`max_per_order`, puerto 3000, `next start`), sección de vault.
- `docs/vault-sync/2026-09-29-alineacion.md` con tres bloques, todos aplicados.
Aplicado en vault: sí
