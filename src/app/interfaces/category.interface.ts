export const DEFAULT_CATEGORIES: string[] = [
  'Renta/hipoteca',
  'Comida/despensa',
  'Transporte',
  'Servicios',
  'Entretenimiento',
  'Deudas/tarjetas',
  'Educación',
  'Otro',
];

export interface CategoryStat {
  name: string;
  spent: number;
  budget: number;
  over: boolean;
}
