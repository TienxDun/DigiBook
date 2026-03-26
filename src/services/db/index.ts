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
  logsService,
  cartsService
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
  
  // Adapter integrated methods
  getBooksByIds = booksService.getBooksByIds;
  updateBook = booksService.updateBook;
  deleteBooksBulk = booksService.deleteBooksBulk;

  // Legacy/Special cases
  searchBooksFromTiki = books.searchBooksFromTiki;
  getBookDetailsFromTiki = books.getBookDetailsFromTiki;
  getRawTikiData = books.getRawTikiData;

  // Categories - Use adapter for API/Firebase routing
  getCategories = categoriesService.getAllCategories;
  getCategoryByName = categoriesService.getCategoryByName;
  createCategory = categoriesService.createCategory;
  updateCategory = categoriesService.updateCategory;
  deleteCategory = categoriesService.deleteCategory;
  saveCategory = categoriesService.saveCategory;
  deleteCategoriesBulk = categoriesService.deleteCategoriesBulk;

  // Authors - Use adapter for API/Firebase routing
  getAuthors = authorsService.getAllAuthors;
  getAuthorById = authorsService.getAuthorById;
  searchAuthorsByName = authorsService.searchAuthorsByName;
  createAuthor = authorsService.createAuthor;
  updateAuthor = authorsService.updateAuthor;
  deleteAuthor = authorsService.deleteAuthor;
  saveAuthor = authorsService.saveAuthor;
  deleteAuthorsBulk = authorsService.deleteAuthorsBulk;
  
  // Legacy methods
  getAuthorByName = metadata.getAuthorByName;

  // Orders - Use adapter for API/Firebase routing
  createOrder = ordersService.createOrder;
  getOrdersByUserId = ordersService.getUserOrders;
  getOrderWithItems = ordersService.getOrderById;
  updateOrderStatus = ordersService.updateOrderStatus;

  // Orders/Cart - Use adapter for API/Firebase routing
  checkIfUserPurchasedBook = ordersService.checkIfUserPurchasedBook;
  syncUserCart = cartsService.syncUserCart;
  getUserCart = cartsService.getUserCart;

  // Users - Use adapter for API/Firebase routing
  getUserProfile = usersService.getUserProfile;
  updateUserProfile = usersService.updateUserProfile;
  updateWishlist = usersService.updateWishlist;
  createTelegramLinkToken = usersService.createTelegramLinkToken;
  getTelegramLinkStatus = usersService.getTelegramLinkStatus;
  unlinkTelegram = usersService.unlinkTelegram;
  getAllUsers = usersService.getAllUsers;
  updateUserRole = usersService.updateUserRole;
  updateUserStatus = usersService.updateUserStatus;
  deleteUser = usersService.deleteUser;
  
  // User Address methods (currently Firebase only, can be added to adapter if API supports)
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
