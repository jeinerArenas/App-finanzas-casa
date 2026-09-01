import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { BackendCategory } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly helper = inject(HelperService);

  listar(): Observable<BackendCategory[]> {
    return this.helper.get<BackendCategory[]>('categories');
  }
}
