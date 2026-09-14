import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BackendCategory, CategoriaFormControls, CrearCategoriaPayload } from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';
import { CATEGORY_TYPES } from '../../../utils/category-types';
import { ModalShellComponent } from '../../../componentes/modal/modal-shell.component';
import { CATEGORY_ICON } from '../../../utils/icons';

export interface CategoriaFormData {
  categoria: BackendCategory | null;
}

@Component({
  selector: 'app-categoria-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  templateUrl: './categoria-form.component.html',
})
export class CategoriaFormComponent {
  private readonly dialogRef = inject(MatDialogRef<CategoriaFormComponent, CrearCategoriaPayload>);
  private readonly data = inject<CategoriaFormData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder).nonNullable;

  private readonly categoria = () => this.data.categoria;
  readonly esEdicion = this.categoria() !== null;
  readonly categoryTypes = CATEGORY_TYPES;
  readonly getErrorMessage = getErrorMessage;
  readonly icon = CATEGORY_ICON;
  readonly titulo = this.esEdicion
    ? $localize`:@@categorias.form.tituloEditar:Editar categoría`
    : $localize`:@@categorias.form.tituloCrear:Nueva categoría`;

  readonly form: FormGroup<CategoriaFormControls> = this.fb.group({
    categoryName: this.fb.control(this.categoria()?.category_name ?? '', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    idCategoryType: this.fb.control<number | null>(
      this.categoria()?.id_category_type ?? null,
      Validators.required,
    ),
    monthlyBudget: this.fb.control<number | null>(this.presupuestoInicial(), Validators.min(0)),
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { categoryName, idCategoryType, monthlyBudget } = this.form.getRawValue();

    this.dialogRef.close({
      categoryName,
      idCategoryType: idCategoryType as number,
      monthlyBudget,
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private presupuestoInicial(): number | null {
    const categoria = this.categoria();
    return categoria ? Number(categoria.monthly_budget) : null;
  }
}
