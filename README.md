https://github.com/SantiSrz/Camel--Companion--Club.git
# 🐪 EduPulse — Inteligencia Educativa y Apoyo a la Decisión Docente

> **Proyecto desarrollado para la VII Edición Internacional de #hack4edu (3–7 de noviembre de 2026)**  
> **Reto abordado:** Reto 13 · *La escuela que aprende de sus datos* (Reto ProFuturo)  
> **Demo en vivo:** [https://camel-companion-club.lovable.app](https://camel-companion-club.lovable.app)

---

## 🎯 El Problema y Nuestra Solución

Las escuelas generan diariamente miles de datos sobre asistencia, aprendizaje, formación docente, utilización de recursos y participación, pero en entornos vulnerables o con brechas de acceso carecen de herramientas sencillas para interpretarlos.

**EduPulse** transforma estos datos dispersos en alertas tempranas comprensibles y planes de intervención accionables para docentes, directores y responsables educativos, cumpliendo estrictamente con dos premisas éticas innegociables:
1. **Cero decisiones automáticas sobre estudiantes (*Human-in-the-loop*):** El sistema sugiere, explica y prioriza, pero la decisión final recae siempre en el profesional educativo.
2. **Privacidad y RGPD desde el diseño:** Seudonimización completa de identificadores estudiantiles (`ALU-XXXX`) en todas las capas de análisis y visualización.

---

## ✨ Características Principales

* **📊 Panel de Control Escolar (`/panel` y `/datos`):** Registro y monitorización de métricas académicas, asistencia, nivel de conectividad y adopción de recursos ProFuturo bajo identificadores seudonimizados.
* **🔍 Alertas y Explicabilidad XAI (`/alertas` y `/predicciones`):** Motor basado en modelos interpretables (*Random Forest*) que desglosa el peso exacto de cada factor (ej. inasistencias consecutivas vs. brecha de conectividad domiciliaria), eliminando las "cajas negras".
* **👩‍🏫 Planes de Intervención con Humano al Mando (`/planes`):** Flujo de validación donde el tutor aprueba, modifica o descarta las recomendaciones asistidas y realiza el seguimiento pedagógico.
* **🛡️ Gobernanza y Ética (`/etica`):** Transparencia algorítmica, cumplimiento del RGPD (Reglamento UE 2016/679) y arquitectura preparada para entornos de conectividad intermitente.
* **🤝 Sostenibilidad e Impacto B2G / B2NGO (`/contratacion`):** Modelo de transferencia al mercado mediante licencias institucionales (Ministerios, ONGs, Fundaciones y patrocinadores) con pasarela Stripe para garantizar que la escuela vulnerable reciba la herramienta de forma 100% gratuita.

---

## 🛠️ Arquitectura y Stack Tecnológico

### Frontend & Cloud
* **Framework:** React 18 + TypeScript + Vite
* **Estilos y UI:** Tailwind CSS + shadcn/ui (Radix UI) + Lucide Icons + Recharts
* **Backend & Base de Datos:** Supabase / Lovable Cloud (PostgreSQL + Auth + Row Level Security)
* **Pagos y Notificaciones:** Stripe Checkout (licencias institucionales) + Resend

### Machine Learning & Ciencia de Datos (`/model`)
* **Librerías:** Python, `scikit-learn`, `pandas`, `numpy`, `joblib`
* **Modelo:** Pipeline con `StandardScaler` y `RandomForestClassifier` optimizado mediante validación cruzada (`GridSearchCV`, `class_weight="balanced"`).
* **Explicabilidad:** Extracción de importancia de características global y atribución local por estudiante para justificar cada alerta preventiva.

---

## 🚀 Estructura del Repositorio e Instalación

```text
├── src/                  # Código fuente del Frontend (React + TypeScript)
├── supabase/             # Esquemas, funciones Edge y configuración de base de datos
├── model/                # Motor de Machine Learning y Explicabilidad (XAI)
│   ├── train_model.py    # Script de generación de datos sintéticos, entrenamiento y auditoría
│   ├── requirements.txt  # Dependencias de Python (scikit-learn, pandas, joblib)
│   └── artifacts/        # Modelo serializado (.joblib), dataset (.csv) y reporte (.json)
└── README.md