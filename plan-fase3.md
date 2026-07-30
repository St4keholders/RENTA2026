# Plan Fase 3 — Ejecución por TAREAS con checkpoints
### Variables en Vercel primero · Cerrar fuga de Supabase (RLS) · Higiene de código · Dejar listo Wompi (Sandbox)

---

## ⚙️ INSTRUCCIONES DE EJECUCIÓN (leer primero)

- Ejecuta las tareas **en orden, una por una**.
- **Al terminar CADA tarea, DETENTE** y muéstrame lo que hiciste + el resultado del checkpoint. **No avances sin mi confirmación.** (Control en cada punto.)
- Si algo falla o no cuadra, párate y repórtalo; **no improvises cambios fuera del alcance** (especialmente ningún `DROP`, `DELETE` o `TRUNCATE`: esto corre sobre PRODUCCIÓN).
- Todo es para el **entorno de PRUEBA (Sandbox)**. Las variables reales de prueba ya están en el `.env.local`; úsalas, no inventes valores.
- Genera esto como una **lista de tareas (task list)** en tu panel para aprobar una a una.

### Por qué este orden
El fallo más probable es **tumbar el sitio**: la Tarea 4 quita los fallbacks hardcodeados y, si Vercel no tiene aún las variables, la app revienta al desplegar. Por eso **la Tarea 1 carga las variables en Vercel ANTES de tocar el código.** Con eso, cuando se quiten los fallbacks, las variables ya estarán ahí.

### Aclaración de seguridad
Quitar el hardcode NO cierra la fuga (la anon key seguirá en el navegador, y está bien). **Lo que cierra la fuga es el RLS (Tareas 2 y 3).**

---

## 🔶 (Recomendado antes de empezar) Respaldo
Corre sobre producción y sin staging. Antes de la Tarea 1, exporta un respaldo de la base (Supabase → Database → Backups, o `pg_dump`). El SQL de las Tareas 2 y 3 no borra datos y es reversible, pero un respaldo te cubre ante cualquier imprevisto. Si prefieres saltarlo, dímelo explícitamente.

---

## ✅ TAREA 1 — Generar variables de entorno para importación masiva en Vercel

**Objetivo:** dejar listas TODAS las variables para que yo las cargue en Vercel antes de cualquier cambio de código (así el sitio no se cae después).

**Acciones:**
1. Lee el `.env.local` de este proyecto.
2. Crea un archivo nuevo **`vercel-import.env`** en la raíz, con este formato y los **valores REALES** (no placeholders):
   ```env
   # ---------- Supabase ----------
   NEXT_PUBLIC_SUPABASE_URL=<valor real>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<valor real>
   SUPABASE_URL=<valor real>
   SUPABASE_SERVICE_ROLE_KEY=<valor real>
   # ---------- Sitio ----------
   NEXT_PUBLIC_SITE_URL=<https://tu-dominio-vercel>
   # ---------- Wompi (Sandbox / pruebas) ----------
   WOMPI_ENV=test
   WOMPI_PUBLIC_KEY=<pub_test_ real>
   WOMPI_PRIVATE_KEY=<prv_test_ real>
   WOMPI_INTEGRITY_SECRET=<test_integrity_ real>
   WOMPI_EVENTS_SECRET=<test_events_ real>
   ```
3. **Si alguna variable NO está en el `.env.local`** (muy probable con `SUPABASE_SERVICE_ROLE_KEY` o el dominio de Vercel), **NO inventes el valor**: lístame exactamente cuáles faltan para que yo las consiga y las agregue antes de importar.
4. **Añade `vercel-import.env` al `.gitignore`** (contiene la service_role y la llave privada de Wompi; JAMÁS debe subirse al repo) y corre `git status` para confirmar que no aparece como archivo a commitear.

**🛑 CHECKPOINT 1 — Detente y muéstrame:**
- El archivo `vercel-import.env` creado con los valores reales (o la lista de variables que faltan).
- Que está en `.gitignore` y que `git status` no lo muestra.
- Yo lo importo en Vercel (Settings → Environment Variables → Import), marcando **Production** y **Preview**, y te confirmo. Luego **borro el archivo local**.
> Espera mi OK para continuar.

---

## ✅ TAREA 2 — Cerrar fuga en tablas públicas: `citas` y `respuestas`

**Objetivo:** activar RLS y permitir solo INSERT desde `anon`, sin SELECT.

**Acciones (vía Supabase MCP):**
```sql
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon puede crear citas"
  ON public.citas FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE public.respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon puede crear respuestas"
  ON public.respuestas FOR INSERT TO anon WITH CHECK (true);
```

**Antes de terminar:** si los formularios usan `.insert(...).select()`, ese `.select()` quedará bloqueado por RLS y el insert dará error. Quita el `.select()` (el insert sigue funcionando). Si de verdad se necesita leer la fila de vuelta, NO abras SELECT a `anon`: repórtalo.

**🛑 CHECKPOINT 2 — Detente y muéstrame:**
1. Que el formulario de `citas` y `respuestas` **inserta OK**.
2. Que un SELECT con la anon key devuelve **vacío**:
   ```bash
   curl 'https://TU_PROYECTO.supabase.co/rest/v1/citas?select=*' \
     -H "apikey: TU_ANON_KEY" -H "Authorization: Bearer TU_ANON_KEY"
   # Esperado: []
   ```
3. Que las tablas ya no muestran el badge `UNRESTRICTED`.
> Espera mi OK para continuar.

---

## ✅ TAREA 3 — Cerrar fuga en tablas internas: `leads`, `usuarios`, `ventas`

**Objetivo:** activar RLS sin políticas para `anon` (deny-all). El servidor con service_role sigue funcionando.

**Acciones (vía Supabase MCP):**
```sql
ALTER TABLE public.leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas   ENABLE ROW LEVEL SECURITY;
```

**Antes de terminar, verifica:** busca en componentes `"use client"` llamadas `supabase.from('usuarios'|'leads'|'ventas')...`.
- Si NO hay acceso desde el cliente → basta con el RLS de arriba.
- Si un usuario **autenticado** lee su propia fila, agrega SOLO una política acotada:
  ```sql
  CREATE POLICY "cada usuario ve su propia fila"
    ON public.usuarios FOR SELECT TO authenticated
    USING (auth.uid() = id);  -- ajustar 'id' a la columna que referencia auth.users
  ```
  Nunca `USING (true)` para `anon`.

**🛑 CHECKPOINT 3 — Detente y muéstrame:** qué acceso encontraste por tabla, qué política agregaste (si aplicó) y que la app sigue funcionando en todas sus pantallas.
> Espera mi OK para continuar.

---

## ✅ TAREA 4 — Higiene de variables de Supabase (quitar hardcode)

> Seguro de desplegar: las variables ya están en Vercel desde la Tarea 1.

**Objetivo:** eliminar los fallbacks hardcodeados y leer todo desde variables de entorno.

**Acciones:**
1. En `lib/supabase/client.ts` y `lib/supabase/server.ts`, quita los literales (`'https://xxxx.supabase.co'`, `'sb_publishable_...'`). Mantén el mismo método de creación; solo cambia el origen:
   ```ts
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   if (!url || !anonKey) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
   // ...crear el cliente con `url` y `anonKey`
   ```
2. Crea/confirma `lib/supabase-admin.ts` (service_role, SOLO servidor):
   ```ts
   import { createClient } from "@supabase/supabase-js";
   export function supabaseAdmin() {
     const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
     const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
     if (!url || !serviceKey) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
     return createClient(url, serviceKey, { auth: { persistSession: false } });
   }
   ```

**🔒 Reglas absolutas para la service_role:** nunca `NEXT_PUBLIC_`, nunca hardcode/fallback, nunca en `"use client"` ni en el navegador. Solo servidor.

**🛑 CHECKPOINT 4 — Detente y muéstrame:** el diff de los 3 archivos y que `next build` local pasa sin errores.
> Espera mi OK para continuar.

---

## ✅ TAREA 5 — Verificar/implementar la integración Wompi (Sandbox)

**Objetivo:** confirmar que existen y están correctos los archivos del plan original (`plan.md`); si faltan, crearlos.

- `lib/wompi.ts` — config + `generateIntegritySignature()` (SHA256 de `reference+amountInCents+currency+integritySecret`) + `verifyEventChecksum()` + `getTransaction()`.
- `app/api/checkout/route.ts` — crea orden `PENDING`, firma en servidor, devuelve `checkoutUrl`. Monto: **$100.000 COP = `10_000_000` centavos**.
- `app/api/wompi/webhook/route.ts` — valida checksum, valida monto, actualiza la orden con `supabaseAdmin()`.
- `app/pagos/respuesta/page.tsx` — página de resultado (informativa).
- Botón de pago en la página de la consultoría.
- Tabla `orders` con RLS enabled (la escribe el servidor con service_role; sin políticas para `anon`).

**🛑 CHECKPOINT 5 — Detente y muéstrame:** la lista de archivos existentes/creados y cualquier ajuste.
> Espera mi OK para continuar.

---

## ✅ TAREA 6 — Deploy, registrar webhook y prueba end-to-end (Sandbox)

**Acciones (guíame; yo ejecuto lo del panel):**
1. Deploy en Vercel (variables ya cargadas desde la Tarea 1).
2. Yo registro en Wompi (Desarrollo → Programadores → URL de Eventos → Guardar):
   `https://TU_DOMINIO_VERCEL/api/wompi/webhook`
3. Pago de prueba con tarjeta `4242 4242 4242 4242` (fecha futura, CVC cualquiera).
4. Verificar en `orders` que pasa de `PENDING` → `APPROVED` **por el webhook** (no por la redirección).

**🛑 CHECKPOINT 6 — FINAL:** confirmar la orden `APPROVED` y que se dispara la acción post-pago. Reportar resultado.

---

### Nota para PRODUCCIÓN (más adelante, NO ahora)
Cambiar `WOMPI_ENV=prod` y las 4 llaves de Wompi a `pub_prod_ / prv_prod_ / prod_integrity_ / prod_events_`, y registrar la URL de Eventos de producción en Wompi.
