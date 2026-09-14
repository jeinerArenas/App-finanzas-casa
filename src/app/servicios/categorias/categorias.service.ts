import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { ActividadService } from '../actividad/actividad.service';
import { BackendCategory, CrearCategoriaPayload, EditarCategoriaPayload } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly helper = inject(HelperService);
  private readonly actividad = inject(ActividadService);

  private readonly _categorias = signal<BackendCategory[]>([]);
  readonly categorias = this._categorias.asReadonly();

  listar(): Observable<BackendCategory[]> {
    return this.helper.get<BackendCategory[]>('categories');
  }

  cargar(): void {
    this.listar().subscribe((categorias) => this._categorias.set(categorias));
  }

  crear(payload: CrearCategoriaPayload): Observable<BackendCategory> {
    return this.helper.post<BackendCategory>('categories', this.aBody(payload)).pipe(
      tap((creada) => {
        this._categorias.update((lista) => this.ordenar([...lista, creada]));
        this.actividad.registrar('agregar', `Categoría: ${creada.category_name}`);
      }),
    );
  }

  editar(idCategory: number, payload: EditarCategoriaPayload): Observable<BackendCategory> {
    return this.helper.put<BackendCategory>(`categories/${idCategory}`, this.aBody(payload)).pipe(
      tap((actualizada) => {
        this._categorias.update((lista) =>
          this.ordenar(lista.map((c) => (c.id_category === idCategory ? actualizada : c))),
        );
        this.actividad.registrar('editar', `Categoría: ${actualizada.category_name}`);
      }),
    );
  }

  private ordenar(lista: BackendCategory[]): BackendCategory[] {
    return [...lista].sort((a, b) => a.category_name.localeCompare(b.category_name));
  }

  private aBody(payload: CrearCategoriaPayload): Record<string, unknown> {
    return {
      category_name: payload.categoryName,
      monthly_budget: payload.monthlyBudget ?? 0,
      id_category_type: payload.idCategoryType,
    };
  }
}
