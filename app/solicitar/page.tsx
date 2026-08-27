export default function SolicitarPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Pedir certificado</span>
          <h1>Cuéntanos qué inmueble necesitas certificar.</h1>
          <p>Este formulario es una demo visual. El siguiente paso será conectarlo con la base de datos y usar la ubicación para mostrar técnicos disponibles.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <form className="form-card">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="postal">Código postal</label>
                <input id="postal" name="postal" inputMode="numeric" placeholder="28001" />
              </div>
              <div className="field">
                <label htmlFor="type">Tipo de inmueble</label>
                <select id="type" name="type" defaultValue="">
                  <option value="" disabled>Selecciona</option>
                  <option>Piso</option>
                  <option>Vivienda unifamiliar</option>
                  <option>Local</option>
                  <option>Oficina</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="surface">Superficie aproximada</label>
                <input id="surface" name="surface" inputMode="numeric" placeholder="Ej. 85 m²" />
              </div>
              <div className="field">
                <label htmlFor="reason">Motivo</label>
                <select id="reason" name="reason" defaultValue="">
                  <option value="" disabled>Selecciona</option>
                  <option>Venta</option>
                  <option>Alquiler</option>
                  <option>Ayuda o subvención</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="field full">
                <label htmlFor="notes">Información adicional</label>
                <textarea id="notes" name="notes" placeholder="Añade cualquier detalle que pueda ayudar al técnico." />
              </div>
              <div className="field">
                <label htmlFor="name">Nombre</label>
                <input id="name" name="name" placeholder="Tu nombre" />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="tu@email.com" />
              </div>
            </div>
            <button className="button" type="button" style={{ marginTop: 22 }}>Ver técnicos disponibles</button>
            <p className="form-note">Demo: todavía no se envían ni almacenan estos datos.</p>
          </form>
        </div>
      </section>
    </>
  );
}
