export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  effectivePrice: number;
  stockQuantity: number;
  material?: string;
  dimensions?: string;
  weight?: string;
  status: ProductStatus;
  isFeatured: boolean;
  categoryId: string;
  categoryName: string;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  effectivePrice: number;
  discountPrice?: number;
  stockQuantity: number;
  status: ProductStatus;
  isFeatured: boolean;
  categoryName: string;
  primaryImageUrl?: string;
}

export enum ProductStatus {
  Active = 1,
  Inactive = 2,
  OutOfStock = 3,
  Discontinued = 4
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
