import { createHash } from 'crypto';

export interface WompiConfig {
  env: 'test' | 'prod';
  publicKey: string;
  privateKey: string;
  integritySecret: string;
  eventsSecret: string;
}

export function getWompiConfig(): WompiConfig {
  const env = (process.env.WOMPI_ENV || 'test') as 'test' | 'prod';
  const publicKey = process.env.WOMPI_PUBLIC_KEY || '';
  const privateKey = process.env.WOMPI_PRIVATE_KEY || '';
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET || '';

  return { env, publicKey, privateKey, integritySecret, eventsSecret };
}

/**
 * Genera la firma de integridad para Wompi Checkout / Widget.
 * Estructura: SHA256(reference + amountInCents + currency + integritySecret)
 */
export function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency = 'COP'
): string {
  const { integritySecret } = getWompiConfig();
  const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;
  return createHash('sha256').update(concatenated).digest('hex');
}

/**
 * Valida el checksum de un evento recibido por Webhook de Wompi.
 * Estructura del evento Wompi:
 * signature: { properties: ["transaction.id", "transaction.status", ...], checksum: "..." }
 * SHA256(valores_concatenados + timestamp + eventsSecret)
 */
export function verifyEventChecksum(payload: any): boolean {
  try {
    const { eventsSecret } = getWompiConfig();
    const { event, data, signature, timestamp } = payload;

    if (!signature || !signature.properties || !signature.checksum || !eventsSecret) {
      return false;
    }

    // Concatenar las propiedades indicadas en signature.properties
    let concatenated = '';
    for (const propPath of signature.properties) {
      const parts = propPath.split('.');
      let val = payload.data;
      for (const p of parts) {
        if (val && typeof val === 'object') {
          val = val[p];
        } else {
          val = undefined;
          break;
        }
      }
      if (val !== undefined && val !== null) {
        concatenated += val;
      }
    }

    concatenated += timestamp;
    concatenated += eventsSecret;

    const calculatedChecksum = createHash('sha256').update(concatenated).digest('hex');
    return calculatedChecksum.toLowerCase() === signature.checksum.toLowerCase();
  } catch (e) {
    console.error('Error al verificar checksum de Wompi:', e);
    return false;
  }
}

/**
 * Consulta el estado de una transacción directamente en Wompi API
 */
export async function getWompiTransaction(transactionId: string): Promise<any> {
  const { env, privateKey } = getWompiConfig();
  const baseUrl = env === 'prod' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';

  const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${privateKey}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Error al consultar transacción Wompi: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}
