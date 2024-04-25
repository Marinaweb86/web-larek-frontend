import './scss/styles.scss';
import { API_URL } from './utils/constants';
import { cloneTemplate, ensureElement } from './utils/utils';
import { Page } from './components/Page';
import { Api } from './components/base/api';
import { ApiResponse, IOrderData } from './types';
import { EventEmitter } from './components/base/events';
import { Modal } from './components/common/Modal';
import { CatalogItem, CatalogItemPreview } from './components/Card';
import { Product, AppState } from './components/AppData';
import { ApiListResponse,IOrder, ICard } from './types';
import { Basket, CatalogItemBasket } from './components/common/Basket';
import { Order } from './components/Order';
import { Contacts } from './components/Contacts';
import { Success } from './components/common/Success';

const api = new Api(API_URL);
const events = new EventEmitter();

// Все шаблоны
const catalogProductTemplate =
  ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success')

const AppData = new AppState({}, events);

// Глобальные контейнеры
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

const basket = new Basket('basket', cloneTemplate(basketTemplate), events);
const order = new Order('order', cloneTemplate(orderTemplate), events)
const contacts = new Contacts(cloneTemplate(contactsTemplate), events);
const success = new Success('order-success', cloneTemplate(successTemplate), {
  onClick: () => {
    events.emit('modal:close')
    modal.close()
  }
})

api
  .get('/product')
  .then((res: ApiResponse) => {
    AppData.setCatalog(res.items as ICard[]);
  })
  .catch((err) => {
    console.error(err);
  });

events.on('items:changed', () => {
  page.catalog = AppData.catalog.map((item) => {
    const product = new CatalogItem(cloneTemplate(catalogProductTemplate), {
      onClick: () => events.emit('card:select', item),
    });
    return product.render({
      id: item.id,
      title: item.title,
      image: item.image,
      category: item.category,
      price: item.price,
    });
  });
});

events.on('card:select', (item: Product) => {
  page.locked = true;
  const product = new CatalogItemPreview(cloneTemplate(cardPreviewTemplate), {
    onClick: () => {
      events.emit('card:toBasket', item)
    },
  });
  modal.render({
    content: product.render({
      id: item.id,
      title: item.title,
      image: item.image,
      category: item.category,
      description: item.description,
      price: item.price,
      selected: item.selected
    }),
  });
});

events.on('card:toBasket', (item: Product) => {
  item.selected = true;
  AppData.addToBasket(item);
  page.counter = AppData.getBasketTotal();
  modal.close();
})

events.on('basket:open', () => {
  page.locked = true
  const basketItems = AppData.basket.map((item, index) => {
    const catalogItem = new CatalogItemBasket(
      'card',
      cloneTemplate(cardBasketTemplate),
      {
        onClick: () => events.emit('basket:delete', item)
      }
    );
    return catalogItem.render({
      title: item.title,
      price: item.price,
      index: index + 1,
    });
  });
  modal.render({
    content: basket.render({
      list: basketItems,
      price: AppData.getTotal(),
    }),
  });
});

events.on('basket:delete', (item: Product) => {
  AppData.deleteFromBasket(item.id);
  item.selected = false;
  basket.price = AppData.getTotal();
  page.counter = AppData.getBasketTotal();
  basket.refreshIndices();
  if (!AppData.basket.length) {
    basket.disableButton();
  }
})

events.on('basket:order', () => {
  modal.render({
    content: order.render(
      {
        address: '',
        valid: false,
        errors: []
      }
    ),
  });
});

events.on('orderFormErrors:change', (errors: Partial<IOrder>) => {
  const { payment, address } = errors;
  order.valid = !payment && !address;
  order.errors = Object.values({ payment, address }).filter(i => !!i).join('; ');
});

events.on('contactsFormErrors:change', (errors: Partial<IOrder>) => {
  const { email, phone } = errors;
  contacts.valid = !email && !phone;
  contacts.errors = Object.values({ phone, email }).filter(i => !!i).join('; ');
});

events.on('orderInput:change', (data: { field: keyof IOrderData, value: string }) => {
  AppData.setOrderField(data.field, data.value);
});

events.on('order:submit', () => {
  AppData.order.total = AppData.getTotal()
  AppData.setItems();
  modal.render({
    content: contacts.render(
      {
        valid: false,
        errors: []
      }
    ),
  });
})

events.on('contacts:submit', () => {
  api.post('/order', AppData.order)
    .then((res) => {
      events.emit('order:success', res);
      AppData.clearBasket();
      AppData.refreshOrder();
      order.disableButtons();
      page.counter = 0;
      AppData.resetSelected();
    })
    .catch((err) => {
      console.log(err)
    })
})

events.on('order:success', (res: ApiListResponse<string>) => {
  modal.render({
    content: success.render({
      description: res.total
    })
  })
})

events.on('modal:close', () => {
  page.locked = false;
  AppData.refreshOrder();
});