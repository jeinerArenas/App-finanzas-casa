import { Injectable, computed, inject } from '@angular/core';
import { IngresosService } from './ingresos/ingresos.service';
import { GastosService } from './gastos/gastos.service';
import { CategoriasService } from './categorias/categorias.service';
import { SalariosService } from './salarios/salarios.service';
import { MonthService } from './month.service';
import { formatCurrency } from '../utils/currency';

export interface BarGroup {
  label: string;
  labelX: number;
  incX: number;
  incY: number;
  incH: number;
  expX: number;
  expY: number;
  expH: number;
  savX: number;
  savY: number;
  savH: number;
  barW: number;
}

export interface LinePoint {
  x: number;
  y: number;
}
export interface LineLabel {
  label: string;
  x: number;
}

export interface HistoryRow {
  key: string;
  label: string;
  incomeFmt: string;
  expenseFmt: string;
  savingsFmt: string;
  savingsPositive: boolean;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  totalIncomeFmt: string;
  totalExpenseFmt: string;
  savingsFmt: string;
  savingsPositive: boolean;
  bars: BarGroup[];
  linePoints: LinePoint[];
  lineLabels: LineLabel[];
  linePointsStr: string;
  areaPointsStr: string;
  midY: number;
  historyRows: HistoryRow[];
  cumTotal: number;
  cumTotalFmt: string;
}

export interface OverBudgetCategory {
  name: string;
  spent: number;
  budget: number;
}

const PLOT_X0 = 44,
  PLOT_X1 = 616,
  PLOT_Y0 = 14,
  PLOT_Y1 = 186;

function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function todayMonthKey(): string {
  return monthKeyOf(new Date().toISOString());
}

function monthsBetween(startDate: string, endDate: string): string[] {
  const [startYear, startMonth] = monthKeyOf(startDate).split('-').map(Number);
  const [endYear, endMonth] = monthKeyOf(endDate).split('-').map(Number);
  const keys: string[] = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return keys;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly ingresosService = inject(IngresosService);
  private readonly gastosService = inject(GastosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly salariosService = inject(SalariosService);
  private readonly month = inject(MonthService);

  readonly summary = computed<DashboardSummary>(() => this.buildSummary(this.month.monthKey()));

  readonly overBudgetCategories = computed<OverBudgetCategory[]>(() => {
    const monthKey = this.month.monthKey();
    const spentByCategory = new Map<number, number>();

    for (const g of this.gastosService.gastos()) {
      if (monthKeyOf(g.expense_date) !== monthKey) continue;
      spentByCategory.set(
        g.id_category,
        (spentByCategory.get(g.id_category) ?? 0) + Number(g.amount),
      );
    }

    return this.categoriasService
      .categorias()
      .map((c) => ({
        name: c.category_name,
        spent: spentByCategory.get(c.id_category) ?? 0,
        budget: Number(c.monthly_budget),
      }))
      .filter((c) => c.budget > 0 && c.spent > c.budget);
  });

  constructor() {
    this.categoriasService.cargar();
    this.salariosService.cargar();
  }

  private buildSummary(monthKey: string): DashboardSummary {
    const incomes = this.ingresosService.ingresos();
    const expenses = this.gastosService.gastos();
    const salarios = this.salariosService.salarios();
    const variables = this.salariosService.variables();
    const hoyKey = todayMonthKey();

    const expensesOf = (k: string) => expenses.filter((e) => monthKeyOf(e.expense_date) === k);
    const sumAmount = (rows: { amount: string }[]) =>
      rows.reduce((s, r) => s + Number(r.amount), 0);
    const activeDuring = (
      rows: { start_date: string; end_date: string | null; amount: string }[],
      k: string,
    ) =>
      rows.filter(
        (r) =>
          monthKeyOf(r.start_date) <= k && (r.end_date === null || monthKeyOf(r.end_date) >= k),
      );
    const totalIncomeOf = (k: string) =>
      sumAmount(incomes.filter((i) => monthKeyOf(i.income_date) === k)) +
      sumAmount(activeDuring(salarios, k)) +
      sumAmount(activeDuring(variables, k));
    const historyCapFor = (endDate: string | null) => {
      const end = endDate ? monthKeyOf(endDate) : hoyKey;
      return end < hoyKey ? end : hoyKey;
    };

    const monthKeysSet = new Set<string>();
    incomes.forEach((i) => monthKeysSet.add(monthKeyOf(i.income_date)));
    expenses.forEach((e) => monthKeysSet.add(monthKeyOf(e.expense_date)));
    salarios.forEach((s) =>
      monthsBetween(s.start_date, `${historyCapFor(s.end_date)}-01`).forEach((k) =>
        monthKeysSet.add(k),
      ),
    );
    variables.forEach((v) =>
      monthsBetween(v.start_date, `${historyCapFor(v.end_date)}-01`).forEach((k) =>
        monthKeysSet.add(k),
      ),
    );
    const allMonthKeys = [...monthKeysSet].filter((k) => k <= hoyKey).sort();

    const totalIncome = totalIncomeOf(monthKey);
    const totalExpense = sumAmount(expensesOf(monthKey));
    const savings = totalIncome - totalExpense;

    let cum = 0;
    const cumByKey: Record<string, number> = {};
    for (const k of allMonthKeys) {
      cum += totalIncomeOf(k) - sumAmount(expensesOf(k));
      cumByKey[k] = cum;
    }
    const cumTotal = cum;

    const chartKeys =
      monthKey <= hoyKey && !allMonthKeys.includes(monthKey)
        ? [...allMonthKeys, monthKey].sort()
        : [...allMonthKeys];
    const last = chartKeys.slice(-6);
    const historyGroups = last.map((k) => {
      const inc = totalIncomeOf(k);
      const exp = sumAmount(expensesOf(k));
      return {
        key: k,
        label: this.month.labelFor(k).slice(0, 3),
        income: inc,
        expense: exp,
        savings: inc - exp,
        cum: cumByKey[k] ?? cum,
      };
    });

    const maxVal = Math.max(
      1,
      ...historyGroups.flatMap((g) => [g.income, g.expense, Math.max(g.savings, 0)]),
    );
    const n = historyGroups.length || 1;
    const plotW = PLOT_X1 - PLOT_X0,
      plotH = PLOT_Y1 - PLOT_Y0;
    const groupW = plotW / n;
    const barW = Math.min(16, groupW * 0.22);
    const bars: BarGroup[] = historyGroups.map((g) => {
      const gx = PLOT_X0 + historyGroups.indexOf(g) * groupW;
      const h = (val: number) => (val / maxVal) * plotH;
      const incH = h(g.income),
        expH = h(g.expense),
        savH = h(Math.max(g.savings, 0));
      return {
        label: g.label,
        labelX: gx + groupW / 2,
        incX: gx + groupW * 0.18,
        incY: PLOT_Y1 - incH,
        incH,
        expX: gx + groupW * 0.42,
        expY: PLOT_Y1 - expH,
        expH,
        savX: gx + groupW * 0.66,
        savY: PLOT_Y1 - savH,
        savH,
        barW,
      };
    });

    const cumVals = historyGroups.map((g) => g.cum);
    const maxCum = Math.max(1, ...cumVals.map((v) => Math.abs(v)));
    const midY = PLOT_Y0 + plotH / 2;
    const linePoints: LinePoint[] = historyGroups.map((g, i) => ({
      x: PLOT_X0 + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW),
      y: midY - (g.cum / maxCum) * (plotH / 2),
    }));
    const linePointsStr = linePoints.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPointsStr = linePoints.length
      ? `${PLOT_X0},${PLOT_Y1} ${linePointsStr} ${PLOT_X1},${PLOT_Y1}`
      : '';
    const lineLabels: LineLabel[] = historyGroups.map((g, i) => ({
      label: g.label,
      x: linePoints[i].x,
    }));

    const historyRows: HistoryRow[] = [...allMonthKeys].reverse().map((k) => {
      const inc = totalIncomeOf(k);
      const exp = sumAmount(expensesOf(k));
      const sv = inc - exp;
      return {
        key: k,
        label: this.month.labelFor(k),
        incomeFmt: formatCurrency(inc),
        expenseFmt: formatCurrency(exp),
        savingsFmt: formatCurrency(sv),
        savingsPositive: sv >= 0,
      };
    });

    return {
      totalIncome,
      totalExpense,
      savings,
      totalIncomeFmt: formatCurrency(totalIncome),
      totalExpenseFmt: formatCurrency(totalExpense),
      savingsFmt: formatCurrency(savings),
      savingsPositive: savings >= 0,
      bars,
      linePoints,
      lineLabels,
      linePointsStr,
      areaPointsStr,
      midY,
      historyRows,
      cumTotal,
      cumTotalFmt: formatCurrency(cumTotal),
    };
  }
}
