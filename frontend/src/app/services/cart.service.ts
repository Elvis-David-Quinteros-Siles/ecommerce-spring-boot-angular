import { Injectable } from '@angular/core';
import { ItemCart } from '../common/item-cart';

const CART_KEY = 'cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private items: Map<number,ItemCart> = new Map<number, ItemCart>();

  itemList : ItemCart [] = [];

  constructor() {
    this.restore();
  }

  // Si el producto ya esta en el carrito, suma la cantidad
  addItemCart(itemCart : ItemCart){
    const current = this.items.get(itemCart.productId);
    if (current) {
      current.quantity += itemCart.quantity;
    } else {
      this.items.set(itemCart.productId, itemCart);
    }
    this.save();
  }

  setQuantity(productId:number, quantity:number){
    const item = this.items.get(productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.save();
    }
  }

  getQuantity(productId:number){
    return this.items.get(productId)?.quantity ?? 0;
  }

  deleteItemCart(productId:number){
    this.items.delete(productId);
    this.save();
  }

  clear(){
    this.items.clear();
    this.save();
  }

  // Numero total de unidades en el carrito
  get count(){
    let count = 0;
    this.items.forEach(item => count += item.quantity);
    return count;
  }

  totalCart(){
    let totalCart:number=0;
    this.items.forEach(
      (item, clave)=>{
        totalCart+= item.getTotalPriceItem();
      }

    );
    return totalCart;
  }

  convertToListFromMap(){
    this.itemList.splice(0,this.itemList.length);
    this.items.forEach(
      (item, clave)=>{
        this.itemList.push(item);
      }

    );
    return this.itemList;
  }

  private save(){
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(Array.from(this.items.values())));
    } catch { /* almacenamiento no disponible */ }
  }

  private restore(){
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        (JSON.parse(raw) as ItemCart[]).forEach(i =>
          this.items.set(i.productId, new ItemCart(i.productId, i.productName, i.quantity, i.price, i.urlImage))
        );
      }
    } catch { /* carrito corrupto o almacenamiento no disponible */ }
  }

}
