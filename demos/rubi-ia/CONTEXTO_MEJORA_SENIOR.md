# Cuaderno Rub-IA v2 - Contexto de mejora senior

Este proyecto `v2` es una copia de trabajo para evolucionar el cuaderno sin tocar el original.

## Objetivo de esta rama v2

Llevar la app a nivel editorial/terapeutico profesional en:

- Calidad de impresion A4 real para uso infantil
- Estructura pedagogica por etapas (3-4 anos a escritura funcional)
- Mejor realismo de cuaderno de caligrafia (sin copiar marca ni identidad visual exacta)
- Mejor UX para terapeutas (generador robusto y predecible)

## Prioridades tecnicas (P1)

1. Calco punteado imprimible de alta calidad:
- Mantener SVG para calco por su nitidez al imprimir.
- Revisar `stroke-dasharray`, grosor y contraste para fotocopia/escaneo.
- Evitar depender solo de fuentes externas para el punteado.

2. Motor de impresion A4 milimetrico:
- Consolidar `@page size: A4` y margenes en mm.
- Normalizar alturas de pauta por nivel: 8 mm, 5 mm, 3.5 mm.
- Verificar que no haya clipping ni saltos extra en PDF.

3. Sistema de pauta escolar configurable:
- Montessori/rayado con linea base, media, ascendente y margen rojo.
- Permitir presets: infantil, primaria inicial, primaria avanzada.

4. Optimizar SVG:
- Simplificar paths, limitar decimales y reducir peso sin perder calidad.
- Reusar elementos repetidos con `<defs>` + `<use>`.
- Evitar geometria redundante.

## Prioridades pedagogicas (P1)

1. Progresion por etapas:
- Etapa A: pretrazo (rectas, curvas, bucles, direccionalidad).
- Etapa B: grafemas y silabas simples.
- Etapa C: trabadas y secuencias complejas.
- Etapa D: palabras/pseudopalabras.
- Etapa E: frases y transferencia funcional.

2. Criterios de paso entre etapas:
- Control de tamano
- Regularidad de espaciado
- Presion y continuidad
- Legibilidad minima funcional

3. Modulos para disgrafia:
- Indicadores observables por sesion
- Registro estandar de progreso
- Actividades de apoyo visomotor y grafoperceptivo

## UX/editorial (P1)

1. Diferencia profesional vs prototipo:
- Jerarquia visual limpia
- Consistencia de margenes, titulos y bloques
- Densidad de contenido equilibrada
- Cabecera imprimible: nombre, fecha, objetivo

2. Editor del terapeuta:
- Plantillas por nivel con presets pedagogicos
- Controles claros de tipografia (mayuscula, minuscula, cursiva)
- Vista previa de impresion fiel al PDF

## Tipografias a evaluar en v2

- Escolar punteada
- Trace
- ColeCarreira
- Otras escolares equivalentes

Nota: usar fallback local y no bloquear el render si la fuente no carga.

## Criterios de aceptacion para cerrar v2

- PDF A4 consistente en Chrome/Safari/Edge
- Pautas legibles en impresion domestica B/N
- Calco punteado claro en todos los niveles
- Progresion pedagogica completa y ordenada
- Generador terapeutico estable y util en sesion real

## Regla de trabajo

- `cuaderno-rub-ia` = original (no tocar)
- `cuaderno-rub-ia-v2` = evolucion con mejoras senior

