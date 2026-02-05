export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          monthly_income: number
          dependents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          monthly_income?: number
          dependents?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          monthly_income?: number
          dependents?: number
          created_at?: string
          updated_at?: string
        }
      }
      budget_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          budgeted_amount: number
          type: 'needs' | 'wants' | 'savings' | 'growth'
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          budgeted_amount?: number
          type: 'needs' | 'wants' | 'savings' | 'growth'
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          budgeted_amount?: number
          type?: 'needs' | 'wants' | 'savings' | 'growth'
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          date: string
          amount: number
          type: 'expense' | 'saving' | 'ipp' | 'asset' | 'liability'
          notes: string | null
          month: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          date?: string
          amount: number
          type: 'expense' | 'saving' | 'ipp' | 'asset' | 'liability'
          notes?: string | null
          month: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          date?: string
          amount?: number
          type?: 'expense' | 'saving' | 'ipp' | 'asset' | 'liability'
          notes?: string | null
          month?: string
          created_at?: string
        }
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          monthly_contribution: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          monthly_contribution?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          monthly_contribution?: number
          created_at?: string
          updated_at?: string
        }
      }
      ipp_accounts: {
        Row: {
          id: string
          user_id: string
          current_balance: number
          monthly_contribution: number
          total_contributions: number
          tax_relief_rate: number
          realized_value: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_balance?: number
          monthly_contribution?: number
          total_contributions?: number
          tax_relief_rate?: number
          realized_value?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_balance?: number
          monthly_contribution?: number
          total_contributions?: number
          tax_relief_rate?: number
          realized_value?: number
          last_updated?: string
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          type: 'asset' | 'liability'
          category: string
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          type: 'asset' | 'liability'
          category: string
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          type?: 'asset' | 'liability'
          category?: string
          last_updated?: string
          created_at?: string
        }
      }
      monthly_snapshots: {
        Row: {
          id: string
          user_id: string
          month: string
          income: number
          total_expenses: number
          total_savings: number
          ipp_contributions: number
          net_worth: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          income: number
          total_expenses: number
          total_savings: number
          ipp_contributions?: number
          net_worth: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          income?: number
          total_expenses?: number
          total_savings?: number
          ipp_contributions?: number
          net_worth?: number
          created_at?: string
        }
      }
      additional_income: {
        Row: {
          id: string
          user_id: string
          date: string
          amount: number
          source: string
          description: string | null
          month: string
          deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          amount: number
          source: string
          description?: string | null
          month: string
          deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          amount?: number
          source?: string
          description?: string | null
          month?: string
          deleted?: boolean
          created_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'money-market' | 'unit-trust' | 'government-bond' | 'stock' | 'sacco' | 'reit' | 'other'
          units: number
          purchase_price: number
          current_price: number
          purchase_date: string
          last_updated: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'money-market' | 'unit-trust' | 'government-bond' | 'stock' | 'sacco' | 'reit' | 'other'
          units: number
          purchase_price: number
          current_price: number
          purchase_date: string
          last_updated?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'money-market' | 'unit-trust' | 'government-bond' | 'stock' | 'sacco' | 'reit' | 'other'
          units?: number
          purchase_price?: number
          current_price?: number
          purchase_date?: string
          last_updated?: string
          notes?: string | null
          created_at?: string
        }
      }
      dividend_payments: {
        Row: {
          id: string
          user_id: string
          investment_id: string
          amount: number
          date: string
          type: 'dividend' | 'interest'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          investment_id: string
          amount: number
          date?: string
          type: 'dividend' | 'interest'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          investment_id?: string
          amount?: number
          date?: string
          type?: 'dividend' | 'interest'
          notes?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      calculate_net_worth: {
        Args: { user_uuid: string }
        Returns: number
      }
    }
  }
}