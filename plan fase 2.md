# Plan de actualización — Rentash

Actualización del aplicativo web (Next.js + Supabase, desplegado en Vercel) para incorporar dos roles nuevos (**referido** y **vendedor**), ampliar el rol **contador**, y agregar el **motor de comisiones** con el modelo 65/10/5 que ya definimos.

> **Diseño:** todo lo nuevo reutiliza el sistema **Sky** ya presente en `globals.css` (`--bg`, `--fg`, `--sky`, `--sky-deep`, `--sky-pale`, clases `sky-btn` y `sky-card`, títulos en `--font-serif`, cifras en `.font-mono-code`). No se introduce ninguna paleta nueva. Las barras del panel de reparto usan degradados dentro de la familia Sky (`--sky-deep → --sky → --sky-pale`), no colores externos.

---

## 1. Modelo de roles (final)

| Rol | Qué ve y qué puede hacer |
|---|---|
| **developer** | Acceso total (técnico y de negocio). Superusuario. |
| **admin** | Operación de negocio: panel de leads (modificar y asignar), aprobar solicitudes de lead, cola de comisiones/pagos, ajustes (tope y porcentajes). |
| **contador** | Su CRM (leads asignados) **+ ahora** ve el panel de leads en solo lectura **+** botón "pedir lead" (genera una solicitud que aprueba el admin). |
| **vendedor** | Panel de referidos (sus links y conversiones) **+** panel de clientes manuales (agregar y marcar "confirmado", lo que envía el cliente al pool de leads) **+** sus comisiones. Gana por referido y por venta confirmada. |
| **referido** | Panel simple: sus dos links personales (test y agendar), lista de conversiones y sus ganancias (pendiente/pagada). |

**Regla de acceso al panel de leads:** lo **ven** developer, admin y contador. Lo **modifica** solo developer/admin. El vendedor **no** ve el panel de leads; solo ve sus propios clientes.

> ⚠️ **Confirmar:** ¿`admin` y `developer` son roles distintos en tu app, o hoy manejas un solo rol "admin/dev"? El plan los deja separados (dev = técnico total, admin = negocio); si son el mismo, se colapsan sin cambiar nada más.

---

## 2. Modelo de datos (Supabase / Postgres)

Migraciones aditivas. Ajusta nombres si tu tabla de perfiles no se llama `profiles`.

### 2.1 Enums

```sql
create type user_role           as enum ('developer','admin','contador','vendedor','referido');
create type lead_stage          as enum ('nuevo','por_asignar','asignada','anticipo_pagado','en_declaracion','entregada','cancelada');
create type lead_source         as enum ('referido','vendedor','test','directo');
create type referral_event_type as enum ('test','consultoria');
create type request_status      as enum ('pendiente','aprobada','rechazada');
create type commission_role     as enum ('referido','vendedor','contador');
create type commission_status   as enum ('por_pagar','pagada','anulada');
```

### 2.2 Perfiles (alter)

```sql
alter table profiles
  add column if not exists role user_role not null default 'referido',
  add column if not exists referral_slug text unique,   -- identifica a la persona en sus links
  add column if not exists phone text,
  -- datos de dispersión (referido / vendedor) para el pago a cuenta bancaria
  add column if not exists payout_bank text,
  add column if not exists payout_account_type text,
  add column if not exists payout_account_number text,
  add column if not exists payout_doc_id text;
```

El `referral_slug` se genera al crear el usuario (ej. `juan-p3k9`). Un solo slug por persona sirve para **ambos** links (test y agendar); el tipo se distingue por la ruta.

### 2.3 Leads (pipeline de clientes)

```sql
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  source lead_source not null default 'directo',
  referrer_id uuid references profiles(id),          -- referido o vendedor que lo trajo
  seller_id   uuid references profiles(id),          -- vendedor que confirmó la venta
  assigned_contador_id uuid references profiles(id), -- lo fija el admin al aprobar
  stage lead_stage not null default 'nuevo',
  declaration_amount numeric(12,0),                  -- valor de la declaración (COP), base de comisión
  anticipo_paid_at timestamptz,                      -- disparador de comisiones
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Un vendedor puede ser a la vez `referrer_id` y `seller_id` del mismo lead: en ese caso cobra **las dos** comisiones.

### 2.4 Eventos de referido (tracking de links)

```sql
create table if not exists referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id),
  event_type referral_event_type not null,           -- 'test' | 'consultoria'
  contact_name text,
  contact_email text,
  contact_phone text,
  lead_id uuid references leads(id),                 -- se enlaza cuando se vuelve cliente
  created_at timestamptz not null default now()
);
```

Es lo que alimenta el panel del referido ("alguien hizo el test / agendó por tu link").

### 2.5 Solicitudes de lead (botón "pedir lead" del contador)

```sql
create table if not exists lead_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  contador_id uuid not null references profiles(id),
  status request_status not null default 'pendiente',
  resolved_by uuid references profiles(id),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz
);
```

### 2.6 Comisiones

```sql
create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  beneficiary_id uuid not null references profiles(id),
  role commission_role not null,
  base_amount numeric(12,0) not null,   -- valor de la declaración
  pct numeric(5,2) not null,
  amount numeric(12,0) not null,
  status commission_status not null default 'por_pagar',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (lead_id, beneficiary_id, role)
);
```

### 2.7 Ajustes (tope y porcentajes, una sola fila)

```sql
create table if not exists app_settings (
  id boolean primary key default true check (id),
  tope           numeric(12,0) not null default 500000,
  pct_contador   numeric(5,2)  not null default 65,
  pct_vendedor   numeric(5,2)  not null default 10,
  pct_desarrollo numeric(5,2)  not null default 5,
  pct_ref_bajo   numeric(5,2)  not null default 10,
  pct_ref_sobre  numeric(5,2)  not null default 5
);
insert into app_settings (id) values (true) on conflict do nothing;
```

---

## 3. Motor de comisiones (modelo 65/10/5)

Esta es la lógica que ya acordamos: **el contador absorbe los cajones que no ocupen referido ni vendedor**, y la plataforma es el remanente. La consultoría de $100.000 **no** entra en esta base.

```sql
create or replace function generate_commissions(p_lead_id uuid)
returns void language plpgsql security definer as $$
declare
  l leads%rowtype;
  s app_settings%rowtype;
  ref_slot numeric;
  has_ref  boolean;
  has_vend boolean;
  pct_con  numeric;
begin
  select * into l from leads where id = p_lead_id;
  select * into s from app_settings where id = true;

  if l.declaration_amount is null then
    raise exception 'declaration_amount requerido antes de generar comisiones';
  end if;

  has_ref  := l.referrer_id is not null;
  has_vend := l.seller_id  is not null;
  ref_slot := case when l.declaration_amount > s.tope then s.pct_ref_sobre else s.pct_ref_bajo end;

  -- el contador recibe su base + lo que no ocupe referido/vendedor
  pct_con := s.pct_contador
             + case when has_ref  then 0 else ref_slot        end
             + case when has_vend then 0 else s.pct_vendedor  end;

  if l.assigned_contador_id is not null then
    insert into commissions(lead_id,beneficiary_id,role,base_amount,pct,amount)
    values (l.id, l.assigned_contador_id, 'contador', l.declaration_amount, pct_con,
            round(l.declaration_amount * pct_con / 100))
    on conflict (lead_id,beneficiary_id,role) do nothing;
  end if;

  if has_ref then
    insert into commissions(lead_id,beneficiary_id,role,base_amount,pct,amount)
    values (l.id, l.referrer_id, 'referido', l.declaration_amount, ref_slot,
            round(l.declaration_amount * ref_slot / 100))
    on conflict (lead_id,beneficiary_id,role) do nothing;
  end if;

  if has_vend then
    insert into commissions(lead_id,beneficiary_id,role,base_amount,pct,amount)
    values (l.id, l.seller_id, 'vendedor', l.declaration_amount, s.pct_vendedor,
            round(l.declaration_amount * s.pct_vendedor / 100))
    on conflict (lead_id,beneficiary_id,role) do nothing;
  end if;
end $$;
```

**Reparto completo (para el panel):** contador + referido + vendedor + desarrollo (5%) + plataforma (remanente) = 100%. Desarrollo y plataforma no son pagos a usuarios; se muestran en el panel de reparto por transparencia, pero no generan filas en `commissions`.

### 3.1 Disparador: anticipo del 50%

La comisión se causa cuando el cliente **compra la declaración y paga el anticipo del 50%**. En ese momento la comisión queda `por_pagar` (redimible) y la dispersión al banco ocurre un par de horas después.

```sql
create or replace function on_anticipo_paid() returns trigger language plpgsql as $$
begin
  if new.stage = 'anticipo_pagado' and old.stage is distinct from 'anticipo_pagado' then
    if new.anticipo_paid_at is null then new.anticipo_paid_at := now(); end if;
  end if;
  return new;
end $$;
create trigger trg_set_anticipo before update on leads
  for each row execute function on_anticipo_paid();

create or replace function after_anticipo_paid() returns trigger language plpgsql as $$
begin
  if new.stage = 'anticipo_pagado' and old.stage is distinct from 'anticipo_pagado' then
    perform generate_commissions(new.id);
  end if;
  return new;
end $$;
create trigger trg_gen_commissions after update on leads
  for each row execute function after_anticipo_paid();
```

> **Requisito:** `declaration_amount` debe estar seteado antes de mover el lead a `anticipo_pagado`. Lo fija el admin/dev en el panel de leads.

### 3.2 Pago (dispersión)

- Fase 1 (ahora): las comisiones `por_pagar` aparecen en **`/admin/comisiones`** como cola de pago. Un job programado (o el admin) las marca `pagada` y registra la referencia de transferencia. El delay de "un par de horas" se cubre con un cron (Vercel Cron / Supabase scheduled function) que procesa el lote.
- Fase 2 (opcional, después): integrar un proveedor de dispersión bancaria en Colombia para automatizar la transferencia a la cuenta registrada en el perfil.

---

## 4. Seguridad por rol (RLS en Supabase)

```sql
create or replace function current_role() returns user_role language sql stable as $$
  select role from profiles where id = auth.uid();
$$;

alter table leads           enable row level security;
alter table referral_events enable row level security;
alter table lead_requests   enable row level security;
alter table commissions     enable row level security;

-- LEADS: ven dev/admin/contador; el vendedor solo los suyos
create policy leads_select on leads for select using (
  current_role() in ('developer','admin','contador')
  or seller_id = auth.uid()
);
-- solo dev/admin modifican el panel de leads
create policy leads_update on leads for update using (current_role() in ('developer','admin'));
-- el vendedor puede crear su propio cliente; dev/admin también
create policy leads_insert on leads for insert with check (
  current_role() in ('developer','admin')
  or (current_role() = 'vendedor' and seller_id = auth.uid())
);

-- EVENTOS DE REFERIDO: cada quien ve los suyos
create policy ref_select on referral_events for select using (
  referrer_id = auth.uid() or current_role() in ('developer','admin')
);

-- SOLICITUDES DE LEAD: el contador crea/ve las suyas; dev/admin todo
create policy req_insert on lead_requests for insert with check (contador_id = auth.uid() and current_role() = 'contador');
create policy req_select on lead_requests for select using (contador_id = auth.uid() or current_role() in ('developer','admin'));
create policy req_update on lead_requests for update using (current_role() in ('developer','admin'));

-- COMISIONES: cada quien ve las suyas; dev/admin todo; solo dev/admin cambian estado
create policy com_select on commissions for select using (
  beneficiary_id = auth.uid() or current_role() in ('developer','admin')
);
create policy com_update on commissions for update using (current_role() in ('developer','admin'));
```

En Next.js, además del RLS, el `middleware.ts` redirige por rol (un contador no debe poder abrir la UI de `/admin/comisiones`).

---

## 5. Atribución de referidos (links personales)

Formato de links (todo interno):

- Test: `https://rentash.vercel.app/test?ref=<referral_slug>`
- Agendar: `https://rentash.vercel.app/agendar?ref=<referral_slug>`

Flujo:

1. La visita llega con `?ref=slug`. Un efecto (o el `middleware`) guarda una cookie `rentash_ref` con el slug, **first-touch** (no se sobrescribe si ya existe), expiración 30 días.
2. Al enviar el test o agendar la consultoría, se resuelve `referrer_id` desde el slug y se inserta un `referral_events`.
3. Cuando ese contacto se vuelve cliente (compra la declaración), se setea `leads.referrer_id` = ese referrer y se enlaza `referral_events.lead_id`.

> ⚠️ **Confirmar:** dejé **first-touch** (gana quien lo trajo primero). Si prefieres last-touch (gana el último link usado), es cambiar una línea. Además: ¿cuál es el `slug` deseado (nombre legible, aleatorio, o editable por el usuario)?

---

## 6. Rutas y páginas (Next.js App Router)

```
app/
  (public)/
    test/page.tsx            # captura ?ref → cookie → formulario de test
    agendar/page.tsx         # captura ?ref → agenda consultoría (interno)
  admin/
    login/page.tsx           # ya existe
    leads/page.tsx           # panel de leads: pool + asignación   [dev/admin editan · contador lee]
    solicitudes/page.tsx     # aprobar/rechazar lead_requests       [dev/admin]
    comisiones/page.tsx      # cola de pago + panel de reparto       [dev/admin]
    ajustes/page.tsx         # tope y porcentajes                    [dev/admin]
  panel/
    contador/page.tsx        # CRM asignados + panel de leads (lectura) + "pedir lead"
    vendedor/page.tsx        # referidos + clientes manuales + "marcar confirmado" + comisiones
    referido/page.tsx        # 2 links + conversiones + ganancias (pendiente/pagada)
  middleware.ts              # gate por rol y redirección al panel correcto
lib/
  commissions.ts             # helpers de cálculo/formato (mismo modelo del SQL, para previsualizar)
  referral.ts                # set/get cookie de atribución, resolver slug
```

### 6.1 Panel de contador
- CRM: leads con `assigned_contador_id = auth.uid()`.
- Panel de leads en **solo lectura** (pool `assigned_contador_id is null` en `por_asignar`).
- Botón **"pedir lead"** → inserta `lead_requests` (pendiente). No asigna al instante.

### 6.2 Flujo "pedir lead" → asignación
1. Contador pide un lead → `lead_requests` pendiente.
2. Admin/dev en `/admin/solicitudes` aprueba → `leads.assigned_contador_id = contador_id`, `stage = 'asignada'`, request `aprobada`.
3. El lead aparece en el CRM del contador.

### 6.3 Panel de vendedor
- **Referidos:** igual que el del referido (sus 2 links + conversiones).
- **Clientes manuales:** formulario para crear un lead con `seller_id = auth.uid()`, `source = 'vendedor'`, `stage = 'nuevo'`.
- **Marcar "cliente confirmado":** pasa el lead a `stage = 'por_asignar'`, con lo que entra al pool del panel de leads para que dev/admin lo asignen. (El vendedor no ve el panel de leads, solo su propia lista.)
- **Comisiones:** ve las suyas (por referido y por venta), con estado.

### 6.4 Panel de referido
- Dos tarjetas `sky-card` con sus links (botón copiar).
- Lista de conversiones desde `referral_events`.
- Ganancias: comisiones propias con estado `por_pagar` / `pagada`.
- Sección de datos bancarios (para la dispersión).

---

## 7. Panel de reparto dentro de la app

Reutiliza el panel que ya construimos, pero leyendo valores reales:

- En **`/admin/comisiones`** y en el detalle de cada lead: barra de reparto (contador / referido / vendedor / desarrollo / plataforma) con montos en COP, calculada con `app_settings` y `declaration_amount`. Colores en escala Sky.
- Cada colaborador ve, en su panel, solo su propia comisión por lead.

---

## 8. Orden de implementación (fases)

1. **Roles y auth.** Enum `user_role`, `referral_slug`, campos de perfil, `middleware` de gate por rol, generación de slug.
2. **Leads + panel + asignación.** Tabla `leads`, `lead_requests`, panel de leads, flujo pedir/aprobar, actualización del CRM del contador.
3. **Referidos.** Links, cookie de atribución, `referral_events`, panel de referido.
4. **Vendedor.** Clientes manuales, "marcar confirmado", entrada al pool.
5. **Comisiones.** `app_settings`, `commissions`, `generate_commissions`, triggers, `/admin/comisiones`, `/admin/ajustes`, paneles de ganancias.
6. **Dispersión.** Cron de pagos + (después) proveedor bancario automático.

---

## 9. Puntos por confirmar antes de codificar

1. ¿`admin` y `developer` son roles separados o uno solo? (el plan los separa)
2. Atribución **first-touch** vs last-touch, y forma del `referral_slug`.
3. La **consultoría** ($100.000): ¿se abona al valor de la declaración o es totalmente aparte? Afecta la base de comisión.
4. ¿Quién fija `declaration_amount` y en qué paso (admin al asignar, o al registrar el anticipo)?
5. Dispersión bancaria: por ahora manual/cron; ¿tienes ya un proveedor de dispersión en mente para automatizarla en fase 2?
