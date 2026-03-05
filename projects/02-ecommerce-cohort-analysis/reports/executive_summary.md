# Resumen Ejecutivo: Analisis de Cohortes -- Olist E-Commerce

**Preparado por**: Andres Gonzalez Ortega
**Fecha**: Marzo 2026
**Periodo de datos**: Septiembre 2016 -- Octubre 2018
**Alcance**: 96,478 pedidos entregados | 93,358 clientes unicos

---

## Contexto

Olist es un marketplace brasileno que conecta pequenos comerciantes con grandes canales de venta. Este analisis examina el comportamiento de compra de ~93K clientes para responder: **que cohortes retienen mejor, que factores predicen la recompra, y donde debe Olist enfocar sus esfuerzos de retencion?**

## Hallazgos Principales

### 1. La retencion es el desafio critico de Olist

Solo el **3.0% de los clientes** realizan una segunda compra (2,801 de 93,358). Sin embargo, los clientes que regresan gastan **1.8x mas** por pedido en promedio. Esto convierte la retencion en la palanca de crecimiento de mayor impacto: un aumento del 1% en la tasa de recompra representaria ~930 clientes adicionales y un incremento estimado de R$150K en ingresos.

### 2. El metodo de pago con voucher predice retencion

El analisis de regresion logistica revela que los clientes que pagan con **voucher en su primera compra** tienen **1.42x mayor probabilidad** de regresar (p < 0.05). Tarjeta de credito y boleto no muestran diferencia significativa. Esto sugiere que incentivos tipo voucher son efectivos para generar habito de compra.

### 3. La entrega es la variable mas influyente

Existe una correlacion consistente entre **tiempos de entrega y retencion a nivel estatal**. Los estados con entregas mas rapidas (SP, PR) muestran las mejores tasas de retencion al mes 3. El 8.1% de entregas tardias se correlaciona con calificaciones mas bajas y menor probabilidad de recompra.

### 4. Los ingresos estan altamente concentrados

El analisis de Lorenz/Gini confirma una distribucion muy desigual: el segmento "Champions" (0.1% de clientes) genera un LTV de R$545/cliente a 12 meses, comparado con R$160 para el segmento promedio. La curva de Pareto muestra que un pequeno grupo de clientes repetidores genera valor desproporcionado.

### 5. Patrones geograficos marcados

Sao Paulo domina en volumen pero la retencion varia significativamente entre estados (chi-cuadrado significativo). Los estados con alto volumen pero baja retencion representan la mayor oportunidad de mejora, especialmente si el factor limitante es logistico.

## Recomendaciones

| Prioridad | Accion | Impacto Estimado |
|-----------|--------|-----------------|
| Alta | Campana de re-engagement a 30 dias post-primera-compra | Capturar clientes antes de la ventana de lapse (~90 dias mediana) |
| Alta | Expandir incentivos tipo voucher para primeros compradores | Aumentar la tasa de recompra aprovechando el factor de activacion mas fuerte (OR=1.42) |
| Media | Mejorar logistica en estados de alto volumen y baja retencion | Reducir tiempos de entrega donde el impacto en retencion es mayor |
| Media | Mejorar precision de estimados de entrega | Reducir entregas percibidas como "tardias" (8.1%) sin necesariamente acelerar el envio |
| Baja | Investigar caracteristicas del segmento Champions | Informar targeting y adquisicion basado en el perfil de los clientes mas valiosos |

## Metodologia

- **4 Jupyter notebooks** con narrativa analitica completa
- **5 scripts SQL** (PostgreSQL) para cohort, retention, RFM, LTV, geografia
- **Dashboard Streamlit** de 4 paginas con estilo ejecutivo
- **Tecnicas estadisticas**: Kaplan-Meier, log-rank, chi-cuadrado, regresion logistica, intervalos de confianza bootstrap, coeficiente de Gini

---

*Fuente: Olist Brazilian E-Commerce Public Dataset (Kaggle) | N = 96,478 pedidos entregados*
