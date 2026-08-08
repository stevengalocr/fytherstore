/* FYTHER STORE — implemented from "FYTHER Store.dc.html" (Claude Design) */
(function () {
  'use strict';

  const PRODUCTS = [
    { id: 'camiseta', name: 'Camiseta Performance Dry', cat: 'ropa', price: 14900, featured: true, sizes: true, ph: '[ foto: camiseta técnica ]', bg: 'repeating-linear-gradient(135deg,#e8f6f5 0 14px,#f0faf9 14px 28px)', desc: 'Tejido técnico de secado rápido con costuras planas. Corte atlético que acompaña cada movimiento sin restringir. Ideal para entrenamientos de alta intensidad.' },
    { id: 'hoodie', name: 'Hoodie Oversize FYTHER', cat: 'ropa', price: 28900, featured: true, sizes: true, ph: '[ foto: hoodie ]', bg: 'repeating-linear-gradient(135deg,#efeef4 0 14px,#f6f5fa 14px 28px)', desc: 'Algodón premium de 400 g con interior perchado. Logo bordado en el pecho. Tu capa favorita antes y después del gym.' },
    { id: 'leggings', name: 'Leggings Sculpt High-Rise', cat: 'ropa', price: 24900, sizes: true, ph: '[ foto: leggings ]', bg: 'repeating-linear-gradient(135deg,#fdeef5 0 14px,#fef5f9 14px 28px)', desc: 'Compresión media con cintura alta y bolsillo lateral. Opacidad garantizada en sentadilla. Tejido de 4 direcciones.' },
    { id: 'shorts', name: 'Shorts Training 2-en-1', cat: 'ropa', price: 18900, sizes: true, ph: '[ foto: shorts ]', bg: 'repeating-linear-gradient(135deg,#e8f6f5 0 14px,#f0faf9 14px 28px)', desc: 'Short exterior liviano con licra interior de compresión. Bolsillo con cierre para llaves o tarjeta.' },
    { id: 'llavero-placa', name: 'Llavero Placa de Peso Personalizada', cat: 'accesorios', price: 5900, featured: true, custom: true, ph: '[ foto: llavero placa ]', bg: 'repeating-linear-gradient(135deg,#eceff1 0 14px,#f4f6f7 14px 28px)', desc: 'Placa de peso en miniatura impresa en 3D con tu nombre y color favorito. Acabado mate premium y argolla metálica reforzada.' },
    { id: 'llavero-mancuerna', name: 'Llavero Mancuerna 3D', cat: 'accesorios', price: 4500, ph: '[ foto: llavero mancuerna ]', bg: 'repeating-linear-gradient(135deg,#eceff1 0 14px,#f4f6f7 14px 28px)', desc: 'Mini mancuerna hexagonal de alta resolución. El recordatorio diario de que hoy también se entrena.' },
    { id: 'agitador', name: 'Mini Agitador Portaproteína', cat: 'accesorios', price: 7900, featured: true, custom: true, ph: '[ foto: mini agitador ]', bg: 'repeating-linear-gradient(135deg,#fdeef5 0 14px,#fef5f9 14px 28px)', desc: 'Contenedor hermético para una porción de proteína o creatina, con tu nombre impreso. Cabe en cualquier bolso.' },
    { id: 'pushup', name: 'Push-Up Bars Pro', cat: 'accesorios', price: 16900, ph: '[ foto: push-up bars ]', bg: 'repeating-linear-gradient(135deg,#e8f6f5 0 14px,#f0faf9 14px 28px)', desc: 'Barras de flexiones con geometría estable y agarre antideslizante. Soportan más de 150 kg.' },
    { id: 'gripper', name: 'Hand Gripper Resorte', cat: 'accesorios', price: 8900, ph: '[ foto: hand gripper ]', bg: 'repeating-linear-gradient(135deg,#efeef4 0 14px,#f6f5fa 14px 28px)', desc: 'Agarrador de mano con resorte intercambiable en tres niveles de resistencia.' },
    { id: 'cucharas', name: 'Set Cucharas Medidoras 3–10 g', cat: 'accesorios', price: 6500, ph: '[ foto: cucharas medidoras ]', bg: 'repeating-linear-gradient(135deg,#eceff1 0 14px,#f4f6f7 14px 28px)', desc: 'Juego de cucharas calibradas para creatina y suplementos. Medidas exactas de 3 a 10 gramos.' },
    { id: 'proteina', name: 'Proteína Whey Premium 1 kg', cat: 'suplementos', price: 32900, ph: '[ foto: proteína whey ]', bg: 'repeating-linear-gradient(135deg,#e8f6f5 0 14px,#f0faf9 14px 28px)', desc: 'Aislado de suero con 27 g de proteína por porción. Sabor vainilla o chocolate. Certificación de pureza.' },
    { id: 'creatina', name: 'Creatina Monohidratada 500 g', cat: 'suplementos', price: 19900, ph: '[ foto: creatina ]', bg: 'repeating-linear-gradient(135deg,#fdeef5 0 14px,#fef5f9 14px 28px)', desc: 'Creatina micronizada 200 mesh, sin sabor ni aditivos. 100 porciones de 5 g.' }
  ];
  const CATS = { ropa: 'ROPA DEPORTIVA', accesorios: 'ACCESORIOS 3D', suplementos: 'SUPLEMENTOS' };
  const COLORS = [
    { name: 'Cian neón', hex: '#35dfe0' },
    { name: 'Rosa neón', hex: '#ff7fc0' },
    { name: 'Lima', hex: '#b8e34d' },
    { name: 'Violeta', hex: '#9d7bff' },
    { name: 'Blanco', hex: '#f2f2f2' }
  ];
  const CATEGORIES = [
    { name: 'ROPA DEPORTIVA', desc: 'Camisetas, hoodies, leggings', ph: '[ foto: ropa deportiva ]', bg: 'repeating-linear-gradient(135deg,#e8f6f5 0 16px,#f0faf9 16px 32px)', cat: 'ropa' },
    { name: 'ACCESORIOS 3D', desc: 'Llaveros, agitadores, grips', ph: '[ foto: accesorios gym ]', bg: 'repeating-linear-gradient(135deg,#fdeef5 0 16px,#fef5f9 16px 32px)', cat: 'accesorios' },
    { name: 'SUPLEMENTOS', desc: 'Proteína, creatina y más', ph: '[ foto: suplementos ]', bg: 'repeating-linear-gradient(135deg,#efeef4 0 16px,#f6f5fa 16px 32px)', cat: 'suplementos' }
  ];
  const PERKS = [
    { t: 'Calidad garantizada', d: 'Materiales premium y control de calidad pieza por pieza. Si no te encanta, lo devolvemos.', dot: '#35dfe0' },
    { t: 'Hecho a tu medida', d: 'Personalización real: tu nombre, tus colores, tu estilo, impreso en 3D bajo pedido.', dot: '#ff7fc0' },
    { t: 'Envío rápido en CR', d: 'Despachamos en 24 h. Gratis en pedidos sobre ₡50.000 a todo el país.', dot: '#35dfe0' }
  ];
  const PAY_METHODS = [
    { id: 'tarjeta', label: 'Tarjeta de crédito/débito', sub: 'Visa, Mastercard, AMEX' },
    { id: 'sinpe', label: 'SINPE Móvil', sub: 'Pago instantáneo al confirmar' },
    { id: 'efectivo', label: 'Contra entrega', sub: 'Pagas al recibir tu pedido' }
  ];

  let state = {
    view: 'home', cat: 'todos', orden: 'destacados', prodId: null, cart: [],
    custText: '', custColor: '#35dfe0', size: 'M', qty: 1,
    fNombre: '', fCorreo: '', fTel: '', fDir: '', fCiudad: '', pay: 'tarjeta',
    formError: false, orderNo: ''
  };

  try {
    const c = JSON.parse(localStorage.getItem('fyther-cart') || '[]');
    if (Array.isArray(c)) state.cart = c;
  } catch (e) { /* ignora carrito corrupto */ }

  const viewEl = document.getElementById('view');
  const revealed = new WeakSet();
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        revealed.add(e.target);
        e.target.setAttribute('data-reveal', 'on');
      }
    });
  }, { threshold: 0.12 });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function fmt(n) { return '₡' + n.toLocaleString('de-DE'); }
  function findProduct(id) {
    return PRODUCTS.find(function (p) { return p.id === id; }) || PRODUCTS[0];
  }

  function setState(patch) {
    const prevView = state.view;
    const prevCart = state.cart;
    Object.assign(state, patch);
    if (state.cart !== prevCart) {
      try { localStorage.setItem('fyther-cart', JSON.stringify(state.cart)); } catch (e) { /* almacenamiento lleno o bloqueado */ }
      updateCartBadge();
    }
    render();
    if (state.view !== prevView) window.scrollTo(0, 0);
  }

  function updateCartBadge() {
    document.getElementById('cart-count').textContent =
      state.cart.reduce(function (t, l) { return t + l.qty; }, 0);
  }

  function go(view, extra) { setState(Object.assign({ view: view }, extra)); }
  function openProduct(id) {
    go('product', { prodId: id, custText: '', custColor: '#35dfe0', size: 'M', qty: 1 });
  }
  function addToCart(p, opts) {
    const key = p.id + '|' + (opts.size || '') + '|' + (opts.text || '') + '|' + (opts.color || '');
    const cart = state.cart.slice();
    const i = cart.findIndex(function (l) { return l.key === key; });
    if (i >= 0) cart[i] = Object.assign({}, cart[i], { qty: cart[i].qty + (opts.qty || 1) });
    else cart.push({ key: key, id: p.id, name: p.name, price: p.price, qty: opts.qty || 1, size: opts.size || null, text: opts.text || null, color: opts.color || null, bg: p.bg });
    setState({ cart: cart });
  }
  function setLineQty(key, d) {
    setState({
      cart: state.cart.map(function (l) {
        return l.key === key ? Object.assign({}, l, { qty: Math.max(1, l.qty + d) }) : l;
      })
    });
  }
  function totals() {
    const subtotal = state.cart.reduce(function (t, l) { return t + l.price * l.qty; }, 0);
    const shipping = subtotal === 0 ? 0 : (subtotal >= 50000 ? 0 : 2500);
    return { subtotal: subtotal, shipping: shipping, total: subtotal + shipping };
  }

  /* ---------- plantillas ---------- */

  function productCardHTML(p, revealAttr) {
    return '' +
      '<div class="prod-card"' + (revealAttr ? ' data-reveal' : '') + ' data-action="openProduct" data-id="' + p.id + '">' +
        '<div class="prod-card-img" style="background:' + p.bg + '">' +
          '<span class="ph-label">' + esc(p.ph) + '</span>' +
          (p.custom ? '<span class="badge-custom">PERSONALIZABLE</span>' : '') +
        '</div>' +
        '<div class="prod-card-body">' +
          '<span class="prod-card-cat">' + CATS[p.cat] + '</span>' +
          '<span class="prod-card-name">' + esc(p.name) + '</span>' +
          '<div class="prod-card-foot">' +
            '<span class="prod-card-price">' + fmt(p.price) + '</span>' +
            '<button class="quick-add" data-action="quickAdd" data-id="' + p.id + '">Agregar</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderHome() {
    const featured = PRODUCTS.filter(function (p) { return p.featured; });
    const marqueeText = 'CALIDAD PREMIUM&nbsp;&nbsp;✦&nbsp;&nbsp;ENVÍOS A TODA COSTA RICA&nbsp;&nbsp;✦&nbsp;&nbsp;PRODUCTOS PERSONALIZABLES&nbsp;&nbsp;✦&nbsp;&nbsp;IMPRESIÓN 3D DE PRECISIÓN&nbsp;&nbsp;✦&nbsp;&nbsp;';
    return '' +
      '<section class="hero">' +
        '<video autoplay muted loop playsinline src="video-presentacion.mp4" poster="home.jpeg"></video>' +
        '<div class="hero-scrim"></div>' +
        '<div class="hero-content">' +
          '<div class="hero-title">FYTHER</div>' +
          '<div class="hero-subtitle">STORE</div>' +
          '<p class="hero-copy">Ropa deportiva y accesorios de gimnasio de altísima calidad. Diseñados para rendir, hechos para durar.</p>' +
          '<div class="hero-ctas">' +
            '<button class="btn-neon-a" data-action="goCatalog">VER CATÁLOGO</button>' +
            '<button class="btn-neon-b-outline" data-action="goCustom">PERSONALIZA EL TUYO</button>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<div class="marquee"><div class="marquee-track"><span>' + marqueeText + '</span><span>' + marqueeText + '</span></div></div>' +

      '<section class="section">' +
        '<div class="section-head" data-reveal>' +
          '<h2 class="section-title">EXPLORA POR CATEGORÍA</h2>' +
          '<span class="see-all" data-action="goCatalog">Ver todo →</span>' +
        '</div>' +
        '<div class="cat-grid">' +
          CATEGORIES.map(function (c) {
            return '<div class="cat-card" data-reveal data-action="openCategory" data-cat="' + c.cat + '">' +
              '<div class="cat-card-img" style="background:' + c.bg + '"><span class="ph-label">' + esc(c.ph) + '</span></div>' +
              '<div class="cat-card-body">' +
                '<div style="display:flex;flex-direction:column;gap:3px">' +
                  '<span class="cat-card-name">' + c.name + '</span>' +
                  '<span class="cat-card-desc">' + c.desc + '</span>' +
                '</div>' +
                '<span class="cat-card-arrow">→</span>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="section section--tight">' +
        '<h2 class="section-title" data-reveal style="margin-bottom:34px">DESTACADOS</h2>' +
        '<div class="prod-grid">' + featured.map(function (p) { return productCardHTML(p, true); }).join('') + '</div>' +
      '</section>' +

      '<section class="custom-section">' +
        '<div class="custom-inner">' +
          '<div data-reveal style="display:flex;justify-content:center">' +
            '<div class="plate">' +
              '<div class="plate-hole"></div>' +
              '<span class="plate-name">TU NOMBRE</span>' +
              '<span class="plate-weight">25<small>KG</small></span>' +
              '<span class="plate-brand">FYTHER</span>' +
            '</div>' +
          '</div>' +
          '<div class="custom-copy" data-reveal>' +
            '<span class="eyebrow">IMPRESIÓN 3D A LA MEDIDA</span>' +
            '<h2 class="custom-title">HAZLO<br>TUYO.</h2>' +
            '<p class="custom-text">Llaveros de placa, agitadores y accesorios con tu nombre, tu peso y tus colores. Cada pieza se imprime bajo pedido con acabado premium.</p>' +
            '<button class="btn-neon-b" data-action="goCustom">CREAR EL MÍO</button>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="perk-grid">' +
          PERKS.map(function (k) {
            return '<div class="perk-card" data-reveal>' +
              '<span class="perk-dot" style="background:' + k.dot + ';box-shadow:0 0 12px ' + k.dot + '"></span>' +
              '<span class="perk-title">' + esc(k.t) + '</span>' +
              '<span class="perk-desc">' + esc(k.d) + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function renderCatalog() {
    let list = PRODUCTS.filter(function (p) { return state.cat === 'todos' || p.cat === state.cat; });
    if (state.orden === 'precio-asc') list = list.slice().sort(function (a, b) { return a.price - b.price; });
    else if (state.orden === 'precio-desc') list = list.slice().sort(function (a, b) { return b.price - a.price; });
    else if (state.orden === 'nombre') list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    else list = list.slice().sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });

    const chips = [['todos', 'Todos'], ['ropa', 'Ropa'], ['accesorios', 'Accesorios 3D'], ['suplementos', 'Suplementos']];
    const ordenes = [['destacados', 'Destacados'], ['precio-asc', 'Precio: menor a mayor'], ['precio-desc', 'Precio: mayor a menor'], ['nombre', 'Nombre A–Z']];

    return '' +
      '<div class="page-main">' +
        '<h1 class="page-title">CATÁLOGO</h1>' +
        '<p class="result-count">' + list.length + ' productos</p>' +
        '<div class="catalog-toolbar">' +
          '<div class="chip-row">' +
            chips.map(function (c) {
              return '<button class="chip' + (state.cat === c[0] ? ' on' : '') + '" data-action="setCat" data-cat="' + c[0] + '">' + c[1] + '</button>';
            }).join('') +
          '</div>' +
          '<select class="sort-select" id="orden-select">' +
            ordenes.map(function (o) {
              return '<option value="' + o[0] + '"' + (state.orden === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="prod-grid">' + list.map(function (p) { return productCardHTML(p, false); }).join('') + '</div>' +
      '</div>';
  }

  function renderProduct() {
    const p = findProduct(state.prodId);
    const custName = (state.custText || 'TU NOMBRE');

    let media;
    if (p.custom) {
      media =
        '<div class="plate-preview" id="plate-preview" style="border-color:' + state.custColor + ';box-shadow:0 0 30px ' + state.custColor + '66">' +
          '<div class="plate-hole"></div>' +
          '<span class="plate-preview-name" id="plate-preview-name" style="color:' + state.custColor + '">' + esc(custName) + '</span>' +
          '<span class="plate-preview-weight">25<small>KG</small></span>' +
          '<span class="plate-preview-brand">FYTHER</span>' +
        '</div>';
    } else {
      media = '<span class="ph-label">' + esc(p.ph) + '</span>';
    }

    const sizesHTML = p.sizes ?
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<span class="opt-label">TALLA</span>' +
        '<div class="size-row">' +
          ['S', 'M', 'L', 'XL'].map(function (z) {
            return '<button class="size-btn' + (state.size === z ? ' on' : '') + '" data-action="setSize" data-size="' + z + '">' + z + '</button>';
          }).join('') +
        '</div>' +
      '</div>' : '';

    const customHTML = p.custom ?
      '<div class="custom-box">' +
        '<span class="custom-box-title">✦ PERSONALIZA TU PIEZA</span>' +
        '<label class="field-label">Texto (máx. 12 caracteres)' +
          '<input class="cust-input" id="cust-text" maxlength="12" placeholder="TU NOMBRE" value="' + esc(state.custText) + '">' +
        '</label>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          '<span style="font-size:13px;font-weight:600;color:rgba(23,25,28,.7)">Color del acento</span>' +
          '<div class="swatch-row">' +
            COLORS.map(function (c) {
              return '<button class="swatch' + (state.custColor === c.hex ? ' on' : '') + '" title="' + c.name + '" style="background:' + c.hex + '" data-action="setColor" data-hex="' + c.hex + '"></button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' : '';

    return '' +
      '<div class="detail-main">' +
        '<span class="back-link" data-action="goCatalog">← Volver al catálogo</span>' +
        '<div class="detail-grid">' +
          '<div class="detail-img" style="background:' + p.bg + '">' + media + '</div>' +
          '<div class="detail-info">' +
            '<span class="detail-cat">' + CATS[p.cat] + '</span>' +
            '<h1 class="detail-name">' + esc(p.name) + '</h1>' +
            '<span class="detail-price">' + fmt(p.price) + '</span>' +
            '<p class="detail-desc">' + esc(p.desc) + '</p>' +
            sizesHTML +
            customHTML +
            '<div class="buy-row">' +
              '<div class="qty-ctrl">' +
                '<button data-action="qtyDown">−</button>' +
                '<span>' + state.qty + '</span>' +
                '<button data-action="qtyUp">+</button>' +
              '</div>' +
              '<button class="add-btn" data-action="addCurrent">AGREGAR AL CARRITO</button>' +
            '</div>' +
            '<span class="ship-note">Envío gratis en pedidos sobre ₡50.000 · Entrega 2–4 días hábiles</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderCart() {
    const t = totals();
    let body;
    if (state.cart.length === 0) {
      body =
        '<div class="cart-empty">' +
          '<span>Tu carrito está vacío.</span>' +
          '<button class="btn-neon-a" data-action="goCatalog">IR AL CATÁLOGO</button>' +
        '</div>';
    } else {
      body =
        '<div class="cart-grid">' +
          '<div class="cart-lines">' +
            state.cart.map(function (l) {
              const meta = [l.size ? 'Talla ' + l.size : null, l.text ? '"' + l.text + '"' : null]
                .filter(Boolean).join(' · ') || 'Estándar';
              return '<div class="cart-line">' +
                '<div class="cart-line-thumb" style="background:' + l.bg + '"></div>' +
                '<div class="cart-line-info">' +
                  '<span class="cart-line-name">' + esc(l.name) + '</span>' +
                  '<span class="cart-line-meta">' + esc(meta) + '</span>' +
                  '<span class="cart-line-price">' + fmt(l.price * l.qty) + '</span>' +
                '</div>' +
                '<div class="cart-qty">' +
                  '<button data-action="lineDown" data-key="' + esc(l.key) + '">−</button>' +
                  '<span>' + l.qty + '</span>' +
                  '<button data-action="lineUp" data-key="' + esc(l.key) + '">+</button>' +
                '</div>' +
                '<button class="cart-remove" title="Quitar" data-action="lineRemove" data-key="' + esc(l.key) + '">✕</button>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div class="summary">' +
            '<span class="summary-title">RESUMEN</span>' +
            '<div class="summary-row"><span>Subtotal</span><span>' + fmt(t.subtotal) + '</span></div>' +
            '<div class="summary-row"><span>Envío</span><span>' + (t.shipping === 0 ? 'Gratis' : fmt(t.shipping)) + '</span></div>' +
            '<div class="summary-divider"></div>' +
            '<div class="summary-total"><span>Total</span><span class="amount">' + fmt(t.total) + '</span></div>' +
            '<button class="checkout-btn" data-action="goCheckout">FINALIZAR COMPRA</button>' +
            '<span class="summary-note">' + (t.subtotal >= 50000 ? '✦ Tu envío es gratis' : 'Envío gratis en pedidos sobre ₡50.000') + '</span>' +
          '</div>' +
        '</div>';
    }
    return '<div class="cart-main"><h1 class="page-title" style="margin-bottom:30px">TU CARRITO</h1>' + body + '</div>';
  }

  function renderCheckout() {
    const t = totals();
    return '' +
      '<div class="cart-main">' +
        '<span class="back-link" data-action="goCart">← Volver al carrito</span>' +
        '<h1 class="page-title checkout-title">CHECKOUT</h1>' +
        '<div class="checkout-grid">' +
          '<div class="checkout-form">' +
            '<span class="form-title">DATOS DE ENVÍO</span>' +
            '<div class="form-fields">' +
              '<input class="field span-2" id="f-nombre" placeholder="Nombre completo" value="' + esc(state.fNombre) + '">' +
              '<input class="field" id="f-correo" type="email" placeholder="Correo electrónico" value="' + esc(state.fCorreo) + '">' +
              '<input class="field" id="f-tel" placeholder="Teléfono" value="' + esc(state.fTel) + '">' +
              '<input class="field span-2" id="f-dir" placeholder="Dirección exacta" value="' + esc(state.fDir) + '">' +
              '<input class="field span-2" id="f-ciudad" placeholder="Provincia / Cantón" value="' + esc(state.fCiudad) + '">' +
            '</div>' +
            '<span class="form-title" style="margin-top:8px">MÉTODO DE PAGO</span>' +
            '<div class="pay-list">' +
              PAY_METHODS.map(function (m) {
                return '<div class="pay-option' + (state.pay === m.id ? ' on' : '') + '" data-action="setPay" data-pay="' + m.id + '">' +
                  '<span class="pay-radio"><i></i></span>' +
                  '<div style="display:flex;flex-direction:column;gap:1px">' +
                    '<span class="pay-label">' + m.label + '</span>' +
                    '<span class="pay-sub">' + m.sub + '</span>' +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>' +
            (state.formError ? '<span class="form-error">Completa nombre, correo y dirección para continuar.</span>' : '') +
            '<button class="confirm-btn" data-action="confirmOrder">CONFIRMAR PEDIDO · ' + fmt(t.total) + '</button>' +
          '</div>' +
          '<div class="order-panel">' +
            '<span class="form-title">TU PEDIDO</span>' +
            state.cart.map(function (l) {
              return '<div class="order-line"><span>' + l.qty + '× ' + esc(l.name) + '</span><span>' + fmt(l.price * l.qty) + '</span></div>';
            }).join('') +
            '<div class="summary-divider"></div>' +
            '<div class="order-ship"><span>Envío</span><span>' + (t.shipping === 0 ? 'Gratis' : fmt(t.shipping)) + '</span></div>' +
            '<div class="order-total"><span>Total</span><span class="amount">' + fmt(t.total) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderSuccess() {
    return '' +
      '<div class="success-main" style="min-height:60vh">' +
        '<div class="success-inner">' +
          '<div class="success-ring">✓</div>' +
          '<h1 class="success-title">¡PEDIDO CONFIRMADO!</h1>' +
          '<p class="success-copy">Gracias por tu compra. Recibirás un correo con el detalle y el seguimiento de tu pedido <strong>' + esc(state.orderNo) + '</strong>.</p>' +
          '<button class="success-btn" data-action="goHome">VOLVER A LA TIENDA</button>' +
        '</div>' +
      '</div>';
  }

  /* ---------- render + eventos ---------- */

  function render() {
    const views = {
      home: renderHome, catalog: renderCatalog, product: renderProduct,
      cart: renderCart, checkout: renderCheckout, success: renderSuccess
    };
    viewEl.innerHTML = (views[state.view] || renderHome)();
    bindInputs();
    observeReveals();
  }

  function bindInputs() {
    const orden = document.getElementById('orden-select');
    if (orden) orden.addEventListener('change', function (e) { setState({ orden: e.target.value }); });

    const cust = document.getElementById('cust-text');
    if (cust) {
      cust.addEventListener('input', function (e) {
        state.custText = e.target.value.slice(0, 12);
        const nameEl = document.getElementById('plate-preview-name');
        if (nameEl) nameEl.textContent = state.custText || 'TU NOMBRE';
      });
    }

    [['f-nombre', 'fNombre'], ['f-correo', 'fCorreo'], ['f-tel', 'fTel'], ['f-dir', 'fDir'], ['f-ciudad', 'fCiudad']].forEach(function (pair) {
      const el = document.getElementById(pair[0]);
      if (el) el.addEventListener('input', function (e) { state[pair[1]] = e.target.value; });
    });
  }

  function observeReveals() {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (revealed.has(el)) el.setAttribute('data-reveal', 'on');
      else io.observe(el);
    });
  }

  const actions = {
    goHome: function () { go('home'); },
    goCatalog: function () { go('catalog', { cat: 'todos' }); },
    goCart: function () { go('cart'); },
    goCheckout: function () { go('checkout', { formError: false }); },
    goCustom: function () { openProduct('llavero-placa'); },
    openProduct: function (el) { openProduct(el.dataset.id); },
    openCategory: function (el) { go('catalog', { cat: el.dataset.cat }); },
    quickAdd: function (el) {
      const p = findProduct(el.dataset.id);
      if (p.custom || p.sizes) openProduct(p.id);
      else addToCart(p, { qty: 1 });
    },
    setCat: function (el) { setState({ cat: el.dataset.cat }); },
    setSize: function (el) { setState({ size: el.dataset.size }); },
    setColor: function (el) { setState({ custColor: el.dataset.hex }); },
    qtyUp: function () { setState({ qty: state.qty + 1 }); },
    qtyDown: function () { setState({ qty: Math.max(1, state.qty - 1) }); },
    addCurrent: function () {
      const p = findProduct(state.prodId);
      addToCart(p, {
        qty: state.qty,
        size: p.sizes ? state.size : null,
        text: p.custom ? (state.custText || 'TU NOMBRE') : null,
        color: p.custom ? state.custColor : null
      });
      go('cart');
    },
    lineUp: function (el) { setLineQty(el.dataset.key, 1); },
    lineDown: function (el) { setLineQty(el.dataset.key, -1); },
    lineRemove: function (el) {
      const key = el.dataset.key;
      setState({ cart: state.cart.filter(function (l) { return l.key !== key; }) });
    },
    setPay: function (el) { setState({ pay: el.dataset.pay }); },
    confirmOrder: function () {
      if (!state.fNombre.trim() || !state.fCorreo.trim() || !state.fDir.trim()) {
        setState({ formError: true });
        return;
      }
      const no = 'FY-' + Math.floor(10000 + Math.random() * 90000);
      setState({ view: 'success', orderNo: no, cart: [], formError: false });
    }
  };

  document.addEventListener('click', function (e) {
    // closest() devuelve el [data-action] más interno, así el botón
    // "Agregar" gana sobre la tarjeta clicable que lo contiene
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el);
  });

  updateCartBadge();
  render();
})();
