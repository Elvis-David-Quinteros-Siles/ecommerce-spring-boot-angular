import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Category } from 'src/app/common/category';
import { CategoryService } from 'src/app/services/category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit {

  categories: Category [] = [];
  loading = true;

  constructor(private categoryService:CategoryService, private toastr:ToastrService){}


  ngOnInit(): void {
    this.listCategories();
  }

  listCategories(){
    this.categoryService.getCategoryList().subscribe({
      next: data => {
        this.categories = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  deleteCategoryById(category: Category){

    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `"${category.name}" se eliminará de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategoryById(category.id).subscribe({
          next: () => {
            this.toastr.success('Categoría eliminada correctamente', 'Categorías');
            this.listCategories();
          },
          error: () => this.toastr.error('No se pudo eliminar. Verifica que no tenga productos asociados.', 'Categorías')
        });
      }
    })

  }

}
