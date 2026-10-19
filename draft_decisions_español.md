# Draft Decisions

Este documento es el borrador de trabajo de **"Primer paso con ahorro medido"**, la capacidad de Kamai para recomendar una primera ecoinnovación y mostrar el ahorro que generó, con honestidad.

El diseño se centra en tres mejoras que juntas corrigen el modo de falla que ilustra el caso de Inés:

- Un diagnóstico mejorado que recoge capacidad de inversión, para que el ranking deje de recomendar ALTA/ALTA a un negocio cuyo trimestre encaja con BAJA/BAJA.
- Una medición honesta que normaliza la duración del período y regula la narrativa de dinero mediante un umbral configurable.
- Caminos de recuperación para usuarias con planes trabados, distinguiendo entre "inversión ya hecha" y "aún no comenzó".

Las siguientes secciones registran las decisiones tomadas para cada uno.

## Sobre el registro de negocios nuevos

Los negocios nuevos pueden no tener facturas previas para establecer una línea base, pero retrasar una ecoinnovación hasta el próximo período de facturación puede sumar tiempo de espera innecesario. Cuando esa demora sería significativa, Kamai usará una línea base manual corta, construida a partir de las lecturas del medidor eléctrico del propio negocio antes de la implementación. Esto da una proyección inicial más relevante que apoyarse solo en negocios similares, dejando en claro que cinco días son una línea base mínima y no una medición definitiva.

- Un negocio puede elegir una ecoinnovación aunque no tenga facturas previas.
- El catálogo almacena `estimatedDaysReady`, que representa el número estimado de días que la ecoinnovación tarda en estar operativa.
- Al crear el plan de acción, Kamai compara los días restantes hasta el próximo período de facturación con `estimatedDaysReady + 6`:
  - Si esperar al período de facturación tomaría más que ese umbral, el plan usa `baselineMethod: "manual_measurement"`.
  - Si no, el plan usa la línea base regular por factura.
- Para `manual_measurement`, el plan incluye un paso de medición que puede correr en paralelo con los pasos de implementación.
- El paso de medición manual requiere al menos 5 mediciones completas de días operativos del negocio antes de poder completarse. La usuaria puede agregar más días; la UI sugiere 7 o más cuando es posible.
- Cada carga de medición manual debe aclarar que las lecturas deben corresponder a días completos en los que el negocio operó.

### Cambios de datos necesarios

- Perfil del negocio: agregar `hasAtLeastOneMonthOperating: boolean`.
- Catálogo de ecoinnovaciones: agregar `estimatedDaysReady: number`.
- Plan de acción: agregar:
  - `requestedAt: date`.
  - `baselineMethod: "invoice" | "manual_measurement"`.
  - `actualReadyDate: date`.
- Pasos del plan de acción: usar el esquema de pasos existente y agregar dinámicamente un paso de medición manual cuando `baselineMethod` sea `"manual_measurement"`.
- Mediciones manuales: agregar una colección o subdocumento con:
  - `planId`.
  - `measurementDate: date`.
  - `meterReading: number`.
- Las mediciones manuales deben ser únicas por plan y fecha.
- Agregar un endpoint para crear mediciones manuales para un plan de acción.
- La acción de completar paso existente, si está, debe verificar que existan al menos 5 mediciones completas de días operativos cuando el plan requiera mediciones manuales.
- El mínimo de 5 mediciones es fijo y no requiere un campo `manualMeasurementDays`. Mediciones adicionales siguen permitidas.

## Sobre los planes trabados

Un plan activo sin progreso puede estar en uno de dos estados, y la respuesta correcta difiere. La señal es el estado de los pasos del plan:

- **Caso A — inversión ya hecha**: al menos un paso tiene un estado distinto de `not_started`. La usuaria se involucró materialmente.
- **Caso B — aún no comenzó**: todos los pasos siguen en `not_started`. Inés encaja acá: plan `in_progress` por siete semanas, cero pasos avanzados.

### Caso A — inversión ya hecha

Sugerir un plan distinto socavaría la invitación a terminar. La jugada es cuidar lo que ella empezó.

- Un badge aparece en el dashboard en la próxima sesión tras dispararse la condición, con un mensaje calmo sobre el bajo progreso y una invitación a finalizar para capitalizar la inversión.
- Sale un único email de acompañamiento (sin repetir en 14 días para el mismo plan), enrutado por el servicio de mensajería y respetando el registro por persona y plantilla.
- El sistema de medición mejorado corre silenciosamente en segundo plano. No se le dice a la usuaria que cambió la matemática del ahorro; simplemente ve números más honestos cuando mira.
- Kamai no propone otra ecoinnovación mientras un plan esté en este estado.

### Caso B — plan elegido pero nunca arrancado

Es posible que la elección original simplemente haya sido mala para su capacidad; una recomendación nueva es justa.

- Kamai vuelve a aplicar la lógica de recomendación (mejorada) a las respuestas que la usuaria ya dio en su diagnóstico. No se le pide un nuevo cuestionario.
- Si la mejor recomendación recomputada es igual al plan trabado, el comportamiento vuelve al Caso A (badge de bajo progreso + email).
- Si la mejor recomendación recomputada es distinta, Kamai la muestra en el dashboard con una breve explicación y ofrece un swap de plan en un click.
- Un único email acompaña el cambio, replicando la regla de frecuencia del Caso A.

### Cambios de datos necesarios

- Plan de acción: agregar `lastActivityAt: date`, actualizado cuando cambie el estado de cualquier paso.
- Derivar `caseA: boolean` desde los pasos (true si algún paso tiene estado ≠ `not_started`).
- Derivar `caseB: boolean` desde los pasos (true si todos los pasos están en `not_started` Y `lastActivityAt` es anterior a un umbral configurable; default propuesto: 14 días).
- Notificaciones: agregar un registro por plan y canal para que la regla de no-repetición se mantenga entre badges y emails.
- Caché de recomendación: almacenar la recomendación recomputada junto con las respuestas del diagnóstico para que el Caso B pueda comparar contra el plan trabado sin volver a correr toda la lógica en cada carga del dashboard.

## Sobre el diagnóstico mejorado

El diagnóstico es el insumo del ranking. El diagnóstico actual devuelve puntajes por sección y un nivel (Inicial / Crecimiento / Consolidación / Expansión / Liderazgo), pero no captura la capacidad real de la usuaria para ejecutar: tiempo, presupuesto o disposición a cambios de alto esfuerzo. Ese vacío es por qué el ranking de Inés le recomendó ALTA/ALTA aunque su trimestre encajara con BAJA/BAJA.

El diagnóstico mejorado agrega una pregunta explícita de capacidad. Redacción en borrador:

> ¿Consideras que puedes invertir un buen tiempo y recursos primero para ver un resultado de alto impacto? ¿O prefieres empezar en pasos semilla y afianzar tus ecoinnovaciones progresivamente?

La respuesta mapea directo a un nuevo insumo del ranking:

- "Alto impacto primero" → ponderar el ranking hacia complejidad e inversión ALTAS.
- "Pasos semilla" → ponderar el ranking hacia BAJA / MEDIA; mostrar el primer paso viable más pequeño.

La nueva pregunta convive con los puntajes de sección existentes; el ranking combina ambos.

### Cambios de datos necesarios

- Respuestas del diagnóstico: agregar una nueva sección o pregunta que recoja la preferencia de capacidad, almacenada como enum (por ej., `seed_steps_first` | `high_impact_first`).
- Ranking: consumir la nueva respuesta de capacidad junto con los puntajes de sección existentes y el nivel general.

## Sobre el sistema de recomendación

Hoy Kamai recomienda ecoinnovaciones en cuatro lugares usando cuatro criterios distintos: el inicio agrupa por sector, el catálogo ordena por respuestas del diagnóstico y complejidad, el diagnóstico por etapas aplica reglas y muestra tres, y el email de bienvenida sugiere tres fijas. El resultado es que el mismo negocio ve recomendaciones diferentes según dónde mire.

Decisión: para todos los lugares, el orden de las ecoinnovaciones es estrictamente el que produce el sistema de rankeo del diagnóstico. Una sola fuente, un solo orden, sin overrides por superficie.

- El ranking se persiste por negocio y se invalida solo cuando cambian las respuestas del diagnóstico o el catálogo.
- Los cuatro lugares consumen ese mismo ranking: ninguno aplica su propio criterio encima.
- Si el negocio todavía no hizo el diagnóstico, los lugares muestran un mensaje explícito en lugar de recurrir a reglas por defecto que reintroducirían inconsistencia.
- La razón de cada recomendación se guarda junto con el ranking para que cualquier superficie pueda explicar el "por qué" sin recalcular.

### Cambios de datos necesarios

- Recommendation: nueva persistencia del ranking por negocio, con timestamp y referencia a la versión del catálogo y al snapshot de respuestas del diagnóstico que lo produjeron.
- Cada entrada almacena `reason: string` para que los cuatro lugares puedan explicar el "por qué" sin recalcular.
- Invalidación: cualquier cambio en respuestas del diagnóstico o en el catálogo dispara el recálculo del ranking.

## Sobre medir el ahorro con honestidad

Tres distorsiones importan al comparar facturas entre meses: duración del período, cambios de tarifa y estacionalidad. Cada una se maneja distinto a propósito.

### Duración del período — normalizar cada mes a 31 días

Las facturas vienen con distinta cantidad de días (28, 29, 30, 31). Comparar una factura de 28 días con una de 31 es engañoso: un "ahorro" puede ser simplemente un período más corto. Todo mes se trata, por definición, como un mes de 31 días, y la normalización se aplica en el momento de registrar la factura en la base de datos.

Fórmula:

    kwhNormalized31 = (kwhConsumed / realDays) * 31

- El `kwhConsumed` crudo y `billingStartDate` / `billingEndDate` se preservan tal cual por transparencia.
- `kwhNormalized31` se almacena junto con la factura para que toda comparación posterior sea comparable sin recalcular.

### Tarifa — mostrar kWh con honestidad, condicionar la narrativa de dinero

La tarifa cambia entre períodos (subió 8% entre enero y junio en las facturas de Inés). Ocultarlo sería mentir; sobreactuar también. El chart de consumo siempre muestra `kWh` crudo para que el hecho durable sea visible; la vista de dinero está condicionada por un umbral.

- El chart de consumo siempre muestra `kWh` crudo por período, nunca Soles. Ese es el hecho durable.
- La vista de dinero sigue un umbral guardado en la configuración de la aplicación (valor propuesto: 5%):
  - Cuando el ahorro monetario real es al menos el umbral, mostrarlo directo en Soles y como porcentaje.
  - Cuando el ahorro monetario real está por debajo del umbral (o es negativo porque la suba de tarifa se lo comió), no mostrar una cifra de Soles engañosa. Mostrar el porcentaje de consumo ahorrado en su lugar, con una nota naranja muy visible que explique que la suba de tarifa se absorbió el ahorro en dinero, y cuánto más estaría perdiendo la usuaria en términos monetarios sin la ecoinnovación.

### Estación — visualizar, no corregir

Los efectos estacionales (por ej., un verano más caluroso que sube la carga de refrigeración) son reales pero no se pueden separar limpiamente de cambios de comportamiento con los datos que tenemos. No aplicamos ninguna corrección.

- El chart de consumo marca los meses de verano en un color distinto para que la usuaria vea el efecto estacional de un vistazo.
- Cualquier cifra de ahorro queda ciega a la estación por diseño; le decimos a la usuaria que no podemos aislar el ruido estacional, en lugar de fingir que podemos.

### Cambios de datos necesarios

- Factura de usuaria: almacenar `realDays: number` (derivado de `billingEndDate - billingStartDate + 1`) y `kwhNormalized31: number` en el momento de escribir.
- Factura de usuaria: almacenar `tariffSnapshot: number` (los S/ por kWh usados en el período) para los cálculos monetarios aguas abajo.
- Cálculo de ahorro: operar sobre `kwhNormalized31` para la vista de porcentaje; operar sobre `kwhNormalized31` × el `tariffSnapshot` de cada período para la vista de dinero antes de aplicar el umbral.
- Configuración de la aplicación: agregar `savingsMoneyThreshold: number` (valor propuesto: 5) leído al arranque, usado para condicionar la vista de dinero descrita arriba.
- Chart de consumo: tagear cada período con `season: "summer" | "winter" | "neutral"` desde el mes de facturación usando un rango de calendario fijo, usado solo para colorear, nunca para corregir.

## Sobre el manejo de fallos (diferido)

Estos modos de fallo se reconocen como riesgos reales de la nueva capacidad y necesitarán un mecanismo unificado de alerta interna. El trabajo es lo suficientemente grande para diferirse a una fase posterior y no forma parte de esta implementación. Se listan acá para que no se olviden.

- Proveedor de IA no disponible o devolviendo errores.
- Servicio de mensajería rechazando un email o con timeout.
- Foto de factura ilegible (la validación falla).
- Factura editada o borrada después de ser usada en un cálculo de ahorro.

Para cada uno, la respuesta prevista es la misma: el sistema detecta el estado de fallo, lo marca en el registro correspondiente y envía un email interno de aviso para que alguien del equipo revise. Esta implementación no incluye cambios visibles para la usuaria.

### Propuestas para una primera iteración

Puntos de partida mínimos para cada modo de fallo. Suficientes para arrancar una primera pasada, no el diseño completo.

- **Proveedor de IA no disponible o con errores**: ante timeout o 5xx, la request se persiste con `status: "pending_retry"` y se reintenta con backoff exponencial (1s / 5s / 30s, máx. 3 intentos). Ante fallo final, `status: "failed"` dispara la alerta interna.
- **Servicio de mensajería rechazando un email o con timeout**: ante non-2xx o timeout, un reintento inmediato; ante un segundo fallo, el envío se registra como fallido en el registro por persona y plantilla y se dispara la alerta interna. El registro existente impide reenviar a una dirección que ya rebotó.
- **Foto de factura ilegible**: el endpoint de carga devuelve un fallo de validación estructurado (tamaño, formato, confianza OCR por debajo del umbral). La factura queda en `pending_review`; la UI le pide a la usuaria que la vuelva a sacar. Los fallos se loguean para revisión de ops.
- **Factura editada o borrada tras usarse en ahorro**: al actualizar o borrar, cualquier registro de ahorro que la referencie se marca `stale`. En la próxima lectura, el ahorro se recalcula contra el set actual de facturas, sin contar dos veces.

## Sobre usar datos de otros negocios

La privacidad y la honestidad estadística importan cada vez que un número viene del negocio de otra persona.

- Nunca se muestran nombres; todos los datos se anonimizan sin importar la modalidad (chart agregado, razón de recomendación, copy de marketing, etc.).
- Los promedios solo se calculan y se muestran cuando al menos 6 negocios contribuyen al dato.
- Cuando contribuyen menos de 6 negocios, Kamai no muestra un número. En su lugar, muestra copy cualitativo con el formato "x locales ya han podido mejorar entre x% y x% mejora en consumo".

### Cambios de datos necesarios

- Agregación: exigir un tamaño de muestra mínimo de 6 negocios antes de publicar cualquier agregado; por debajo del umbral, devolver la plantilla de copy cualitativo.
- Anonimización: eliminar identificadores del negocio antes de que cualquier agregado salga del límite por negocio; la misma regla aplica a razones de recomendación y a cualquier vista exportada.

## Sobre tecnologías

- Frontend: React con Vite (existente).
- Backend: Node.js con Nest.js.
- Deploy: AWS usando ECS.
- Mensajería asíncrona: SNS + SQS.
- Email saliente: Mailchimp.
- Testing: tests unitarios y de integración en código, más una suite end-to-end aparte.

## Sobre cuánta IA hace falta

La consigna ofrece un rango que va de reglas simples a LLMs. La postura tomada en este diseño es "usar IA solo donde la tarea se beneficie realmente; usar reglas en todo lo demás."

### Dónde se usa IA

- **Endpoint de subtareas** (ahora): el proveedor de IA ya genera subtareas para los pasos del plan. La mejora es darle datos conocidos de la usuaria — sector, país, nivel del diagnóstico, estado del plan actual — para que las subtareas se ajusten a su contexto en lugar de ser genéricas. Esta es la única llamada de IA dentro de la capacidad "Primer paso con ahorro medido".
- **Asistente en el dashboard** (después): un helper conversacional para dos tipos de preguntas — preguntas frecuentes sobre la plataforma, y preguntas sobre las ecoinnovaciones actuales de la usuaria y su estado. RAG sobre el plan, las facturas y el catálogo de la propia usuaria es el enfoque previsto. Diferido a una fase posterior; fuera del alcance de esta implementación.

### Dónde no se usa IA

- **Ranking**: reglas sobre las respuestas del diagnóstico y el catálogo. Los datos son pocos y estructurados; un modelo sumaría costo y opacidad sin mejorar el ordenamiento.
- **Medición de ahorro**: aritmética sobre `kwhNormalized31` y `tariffSnapshot`. No hace falta inferencia; los números honestos vienen de matemática honesta.
- **Agregación entre negocios**: conteos y promedios condicionados por la regla `n ≥ 6`. La garantía de privacidad exige umbrales determinísticos, no salida de modelo.
- **Detección de fallos**: flags de estado explícitos y lógica de reintento, no detección de anomalías.

### Cambios de datos necesarios

- Endpoint de subtareas: aceptar y pasar el contexto de la usuaria (sector, país, nivel, estado del plan actual) para que el proveedor de IA pueda personalizar la salida.