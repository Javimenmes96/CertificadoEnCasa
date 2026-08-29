import { Suspense } from "react";
import SolicitarForm from "./SolicitarForm";

export default function SolicitarPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Pedir certificado</span>
          <h1>Elige al técnico y cuéntale qué inmueble necesitas certificar.</h1>
          <p>
            Puedes comparar profesionales verificados antes de enviar la solicitud. Si todavía no quieres elegir,
            deja los datos del inmueble y podrás revisar los perfiles disponibles después.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Suspense fallback={<div className="form-card">Cargando formulario…</div>}>
            <SolicitarForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
