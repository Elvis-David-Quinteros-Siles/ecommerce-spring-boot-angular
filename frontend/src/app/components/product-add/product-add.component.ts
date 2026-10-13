import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Category } from 'src/app/common/category';
import { CategoryService } from 'src/app/services/category.service';
import { ProductService } from 'src/app/services/product.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';

@Component({
  selector: 'app-product-add',
  templateUrl: './product-add.component.html',
  styleUrls: ['./product-add.component.css']
})
export class ProductAddComponent implements OnInit{
  id : number = 0;
  code : string = '';
  name : string = '';
  description : string = '';
  price : number | null = null;
  urlImage : string = '';
  userId : string = '0';
  categoryId : string = '';
  user : number = 0;

  selectFile! : File;
  preview : string | null = null;
  saving = false;
  readonly maxImageMb = 10;

  categories : Category [] = [];

  constructor(private productService : ProductService,
    private router:Router,
    private activatedRoute:ActivatedRoute,
    private toastr: ToastrService,
    private categoryService:CategoryService,
    private sessionStorage : SessionStorageService){

  }

  get isEdit(){
    return this.id != 0;
  }

  ngOnInit(): void {
    this.getCategories();
    this.getProductById();
    this.user = this.sessionStorage.getItem('token').id;
    this.userId = this.user.toString();
  }
  addProduct(){
    if (this.saving) {
      return;
    }
    this.saving = true;
    const formData = new FormData();
    formData.append('id',this.id.toString());
    formData.append('code', this.code.trim());
    formData.append('name', this.name.trim());
    formData.append('description',this.description.trim());
    formData.append('price', String(this.price ?? 0));
    if (this.selectFile) {
      formData.append('image', this.selectFile);
    }
    formData.append('urlImage', this.urlImage);
    formData.append('userId', this.userId);
    formData.append('categoryId', this.categoryId);

    this.productService.createProduct(formData).subscribe({
      next: () => {
        if(this.id==0){
          this.toastr.success('Producto registrado correctamente', 'Productos');
        }else{
          this.toastr.success('Producto actualizado correctamente', 'Productos');
        }

        this.router.navigate(['admin/product']);
      },
      error: () => {
        this.saving = false;
        this.toastr.error('No se pudo guardar el producto. Revisa los datos e inténtalo nuevamente.', 'Productos');
      }
    });

  }

  getProductById(){
    this.activatedRoute.params.subscribe(
      prod => {
        let id = prod['id'];
        if(id){
          this.productService.getProductById(id).subscribe(
            data =>{
              this.id = data.id;
              this.code = data.code;
              this.name = data.name;
              this.description = data.description;
              this.urlImage = data.urlImage;
              this.price = data.price;
              this.userId = data.userId;
              this.categoryId = String(data.categoryId);
              this.preview = data.urlImage;
            }
          );
        }

      }

    );
  }

  onFileSelected(event : any){
    const file : File | undefined = event.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.toastr.warning('Selecciona un archivo de imagen (JPG, PNG, WEBP...)', 'Imagen');
      event.target.value = '';
      return;
    }
    if (file.size > this.maxImageMb * 1024 * 1024) {
      this.toastr.warning(`La imagen no puede superar los ${this.maxImageMb} MB`, 'Imagen');
      event.target.value = '';
      return;
    }
    this.selectFile = file;
    const reader = new FileReader();
    reader.onload = () => this.preview = reader.result as string;
    reader.readAsDataURL(file);
  }

  getCategories(){
    return this.categoryService.getCategoryList().subscribe(
      data => this.categories = data
    );
  }

}
