// The fixed seed data - company, users, customers, products.
// The orders aren't hard-coded here; seed.js builds them with the real
// calc functions so the totals always match what the app would produce.

export const company = {
  name: 'Sayed Kaif Medical Distribution',
  address: 'Building 12, Al Khuwair, Muscat, Oman',
  phone: '+968 2400 0000',
  email: 'akhibsayed85@gmail.com',
  vatPercent: 5,
  currency: 'OMR',
};

export const users = [
  { name: 'Sayed Kaif', email: 'akhibsayed85@gmail.com', role: 'super_admin', phone: '+968 9000 0001' },
  // owner points at a real inbox so the order emails actually land somewhere
  { name: 'Sayed Kaif', email: 'akhibsayed85@gmail.com', role: 'company_owner', phone: '+968 9000 0002' },
  { name: 'Rahul Sharma', email: 'rahul@gmail.com', role: 'sales_manager', phone: '+968 9000 0003' },
  { name: 'Imran Qureshi', email: 'imran.sales@gmail.com', role: 'sales_person', phone: '+968 9000 0004' },
  { name: 'Sana Pervin', email: 'sana.sales@gmail.com', role: 'sales_person', phone: '+968 9000 0005' },
  { name: 'Kaif', email: 'kaif.sales@gmail.com', role: 'sales_person', phone: '+968 9000 0006' },
];

// made-up customers, all around Muscat
export const customers = [
  {
    customerCode: 'CUST-001',
    customerName: 'Al Noor Pharmacy',
    contactPerson: 'Ahmed Al Balushi',
    mobileNumber: '+968 9412 3344',
    email: 'alnoor@example.com',
    address: { country: 'Oman', city: 'Muscat', area: 'Ruwi', zipcode: '112', googleMapUrl: 'https://maps.google.com/?q=23.5880,58.4080' },
    creditLimit: 5000,
    outstandingAmount: 250,
    status: 'active',
  },
  {
    customerCode: 'CUST-002',
    customerName: 'Muscat Care Pharmacy',
    contactPerson: 'Said Al Harthy',
    mobileNumber: '+968 9255 7788',
    email: 'muscatcare@example.com',
    address: { country: 'Oman', city: 'Muscat', area: 'Al Khuwair', zipcode: '133', googleMapUrl: 'https://maps.google.com/?q=23.5870,58.4180' },
    creditLimit: 3000,
    outstandingAmount: 0,
    status: 'active',
  },
  {
    customerCode: 'CUST-003',
    customerName: 'Al Waha Medical Store',
    contactPerson: 'Mona Al Lawati',
    mobileNumber: '+968 9633 2211',
    email: 'alwaha@example.com',
    address: { country: 'Oman', city: 'Muscat', area: 'Qurum', zipcode: '113', googleMapUrl: 'https://maps.google.com/?q=23.6110,58.4700' },
    creditLimit: 4000,
    outstandingAmount: 500,
    status: 'active',
  },
  {
    customerCode: 'CUST-004',
    customerName: 'Seeb Family Pharmacy',
    contactPerson: 'Hamad Al Maamari',
    mobileNumber: '+968 9477 9900',
    email: 'seebfamily@example.com',
    address: { country: 'Oman', city: 'Muscat', area: 'Seeb', zipcode: '121', googleMapUrl: 'https://maps.google.com/?q=23.6700,58.1890' },
    creditLimit: 2000,
    outstandingAmount: 120,
    status: 'active',
  },
  {
    customerCode: 'CUST-005',
    customerName: 'Al Amal Pharmacy',
    contactPerson: 'Nasser Al Rawahi',
    mobileNumber: '+968 9188 4455',
    email: 'alamal@example.com',
    address: { country: 'Oman', city: 'Muscat', area: 'Al Ghubra', zipcode: '130', googleMapUrl: 'https://maps.google.com/?q=23.5780,58.4000' },
    creditLimit: 1500,
    outstandingAmount: 0,
    status: 'inactive', // one inactive customer to test the "can't order" case
  },
  {
    customerCode: 'CUST-006',
    customerName: 'Bausher Health Pharmacy',
    contactPerson: 'Salma Al Kindi',
    mobileNumber: '+968 9722 6633',
    email: 'bausher@example.com',
    address: { country: 'Oman', city: 'Muscat', area: 'Bausher', zipcode: '118', googleMapUrl: 'https://maps.google.com/?q=23.5850,58.3900' },
    creditLimit: 3500,
    outstandingAmount: 0,
    status: 'active',
  },
];

// 20 products - a few generics with multiple brands, some with FOC offers
export const products = [
  // --- Paracetamol family (variations + alternative brands) ---
  { productCode: 'PRD-001', productName: 'Panadol 500mg Tablet', genericName: 'Paracetamol', brand: 'Panadol', category: 'Analgesic', variation: '500mg Tablet', stockQuantity: 500, sellingPrice: 0.800, discountPercentage: 5, focBuyQuantity: 10, focFreeQuantity: 1, status: 'active' },
  { productCode: 'PRD-002', productName: 'Panadol 650mg Tablet', genericName: 'Paracetamol', brand: 'Panadol', category: 'Analgesic', variation: '650mg Tablet', stockQuantity: 300, sellingPrice: 1.000, discountPercentage: 5, focBuyQuantity: 10, focFreeQuantity: 1, status: 'active' },
  { productCode: 'PRD-003', productName: 'Calpol Syrup 120ml', genericName: 'Paracetamol', brand: 'Calpol', category: 'Analgesic', variation: 'Syrup', stockQuantity: 150, sellingPrice: 1.500, discountPercentage: 0, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },
  // kept inactive so we can test ordering an inactive product
  { productCode: 'PRD-004', productName: 'Fevadol Drops 15ml', genericName: 'Paracetamol', brand: 'Fevadol', category: 'Analgesic', variation: 'Drops', stockQuantity: 90, sellingPrice: 1.200, discountPercentage: 10, focBuyQuantity: 0, focFreeQuantity: 0, status: 'inactive' },

  // --- Amoxicillin family ---
  { productCode: 'PRD-005', productName: 'Amoxil 250mg Capsule', genericName: 'Amoxicillin', brand: 'Amoxil', category: 'Antibiotic', variation: '250mg Capsule', stockQuantity: 400, sellingPrice: 2.000, discountPercentage: 5, focBuyQuantity: 12, focFreeQuantity: 1, status: 'active' },
  { productCode: 'PRD-006', productName: 'Amoxil 500mg Capsule', genericName: 'Amoxicillin', brand: 'Amoxil', category: 'Antibiotic', variation: '500mg Capsule', stockQuantity: 250, sellingPrice: 3.200, discountPercentage: 5, focBuyQuantity: 12, focFreeQuantity: 1, status: 'active' },
  { productCode: 'PRD-007', productName: 'Moxclass 500mg Capsule', genericName: 'Amoxicillin', brand: 'Moxclass', category: 'Antibiotic', variation: '500mg Capsule', stockQuantity: 0, sellingPrice: 2.900, discountPercentage: 0, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },

  // --- Ibuprofen family ---
  { productCode: 'PRD-008', productName: 'Brufen 400mg Tablet', genericName: 'Ibuprofen', brand: 'Brufen', category: 'Analgesic', variation: '400mg Tablet', stockQuantity: 350, sellingPrice: 1.100, discountPercentage: 5, focBuyQuantity: 10, focFreeQuantity: 1, status: 'active' },
  { productCode: 'PRD-009', productName: 'Advil 200mg Tablet', genericName: 'Ibuprofen', brand: 'Advil', category: 'Analgesic', variation: '200mg Tablet', stockQuantity: 220, sellingPrice: 0.950, discountPercentage: 0, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },

  // --- Omeprazole family ---
  { productCode: 'PRD-010', productName: 'Losec 20mg Capsule', genericName: 'Omeprazole', brand: 'Losec', category: 'Gastro', variation: '20mg Capsule', stockQuantity: 180, sellingPrice: 4.500, discountPercentage: 10, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },
  { productCode: 'PRD-011', productName: 'Omez 20mg Capsule', genericName: 'Omeprazole', brand: 'Omez', category: 'Gastro', variation: '20mg Capsule', stockQuantity: 200, sellingPrice: 3.800, discountPercentage: 5, focBuyQuantity: 10, focFreeQuantity: 1, status: 'active' },

  // --- Cetirizine family ---
  { productCode: 'PRD-012', productName: 'Zyrtec 10mg Tablet', genericName: 'Cetirizine', brand: 'Zyrtec', category: 'Antihistamine', variation: '10mg Tablet', stockQuantity: 260, sellingPrice: 1.800, discountPercentage: 5, focBuyQuantity: 10, focFreeQuantity: 1, status: 'active' },
  { productCode: 'PRD-013', productName: 'Cetzine Syrup 60ml', genericName: 'Cetirizine', brand: 'Cetzine', category: 'Antihistamine', variation: 'Syrup', stockQuantity: 140, sellingPrice: 1.600, discountPercentage: 0, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },

  // --- Others ---
  { productCode: 'PRD-014', productName: 'Glucophage 500mg Tablet', genericName: 'Metformin', brand: 'Glucophage', category: 'Antidiabetic', variation: '500mg Tablet', stockQuantity: 300, sellingPrice: 2.400, discountPercentage: 5, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },
  { productCode: 'PRD-015', productName: 'Redoxon Vitamin C 1000mg', genericName: 'Ascorbic Acid', brand: 'Redoxon', category: 'Supplement', variation: '1000mg Effervescent', stockQuantity: 320, sellingPrice: 2.700, discountPercentage: 10, focBuyQuantity: 6, focFreeQuantity: 1, status: 'active' },
  { productCode: 'PRD-016', productName: 'Augmentin 625mg Tablet', genericName: 'Amoxicillin Clavulanate', brand: 'Augmentin', category: 'Antibiotic', variation: '625mg Tablet', stockQuantity: 160, sellingPrice: 5.500, discountPercentage: 5, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },
  { productCode: 'PRD-017', productName: 'Ventolin Inhaler 100mcg', genericName: 'Salbutamol', brand: 'Ventolin', category: 'Respiratory', variation: 'Inhaler', stockQuantity: 130, sellingPrice: 3.300, discountPercentage: 0, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },
  { productCode: 'PRD-018', productName: 'ORS Sachet (Pack of 10)', genericName: 'Oral Rehydration Salts', brand: 'Pedialyte', category: 'Supplement', variation: 'Sachet', stockQuantity: 600, sellingPrice: 0.600, discountPercentage: 0, focBuyQuantity: 20, focFreeQuantity: 2, status: 'active' },
  { productCode: 'PRD-019', productName: 'Voltaren 50mg Tablet', genericName: 'Diclofenac', brand: 'Voltaren', category: 'Analgesic', variation: '50mg Tablet', stockQuantity: 210, sellingPrice: 2.100, discountPercentage: 5, focBuyQuantity: 10, focFreeQuantity: 1, status: 'active' },
  // active but zero stock - lets us test the "out of stock" rejection
  { productCode: 'PRD-020', productName: 'Aspirin 75mg Tablet', genericName: 'Acetylsalicylic Acid', brand: 'Aspirin', category: 'Cardio', variation: '75mg Tablet', stockQuantity: 0, sellingPrice: 0.900, discountPercentage: 0, focBuyQuantity: 0, focFreeQuantity: 0, status: 'active' },
];

// rough recipes for the sample orders - seed.js looks up the real
// products/customers and the calc functions fill in all the numbers
export const orderBlueprints = [
  { customerCode: 'CUST-001', salesEmail: 'imran.sales@gmail.com', daysAgo: 25, deliveryInDays: 2, remarks: 'Monthly stock replenishment', items: [{ code: 'PRD-001', qty: 50 }, { code: 'PRD-008', qty: 20 }] },
  { customerCode: 'CUST-002', salesEmail: 'sana.sales@gmail.com', daysAgo: 22, deliveryInDays: 3, remarks: 'Urgent antibiotics', items: [{ code: 'PRD-005', qty: 24 }, { code: 'PRD-006', qty: 12 }] },
  { customerCode: 'CUST-003', salesEmail: 'imran.sales@gmail.com', daysAgo: 20, deliveryInDays: 4, remarks: '', items: [{ code: 'PRD-010', qty: 10 }, { code: 'PRD-012', qty: 20 }, { code: 'PRD-015', qty: 12 }] },
  { customerCode: 'CUST-004', salesEmail: 'sana.sales@gmail.com', daysAgo: 18, deliveryInDays: 2, remarks: 'Cold chain items', items: [{ code: 'PRD-017', qty: 15 }] },
  { customerCode: 'CUST-001', salesEmail: 'imran.sales@gmail.com', daysAgo: 15, deliveryInDays: 3, remarks: 'Discount campaign order', items: [{ code: 'PRD-002', qty: 30 }, { code: 'PRD-019', qty: 20 }] },
  { customerCode: 'CUST-002', salesEmail: 'sana.sales@gmail.com', daysAgo: 12, deliveryInDays: 5, remarks: '', items: [{ code: 'PRD-014', qty: 40 }, { code: 'PRD-018', qty: 40 }] },
  { customerCode: 'CUST-003', salesEmail: 'imran.sales@gmail.com', daysAgo: 9, deliveryInDays: 2, remarks: 'Pediatric range', items: [{ code: 'PRD-003', qty: 18 }, { code: 'PRD-013', qty: 16 }] },
  { customerCode: 'CUST-004', salesEmail: 'sana.sales@gmail.com', daysAgo: 6, deliveryInDays: 3, remarks: '', items: [{ code: 'PRD-016', qty: 10 }, { code: 'PRD-011', qty: 20 }] },
  { customerCode: 'CUST-001', salesEmail: 'imran.sales@gmail.com', daysAgo: 3, deliveryInDays: 2, remarks: 'Weekend top-up', items: [{ code: 'PRD-001', qty: 100 }, { code: 'PRD-009', qty: 25 }] },
  { customerCode: 'CUST-002', salesEmail: 'sana.sales@gmail.com', daysAgo: 1, deliveryInDays: 4, remarks: 'New branch opening', items: [{ code: 'PRD-005', qty: 36 }, { code: 'PRD-012', qty: 30 }, { code: 'PRD-019', qty: 15 }] },
];
