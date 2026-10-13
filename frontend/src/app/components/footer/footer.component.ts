import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="app-footer">
      <div class="container d-flex flex-column flex-sm-row gap-2 justify-content-between align-items-center">
        <span><i class="bi bi-bag-heart-fill text-brand me-1"></i> Spring eCommerce &copy; {{ year }}</span>
        <span><i class="bi bi-shield-check me-1"></i>Pagos con PayPal</span>
      </div>
    </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
