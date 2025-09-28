/**
 * Test Data for Mobile Applications
 * Comprehensive test data for Android and iOS apps
 */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  vehicles: Vehicle[];
  preferences: UserPreferences;
  createdAt: string;
  lastLogin: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  userId: string;
  isPrimary: boolean;
  registeredAt: string;
}

export interface TollEvent {
  id: string;
  location: string;
  agency: string;
  agencyCode: string;
  amount: number;
  date: string;
  timestamp: string;
  vehicle: string;
  status: 'paid' | 'unpaid' | 'disputed';
  paymentMethod?: string;
  userId: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Statement {
  id: string;
  period: string;
  totalAmount: number;
  tollCount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  userId: string;
  createdAt: string;
  tolls: TollEvent[];
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  timestamp: string;
  userId: string;
  tollIds: string[];
  transactionId?: string;
}

export interface Agency {
  id: string;
  name: string;
  code: string;
  regions: string[];
  tollRates: Record<string, number>;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

export interface UserPreferences {
  notifications: boolean;
  autoPay: boolean;
  statementDelivery: 'email' | 'mail';
  language: string;
  timezone: string;
  currency: string;
}

export interface Notification {
  id: string;
  type: 'toll' | 'payment' | 'statement' | 'dispute';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  data?: any;
}

// Test Data Generation
export const generateTestData = () => {
  const agencies: Agency[] = [
    {
      id: '1',
      name: 'California Department of Transportation',
      code: 'CALDOT',
      regions: ['Northern California', 'Southern California'],
      tollRates: {
        'Golden Gate Bridge': 8.75,
        'Bay Bridge': 6.00,
        'San Mateo Bridge': 5.00,
        'Richmond Bridge': 4.00
      },
      contactInfo: {
        phone: '+1-800-427-7623',
        email: 'info@dot.ca.gov',
        website: 'https://dot.ca.gov'
      }
    },
    {
      id: '2',
      name: 'New York Metropolitan Transportation Authority',
      code: 'NYMTA',
      regions: ['New York City', 'Long Island'],
      tollRates: {
        'Verrazzano Bridge': 19.00,
        'Throgs Neck Bridge': 8.50,
        'Whitestone Bridge': 8.50,
        'Robert F. Kennedy Bridge': 8.50
      },
      contactInfo: {
        phone: '+1-718-330-1234',
        email: 'info@mta.info',
        website: 'https://mta.info'
      }
    },
    {
      id: '3',
      name: 'Florida Department of Transportation',
      code: 'FLDOT',
      regions: ['South Florida', 'Central Florida'],
      tollRates: {
        'SunPass': 2.50,
        'Alligator Alley': 3.00,
        'I-95 Express': 1.25,
        'I-75 Express': 1.50
      },
      contactInfo: {
        phone: '+1-800-352-5368',
        email: 'info@fdot.gov',
        website: 'https://fdot.gov'
      }
    }
  ];

  const locations = [
    'Golden Gate Bridge', 'Bay Bridge', 'Verrazzano Bridge',
    'Throgs Neck Bridge', 'SunPass Toll', 'Alligator Alley',
    'I-95 Express Lanes', 'I-66 Express Lanes', 'I-495 Express Lanes',
    'Dulles Toll Road', 'George Washington Bridge', 'Lincoln Tunnel',
    'Holland Tunnel', 'Queens Midtown Tunnel', 'Brooklyn Battery Tunnel'
  ];

  const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Nissan', 'Hyundai', 'Kia'];
  const models = ['Camry', 'Accord', 'F-150', 'Silverado', '3 Series', 'C-Class', 'A4', 'Altima', 'Elantra', 'Optima'];
  const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Gray', 'Green', 'Brown'];

  // Generate Users
  const users: User[] = [];
  for (let i = 1; i <= 50; i++) {
    const firstName = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Jessica'][Math.floor(Math.random() * 10)];
    const lastName = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson'][Math.floor(Math.random() * 10)];
    
    users.push({
      id: `user-${i}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${Math.floor(Math.random() * 90000) + 10000}`,
      vehicles: generateVehicles(i, makes, models, colors),
      preferences: {
        notifications: Math.random() > 0.2,
        autoPay: Math.random() > 0.7,
        statementDelivery: Math.random() > 0.5 ? 'email' : 'mail',
        language: 'en',
        timezone: 'America/New_York',
        currency: 'USD'
      },
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  // Generate Vehicles
  const vehicles: Vehicle[] = [];
  users.forEach(user => {
    user.vehicles.forEach((vehicle, index) => {
      vehicles.push({
        ...vehicle,
        userId: user.id,
        isPrimary: index === 0
      });
    });
  });

  // Generate Toll Events
  const tolls: TollEvent[] = [];
  for (let i = 1; i <= 200; i++) {
    const agency = agencies[Math.floor(Math.random() * agencies.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const amount = Math.random() * 20 + 1;
    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const user = users[Math.floor(Math.random() * users.length)];
    const vehicle = user.vehicles[Math.floor(Math.random() * user.vehicles.length)];

    tolls.push({
      id: `toll-${i}`,
      location,
      agency: agency.name,
      agencyCode: agency.code,
      amount: Math.round(amount * 100) / 100,
      date: date.toISOString().split('T')[0],
      timestamp: date.toISOString(),
      vehicle: vehicle.licensePlate,
      status: Math.random() > 0.3 ? 'paid' : 'unpaid',
      paymentMethod: Math.random() > 0.3 ? 'Visa ****1234' : undefined,
      userId: user.id,
      coordinates: {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.1
      }
    });
  }

  // Generate Statements
  const statements: Statement[] = [];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  for (let i = 0; i < 24; i++) {
    const month = months[Math.floor(Math.random() * 12)];
    const year = 2023 + Math.floor(Math.random() * 2);
    const user = users[Math.floor(Math.random() * users.length)];
    const userTolls = tolls.filter(toll => toll.userId === user.id);
    const tollCount = Math.floor(Math.random() * 10) + 1;
    const totalAmount = userTolls.slice(0, tollCount).reduce((sum, toll) => sum + toll.amount, 0);
    const dueDate = new Date(year, Math.floor(Math.random() * 12), 15);

    statements.push({
      id: `stmt-${i + 1}`,
      period: `${month} ${year}`,
      totalAmount: Math.round(totalAmount * 100) / 100,
      tollCount,
      dueDate: dueDate.toISOString().split('T')[0],
      status: Math.random() > 0.4 ? 'paid' : 'unpaid',
      userId: user.id,
      createdAt: new Date(year, Math.floor(Math.random() * 12), 1).toISOString(),
      tolls: userTolls.slice(0, tollCount)
    });
  }

  // Generate Payments
  const payments: Payment[] = [];
  for (let i = 1; i <= 100; i++) {
    const amount = Math.random() * 100 + 10;
    const date = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const user = users[Math.floor(Math.random() * users.length)];
    const methods = ['Visa ****1234', 'Mastercard ****5678', 'American Express ****9012', 'PayPal', 'Apple Pay'];

    payments.push({
      id: `payment-${i}`,
      amount: Math.round(amount * 100) / 100,
      method: methods[Math.floor(Math.random() * methods.length)],
      status: Math.random() > 0.1 ? 'completed' : 'failed',
      date: date.toISOString().split('T')[0],
      timestamp: date.toISOString(),
      userId: user.id,
      tollIds: generateTollIds(Math.floor(Math.random() * 5) + 1),
      transactionId: `TXN-${Math.floor(Math.random() * 1000000)}`
    });
  }

  // Generate Notifications
  const notifications: Notification[] = [];
  for (let i = 1; i <= 150; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const types: Notification['type'][] = ['toll', 'payment', 'statement', 'dispute'];
    const type = types[Math.floor(Math.random() * types.length)];
    const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    const notificationTemplates = {
      toll: {
        title: 'New Toll Event',
        message: 'You have a new toll event to review'
      },
      payment: {
        title: 'Payment Processed',
        message: 'Your payment has been successfully processed'
      },
      statement: {
        title: 'Statement Ready',
        message: 'Your monthly statement is now available'
      },
      dispute: {
        title: 'Dispute Update',
        message: 'Your dispute has been reviewed and resolved'
      }
    };

    notifications.push({
      id: `notif-${i}`,
      type,
      title: notificationTemplates[type].title,
      message: notificationTemplates[type].message,
      isRead: Math.random() > 0.3,
      createdAt: date.toISOString(),
      userId: user.id,
      data: { tollId: `toll-${Math.floor(Math.random() * 200) + 1}` }
    });
  }

  return {
    users,
    vehicles,
    tolls,
    statements,
    payments,
    agencies,
    notifications
  };
};

// Helper Functions
function generateVehicles(userId: number, makes: string[], models: string[], colors: string[]): Vehicle[] {
  const vehicleCount = Math.floor(Math.random() * 3) + 1;
  const vehicles: Vehicle[] = [];

  for (let i = 0; i < vehicleCount; i++) {
    const make = makes[Math.floor(Math.random() * makes.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const year = 2015 + Math.floor(Math.random() * 10);
    const color = colors[Math.floor(Math.random() * colors.length)];

    vehicles.push({
      id: `vehicle-${userId}-${i + 1}`,
      licensePlate: generateLicensePlate(),
      make,
      model,
      year,
      color,
      userId: `user-${userId}`,
      isPrimary: i === 0,
      registeredAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return vehicles;
}

function generateLicensePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let plate = '';

  for (let i = 0; i < 3; i++) {
    plate += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    plate += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return plate;
}

function generateTollIds(count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(`toll-${Math.floor(Math.random() * 200) + 1}`);
  }
  return ids;
}

export default generateTestData;
