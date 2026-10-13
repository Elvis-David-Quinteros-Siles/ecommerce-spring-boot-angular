import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ItemCart } from 'src/app/common/item-cart';
import { Product } from 'src/app/common/product';
import { CartService } from 'src/app/services/cart.service';
import { HomeService } from 'src/app/services/home.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{
  products: Product [] = [];
  filtered: Product [] = [];
  loading = true;
  error = false;
  query = '';
  sort = 'recent';
  skeletons = Array(8);

  constructor(private homeService:HomeService,
    private cartService:CartService,
    private toastr:ToastrService,
    private activatedRoute:ActivatedRoute,
    private router:Router){

  }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.query = params.get('q') ?? '';
      this.applyFilters();
    });
    this.loadProducts();
  }

  loadProducts(){
    this.loading = true;
    this.error = false;
    this.homeService.getProducts().subscribe({
      next: data => {
        this.products = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  applyFilters(){
    const q = this.query.trim().toLowerCase();
    let result = this.products.filter(p =>
      !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
    switch (this.sort) {
      case 'price-asc': result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'name': result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result = [...result].sort((a, b) => b.id - a.id);
    }
    this.filtered = result;
  }

  clearSearch(){
    this.router.navigate(['/']);
  }

  addToCart(p: Product){
    this.cartService.addItemCart(new ItemCart(p.id, p.name, 1, p.price, p.urlImage));
    this.toastr.success(`${p.name} se añadió al carrito`, 'Carrito');
  }

  onImageError(event: Event){
    (event.target as HTMLImageElement).src = '/images/default.jpg';
  }

}
