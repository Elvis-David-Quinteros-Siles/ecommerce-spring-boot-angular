import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ItemCart } from 'src/app/common/item-cart';
import { CartService } from 'src/app/services/cart.service';
import { HomeService } from 'src/app/services/home.service';

@Component({
  selector: 'app-detail-product',
  templateUrl: './detail-product.component.html',
  styleUrls: ['./detail-product.component.css']
})
export class DetailProductComponent implements OnInit {
  id : number = 0;
  name :string ='';
  description :string = '';
  price : number =0;
  urlImage : string = '';
  quantity : number = 1;
  readonly maxQuantity = 10;
  loading = true;
  notFound = false;

  ngOnInit(): void {
    this.getProductById();
  }

  constructor(private homeService:HomeService, private activatedRoute: ActivatedRoute, public cartService:CartService, private toastr:ToastrService ){

  }

  getProductById(){
    this.activatedRoute.params.subscribe(
      p => {
        let id = p['id'];
        if(id){
          this.loading = true;
          this.homeService.getProductById(id).subscribe({
            next: data =>{
              if (!data) { this.notFound = true; this.loading = false; return; }
              this.id = data.id;
              this.name = data.name;
              this.description = data.description;
              this.urlImage = data.urlImage;
              this.price = data.price;
              this.loading = false;
            },
            error: () => { this.notFound = true; this.loading = false; }
          });
        }
      }

    );
  }

  changeQuantity(delta: number){
    this.quantity = Math.min(this.maxQuantity, Math.max(1, this.quantity + delta));
  }

  addCart(id : number){
    let item = new ItemCart(id, this.name, this.quantity, this.price, this.urlImage);

    this.cartService.addItemCart(item);

    this.toastr.success(`${this.quantity} × ${this.name} añadido al carrito`, 'Carrito');
    this.quantity = 1;
  }

  onImageError(event: Event){
    (event.target as HTMLImageElement).src = '/images/default.jpg';
  }

}
