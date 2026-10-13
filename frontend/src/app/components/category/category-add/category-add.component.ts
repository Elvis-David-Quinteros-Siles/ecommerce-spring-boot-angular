import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Category } from 'src/app/common/category';
import { CategoryService } from 'src/app/services/category.service';

@Component({
  selector: 'app-category-add',
  templateUrl: './category-add.component.html',
  styleUrls: ['./category-add.component.css']
})
export class CategoryAddComponent implements OnInit{
  id : number = 0;
  name : string = '';
  saving = false;

  constructor(private categoryService:CategoryService, private toastr:ToastrService, private router:Router, private activatedRoute: ActivatedRoute){}

  get isEdit(){
    return this.id != 0;
  }

  ngOnInit(): void {
    this.getCategoryById();
  }

  addCategory(){
    if (this.saving) {
      return;
    }
    this.saving = true;
    let category = new Category(this.id,this.name.trim());
    this.categoryService.createCategory(category).subscribe({
      next: () => {
        this.toastr.success(this.isEdit ? 'Categoría actualizada correctamente' : 'Categoría registrada correctamente','Categorías');
        this.router.navigate(['admin/category']);
      },
      error: () => {
        this.saving = false;
        this.toastr.error('No se pudo guardar la categoría', 'Categorías');
      }
    });
  }

  getCategoryById(){
    this.activatedRoute.params.subscribe(
      category =>{
        let id = category['id'];
        if(id){
          this.categoryService.getCategoryById(id).subscribe(
            data =>{
              this.id = data.id;
              this.name = data.name;
            }

          );
        }
      }

    );
  }

}
