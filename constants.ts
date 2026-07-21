
import { Product, Sale } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Café Espresso',
    category: 'Bebidas',
    price: 5.50,
    // Fix: Added required costPrice property
    costPrice: 3.30,
    stock: 50,
    description: 'Café espresso encorpado feito com grãos selecionados.',
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=200&h=200&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Croissant de Manteiga',
    category: 'Padaria',
    price: 8.90,
    // Fix: Added required costPrice property
    costPrice: 5.34,
    stock: 20,
    description: 'Croissant folhado e amanteigado, receita tradicional francesa.',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=200&h=200&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Suco de Laranja 300ml',
    category: 'Bebidas',
    price: 7.00,
    // Fix: Added required costPrice property
    costPrice: 4.20,
    stock: 30,
    description: 'Suco natural de laranja, espremido na hora.',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=200&h=200&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Bolo de Chocolate',
    category: 'Sobremesas',
    price: 12.00,
    // Fix: Added required costPrice property
    costPrice: 7.20,
    stock: 12,
    description: 'Fatia de bolo de chocolate com cobertura de brigadeiro.',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&h=200&auto=format&fit=crop'
  }
];

export const INITIAL_SALES: Sale[] = [];

export const CATEGORIES: string[] = ['Bebidas', 'Padaria', 'Sobremesas', 'Lanches'];
