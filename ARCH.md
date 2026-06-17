# ARCH.md

# Project Architecture Document

## Project Overview

This project is a full-stack E-Commerce platform built using modern web technologies.

Technology Stack:

* Next.js
* TypeScript
* Tailwind CSS
* Prisma ORM
* NextAuth
* Role Based Access Control (RBAC)

The architecture is considered **stable and production-ready**.

This document defines architectural constraints that must not be violated during future development.

---

# Architecture Stability Rules

The following systems are considered core architecture.

These systems may be extended but must not be replaced or fundamentally altered:

* Authentication
* Authorization
* Session Management
* Database Models
* Middleware Protection
* Routing Structure
* Admin Access Control

UI, content, branding, and design improvements are allowed.

---

# Authentication Architecture

Authentication System:

* NextAuth

Supported Roles:

* ADMIN
* CUSTOMER

Authentication Flow:

User
→ Login
→ Session Created
→ Role Attached
→ Route Access Controlled

### Restrictions

Do NOT:

* Create a second authentication system
* Replace NextAuth
* Remove RBAC
* Modify session architecture
* Create duplicate login systems
* Change role handling logic

Authentication must remain centralized.

---

# Authorization Architecture

Role-Based Access Control (RBAC)

Roles:

### ADMIN

Can access:

* Admin Dashboard
* Product Management
* Order Management
* User Management
* Settings

### CUSTOMER

Can access:

* Shop
* Cart
* Orders
* Wishlist
* Profile

Customers must never gain admin access.

---

# Route Architecture

## Public Routes

/

/shop

/product/[slug]

/login

/register

/cart

/profile

/orders

---

## Admin Routes

/admin/login

/admin/dashboard

/admin/products

/admin/orders

/admin/users

/admin/settings

### Protection Rules

Not Logged In:

→ Redirect to:

/admin/login

Logged In but Not Admin:

→ Redirect to:

/unauthorized

Admin:

→ Access Granted

---

# Middleware

Admin routes are protected through middleware.

Middleware Responsibilities:

* Session Validation
* Authentication Verification
* Role Verification
* Redirect Handling

### Restrictions

Do NOT:

* Remove middleware
* Bypass middleware
* Replace middleware protection

---

# Database Architecture

Prisma is the single source of truth.

Core Models:

### User

Stores:

* Account Information
* Authentication Data
* Role Information

### Product

Stores:

* Product Details
* Pricing
* Images
* Inventory

### Category

Stores:

* Product Categories

### Order

Stores:

* Customer Orders
* Order Status

### OrderItem

Stores:

* Product Line Items

### Wishlist

Stores:

* Customer Saved Products

---

# Database Rules

Allowed:

* Add new fields
* Add indexes
* Add relations
* Add optimization tables

Not Allowed:

* Rename existing models
* Remove existing models
* Break existing relations
* Change primary keys
* Delete core fields

All changes must be backward compatible.

---

# Existing Functional Modules

Completed Features:

### Authentication

* Login
* Registration
* Session Management

### Customer Features

* Product Browsing
* Wishlist
* Cart
* Checkout
* Order Tracking
* Profile Management

### Admin Features

* Dashboard
* Product Management
* Order Management
* User Management

### Security

* Route Protection
* Role Validation
* Session Verification

These modules must remain functional after future updates.

---

# UI and Design Policy

Allowed:

* Rebranding
* UI Redesign
* Layout Improvements
* Animation
* New Components
* Better UX
* Mobile Optimization

Not Allowed:

* Architectural Changes
* Route Changes
* Authentication Changes
* Authorization Changes
* Breaking Existing Features

Design can evolve.

Architecture must remain stable.

---

# Development Principle

Architecture First.

Business Logic Second.

UI Third.

Every future update must preserve:

* Authentication Integrity
* Role Security
* Route Structure
* Database Consistency
* Existing Functionality

No change should break previously working features.

End of Document.
