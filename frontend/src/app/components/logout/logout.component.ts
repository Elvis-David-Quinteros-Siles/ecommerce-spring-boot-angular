import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SessionStorageService } from 'src/app/services/session-storage.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {
constructor(private sessionStorage : SessionStorageService, private router:Router, private toastr:ToastrService){

}

  ngOnInit(): void {
    this.sessionStorage.removeItem('token');
    this.toastr.info('Cerraste sesión correctamente', 'Sesión');
    this.router.navigate(['/']);
  }

}
