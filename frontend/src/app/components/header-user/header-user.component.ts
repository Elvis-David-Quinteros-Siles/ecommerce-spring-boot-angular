import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';

@Component({
  selector: 'app-header-user',
  templateUrl: './header-user.component.html',
  styleUrls: ['./header-user.component.css']
})
export class HeaderUserComponent {
  query : string = '';

  constructor(public cartService: CartService,
    private sessionStorage: SessionStorageService,
    private router: Router,
    activatedRoute: ActivatedRoute){
    this.query = activatedRoute.snapshot.queryParamMap.get('q') ?? '';
  }

  get session(){
    return this.sessionStorage.getItem('token');
  }

  get isAdmin(){
    return this.session?.type === 'ADMIN';
  }

  search(){
    const q = this.query.trim();
    this.router.navigate(['/'], { queryParams: q ? { q } : {} });
  }

}
