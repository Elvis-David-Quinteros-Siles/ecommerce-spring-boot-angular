import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  currentPassword : string = '';
  newPassword : string = '';
  confirmPassword : string = '';
  showPassword = false;
  saving = false;

  constructor(private userService: UserService,
    private sessionStorage: SessionStorageService,
    private toastr: ToastrService,
    private router: Router){}

  get isAdmin(){
    return this.sessionStorage.getItem('token')?.type === 'ADMIN';
  }

  get mismatch(){
    return this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  get sameAsCurrent(){
    return this.newPassword.length > 0 && this.newPassword === this.currentPassword;
  }

  changePassword(){
    if (this.saving || this.mismatch || this.sameAsCurrent) {
      return;
    }
    this.saving = true;
    this.userService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.toastr.success('Tu contraseña se actualizó correctamente', 'Contraseña');
        this.router.navigate([this.isAdmin ? '/admin/product' : '/']);
      },
      error: err => {
        this.saving = false;
        this.toastr.error(err?.error?.message ?? 'No se pudo cambiar la contraseña', 'Contraseña');
      }
    });
  }
}
