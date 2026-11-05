# EduPulse

Repositorio: https://github.com/SantiSrz/Camel--Companion--Club.git

Plataforma de seguimiento educativo para ayudar a docentes y centros a revisar indicadores, detectar señales tempranas y organizar apoyos pedagógicos. Proyecto presentado a **#hack4edu 2026**, en el reto ProFuturo de educación digital inclusiva.

> **Estado del producto:** MVP de hackathon. Las señales actuales son reglas transparentes. La pantalla de predicciones combina una auditoría de modelo entrenado con datos sintéticos y un índice didáctico para registros de demostración; no ofrece predicciones reales de abandono. Consulta [Limitaciones y uso responsable](#limitaciones-y-uso-responsable).

**Demo publicada:** [https://camel-companion-club.vercel.app](https://camel-companion-club.vercel.app)

## Qué permite hacer

- **Acceso por centro y roles:** registro e inicio de sesión de docentes y dirección. Los centros existentes se comparten mediante invitaciones vinculadas a un email confirmado.
- **Seguimiento de estudiantes:** alta individual o importación CSV con plantilla vacía o con 30 registros ficticios identificados como demostración. La importación valida filas, muestra vista previa y detecta códigos duplicados.
- **Panel y alertas:** indicadores agregados por grupo y señales basadas en umbrales visibles para asistencia, nota y tareas. Las alertas no son predicciones de IA.
- **Apoyo pedagógico:** creación y seguimiento de planes; el docente selecciona la acción y prioridad y confirma explícitamente su revisión.
- **Vista de demostración analítica:** permite explorar el índice didáctico de los registros marcados como demo y consultar la importancia global del Random Forest entrenado con datos sintéticos.
- **Contratación institucional:** paquetes por capacidad de centros, disponibilidad por entorno y flujo de pago Stripe. La disponibilidad no se inventa cuando el backend no está configurado.
- **Idiomas:** interfaz en español, inglés y francés.

## Demo de estudiantes y CSV

En la aplicación, abre **Estudiantes → Importar CSV**:

1. Descarga el CSV de demostración con 30 estudiantes ficticios o la plantilla vacía.
2. Selecciona el archivo y revisa las filas válidas y los errores.
3. Confirma la importación de las filas válidas.

La importación admite hasta 500 registros y archivos CSV de hasta 2 MB. Las columnas obligatorias son código, curso, asistencia, entregas, uso de recursos y nota. Conectividad, situación académica y observaciones son opcionales. Se aceptan separadores por coma o punto y coma, y decimales con coma en CSV separado por punto y coma.

**No incluyas nombres, emails, contactos ni información sensible de menores.** Para datos reales, utiliza códigos seudonimizados y sigue las políticas de protección de datos de tu centro.

## Señales, modelo y explicabilidad

### Señales operativas

Las rutas **Alertas** y el resumen del panel aplican reglas fijas y visibles (por ejemplo, asistencia inferior al 75 % como señal prioritaria). Muestran el indicador y el umbral que activaron cada señal; el profesional revisa el contexto y decide qué hacer.

### Demostración del modelo

El script [model/train_model.py](./model/train_model.py) genera datos sintéticos, entrena un pipeline de `StandardScaler` y `RandomForestClassifier`, evalúa métricas y exporta un informe. El reporte incluido en `artifacts/model_audit_report.json` refleja una evaluación sobre ese conjunto sintético; **no mide resultados de escuelas reales**.

En **Predicciones**, el índice 0–100 de cada registro de demostración se calcula con una fórmula pedagógica explícita sobre sus métricas (asistencia 30 %, nota 25 %, entregas 20 %, uso de recursos 15 % y conectividad 10 %). Es un **índice didáctico, no una probabilidad ni pronóstico de abandono** y no lo calcula el Random Forest. La importancia global del Random Forest se presenta por separado y no como explicación individual ni como valores SHAP.

El servicio de inferencia real no está conectado. Los registros reales no reciben puntuaciones de demostración.

## Tecnologías

- **Aplicación:** React 19, TypeScript, TanStack Start/Router, Vite 8, Tailwind CSS 4 y componentes Radix/shadcn.
- **Datos y autenticación:** Supabase (PostgreSQL, Auth y Row Level Security).
- **Gráficos:** Recharts. **Pagos institucionales:** Stripe Checkout. **Confirmaciones de compra:** Resend.
- **Modelo experimental:** Python, NumPy, pandas, scikit-learn y joblib.

## Ejecución local

Requisitos: Node.js compatible con el proyecto y npm. Para conectar la app a Supabase, configura `.env.local`:

```env
VITE_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Inicia la aplicación:

```bash
npm install
npm run dev
```

Ejecuta comprobaciones:

```bash
npm test
npm run lint
npm run build
```

La configuración de [supabase/config.toml](./supabase/config.toml) desactiva la confirmación por email **solo para Supabase local**. Para usarla, inicia tu instancia local de Supabase y apunta las variables de la app a esa instancia. Este ajuste no cambia el proyecto alojado. En producción es recomendable conservar la confirmación: las invitaciones para unirse a un centro dependen de verificar el email.

## Entrenamiento experimental

Desde la raíz del repositorio:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r model/requirements.txt
python model/train_model.py
```

El script escribe resultados en `artifacts/` respecto del directorio actual. El CSV y el modelo serializado son artefactos de experimentación con datos sintéticos; el frontend no carga el archivo `.joblib` ni consulta un endpoint de inferencia.

## Contratación institucional

La ruta **Licencias institucionales** consulta disponibilidad real y permite solicitar los paquetes configurados. Para habilitar Stripe localmente se requieren servicios y secretos de servidor:

```env
SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_SECRETA_DE_SERVIDOR
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_DE_PRUEBAS
STRIPE_ALLOWED_ORIGINS=http://localhost:8080
```

Configura Automatic Tax en Stripe. No expongas `SUPABASE_SERVICE_ROLE_KEY` ni `STRIPE_SECRET_KEY` en variables `VITE_*`, en el navegador o en el repositorio. La aplicación verifica la sesión de Stripe antes de activar la licencia; el entorno test y el real mantienen inventarios separados.

Las confirmaciones de compra por email requieren configuración de Resend y sender verificado en producción. La opción de prueba restringida requiere además un destinatario de prueba configurado en servidor; no equivale a desactivar ni afecta a los emails de autenticación de Supabase.

## Privacidad, roles y límites

- Los datos educativos están protegidos por políticas de acceso por centro. La dirección consulta resultados agregados; las observaciones y notas individuales son para el rol autorizado de docente.
- Las invitaciones para centros existentes requieren email confirmado. Desactivar esa comprobación en producción debilitaría la verificación de identidad del invitado.
- La seudonimización reduce exposición, pero no convierte por sí sola los datos en anónimos ni acredita cumplimiento legal. No uses datos identificables de estudiantes en la demo.
- No se toman decisiones automatizadas sobre estudiantes. Las alertas son señales de apoyo y cualquier plan requiere revisión explícita del docente.
- La app necesita conexión con Supabase para las áreas autenticadas; no implementa sincronización educativa offline.

## Estructura principal

```text
src/
  components/edu/       Componentes educativos, importación CSV y demo
  lib/edu/              Reglas, esquemas, almacenamiento y demo analítica
  lib/licensing/        Reglas, pagos y confirmaciones institucionales
  routes/               Rutas públicas, autenticadas y de contratación
  i18n/locales/         Traducciones es, en y fr
supabase/               Configuración local de Supabase
drizzle/migrations/     Migraciones SQL de esquema, permisos y funciones
model/                  Script de entrenamiento y dependencias Python
artifacts/              Informe y artefactos de modelo sintético
```
