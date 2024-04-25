import {Model} from "../components/base/Model";
import{ICard,IAppState,IOrder,FormErrors, IOrderData} from '../types';

export class Product extends Model<ICard> {
  id: string;
	description: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
  selected: boolean;
}

export class AppState extends Model<IAppState> {
  catalog: Product[];
  preview: string; 
  basket: Product[]=[];
  order: IOrder = {
    items: [],
    payment: '',
    total: null,
    address: '',
    email: '',
    phone: '',
};
    formErrors: FormErrors = {};

    addToBasket(value: Product) {
      this.basket.push(value);
    }

    deleteFromBasket(id: string) {
     this.basket = this.basket.filter(item => item.id !== id)
    }

    clearBasket() {
      this.basket.length = 0;
    }

    getBasketTotal() {
      return this.basket.length;
    }

    setItems() {
      this.order.items = this.basket.map(item =>item.id)
    }

    setOrderField(field: keyof IOrderData, value: string) {
      this.order[field] = value;

      if (this.validateContacts()) {
        this.events.emit('contacts:ready', this.order)
      }

      if (this.validateOrder()) {
          this.events.emit('order:ready', this.order);
      }
  }

  validateOrder() {
    const errors: typeof this.formErrors = {};
    if (!this.order.address) {
        errors.address = 'Необходимо указать адрес';
    }
    if (!this.order.payment) {
        errors.payment = 'Необходимо указать способ оплаты';
    }
    this.formErrors = errors;
    this.events.emit('formErrors:change', this.formErrors);
    return Object.keys(errors).length === 0;
}

validateContacts() {
  const errors: typeof this.formErrors = {};
  if (!this.order.email) {
      errors.email = 'Необходимо указать email';
  }
  if (!this.order.phone) {
      errors.phone = 'Необходимо указать телефон';
  }
  
  this.formErrors = errors;
  this.events.emit('formErrors:change', this.formErrors);
  return Object.keys(errors).length === 0;
}

refreshOrder() {
  this.order = {
    items: [],
    total: null,
    address: '',
    email: '',
    phone: '',
    payment: ''
  };
}

getTotal() {
  return this.basket.reduce((sum, next) => sum + next.price, 0);
}
 setCatalog (items: ICard[]){
  this.catalog = items.map(item => new Product(item, this.events));
  this.emitChanges('items:changed', { catalog: this.catalog });
 }

 resetSelected() {
  this.catalog.forEach(item => item.selected = false)
}

}
