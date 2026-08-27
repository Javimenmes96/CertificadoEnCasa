# CertificadoEnCasa

Marketplace nacional para conectar clientes que necesitan un Certificado de Eficiencia Energética (CEE) con técnicos habilitados.

## Estado actual

MVP navegable con Next.js 16.3.3 y TypeScript, desplegado en Vercel.

### Páginas principales

- `/` — portada y propuesta de valor
- `/como-funciona` — flujo cliente → técnico → CEE
- `/tecnicos` — perfiles de técnicos de ejemplo
- `/precios` — planes para técnicos
- `/unete-como-tecnico` — captación de profesionales
- `/solicitar` — formulario de captación de solicitudes
- `/admin` — panel privado de leads
- `/aviso-legal`
- `/politica-de-privacidad`
- `/politica-de-cookies`

## Captación de leads con Supabase

La web está preparada para guardar las solicitudes en una tabla `public.leads` de Supabase.

### 1. Crear la tabla

En Supabase, abre el SQL Editor y ejecuta el contenido de:

`supabase/schema.sql`

### 2. Variables de entorno

Añade en Vercel:

```text
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_USER=elige-un-usuario
ADMIN_PASSWORD=elige-una-contraseña-larga
```

La clave `SUPABASE_SECRET_KEY` es exclusivamente de servidor y nunca debe exponerse en el navegador ni subirse al repositorio.

Después de añadir o cambiar variables en Vercel, hay que volver a desplegar la aplicación para que el deployment de producción las reciba.

### 3. Flujo

1. Un cliente rellena `/solicitar`.
2. `POST /api/leads` valida la solicitud.
3. El servidor guarda el lead en Supabase.
4. El administrador entra en `/admin` con las credenciales configuradas y puede consultar las solicitudes recibidas.

## Decisiones de producto

- Alcance: toda España.
- Servicio inicial: solo Certificados de Eficiencia Energética.
- El cliente elige al técnico.
- Cada técnico fija su propio precio.
- El cliente paga directamente al técnico.
- Los técnicos deben verificarse antes de aparecer públicamente.
- Perfiles con valoraciones, zona de servicio, disponibilidad y área privada.
- Plan Básico: 0 €/mes + 20% de comisión.
- Plan Premium: 29 €/mes + 12% de comisión.
- Plan Plus: cuota y comisión final pendientes de cerrar.

## Stack

- Next.js + TypeScript
- PostgreSQL / Supabase
- Vercel
- Stripe previsto para cuotas de técnicos
- Servicio de email pendiente
- Mapas / geolocalización pendientes

## Ejecutar en local

```bash
npm install
npm run dev
```

Después abre `http://localhost:3000`.

## Próximos pasos

1. Conectar el proyecto real de Supabase.
2. Probar el primer lead de principio a fin.
3. Añadir aviso por email cuando entra una solicitud.
4. Crear alta de técnicos y verificación documental.
5. Implementar matching por zona y filtros.
6. Añadir estados editables del lead en el panel.
7. Integrar cuotas de técnicos.
