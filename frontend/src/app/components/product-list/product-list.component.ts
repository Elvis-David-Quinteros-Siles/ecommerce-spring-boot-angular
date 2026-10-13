import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Product } from 'src/app/common/product';
import { CategoryService } from 'src/app/services/category.service';
import { ProductService } from 'src/app/services/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products : Product[] = [];
  categoryNames = new Map<string, string>();
  filter = '';
  loading = true;

  constructor(private productService:ProductService, private categoryService:CategoryService, private toastr:ToastrService ){}

  ngOnInit(): void {
    this.listProducts();
    this.categoryService.getCategoryList().subscribe(
      data => data.forEach(c => this.categoryNames.set(String(c.id), c.name))
    );
  }

  get filtered(){
    const q = this.filter.trim().toLowerCase();
    if (!q) {
      return this.products;
    }
    return this.products.filter(p =>
      p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
  }

  categoryName(id: string){
    return this.categoryNames.get(String(id)) ?? '—';
  }

  listProducts(){
    this.productService.getProducts().subscribe({
      next: data => {
        this.products = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  deleteProductById(product: Product){

    Swal.fire({
      title: '¿Eliminar producto?',
      text: `"${product.name}" se eliminará de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProductById(product.id).subscribe({
          next: () => {
            this.toastr.success('Producto eliminado correctamente', 'Productos');
            this.listProducts();
          },
          error: () => this.toastr.error('No se pudo eliminar el producto', 'Productos')
        });
      }
    })

  }

  onImageError(event: Event){
    (event.target as HTMLImageElement).src = '/images/default.jpg';
  }

}
