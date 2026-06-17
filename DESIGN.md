# DESIGN.md

## Objective

Polish the UI without changing functionality.

The goal is:

Modern
Professional
Minimal
Bookstore-focused

Inspired by:

* Shopify
* Stripe
* Vercel
* Notion
* Amazon Books

---

## Design Principles

* Clean spacing
* Consistent typography
* Better hierarchy
* Better cards
* Better tables
* Better forms

Do NOT redesign workflows.

---

## Icons

Use Lucide React icons.

Examples:

Books
ShoppingCart
User
Package
Settings
LayoutDashboard
Search
Trash
Edit
Plus

Replace plain text actions with icons where appropriate.

---

## Colors

Current dark theme should remain.

Improve:

* Contrast
* Borders
* Hover states
* Active states

Do not change branding.

---

## Admin Dashboard

Improve:

* Sidebar
* Cards
* Tables
* Empty States
* Statistics

Keep existing functionality.

---

## Books Page

Add:

* Better table
* Search bar
* Filters
* Add Book button
* Status badges

No backend changes.

---

## Orders Page

Improve:

* Order status badges
* Order table
* Detail view

No backend changes.

---

## Customer Side

Improve:

* Hero section
* Book cards
* Product details
* Cart
* Checkout
* Orders page

Keep existing business logic.

---

## Forbidden

Do NOT:

* Change authentication
* Change database
* Change Prisma schema
* Change routes
* Change middleware
* Change role system
* Replace libraries

Focus only on UI polish and UX improvements.
