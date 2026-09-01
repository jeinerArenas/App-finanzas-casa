import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { AuthService } from '../auth/auth.service';
import { AuthResult } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly helper = inject(HelperService);
  private readonly auth = inject(AuthService);

  login(email: string, password: string): Observable<AuthResult> {
    return this.helper
      .post<AuthResult>('auth/login', { email: email.trim().toLowerCase(), password })
      .pipe(tap((res) => this.auth.setSession(res.user, res.token)));
  }
}
