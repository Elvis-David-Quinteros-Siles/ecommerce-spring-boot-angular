import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, throwError } from 'rxjs';
import { SessionStorageService } from './session-storage.service';

// Si el backend rechaza el token (expirado o sin permisos), cierra la sesion y lleva al login
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {

  constructor(private sessionStorage: SessionStorageService, private router: Router, private toastr: ToastrService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const isAuthError = err.status === 401 || err.status === 403;
        if (isAuthError && !req.url.includes('/security/') && this.sessionStorage.getItem('token') != null) {
          this.sessionStorage.removeItem('token');
          this.toastr.warning('Tu sesión expiró. Vuelve a ingresar.', 'Sesión');
          this.router.navigate(['/user/login'], { queryParams: { returnUrl: this.router.url } });
        }
        return throwError(() => err);
      })
    );
  }
}
