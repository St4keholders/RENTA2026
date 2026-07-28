export interface RespuestasCuestionario {
  nombre: string;
  cedula: string;
  edad: number;
  ocupacion: 'empleado' | 'independiente';
  ingresoMensual: number;
  tieneDeudas: boolean;
  totalCreditos?: number;
  cuotaMensualCreditos?: number;
  gastoMensualTC: number;
  comproBienes: boolean;
  tipoFinanciacion?: 'financiado' | 'contado' | 'mixto';
  costoTotalCompras?: number;
  cuotaMensualCompras?: number;
  numCuentas: number;
  frecuenciaMovimientos: 'nunca' | 'mensual' | 'semanal' | 'diario';
  tienePropiedades: boolean;
  valorPropiedades?: number;
  valorVehiculos?: number;
  ahorrosInversiones?: number;
  celular?: string;
}

export interface ResultadoCalculado {
  arquetipoSlug: 'gladiador' | 'emperador' | 'malabarista' | 'mago' | 'mochilero' | 'sonador';
  debeDeclarar: boolean;
  topesSuperados: string[];
  barraPatrimonio: number;
  barraIngresos: number;
  barraCreditos: number;
  barraMovimientos: number;
  fechaVencimiento: string; // YYYY-MM-DD
  extemporaneo: boolean;
  ingresoAnual: number;
  patrimonioTot: number;
  consignEstimadas: number;
}

export const TOPE_PATRIMONIO = 224095500;
export const TOPE_INGRESOS = 69718600;
export const TOPE_TC = 69718600;
export const TOPE_CONSIGNACIONES = 69718600;
export const TOPE_COMPRAS = 69718600;

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function obtenerDosUltimosDigitos(cedula: string): string {
  const numOnly = cedula.replace(/\D/g, '');
  if (numOnly.length < 2) return '00';
  return numOnly.slice(-2);
}

// Fechas por pares de dígitos (calendario 2026)
const CALENDARIO_2026: Record<string, string> = {
  '01':'2026-08-12', '02':'2026-08-12',
  '03':'2026-08-13', '04':'2026-08-13',
  '05':'2026-08-14', '06':'2026-08-14',
  '07':'2026-08-18', '08':'2026-08-18',
  '09':'2026-08-19', '10':'2026-08-19',
  '11':'2026-08-20', '12':'2026-08-20',
  '13':'2026-08-21', '14':'2026-08-21',
  '15':'2026-08-24', '16':'2026-08-24',
  '17':'2026-08-25', '18':'2026-08-25',
  '19':'2026-08-26', '20':'2026-08-26',
  '21':'2026-08-27', '22':'2026-08-27',
  '23':'2026-08-28', '24':'2026-08-28',
  '25':'2026-08-31', '26':'2026-08-31',
  '27':'2026-09-01', '28':'2026-09-01',
  '29':'2026-09-02', '30':'2026-09-02',
  '31':'2026-09-03', '32':'2026-09-03',
  '33':'2026-09-04', '34':'2026-09-04',
  '35':'2026-09-07', '36':'2026-09-07',
  '37':'2026-09-08', '38':'2026-09-08',
  '39':'2026-09-09', '40':'2026-09-09',
  '41':'2026-09-10', '42':'2026-09-10',
  '43':'2026-09-11', '44':'2026-09-11',
  '45':'2026-09-14', '46':'2026-09-14',
  '47':'2026-09-15', '48':'2026-09-15',
  '49':'2026-09-16', '50':'2026-09-16',
  '51':'2026-09-17', '52':'2026-09-17',
  '53':'2026-09-18', '54':'2026-09-18',
  '55':'2026-09-21', '56':'2026-09-21',
  '57':'2026-09-22', '58':'2026-09-22',
  '59':'2026-09-23', '60':'2026-09-23',
  '61':'2026-09-24', '62':'2026-09-24',
  '63':'2026-09-25', '64':'2026-09-25',
  '65':'2026-09-28', '66':'2026-09-28',
  '67':'2026-10-01', '68':'2026-10-01',
  '69':'2026-10-02', '70':'2026-10-02',
  '71':'2026-10-05', '72':'2026-10-05',
  '73':'2026-10-06', '74':'2026-10-06',
  '75':'2026-10-07', '76':'2026-10-07',
  '77':'2026-10-08', '78':'2026-10-08',
  '79':'2026-10-09', '80':'2026-10-09',
  '81':'2026-10-13', '82':'2026-10-13',
  '83':'2026-10-14', '84':'2026-10-14',
  '85':'2026-10-15', '86':'2026-10-15',
  '87':'2026-10-16', '88':'2026-10-16',
  '89':'2026-10-19', '90':'2026-10-19',
  '91':'2026-10-20', '92':'2026-10-20',
  '93':'2026-10-21', '94':'2026-10-21',
  '95':'2026-10-22', '96':'2026-10-22',
  '97':'2026-10-23', '98':'2026-10-23',
  '99':'2026-10-26', '00':'2026-10-26',
};

export function calcularFechaVencimiento(cedula: string): { fecha: string; extemporaneo: boolean } {
  const digitos = obtenerDosUltimosDigitos(cedula);
  const fecha = CALENDARIO_2026[digitos] || '2026-10-26';
  
  const hoyStr = new Date().toISOString().split('T')[0];
  const extemporaneo = hoyStr > fecha;

  return { fecha, extemporaneo };
}

export function calcularResultado(resp: RespuestasCuestionario): ResultadoCalculado {
  const ingresoAnual = resp.ingresoMensual * 12;
  const gastoTCAnual = resp.gastoMensualTC * 12;
  const cuotaTotalMes = (resp.cuotaMensualCreditos ?? 0) + (resp.cuotaMensualCompras ?? 0);
  const patrimonioTot = (resp.valorPropiedades ?? 0) + (resp.valorVehiculos ?? 0) + (resp.ahorrosInversiones ?? 0);

  // 1. PATRIMONIO
  const barraPatrimonio = Math.round(clamp((patrimonioTot / TOPE_PATRIMONIO) * 100, 0, 100));

  // 2. INGRESOS — penalizada si las compras la superan
  let rawIngresos = (ingresoAnual / TOPE_INGRESOS) * 100;
  if ((resp.costoTotalCompras ?? 0) > ingresoAnual) {
    rawIngresos *= 0.6;
  }
  const barraIngresos = Math.round(clamp(rawIngresos, 0, 100));

  // 3. CRÉDITOS — ratio cuotas + gasto TC + volumen total de deuda relativa a ingresos
  const ratioCuota = resp.ingresoMensual > 0 ? cuotaTotalMes / resp.ingresoMensual : 0;
  // Total debt load: how many years of income represents total debt (capped at 5y = 100)
  const totalDeudaLoad = ingresoAnual > 0
    ? clamp(((resp.totalCreditos ?? 0) / (ingresoAnual * 5)) * 100, 0, 100)
    : 0;
  const rawCreditos =
    (ratioCuota * 100 * 0.55) +          // monthly payment burden
    ((gastoTCAnual / TOPE_TC) * 100 * 0.20) +  // TC spending pressure
    (totalDeudaLoad * 0.25);               // absolute debt volume
  const barraCreditos = Math.round(clamp(rawCreditos, 0, 100));

  // 4. MOVIMIENTOS — relativo a ingresos
  const factores: Record<string, number> = { nunca: 0, mensual: 1.0, semanal: 2.0, diario: 3.0 };
  const factorFrec = factores[resp.frecuenciaMovimientos] ?? 0;
  const saltos = Math.min(Math.max(resp.numCuentas - 1, 0), 3);
  const consignEstimadas = ingresoAnual + (resp.ingresoMensual * factorFrec * saltos * 12);
  const multiploCirculacion = ingresoAnual > 0 ? consignEstimadas / ingresoAnual : 1;
  const barraMovimientos = Math.round(clamp(((multiploCirculacion - 1) / 3) * 100, 0, 100));

  // SELECCIÓN DE ARQUETIPO — Cascada revisada con umbrales más representativos
  let arquetipoSlug: ResultadoCalculado['arquetipoSlug'];

  // Gladiador: cuotas >= 25% ingreso O deuda total > 2x ingreso anual (perfil de endeudamiento real)
  const deudaAbsoluta = (resp.totalCreditos ?? 0) > ingresoAnual * 2;
  if (ratioCuota >= 0.25 || deudaAbsoluta) {
    arquetipoSlug = 'gladiador';
  // Emperador: patrimonio >= 40% del tope y carga de cuotas baja (perfil acumulador)
  } else if (barraPatrimonio >= 40 && ratioCuota < 0.25) {
    arquetipoSlug = 'emperador';
  // Malabarista: alta circulación de dinero entre cuentas
  } else if (barraMovimientos >= 50) {
    arquetipoSlug = 'malabarista';
  // Mago: ingresos altos y sin carga de deuda significativa
  } else if (resp.ingresoMensual >= 7000000 && ratioCuota < 0.25) {
    arquetipoSlug = 'mago';
  } else {
    arquetipoSlug = (resp.edad >= 18 && resp.edad <= 23) ? 'mochilero' : 'sonador';
  }

  // VEREDICTO LEGAL (§6.4)
  const topesSuperados: string[] = [];
  if (patrimonioTot >= TOPE_PATRIMONIO) topesSuperados.push('Patrimonio bruto (>$224.095.500)');
  if (ingresoAnual >= TOPE_INGRESOS) topesSuperados.push('Ingresos brutos (>$69.718.600)');
  if (gastoTCAnual >= TOPE_TC) topesSuperados.push('Consumos con tarjeta de crédito (>$69.718.600)');
  if (consignEstimadas >= TOPE_CONSIGNACIONES) topesSuperados.push('Consignaciones o depósitos (>$69.718.600)');
  if ((resp.costoTotalCompras ?? 0) >= TOPE_COMPRAS) topesSuperados.push('Compras y consumos (>$69.718.600)');

  const debeDeclarar = topesSuperados.length > 0;
  const { fecha: fechaVencimiento, extemporaneo } = calcularFechaVencimiento(resp.cedula);

  return {
    arquetipoSlug,
    debeDeclarar,
    topesSuperados,
    barraPatrimonio,
    barraIngresos,
    barraCreditos,
    barraMovimientos,
    fechaVencimiento,
    extemporaneo,
    ingresoAnual,
    patrimonioTot,
    consignEstimadas,
  };
}
