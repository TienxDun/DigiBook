/**
 * @file db.ts
 * @description Facade service for database interactions.
 * This file uses adapters to route to either API backend or Firebase based on configuration.
 */

import * as core from './core';
import * as books from './modules/books.service';
import * as metadata from './modules/metadata.service';
import * as orders from './modules/orders.service';
import * as users from './modules/users.service';
import * as coupons from './modules/coupons.service';
import * as reviews from './modules/reviews.service';
import * as system from './modules/system.service';

// Import adapters for API integration
import {
  booksService,
  usersService,
  ordersService,
  reviewsService,
  couponsService,
  categoriesService,
  authorsService,
  logsService
} from './adapter';

import { Order, OrderItem, Review, SystemLog } from '@/shared/types/';

class DataService {
  // Core & Base Utility
  logActivity = core.logActivity;
  testConnection = core.testConnection;

  // Books - Use adapter for API/Firebase routing
  getBooks = booksService.getBooks;
  getBooksPaginated = booksService.getBooksPaginated;
  getBookById = booksService.getBookById;
  getBookBySlug = booksService.getBookBySlug;
  getBooksByAuthor = booksService.getBooksByAuthor;
  getRelatedBooks = booksService.getRelatedBooks;
  saveBook = booksService.saveBook;
  deleteBook = booksService.deleteBook;
  incrementBookView = booksService.incrementBookView;
  
  // Legacy Firebase-only methods (complex operations)
  getBooksByIds = books.getBooksByIds;
  updateBook = books.updateBook;
  deleteBooksBulk = books.deleteBooksBulk;
  searchBooksFromTiki = books.searchBooksFromTiki;
  getBookDetailsFromTiki = books.getBookDetailsFromTiki;
  getRawTikiData = books.getRawTikiData;

  // Categories - Use adapter for API/Firebase routing
  getCategories = categoriesService.getAllCategories;
  getCategoryByName = categoriesService.getCategoryByName;
  createCategory = categoriesService.createCategory;
  updateCategory = categoriesService.updateCategory;
  deleteCategory = categoriesService.deleteCategory;
  
  // Legacy Firebase-only methods
  saveCategory = metadata.saveCategory;
  deleteCategoriesBulk = metadata.deleteCategoriesBulk;

  // Authors - Use adapter for API/Firebase routing
  getAuthors = authorsService.getAllAuthors;
  getAuthorById = authorsService.getAuthorById;
  searchAuthorsByName = authorsService.searchAuthorsByName;
  createAuthor = authorsService.createAuthor;
  updateAuthor = authorsService.updateAuthor;
  deleteAuthor = authorsService.deleteAuthor;
  
  // Legacy Firebase-only methods
  getAuthorByName = metadata.getAuthorByName;
  saveAuthor = metadata.saveAuthor;
  deleteAuthorsBulk = metadata.deleteAuthorsBulk;

  // Orders - Use adapter for API/Firebase routing
  createOrder = ordersService.createOrder;
  getOrdersByUserId = ordersService.getUserOrders;
  getOrderWithItems = ordersService.getOrderById;
  updateOrderStatus = ordersService.updateOrderStatus;
  
  // Legacy Firebase-only methods
  checkIfUserPurchasedBook = orders.checkIfUserPurchasedBook;
  syncUserCart = orders.syncUserCart;
  getUserCart = orders.getUserCart;

  // Users - Use adapter for API/Firebase routing
  getUserProfile = usersService.getUserProfile;
  updateUserProfile = usersService.updateUserProfile;
  updateWishlist = usersService.updateWishlist;
  
  // Legacy Firebase-only methods
  getAllUsers = users.getAllUsers;
  updateUserRole = users.updateUserRole;
  updateUserStatus = users.updateUserStatus;
  deleteUser = users.deleteUser;
  addUserAddress = users.addUserAddress;
  updateUserAddress = users.updateUserAddress;
  removeUserAddress = users.removeUserAddress;
  setDefaultAddress = users.setDefaultAddress;

  // Coupons - Use adapter for API/Firebase routing
  getCoupons = couponsService.getAllCoupons;
  getCouponByCode = couponsService.getCouponByCode;
  getActiveCoupons = couponsService.getActiveCoupons;
  validateCoupon = couponsService.validateCoupon;
  saveCoupon = couponsService.createCoupon;
  deleteCoupon = couponsService.deleteCoupon;
  incrementCouponUsage = couponsService.incrementCouponUsage;

  // Reviews - Use adapter for API/Firebase routing
  getReviewsByBookId = reviewsService.getReviewsByBookId;
  getReviewsByUserId = reviewsService.getReviewsByUserId;
  getAverageRating = reviewsService.getAverageRating;
  addReview = reviewsService.addReview;
  updateReview = reviewsService.updateReview;
  deleteReview = reviewsService.deleteReview;

  // System Logs - Use adapter for API/Firebase routing
  getSystemLogs = logsService.getAllLogs;
  getLogsByStatus = logsService.getLogsByStatus;
  getLogsByUser = logsService.getLogsByUser;
  getLogsByAction = logsService.getLogsByAction;
  getLogStatistics = logsService.getLogStatistics;
  getRecentLogs = logsService.getRecentLogs;
  deleteOldLogs = logsService.deleteOldLogs;

  constructor() {
    // Tự động kiểm tra kết nối khi khởi tạo
    this.testConnection();
  }
}

export const db = new DataService();

export type { Order, OrderItem, Review, SystemLog };
