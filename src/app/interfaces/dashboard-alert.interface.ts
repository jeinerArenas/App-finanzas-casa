export interface DashboardAlertCategoryCard {
  id: string;
  kind: 'warning';
  categoryName: string;
}

export interface DashboardAlertGoalCard {
  id: string;
  kind: 'goal';
}

export type DashboardAlertCard = DashboardAlertCategoryCard | DashboardAlertGoalCard;
