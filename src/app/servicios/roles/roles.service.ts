import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { BackendRole } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly helper = inject(HelperService);

  getRoles(): Observable<BackendRole[]> {
    return this.helper.get<BackendRole[]>('roles');
  }
}
