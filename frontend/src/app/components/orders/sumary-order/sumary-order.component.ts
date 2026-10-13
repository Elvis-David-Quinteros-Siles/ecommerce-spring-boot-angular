import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { switchMap } from 'rxjs';
import { DataPayment } from 'src/app/common/data-payment';
import { ItemCart } from 'src/app/common/item-cart';
import { Order } from 'src/app/common/order';
import { OrderProduct } from 'src/app/common/order-product';
import { OrderState } from 'src/app/common/order-state';
import { CartService } from 'src/app/services/cart.service';
import { OrderService } from 'src/app/services/order.service';
import { PaymentService } from 'src/app/services/payment.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-sumary-order',
  templateUrl: './sumary-order.component.html',
  styleUrls: ['./sumary-order.component.css']
})
export class SumaryOrderComponent implements OnInit {

  items : ItemCart [] = [];
  totalCart : number =0;
  firstName : string = '';
  lastName : string = '';
  email : string = '';
  address : string ='';
  userId : number =0;
  loggedIn = false;
  paying = false;
  readonly maxQuantity = 10;

  constructor(private cartService:CartService,
    private userService:UserService,
    private orderService:OrderService,
    private paymentService:PaymentService,
    private sessionStorage:SessionStorageService,
    private toastr:ToastrService,
    private router:Router
    ){}


  ngOnInit(): void {
    this.refresh();
    const session = this.sessionStorage.getItem('token');
    this.loggedIn = session != null;
    if (this.loggedIn) {
      this.userId = session.id;
      this.getUserById(this.userId);
    }
  }

  get units(){
    return this.cartService.count;
  }

  refresh(){
    this.items = [...this.cartService.convertToListFromMap()];
    this.totalCart = this.cartService.totalCart();
  }

  changeQuantity(item: ItemCart, delta: number){
    const quantity = Math.min(this.maxQuantity, Math.max(1, item.quantity + delta));
    this.cartService.setQuantity(item.productId, quantity);
    this.refresh();
  }

  goToLogin(){
    this.router.navigate(['/user/login'], { queryParams: { returnUrl: '/cart/sumary' } });
  }

  // Primero registra la orden y, una vez guardada, redirige a PayPal
  generateOrder(){
    if (this.items.length === 0 || this.paying) {
      return;
    }
    this.paying = true;

    const orderProducts = this.items.map(item => new OrderProduct(null, item.productId, item.quantity, item.price));
    const order = new Order(null, new Date(), orderProducts, this.userId, OrderState.CANCELLED);

    this.orderService.createOrder(order).pipe(
      switchMap(data => {
        this.sessionStorage.setItem('order', data);
        return this.paymentService.getUrlPaypalPayment(new DataPayment('PAYPAL', this.totalCart.toFixed(2), 'USD', 'COMPRA', data.id));
      })
    ).subscribe({
      next: data => window.location.href = data.url,
      error: () => {
        this.paying = false;
        this.toastr.error('No se pudo iniciar el pago. Inténtalo nuevamente.', 'Pago');
      }
    });
  }

  deleteItemCart(productId:number){
    this.cartService.deleteItemCart(productId);
    this.refresh();
  }

  getUserById(id:number){
    this.userService.getUserById(id).subscribe(
      data => {
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.address = data.address;
      }
    );
  }

  onImageError(event: Event){
    (event.target as HTMLImageElement).src = '/images/default.jpg';
  }

}
