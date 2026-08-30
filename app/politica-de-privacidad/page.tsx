export default function PoliticaPrivacidadPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Información legal</span>
          <h1>Política de privacidad</h1>
          <p>Cómo tratamos los datos personales de clientes, técnicos y usuarios de CertificadoEnCasa.</p>
        </div>
      </section>
      <section className="section">
        <div className="container legal-content">
          <article className="legal-card">
            <p><strong>Última actualización:</strong> 30 de agosto de 2026.</p>

            <h2>1. Responsable del tratamiento</h2>
            <p><strong>Responsable:</strong> Francisco Mendoza Mesa.</p>
            <p><strong>NIF:</strong> 32070963Q.</p>
            <p><strong>Nombre comercial:</strong> CertificadoEnCasa.</p>
            <p><strong>Domicilio:</strong> Av. Pablo Iglesias 84, 28521 Rivas-Vaciamadrid, Madrid.</p>
            <p><strong>Correo de contacto y privacidad:</strong> solicitudes@certificadoencasa.com.</p>

            <h2>2. Qué datos tratamos</h2>
            <p>Según la relación que mantengas con CertificadoEnCasa, podremos tratar las siguientes categorías de datos:</p>
            <ul>
              <li><strong>Clientes:</strong> nombre, teléfono, correo electrónico, código postal, municipio, información del inmueble, motivo de la solicitud, observaciones y técnico elegido.</li>
              <li><strong>Técnicos:</strong> nombre, datos de contacto, localidad y provincia, titulación, número profesional cuando se facilite, experiencia, zonas de trabajo, precio orientativo, disponibilidad, fotografía de perfil opcional y datos necesarios para verificar y publicar el perfil.</li>
              <li><strong>Facturación de técnicos:</strong> plan contratado, comisiones, identificadores de cliente, suscripción, factura y método de pago generados por Stripe. CertificadoEnCasa no recibe ni almacena el número completo de la tarjeta.</li>
              <li><strong>Valoraciones:</strong> puntuación, comentario, nombre abreviado del cliente y consentimiento para publicar la opinión.</li>
              <li><strong>Datos técnicos:</strong> información básica necesaria para seguridad, prevención de abuso, funcionamiento y diagnóstico de incidencias.</li>
            </ul>

            <h2>3. Para qué usamos los datos</h2>
            <ul>
              <li>Gestionar solicitudes de Certificados de Eficiencia Energética y poner en contacto al cliente con el técnico que haya elegido.</li>
              <li>Gestionar el alta, verificación, publicación y disponibilidad de perfiles profesionales.</li>
              <li>Gestionar planes, suscripciones, comisiones, liquidaciones, facturas y cobros de los técnicos.</li>
              <li>Enviar comunicaciones operativas relacionadas con solicitudes, altas, pagos, incidencias y valoraciones.</li>
              <li>Gestionar y publicar valoraciones cuando el usuario haya aceptado su publicación.</li>
              <li>Prestar soporte, mantener la seguridad de la plataforma, prevenir usos fraudulentos y mejorar el servicio.</li>
              <li>Cumplir obligaciones legales, contables, fiscales y de atención a autoridades cuando resulte obligatorio.</li>
            </ul>

            <h2>4. Base jurídica</h2>
            <p>El tratamiento se basa, según el caso, en la aplicación de medidas precontractuales o la ejecución de la relación contractual solicitada por el usuario, el cumplimiento de obligaciones legales, el consentimiento para tratamientos opcionales como la publicación de una fotografía o una valoración, y el interés legítimo en proteger la plataforma, prevenir abusos y prestar soporte.</p>

            <h2>5. A quién comunicamos los datos</h2>
            <p>Cuando un cliente elige a un técnico, CertificadoEnCasa comunica al profesional los datos necesarios para que pueda contactar con el cliente y gestionar el servicio. A su vez, determinados datos profesionales del técnico se muestran públicamente cuando su perfil está verificado y publicado.</p>
            <p>También utilizamos proveedores tecnológicos necesarios para prestar el servicio, entre ellos infraestructura y alojamiento, base de datos, correo transaccional y pagos. Actualmente utilizamos servicios de Vercel, Supabase, Resend y Stripe, que tratarán los datos en la medida necesaria para prestar sus respectivos servicios y conforme a sus propias condiciones y acuerdos de protección de datos.</p>

            <h2>6. Transferencias internacionales</h2>
            <p>Algunos proveedores tecnológicos pueden tratar datos desde países situados fuera del Espacio Económico Europeo. Cuando ello implique una transferencia internacional de datos, se aplicarán las garantías exigidas por el RGPD, como decisiones de adecuación o mecanismos contractuales apropiados, según corresponda.</p>

            <h2>7. Durante cuánto tiempo conservamos los datos</h2>
            <p>Los datos se conservarán mientras sean necesarios para gestionar la relación con el usuario y, posteriormente, durante los plazos legalmente exigibles o mientras puedan derivarse responsabilidades. Los datos asociados a facturación y cobros se conservarán durante los periodos exigidos por la normativa fiscal, contable y mercantil aplicable.</p>
            <p>Las fotografías y demás datos opcionales de perfiles profesionales podrán eliminarse cuando dejen de ser necesarios o cuando proceda atender una solicitud válida de supresión, sin perjuicio de los datos que deban mantenerse por obligación legal.</p>

            <h2>8. Valoraciones</h2>
            <p>CertificadoEnCasa puede invitar al cliente a valorar al técnico elegido una vez transcurrido el periodo previsto desde la solicitud. La valoración es opcional. Solo se publicará si el cliente acepta expresamente su publicación y no se mostrará su correo electrónico ni su teléfono.</p>

            <h2>9. Decisiones automatizadas</h2>
            <p>CertificadoEnCasa puede utilizar filtros automáticos de ubicación, disponibilidad u otros criterios para mostrar perfiles relevantes, pero el cliente mantiene la decisión sobre qué profesional elige. No se adoptan decisiones exclusivamente automatizadas que produzcan efectos jurídicos o afecten significativamente al usuario de forma similar.</p>

            <h2>10. Derechos</h2>
            <p>Puedes solicitar el acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus datos cuando resulten aplicables, así como retirar un consentimiento previamente otorgado.</p>
            <p>Para ejercer tus derechos puedes escribir a <strong>solicitudes@certificadoencasa.com</strong>, indicando el derecho que deseas ejercer y la información necesaria para identificar tu solicitud.</p>

            <h2>11. Reclamaciones</h2>
            <p>Si consideras que el tratamiento de tus datos no se ajusta a la normativa, puedes presentar una reclamación ante la Agencia Española de Protección de Datos.</p>

            <h2>12. Seguridad</h2>
            <p>CertificadoEnCasa aplica medidas técnicas y organizativas razonables para proteger los datos personales frente a accesos no autorizados, pérdida, alteración o divulgación indebida, teniendo en cuenta la naturaleza de los datos y los riesgos del tratamiento.</p>

            <h2>13. Cambios en esta política</h2>
            <p>Esta política podrá actualizarse cuando cambien las funcionalidades, los proveedores, los tratamientos de datos o la normativa aplicable. La versión publicada en esta página será la vigente en cada momento.</p>
          </article>
        </div>
      </section>
    </>
  );
}
