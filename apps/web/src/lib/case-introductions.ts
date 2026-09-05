import type { Localized } from './case-studies'

type Introduction = { title: Localized; description: Localized; alt: Localized; image: string }
const l = (en: string, es: string): Localized => ({ en, es })

/** Conceptual entry points; the analytical narrative and its evidence stay independent. */
export const caseIntroductions: Record<string, Introduction> = {
  insurance: {
    title: l('How much will an insurer still need to pay?', '¿Cuánto le queda por pagar a una aseguradora?'),
    description: l('An accident happens today, but its bills can arrive for years. We look at past payments to estimate how much money an insurer needs to set aside for what comes next.', 'Un accidente ocurre hoy, pero sus cuentas pueden llegar durante años. Revisamos los pagos del pasado para estimar cuánto dinero necesita apartar una aseguradora para lo que viene.'),
    alt: l('Painting of an analyst reviewing insurance claim folders, damage photographs, repair invoices, and payment records.', 'Pintura de una analista que revisa expedientes de siniestros, fotografías de daños, facturas de reparación y registros de pagos.'),
    image: 'insurance-v2',
  },
  ecommerce: {
    title: l('After the first purchase, who comes back?', 'Después de la primera compra, ¿quién vuelve?'),
    description: l('An order arrives, the customer leaves, and the shop waits for another visit. We follow groups of customers over time to see how many return and how their buying habits differ.', 'Llega un pedido, el cliente se va y la tienda espera otra visita. Seguimos a grupos de clientes a lo largo del tiempo para ver cuántos regresan y cómo cambian sus hábitos de compra.'),
    alt: l('Painting of customer purchase histories on a monitor, with repeat orders, customer cards, and packed parcels.', 'Pintura de historiales de compra en un monitor, con pedidos repetidos, fichas de clientes y paquetes preparados.'),
    image: 'ecommerce-v2',
  },
  olist: {
    title: l('What happens between an order and its review?', '¿Qué pasa entre un pedido y su reseña?'),
    description: l('A purchase leaves a trail: the seller, the payment, the delivery, and the customer’s review. We bring those records together to explore how a marketplace works beyond its sales total.', 'Una compra deja un rastro: el vendedor, el pago, la entrega y la reseña del cliente. Reunimos esos registros para explorar cómo funciona un marketplace más allá de su total de ventas.'),
    alt: l('Painting of a seller packing an order, a delivery worker loading a van, and a customer opening a parcel beside a review on a phone.', 'Pintura de una vendedora que empaca un pedido, un repartidor que carga una camioneta y una clienta que abre su paquete junto a una reseña en el teléfono.'),
    image: 'olist-v2',
  },
  abtest: {
    title: l('Does a different page lead to more purchases?', '¿Una página distinta consigue más compras?'),
    description: l('Two groups see different versions of a page. One seems to work better—but could that be chance? This practice case uses an enriched dataset to examine the difference and how sure we can be.', 'Dos grupos ven versiones distintas de una página. Una parece funcionar mejor, pero ¿podría ser casualidad? Este caso de práctica usa datos enriquecidos para revisar la diferencia y qué tan seguros podemos estar.'),
    alt: l('Painting of two checkout-page layouts on matching screens, with separate customer groups being compared.', 'Pintura de dos diseños de una página de pago en pantallas iguales, con grupos de clientes separados para compararlos.'),
    image: 'abtest-v2',
  },
  kpi: {
    title: l('Why did this month’s revenue change?', '¿Por qué cambiaron los ingresos de este mes?'),
    description: l('Some customers join, others leave, and some change their subscription. In a fictional software business, we follow those movements to explain the monthly result and spot changes worth investigating.', 'Llegan clientes, otros se van y algunos cambian de suscripción. En una empresa ficticia de software, seguimos esos movimientos para explicar el resultado mensual y detectar cambios que vale la pena revisar.'),
    alt: l('Painting of an analyst preparing a monthly report with subscription additions, changes, cancellations, and revenue charts.', 'Pintura de una analista que prepara un reporte mensual con altas, cambios y cancelaciones de suscripciones y gráficas de ingresos.'),
    image: 'kpi-v2',
  },
  portfolio: {
    title: l('How much can an investment lose along the way?', '¿Cuánto puede caer una inversión en el camino?'),
    description: l('Two investments can finish at the same value after very different ups and downs. We compare historical returns and losses, then explore possible scenarios—not promises of future gains.', 'Dos inversiones pueden terminar con el mismo valor después de subidas y bajadas muy distintas. Comparamos rendimientos y pérdidas históricas, y exploramos escenarios posibles, no promesas de ganancias futuras.'),
    alt: l('Painting of an investment workspace with price histories, asset allocation, and a chart of losses from previous peaks.', 'Pintura de una mesa de análisis de inversiones con históricos de precios, distribución de activos y una gráfica de caídas desde máximos.'),
    image: 'portfolio-v2',
  },
  operations: {
    title: l('Which city service requests take longer to resolve?', '¿Qué solicitudes de la ciudad tardan más en resolverse?'),
    description: l('Someone reports a broken streetlight or a problem on their street. What happens next? New York’s 311 records let us compare workloads, completed requests, and the cases still waiting.', 'Alguien reporta una lámpara rota o un problema en su calle. ¿Qué pasa después? Los registros del 311 de Nueva York permiten comparar la carga de trabajo, las solicitudes resueltas y las que siguen esperando.'),
    alt: l('Painting of a resident reporting a pothole with a phone while a city crew repairs a marked section of a New York street.', 'Pintura de una persona que reporta un bache con su teléfono mientras una cuadrilla municipal repara una sección de una calle de Nueva York.'),
    image: 'operations-v2',
  },
  airbnb: {
    title: l('How do places to stay differ across Mexico City?', '¿Cómo cambian los alojamientos entre zonas de Ciudad de México?'),
    description: l('Looking for a place to stay means comparing neighborhoods, rooms, and prices. We explore Airbnb listings to see where the supply is concentrated and who offers it, without assuming every listing gets booked.', 'Buscar dónde quedarse implica comparar zonas, habitaciones y precios. Exploramos anuncios de Airbnb para ver dónde se concentra la oferta y quién la ofrece, sin suponer que cada anuncio recibe reservas.'),
    alt: l('Painting of apartment listings and room interiors being compared beside a street map with location pins in Mexico City.', 'Pintura de anuncios de departamentos e interiores de habitaciones que se comparan junto a un mapa con ubicaciones de Ciudad de México.'),
    image: 'airbnb-v2',
  },
}
