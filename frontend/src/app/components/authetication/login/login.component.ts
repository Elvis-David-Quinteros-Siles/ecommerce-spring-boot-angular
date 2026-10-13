import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Userdto } from 'src/app/common/userdto';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{
  username : string = '';
  password : string = '';
  showPassword = false;
  loading = false;
  private returnUrl : string | null = null;


  ngOnInit(): void {
    const params = this.activatedRoute.snapshot.queryParamMap;
    this.returnUrl = params.get('returnUrl');
    this.username = params.get('email') ?? '';
  }

  constructor(private authentication : AuthenticationService,
    private sessionStorage : SessionStorageService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
    ){

  }

  login(){
    if (this.loading) {
      return;
    }
    this.loading = true;
    let userDto = new Userdto(this.username.trim(), this.password);
    this.authentication.login(userDto).subscribe({
      next: token => {
        this.sessionStorage.setItem('token', token);
        this.toastr.success('Bienvenido', 'Sesión iniciada');
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else if(token.type == 'ADMIN'){
          this.router.navigate(['/admin/product']);
        }else{
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Usuario o contraseña incorrectos', 'Login');
      }
    });
  }



}
