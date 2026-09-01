import { ChangeDetectionStrategy, Component, TemplateRef, computed, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../servicios';
import { formatCurrency } from '../../utils/currency';
import { CategoryStat, TableColumn } from '../../interfaces';
import { DataTableComponent } from '../../componentes/data-table/data-table.component';

@Component({
  selector: 'app-categorias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DataTableComponent],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent {
  private readonly categoryService = inject(CategoryService);

  readonly stats = this.categoryService.currentMonthStats;

  newCategory = '';

  private readonly budgetCellTpl = viewChild<TemplateRef<{ $implicit: CategoryStat }>>('budgetCell');
  private readonly overCellTpl = viewChild<TemplateRef<{ $implicit: CategoryStat }>>('overCell');

  readonly columns = computed<TableColumn<CategoryStat>[]>(() => [
    { field: 'name', header: 'Categoría' },
    { field: 'spent', header: 'Gastado', format: (c) => this.fmt(c.spent) },
    { field: 'budget', header: 'Presupuesto', type: 'custom', width: '140px', cellTemplate: this.budgetCellTpl() },
    { field: 'over', header: '', type: 'custom', cellTemplate: this.overCellTpl() },
  ]);

  addCategory(): void {
    this.categoryService.add(this.newCategory).subscribe(() => {
      this.newCategory = '';
    });
  }

  onBudgetChange(name: string, value: string): void {
    this.categoryService.updateBudget(name, parseFloat(value)).subscribe();
  }

  fmt(amount: number): string {
    return formatCurrency(amount);
  }
}
