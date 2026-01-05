/**
 * Database Types
 * 
 * TypeScript interfaces matching Supabase database schema.
 */

// User Profile
export interface Profile {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
    created_at: string;
    updated_at: string;
}

// Order
export interface Order {
    id: string;
    user_id: string;
    service_type: 'attire' | 'events' | 'bridal' | 'catering';
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    details: Record<string, unknown>;
    total: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// Conversation
export interface Conversation {
    id: string;
    user_id: string;
    admin_id: string | null;
    service_type: 'attire' | 'events' | 'bridal' | 'catering' | 'general';
    order_id: string | null;
    subject: string | null;
    status: 'open' | 'closed';
    last_message_at: string;
    created_at: string;
}

// Message
export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

// Extended types with relations
export interface OrderWithProfile extends Order {
    profiles: Profile;
}

export interface ConversationWithProfiles extends Conversation {
    user: Profile;
    admin: Profile | null;
    messages: Message[];
}

export interface MessageWithSender extends Message {
    sender: Profile;
}

// Stats for admin dashboard
export interface DashboardStats {
    totalRevenue: number;
    monthlyRevenue: number;
    totalUsers: number;
    activeOrders: number;
    unreadMessages: number;
    ordersByService: {
        attire: number;
        events: number;
        bridal: number;
        catering: number;
    };
    ordersByStatus: {
        pending: number;
        confirmed: number;
        in_progress: number;
        completed: number;
        cancelled: number;
    };
}
