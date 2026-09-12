import { Lot, TimelineBlock, ApplicationRecord, NdviPoint } from '../types';

export const INITIAL_LOTS: Lot[] = [
  {
    id: 'lote-3',
    name: 'Lote 3 - El Ombú',
    hectares: 185,
    crop: 'Soja 1ra',
    stage: 'R3',
    station: 'ESTACIÓN PERGAMINO CENTRO',
    stationTime: 'hace 12 min',
    condition: 'FAVORABLE',
    conditionTitle: 'CONDICIONES FAVORABLES',
    conditionDesc: 'Viento 11 km/h · Delta-T 4.2 · Sin pronóstico de lluvia',
    windSpeed: 12,
    windDirection: 'SE',
    deltaT: 4.8,
    temp: 23.1,
    humidity: 62,
    points: [
      { x: 12, y: 14 },
      { x: 48, y: 10 },
      { x: 52, y: 46 },
      { x: 22, y: 52 },
      { x: 8, y: 36 }
    ],
    economicImpact: 'Ahorro estimado de $3.450.000 ARS en eficacia de caldo y control de deriva (185 ha).'
  },
  {
    id: 'lote-1',
    name: 'Lote 1 - Bajo Norte',
    hectares: 92,
    crop: 'Maíz Tardío',
    stage: 'V8',
    station: 'ESTACIÓN PERGAMINO CENTRO',
    stationTime: 'hace 18 min',
    condition: 'AL_LIMITE',
    conditionTitle: 'AL LÍMITE',
    conditionDesc: 'Ráfagas a 24 km/h en incremento · Humedad relativa 42%',
    windSpeed: 19,
    windDirection: 'E',
    deltaT: 6.5,
    temp: 26.4,
    humidity: 42,
    points: [
      { x: 8, y: 10 },
      { x: 52, y: 14 },
      { x: 42, y: 48 },
      { x: 16, y: 50 }
    ],
    economicImpact: 'Riesgo de deriva moderada en cabecera lindera a cortina forestal.'
  },
  {
    id: 'lote-4',
    name: 'Lote 4 - El Trébol',
    hectares: 240,
    crop: 'Girasol',
    stage: 'R5.1',
    station: 'ESTACIÓN PERGAMINO CENTRO',
    stationTime: 'hace 25 min',
    condition: 'NO_FAVORABLE',
    conditionTitle: 'CONDICIONES NO FAVORABLES',
    conditionDesc: 'Inversión térmica activa (humo atrapado a ras de suelo) y ráfagas > 32 km/h.',
    windSpeed: 34,
    windDirection: 'NE',
    deltaT: 8.9,
    temp: 29.2,
    humidity: 32,
    points: [
      { x: 18, y: 10 },
      { x: 46, y: 14 },
      { x: 54, y: 34 },
      { x: 38, y: 52 },
      { x: 14, y: 44 },
      { x: 6, y: 24 }
    ],
    economicImpact: 'Bloqueo operativo mandatorio para evitar pérdidas fitosanitarias mayores a $6.200.000 ARS.'
  }
];

export const TIMELINE_BLOCKS: TimelineBlock[] = [
  {
    id: 't1',
    timeRange: 'AHORA – 14:00',
    condition: 'FAVORABLE',
    title: 'FAVORABLE',
    symbol: '◆',
    wind: '12 km/h',
    deltaT: 4.8,
    temp: 23,
    notes: '12 km/h · Delta-T 4.8 · Temp 23°C',
    bgClass: 'bg-surface-container-low'
  },
  {
    id: 't2',
    timeRange: '15:00 – 18:00',
    condition: 'AL_LIMITE',
    title: 'AL LÍMITE',
    symbol: '❚❚',
    wind: '19 km/h (ráfagas 26 km/h)',
    deltaT: 6.5,
    notes: '19 km/h (ráfagas 26 km/h) · Delta-T 6.5',
    bgClass: 'bg-surface-variant'
  },
  {
    id: 't3',
    timeRange: '19:00 – 02:00',
    condition: 'NO_FAVORABLE',
    title: 'NO FAVORABLE',
    symbol: '⯀',
    wind: 'Calma superficial',
    deltaT: 2.1,
    notes: 'Inversión térmica probable · Calma superficial',
    bgClass: 'bg-primary text-white'
  },
  {
    id: 't4',
    timeRange: '03:00 – 09:00',
    condition: 'FAVORABLE_OPTIMO',
    title: 'FAVORABLE (ÓPTIMO)',
    symbol: '◆',
    wind: 'Viento 8 km/h',
    deltaT: 3.5,
    notes: 'Viento 8 km/h · Delta-T 3.5 · Rocío moderado',
    bgClass: 'bg-surface-container-low'
  }
];

export const NDVI_HISTORY: NdviPoint[] = [
  { date: '14 Feb', value: 0.74, label: '14 Feb' },
  { date: '2 Feb', value: 0.71, label: '2 Feb' },
  { date: '20 Ene', value: null, label: '20 Ene', isCloud: true },
  { date: '10 Ene', value: 0.65, label: '10 Ene' },
  { date: '28 Dic', value: 0.58, label: '28 Dic' }
];

export const APPLICATION_HISTORY: ApplicationRecord[] = [
  {
    id: 'app-1',
    date: '10 Feb 2025',
    time: '07:15 hs',
    hectares: 185,
    title: 'Fungicida + Coadyuvante',
    operator: 'Matrícula #7481',
    wind: '9 km/h SO',
    temp: '19.4 °C',
    deltaT: '3.8 °C',
    humidity: '68%'
  },
  {
    id: 'app-2',
    date: '22 Ene 2025',
    time: '19:40 hs',
    hectares: 185,
    title: 'Herbicida Selectivo',
    operator: 'Matrícula #7481',
    wind: '13 km/h E',
    temp: '24.1 °C',
    deltaT: '4.5 °C',
    humidity: '54%'
  }
];

export const DEFAULT_LOTS = INITIAL_LOTS;
