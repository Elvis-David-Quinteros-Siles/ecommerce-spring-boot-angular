import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStorageService } from '../services/session-storage.service';

// Requiere sesion iniciada; si la ruta define data.role, tambien exige ese rol
export const authGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionStorageService);
  const router = inject(Router);
  const token = session.getItem('token');

  if(token == null){
    return router.createUrlTree(['/user/login'], { queryParams: { returnUrl: state.url } });
  }

  const role = route.data?.['role'];
  if(role && token.type !== role){
    return router.createUrlTree(['/']);
  }

  return true;
};
