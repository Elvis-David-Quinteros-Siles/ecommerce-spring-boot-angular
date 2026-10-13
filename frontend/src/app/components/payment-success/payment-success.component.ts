import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    private cartService:CartService,
    private activatedRoute:ActivatedRoute
  ){

  }

  // El backend confirma la orden al verificar el pago con PayPal; aqui solo se consulta su estado
  ngOnInit(): void {
    const fromUrl = this.activatedRoute.snapshot.queryParamMap.get('orderId');
    this.orderId = fromUrl ? Number(fromUrl) : this.sessionStorage.getItem('order')?.id ?? null;
    if (!this.orderId || this.sessionStorage.getItem('token') == null) {
      this.status = 'error';
      return;
    }

    this.orderService.getOrderById(this.orderId).subscribe({
      next: order => {
        if (order.orderState === OrderState.CONFIRMED) {
          this.status = 'ok';
          this.cartService.clear();
          this.sessionStorage.removeItem('order');
        } else {
          this.status = 'error';
        }
      },
      error: () => this.status = 'error'
    });

  }

}
