import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { AuthService } from '../auth/auth.service';
import { AuthResult, RegistroPayload } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class RegistroService {
  private readonly helper = inject(HelperService);
  private readonly auth = inject(AuthService);

  registrar(payload: RegistroPayload): Observable<AuthResult> {
    return this.helper
      .post<AuthResult>('auth/register', {
        document_number: payload.documentNumber.trim(),
        full_name: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        family_name: payload.familyName.trim(),
      })
      .pipe(tap((res) => this.auth.setSession(res.user, res.token)));
  }

  familyNameExists(familyName: string): Observable<boolean> {
    return this.helper.get<boolean>('auth/family-exists', { name: familyName.trim() });
  }

  emailExists(email: string): Observable<boolean> {
    return this.helper.get<boolean>('auth/email-exists', { email: email.trim().toLowerCase() });
  }
}
