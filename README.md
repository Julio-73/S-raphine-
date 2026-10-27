# Maison Séraphine — Alta Costura · A/W 26 «Nocturne»

Web editorial de alta costura (casa ficticia, Madrid–París 1987) construida como pieza premium de diseño y desarrollo: Vite 7 + TypeScript vanilla, sin framework, imágenes Wikimedia con licencias verificadas y rendimiento de nivel Lighthouse 90+.

## Stack

| Capa | Herramienta |
|---|---|
| Build | Vite 7 · TypeScript 5.9 (strict, `tsc --noEmit` en cada build) |
| UI | HTML semántico + CSS moderno (grid, `clamp()`, `svh`, `clip-path`, `aspect-ratio`) |
| Motion | reveals con IntersectionObserver **+ barrido posicional de respaldo**, split-text por líneas, Lenis (solo desktop / fine pointer), `prefers-reduced-motion` respetado |
| Imágenes | Sharp → AVIF + WebP responsive (480–3840 px con `sizes` y density-aware srcset) |
| A11y | `:focus-visible` global, hit-targets 44px, `aria-live`, formulario accesible con errores inline |
| SEO | JSON-LD (Organization + LocalBusiness), Open Graph, canonical, `robots.txt`, `sitemap.xml`, muestrario semántico h1–h4 |

## Estructura

```
index.html              ← markup completo (única página, 9 secciones)
src/
  main.ts               ← orquestación
  lib/                  ← smooth (Lenis), motion, nav, cursor, gallery, form, journal, credits
  styles/               ← tokens, base, chrome, sections, motion
scripts/
  optimize-images.mjs   ← pipeline Sharp (AVIF/WebP por ancho; requiere `_picks`)
  shoot.mjs / shots.mjs ← QA visual Playwright (requiere Chrome instalado)
public/
  media/                ← derivados optimizados (AVIF/WebP)
  fonts/                ← Bodoni Moda + Jost self-hosted (woff2 latin/latin-ext)
```

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build de producción → dist/
npm run preview    # sirve dist/ :4173
```

## Desplegar en GitHub Pages

1. `npm run build`
2. Sube el contenido de `dist/` (o usa la acción oficial `actions/deploy-pages`).

`vite.config.ts` debe fijar `base` si el sitio no vive en la raíz del dominio:

```ts
export default { base: "/<nombre-del-repo>/" }
```

## Desplegar en Vercel / Netlify / Cloudflare

- **Build command:** `npm run build`
- **Output directory:** `dist`
- Node ≥ 20. Sin variables de entorno.

## Formulario de citas (endpoint real)

El formulario de «Cita privada» es client-side (simulado). Para conectar un backend real edita `src/lib/form.ts`:

```ts
const res = await fetch("https://tu-endpoint/cita", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

Sugerencias: Formspree, Netlify Forms (`data-netlify="true"`), o Google Forms sobre el mismo markup.

## Créditos de imagen

Ver [`CREDITS.md`](./CREDITS.md). En la web, el diálogo «Créditos» del footer muestra la lista completa con enlaces.

---

## © Derechos de autor

Todos los derechos de este proyecto pertenecen al **Ingeniero de Software Julio Cesar Quispe Garrido**.

🔗 LinkedIn: [linkedin.com/in/julio-cesar-quispe-garrido](https://linkedin.com/in/julio-cesar-quispe-garrido)

