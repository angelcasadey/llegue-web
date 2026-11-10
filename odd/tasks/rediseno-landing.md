# Rediseño de landing — port del mockup aprobado a producción

Llevar el diseño ganador `design/landing-redesign/04-combinada.html` (repo `appgeo`, ya aprobado por el usuario) al sitio real `llegue-web/index.html`, sin romper Eventos (oculto, con respaldo), FAQ, Contacto, footer ni el admin.

## Specs

- S1 (usuario, rediseño de landing): "Rediseñar la landing pública de Llegué: quitar la sección de Eventos (módulo congelado), incorporar contenido real de la reforma laboral (docs/investigacion-marco-legal-2026.md) como diferenciador de confianza, modernizar animaciones y copy." (brief original de `design/landing-redesign/design.json`)
- S2 (usuario, Eventos): "te he dicho que esa parte me encanta entonces no la toques, obviamente ocultala o hazle un respaldo, ok?" — el módulo de Eventos (`#eventos`, su CSS `css/hero-eventos.css`, su JS, sus imágenes) no se edita; se oculta de la página visible y se conserva un respaldo exacto de su markup.
- S3 (usuario, nav): confirmó mantener los enlaces del nav a `#eventos`, `#faq`, `#contacto` tal cual, ya que esas secciones (FAQ, Contacto) se incluyen en la nueva versión sin cambios de contenido. El enlace a `#eventos` se quita del nav ya que la sección queda oculta.
- S4 (usuario, CTA de precios): "1.- si" — los 3 botones de precios ("Descargar en Google Play", desactualizados desde que existe el portal de pago web de Fase 2) se cambian para apuntar al signup real tipo mockup ("Empezar gratis 15 días" → portal/registro), no a Google Play.
- S5 (usuario, sección Geofencing): "2.- quitala" — la sección `.geofencing` (privacidad, antes/después) se elimina de la página (ya cubierta por la tarjeta legal "Cero geolocalización de más" del nuevo mockup).
- S6 (usuario, modalidades): "si remplazala" — la sección `.modalities` actual (Particular/Empresa/Eventos) se reemplaza por completo con la del mockup (En oficina/Teletrabajo/Independiente), eliminando la referencia a Eventos ahí también.
- S7 (implícito, de la sesión de diseño): todo el contenido final — copy, estilos de hover, contorno amarillo, demo animada (ya existe en `index.html` como `.demo`/`hero-demo.js`, solo se usa sin `demo--peek`), carrusel de tarjetas en mobile, timeline de pasos en mobile, divisor amarillo, badge de prueba gratis, contador animado de la multa — debe copiarse fielmente del mockup aprobado, no reinventarse.
- S8 (implícito, integridad del sitio): no modificar FAQ, Contacto, footer, ni `admin/`; css/styles.css es compartido por todo el sitio, así que las reglas nuevas se añaden sin alterar selectores que ya usan Eventos/FAQ/Contacto/footer.
- S9 (implícito, delivery): nunca hacer push a `llegue-web` (auto-deploy) sin autorización explícita del usuario; comandos de commit/push se entregan para que el usuario los ejecute, igual que en geoattend.

## Tasks

- T1 (S2, S3): Ocultar Eventos (comentar su `<section>` completo en `index.html` como respaldo in-place) y quitar su link del nav. — commit
- T2 (S5): Eliminar la sección `.geofencing` completa. — commit
- T3 (S1, S4, S6, S7, S8): Reemplazar hero, agregar sección "La reforma", reemplazar "Cómo funciona" y "Modalidades" con el contenido del mockup; actualizar CTAs de precios; fusionar el CSS nuevo en `css/styles.css` sin romper selectores existentes; agregar el script de animaciones (reveal/scroll-reveal/contador). — commit(s)
- T4 (S7): Verificación visual en navegador real (desktop y mobile) comparando contra el mockup aprobado y confirmando que Eventos/FAQ/Contacto/footer siguen intactos. — sin commit

## Log

- L1: Usuario pidió llevar el diseño ganador a producción ("hay que subirlo", "si a que se vea ya en producción como esta la vieja").
- L2: Se exploró `llegue-web/index.html` real, encontrando diferencias de contenido no cubiertas por el mockup (CTAs de Google Play obsoletos, sección Geofencing, tarjeta "Eventos" dentro de modalidades).
- L3: Usuario resolvió las 3 decisiones abiertas (ver S4-S6).
- L4: Port completo ejecutado en `index.html` y `css/styles.css`: T1-T4 cerradas. Usuario confirmó visualmente ("me gusta") tras abrir `index.html` real en el navegador (desktop y mobile). Pendiente: commit y push (push hace auto-deploy a producción, requiere decisión explícita del usuario).
