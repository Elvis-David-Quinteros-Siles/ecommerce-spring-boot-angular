import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { User } from 'src/app/common/user';
import { UserType } from 'src/app/common/user-type';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent  implements OnInit{

  username : string = '';
  name : string = '';
  surname : string = '';
  email : string = '';
  address : string = '';
  cellphone : string = '';
  password : string = '';
  confirmPassword : string = '';
  userType : string = '';
  showPassword = false;
  loading = false;

  get passwordMismatch(){
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  ngOnInit(): void {
  }

  constructor(private authetication : AuthenticationService, private router : Router,
    private toastr:ToastrService
    ){}

  register(){
    if (this.loading || this.passwordMismatch) {
      return;
    }
    this.loading = true;
    this.username = this.email.trim();
    this.userType = UserType.USER
    let user = new User (0, this.username, this.name.trim(), this.surname.trim(), this.email.trim(), this.address.trim(), this.cellphone.trim(), this.password, this.userType);
    // Solo se navega al login cuando el registro se confirma
    this.authetication.register(user).subscribe({
      next: () => {
        this.toastr.success('Tu cuenta fue creada. Ya puedes ingresar.', 'Registro');
        this.router.navigate(['user/login'], { queryParams: { email: this.username } });
      },
      error: () => {
        this.loading = false;
        this.toastr.error('No se pudo crear la cuenta. Es posible que el email ya esté registrado.', 'Registro');
      }
    });
  }

}
