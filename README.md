# CertificadoEnCasa

Marketplace nacional para conectar clientes que necesitan un Certificado de Eficiencia Energética (CEE) con técnicos habilitados.

## Estado actual

Primera demo navegable con Next.js 16.3.3 y TypeScript.

### Páginas

- `/` — portada y propuesta de valor
- `/como-funciona` — flujo cliente → técnico → CEE
- `/tecnicos` — perfiles de técnicos de ejemplo
- `/precios` — planes para técnicos
- `/solicitar` — formulario visual de solicitud

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

## Stack previsto

- Next.js + TypeScript
- PostgreSQL / Supabase
- Autenticación y almacenamiento documental
- Stripe para cuotas de técnicos
- Resend para emails
- Mapas / geolocalización
- Vercel para despliegue

## Ejecutar en local

```bash
npm install
npm run dev
```

Después abre `http://localhost:3000`.

## Próximos pasos

1. Conectar Supabase.
2. Crear registro y login de cliente/técnico.
3. Diseñar verificación documental de técnicos.
4. Guardar solicitudes de CEE.
5. Hacer matching por ubicación y filtros.
6. Crear agenda/disponibilidad y valoraciones.
7. Integrar cuotas de técnicos.
8. Desplegar una demo pública en Vercel.
