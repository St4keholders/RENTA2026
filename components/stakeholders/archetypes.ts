export const ASSET_BASE = 'https://11qxl2z9wnwj1jis.public.blob.vercel-storage.com/';
export const LOCAL_ASSET_BASE = '/arquetipos/';

export type Archetype = {
  n: string;
  img: string;
  vid: string;
  c2: string;
  accent: string;
  hA: string;
  hB: string;
  f: string;
  t: string;
  v: string;
  b: { INGRESOS: number; DEUDA: number; AHORRO: number; MOVS: number };
};

export const ARCHETYPES: Archetype[] = [
  {
    n: 'El Emperador',
    img: '/arquetipos/EMPERADOR.webp',
    vid: 'EMPERADOR.mp4',
    c2: '#4a2c06',
    accent: '#F0B93C',
    hA: '#FFB020',
    hB: '#FF6A00',
    f: 'No solo ganas dinero, dominas el arte de conservarlo y multiplicarlo.',
    t: 'Todo imperio deja registro. La DIAN no te mide por lo que ganas ni por lo que gastas, te mide por lo que acumulaste, <b>por lo general declaras renta porque rompes el tope de patrimonio.</b>',
    v: 'Declara por patrimonio',
    b: { INGRESOS: 0.55, DEUDA: 0.15, AHORRO: 0.9, MOVS: 0.4 },
  },
  {
    n: 'El Mago',
    img: '/arquetipos/MAGO.webp',
    vid: 'EL%20MAGO.mp4',
    c2: '#0e3524',
    accent: '#4ED6A1',
    hA: '#34E1A0',
    hB: '#0E9F6E',
    f: 'Eres una máquina de hacer dinero, pero un colador para retenerlo.',
    t: 'Vives un estilo de vida envidiable y no dependes de la deuda, pero no has construido activos reales. <b>Declaras por el tamaño de tus ingresos y por lo general eres el que más deducciones deja sin reclamar.</b>',
    v: 'Declara por ingresos',
    b: { INGRESOS: 0.95, DEUDA: 0.1, AHORRO: 0.35, MOVS: 0.5 },
  },
  {
    n: 'El Gladiador',
    img: '/arquetipos/GLADIADOR.webp',
    vid: 'GLADIADOR.mp4',
    c2: '#1b1d21',
    accent: '#D7DEE6',
    hA: '#C7D3E3',
    hB: '#4A5A72',
    f: 'Sientes que trabajas duro solo para apagar incendios.',
    t: 'Las cuotas y los intereses se comen tu sueldo antes de que puedas disfrutarlo, y tu día a día es una batalla por recuperar tu libertad. Peleas en dos arenas: el banco te cobra lo que debes y la DIAN te cobra por lo que te ingresó a la cuenta debido a los préstamos.',
    v: 'Veredicto variable',
    b: { INGRESOS: 0.55, DEUDA: 0.88, AHORRO: 0.1, MOVS: 0.7 },
  },
  {
    n: 'El Malabarista',
    img: '/arquetipos/MALABARISTA.webp',
    vid: 'EL%20MALABARISTA.mp4',
    c2: '#33373c',
    accent: '#C9CE34',
    hA: '#E3EA3C',
    hB: '#8F9A12',
    f: 'El dinero entra y sale de tus manos a la misma velocidad.',
    t: 'Tienes capacidad de consumo y pagas tus cuentas, pero al final del mes el marcador queda en ceros. <b>Lo complicado es que la DIAN no cuenta lo que te quedaste, cuenta lo que pasó por tus cuentas, por lo general declaras renta porque rompes el tope de consignaciones.</b>',
    v: 'Declara por consignaciones',
    b: { INGRESOS: 0.55, DEUDA: 0.5, AHORRO: 0.2, MOVS: 0.95 },
  },
  {
    n: 'El Mochilero',
    img: '/arquetipos/MOCHILERO.webp',
    vid: 'EL%20MOCHILERO.mp4',
    c2: '#2c1a52',
    accent: '#B492F7',
    hA: '#B492F7',
    hB: '#6D28D9',
    f: 'Tu vida financiera es simple, no por estrategia, sino por etapa.',
    t: 'No tienes deudas que te quiten el sueño, pero tampoco ingresos que te permitan soñar en grande todavía. Por lo general no declaras renta, pero ojo: <b>no es el sueldo el que te delata, es lo que pasa por tus cuentas.</b>',
    v: 'No declara. 18 a 23 años',
    b: { INGRESOS: 0.2, DEUDA: 0.08, AHORRO: 0.15, MOVS: 0.18 },
  },
  {
    n: 'El Soñador',
    img: '/arquetipos/SO%C3%91ADOR.webp',
    vid: 'EL%20SO%C3%91ADOR.mp4',
    c2: '#0a2c52',
    accent: '#7DD3FC',
    hA: '#7DD3FC',
    hB: '#2563EB',
    f: 'Nada te ancla, pero tampoco nada te sostiene.',
    t: 'A diferencia de quien apenas empieza, tú ya llevas rato flotando. Vives ligero, sin deudas y sin ataduras, pero también sin nada acumulado. <b>No declaras renta y suena cómodo</b>, sin embargo a tu edad significa que todavía no has construido una vida financiera estable. Dato curioso: por lo general eres la persona a la cual el banco nunca le presta.',
    v: 'No declara. Edad mayor a 23',
    b: { INGRESOS: 0.18, DEUDA: 0.06, AHORRO: 0.12, MOVS: 0.15 },
  },
];
