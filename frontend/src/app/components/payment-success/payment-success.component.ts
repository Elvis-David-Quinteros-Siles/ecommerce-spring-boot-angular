import { Component, OnInit } from '@angular/core';
import { OrderState } from 'src/app/common/order-state';
import { CartService } from 'src/app/services/cart.service';
import { OrderService } from 'src/app/services/order.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  orderId : number | null = null;
  status : 'loading' | 'ok' | 'error' = 'loading';

  constructor(
    private orderService:OrderService,
    private sessionStorage:SessionStorageService,
    private cartService:CartService
  ){

  }


  ngOnInit(): void {
    let order = this.sessionStorage.getItem('order');
    if (!order) {
      this.status = 'error';
      return;
    }
    this.orderId = order.id;

    let formData = new FormData();

    formData.append('id',order.id);
    formData.append('state', OrderState.CONFIRMED.toString());

    this.orderService.updateOrder(formData).subscribe({
      next: () => {
        this.status = 'ok';
        this.cartService.clear();
        this.sessionStorage.removeItem('order');
      },
      error: () => this.status = 'error'
    });

  }

}
