# Olist: comprender la segunda compra

**Analista:** Andres Gonzalez Ortega · **Revision:** 2026-09-05
**Periodo de compras:** 2016-09-15 a 2018-08-29
**Poblacion:** 96,478 pedidos entregados; 93,358 clientes identificados por customer_unique_id.

## Decision

Que evidencia justifica probar una intervencion de recompra y como medirla sin confundir asociacion con efecto causal?

## Evidencia verificada

- **2,801 clientes recompran (3.0%).** Estos clientes suman 5,921 pedidos; los otros 90,557 clientes realizan un pedido cada uno.
- El ingreso total medio por cliente es **R$308.53** entre repetidores y **R$160.73** entre compradores unicos. La media del valor medio por pedido de cada cliente es **R$145.85** y **R$160.73**, respectivamente. El mayor ingreso total refleja mas pedidos, no un ticket mayor. La afirmacion anterior de 1.8x mas gasto por pedido era incorrecta.
- El coeficiente de voucher tiene **odds ratio 1.424**, IC 95% **[1.111, 1.826]**. Es una asociacion ajustada en datos observacionales, no un multiplicador de probabilidad ni evidencia de que entregar vouchers cause recompra.
- La comparacion geografica es descriptiva: mezcla logistica, composicion de clientes y categorias. No identifica el efecto de reducir tiempos de entrega.

## Interpretacion y accion propuesta

Probar una intervencion de segunda compra con asignacion aleatoria y un horizonte de seguimiento comun. Medir recompra, ingreso incremental por cliente elegible y costo del incentivo. Ningun ingreso incremental ha sido demostrado; se retiran las proyecciones anteriores de R$150K y las recomendaciones causales sobre vouchers.

Las cohortes recientes tienen menos tiempo para regresar: las celdas sin seguimiento suficiente son desconocidas, no retencion cero. El analisis de supervivencia trata la censura por separado; su poblacion elegible no debe confundirse con todos los clientes.

## Metodos y fuentes

Resultados comprobados contra customers_summary.parquet y activation_coefficients.parquet; totales publicados en web/public/cohorts/data/meta.json. Los notebooks documentan las transformaciones y el dashboard compartido publica el caso y su exploracion.

La vista /olist conserva todos los estados de pedido; /cohorts usa pedidos entregados. Sus totales y ventanas no son intercambiables. Los pagos agregados por pedido incluyen flete y no son beneficio neto ni comisiones de Olist. [Registro de evidencia](../../../docs/evidence-audit.md).
