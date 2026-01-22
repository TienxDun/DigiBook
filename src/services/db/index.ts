/**
 * @file db.ts
 * @description Facade service for Firestore database interactions. 
 * This file aggregates functionality from modular sub-services for better maintainability.
 */

import * as core from './core';
import * as books from './books';
import * as metadata from './metadata';
import * as orders from './orders';
import * as users from './users';
import * as coupons from './coupons';
import * as reviews from './reviews';
import * as system from './system';
import * as ai from './ai';

import { Order, OrderItem, Review, SystemLog } from '../../types';

class DataService {
  // Core & Base Utility
  logActivity = core.logActivity;
  testConnection = core.testConnection;

  // Books
  getBooks = books.getBooks;
  getBooksPaginated = books.getBooksPaginated;
  getBookById = books.getBookById;
  getBooksByIds = books.getBooksByIds;
  getRelatedBooks = books.getRelatedBooks;
  saveBook = books.saveBook;
  updateBook = books.updateBook;
  deleteBook = books.deleteBook;
  deleteBooksBulk = books.deleteBooksBulk;
  // fetchBooksFromGoogle = books.fetchBooksFromGoogle; // Deprecated
  searchBooksFromTiki = books.searchBooksFromTiki;
  getBookDetailsFromTiki = books.getBookDetailsFromTiki;
  fetchBookByISBN = books.fetchBookByISBN;

  // Metadata (Categories, Authors, Seed)
  getCategories = metadata.getCategories;
  getAuthors = metadata.getAuthors;
  saveAuthor = metadata.saveAuthor;
  deleteAuthor = metadata.deleteAuthor;
  saveCategory = metadata.saveCategory;
  deleteCategory = metadata.deleteCategory;
  deleteAuthorsBulk = metadata.deleteAuthorsBulk;
  deleteCategoriesBulk = metadata.deleteCategoriesBulk;
  seedDatabase = metadata.seedDatabase;
  saveBooksBatch = metadata.saveBooksBatch;

  // Orders & Transactions
  createOrder = orders.createOrder;
  getOrdersByUserId = orders.getOrdersByUserId;
  checkIfUserPurchasedBook = orders.checkIfUserPurchasedBook;
  getOrderWithItems = orders.getOrderWithItems;
  updateOrderStatus = orders.updateOrderStatus;
  syncUserCart = orders.syncUserCart;
  getUserCart = orders.getUserCart;

  // Users & Profiles
  getUserProfile = users.getUserProfile;
  updateUserProfile = users.updateUserProfile;
  updateWishlist = users.updateWishlist;
  getAllUsers = users.getAllUsers;
  updateUserRole = users.updateUserRole;
  updateUserStatus = users.updateUserStatus;
  deleteUser = users.deleteUser;

  // Coupons
  validateCoupon = coupons.validateCoupon;
  getCoupons = coupons.getCoupons;
  saveCoupon = coupons.saveCoupon;
  deleteCoupon = coupons.deleteCoupon;
  incrementCouponUsage = coupons.incrementCouponUsage;

  // Reviews
  getReviewsByBookId = reviews.getReviewsByBookId;
  addReview = reviews.addReview;

  // System & Admin Config
  getSystemLogs = system.getSystemLogs;
  getAIConfig = system.getAIConfig;
  updateAIConfig = system.updateAIConfig;
  getAIModels = system.getAIModels;
  addAIModel = system.addAIModel;
  updateAIModelInfo = system.updateAIModelInfo;
  deleteAIModel = system.deleteAIModel;
  syncAIModels = system.syncAIModels;

  // AI Insights
  getAIInsight = ai.getAIInsight;
  getAuthorAIInsight = ai.getAuthorAIInsight;
  getAIInsights = ai.getAIInsights;
  getPersonalizedRecommendations = ai.getPersonalizedRecommendations;
  chatWithAI = ai.chatWithAI;
  fetchGroqModels = ai.fetchGroqModels;

  constructor() {
    // Tự động kiểm tra kết nối khi khởi tạo
    this.testConnection();
  }
}

export const db = new DataService();

export type { Order, OrderItem, Review, SystemLog };
