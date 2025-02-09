import { Injectable, inject } from '@angular/core';
import { Model, ModelFactory } from '@angular-extensions/model';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { SsrCookieService } from 'ngx-cookie-service-ssr';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  public model: Model<State>;
  cart$: Observable<State>;
  cookieService = inject(SsrCookieService);
  constructor(private modelFactory: ModelFactory<State>) {
    this.model = this.modelFactory.create({
      tutorId: '',
      items: []
    });
    this.cart$ = this.model.data$;
  }

  getCart() {
    const cart = this.model.get();
    return cart;
  }

  getTutorId() {
    const tutorId = this.model.get().tutorId;
    return tutorId;
  }

  getItemsInCart(type = '') {
    const items = this.model.get().items;
    if (type) {
      return items.filter((item: any) => item.type === type);
    }
    return items;
  }

  updateTutorId(tutorId: string) {
    const model = this.model.get();
    const newModel = { ...model, tutorId: tutorId };
    // localStorage.setItem('cartInfo', JSON.stringify(newModel));
    this.cookieService.set('cartInfo', JSON.stringify(newModel))
    this.model.set(newModel);
  }

  updateCart(item: CartItem) {
    const model = this.model.get();
    const newModel = {
      ...model,
      items: [...model.items, item]
    };
    // localStorage.setItem('cartInfo', JSON.stringify(newModel));
    this.cookieService.set('cartInfo', JSON.stringify(newModel))
    this.model.set(newModel);
  }

  updateCartInfoFromLocal(cart: State) {
    const model = this.model.get();
    const newModel = {
      ...model,
      ...cart
    };
    this.model.set(newModel);
  }

  removeItem(item: CartItem) {
    const model = this.model.get();
    const { items } = model;
    const newItems = items.filter(i => !moment(i.product.startTime).isSame(item.product.startTime));
    const newModel = {
      ...model,
      items: [...newItems]
    };
    // localStorage.setItem('cartInfo', JSON.stringify(newModel));
    this.cookieService.set('cartInfo', JSON.stringify(newModel))
    this.model.set(newModel);
  }

  removeCart() {
    const model = this.model.get();
    const newModel = {
      ...model,
      items: []
    };
    this.model.set(newModel);
  }
}

export interface CartItem {
  product: { [key: string]: any };
  price: number;
  quantity: number;
  type: string;
  couponCode: string;
  originalPrice: number;
}

export interface State {
  tutorId: string;
  items: CartItem[];
}
