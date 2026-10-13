import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../common/user';
import { HeaderService } from './header.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl: string = '/api/v1/users';

  constructor(private httpClient:HttpClient, private headerService: HeaderService) { }

  getUserById(id:number):Observable<User>{
    //return this.httpClient.get<User>(this.apiUrl+'/'+id);
    return this.httpClient.get<User>(`${this.apiUrl}/${id}`, { headers: this.headerService.headers });
  }

  changePassword(currentPassword:string, newPassword:string):Observable<{message:string}>{
    return this.httpClient.put<{message:string}>(`${this.apiUrl}/me/password`, { currentPassword, newPassword }, { headers: this.headerService.headers });
  }


}
