# Tea वृक्ष POS System

A modern Point of Sale (POS) system designed for tea and coffee shops, supporting both dine-in and take-out operations.

## Features

### 🍽️ Dine-in Service
- **Service Type Selection**: Choose between Dine-in and Take-out modes
- **Table Management**: Assign orders to specific table numbers
- **Bill Generation**: Generate bills for dine-in customers
- **Bill Printing**: Print professional bills with itemized details
- **Payment Processing**: Process payments after bill generation

### 📦 Take-out Service
- **Quick Checkout**: Streamlined process for take-out orders
- **Receipt Printing**: Print receipts with payment details
- **Multiple Payment Methods**: Support for Cash, Credit/Debit Card, and Mobile Payment

### 🛍️ General Features
- **Product Management**: Add, edit, and delete menu items
- **Category Organization**: Organize products by categories
- **Order History**: Complete sales history with search functionality
- **User Authentication**: Role-based access (Admin/Cashier)
- **Modern UI**: Clean, Square POS-inspired interface

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FinalPOS
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd ../backend
   npm start
   ```
   The backend will run on `http://localhost:4000`

5. **Start the frontend development server**
   ```bash
   cd ../frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Default Login Credentials

- **Admin User**: 
  - Username: `admin`
  - Password: `admin123`
- **Cashier User**:
  - Username: `cashier`
  - Password: `cashier123`

## Usage

### Dine-in Orders
1. Select "🍽️ Dine-in" service type
2. Enter the table number
3. Add items to the cart
4. Click "📄 Generate Bill" to create a bill for the customer
5. Print the bill and give it to the customer
6. When customer is ready to pay, click "💳 Pay Bill"
7. Process payment and complete the order

### Take-out Orders
1. Select "📦 Take-out" service type
2. Add items to the cart
3. Click "💳 Checkout" to process payment immediately
4. Print receipt and complete the order

### Product Management (Admin Only)
1. Navigate to "Menu Management" tab
2. Add new products with images, prices, and categories
3. Edit existing products
4. Delete products as needed

### Sales History
1. Navigate to "Sales History" tab
2. View all completed orders
3. Search by table number or product name
4. View order details and print receipts
5. Edit orders (Admin only)
6. Process refunds (Admin only)

## Database Schema

The system uses SQLite with the following main tables:

- **users**: User authentication and roles
- **products**: Menu items with images and pricing
- **orders**: Order records with service type, table numbers, and payment details

## Technology Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Authentication**: bcryptjs for password hashing
- **Styling**: Custom CSS with modern design principles

## License

This project is licensed under the MIT License. # Updated Fri Aug  1 09:41:25 PDT 2025
