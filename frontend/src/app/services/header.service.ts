import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  constructor(private sessionStorage : SessionStorageService) { }

  // Se calcula en cada peticion para tomar el token vigente (tras login/logout)
  get headers() : HttpHeaders {
    const session = this.sessionStorage.getItem('token');
    if (session != null) {
      return new HttpHeaders({ 'Authorization' : `${session.token}` });
    }
    return new HttpHeaders();
  }
}
