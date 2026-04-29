import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ProductsComponent } from './components/products/products';
import { ProductDetailComponent } from './components/product-detail/product-detail';
import { CartComponent } from './components/cart/cart';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Kavya Creations — Handcrafted Jewellery' },
  { path: 'products', component: ProductsComponent, title: 'Shop — Kavya Creations' },
  { path: 'products/:id', component: ProductDetailComponent, title: 'Product — Kavya Creations' },
  { path: 'cart', component: CartComponent, title: 'Cart — Kavya Creations' },
  { path: '**', redirectTo: '' }
];
