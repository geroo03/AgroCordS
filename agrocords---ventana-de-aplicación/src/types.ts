export type ScreenView = 'auth' | 'lotes' | 'detalle' | 'ventanas' | 'historial';

export type FontSizeScale = 'chico' | 'mediano' | 'grande' | 'extra';

export type ConditionType = 'FAVORABLE' | 'AL_LIMITE' | 'NO_FAVORABLE';

export interface Lot {
  id: string;
  name: string;
  hectares: number;
  crop: string;
  stage: string;
  station: string;
  stationTime: string;
  condition: ConditionType;
  conditionTitle: string;
  conditionDesc: string;
  windSpeed: number;
  windDirection: string;
  deltaT: number;
  temp: number;
  humidity: number;
  points: { x: number; y: number }[];
  economicImpact: string;
}

export interface TimelineBlock {
  id: string;
  timeRange: string;
  condition: ConditionType | 'FAVORABLE_OPTIMO';
  title: string;
  symbol: string;
  wind: string;
  deltaT: number;
  temp?: number;
  notes: string;
  bgClass: string;
}

export interface ApplicationRecord {
  id: string;
  date: string;
  time: string;
  hectares: number;
  title: string;
  operator: string;
  wind: string;
  temp: string;
  deltaT: string;
  humidity: string;
}

export interface NdviPoint {
  date: string;
  value: number | null;
  label: string;
  isCloud?: boolean;
}
