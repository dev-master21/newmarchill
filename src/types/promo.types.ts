export interface PromoCode {
  id?: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_value_rub: number;
  discount_value_usd: number;
  min_order_amount: number;
  usage_limit?: number;
  used_count: number;
  valid_from: string | Date;
  valid_until?: string | Date;
  is_active: boolean;
  created_at?: string;
  products?: number[];
  total_users?: number;
  total_uses?: number;
}

export interface PromoCodeUsage {
  user_id: number;
  promo_code_id: number;
  used_at: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface PromoCodeStats {
  totalUses: number;
  totalUsers: number;
  users: PromoCodeUsage[];
}