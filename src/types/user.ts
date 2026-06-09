// src/types/user.ts

export interface IUserProfile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'CASHIER';
  email: string;
  phone_number: string;
  avatar_url: string;
  joined_at: string;
}
