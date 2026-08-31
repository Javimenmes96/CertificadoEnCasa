"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./howItWorks.module.css";

const steps = [
  {
    number: "1",
    title: "Indica la ubicación",
    text: "Escribe el código postal del inmueble y te mostramos profesionales que trabajan realmente en esa zona.",
    visual: "location",
  },
  {
    number: "2",
    title: "Compara y elige",
    text: "Revisa técnicos verificados, precios orientativos, experiencia y zona de servicio antes de decidir.",
    visual: "compare",
  },
  {
    number: "3",
    title: "Visita y certificado",
    text: "El técnico elegido contacta contigo, acuerda la visita y completa el certificado energético.",
    visual: "certificate",
  },
] as const;

function StepVisual({ type }: { type: (typeof steps)[number]["visual"] }) {
  if (type === "location") {
    return (
      <div className={`${styles.visual} ${styles.locationVisual}`} aria-hidden="true">
        <div className={styles.mapGrid} />
        <div className={styles.locationSearch}><span>28001</span><span className={styles.searchDot}>⌕</span></div>
        <div className={styles.pin}><span /></div>
      </div>
    );
  }

  if (type === "compare") {
    return (
      <div className={`${styles.visual} ${styles.compareVisual}`} aria-hidden="true">
        <div className={styles.profileRow}><span className={styles.avatar}>CM</span><span className={styles.profileName}>Carlos M.</span><strong>45 €</strong></div>
        <div className={styles.profileRow}><span className={styles.avatar}>LG</span><span className={styles.profileName}>Laura G.</span><strong>52 €</strong></div>
        <div className={styles.profileRow}><span className={styles.avatar}>SR</span><span className={styles.profileName}>Sergio R.</span><strong>59 €</strong></div>
        <span className={styles.exampleBadge}>Ejemplo</span>
      </div>
    );
  }

  return (
    <div className={`${styles.visual} ${styles.certificateVisual}`} aria-hidden="true">
      <div className={styles.certificateSheet}>
        <div className={styles.certificateTop}>CEE</div>
        <div className={styles.energyBars}>
          <span /><span /><span /><span /><span />
        </div>
      </div>
      <div className={styles.checkBubble}>✓</div>
    </div>
  );
}

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`section section-white ${styles.section}`}>
      <div className="container">
        <div className={styles.heading}>
          <span className="eyebrow">Cómo funciona</span>
          <h2>Tu certificado en 3 pasos.</h2>
          <p>Encuentra profesionales de tu zona, compara opciones y elige tú mismo a quién contratar.</p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div className={styles.stepWrap} key={step.number}>
              <article
                className={`${styles.stepCard} ${visible ? styles.visible : ""}`}
                style={{ transitionDelay: `${index * 140}ms` }}
              >
                <div className={styles.stepNumber}>{step.number}</div>
                <StepVisual type={step.visual} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
              {index < steps.length - 1 ? <div className={styles.arrow} aria-hidden="true">→</div> : null}
            </div>
          ))}
        </div>

        <p className={styles.note}>Los nombres y precios mostrados en el paso 2 son solo un ejemplo visual de comparación.</p>
      </div>
    </section>
  );
}
