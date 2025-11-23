export interface PaymongoPaymentIntent {
    id: string;
    type: 'payment_intent';
    attributes: {
        amount: number;
        currency: string;
        description: string;
        statement_descriptor?: string;
        status: 'awaiting_payment_method' | 'awaiting_next_action' | 'processing' | 'succeeded' | 'awaiting_payment';
        livemode: boolean;
        client_key: string;
        created_at: number;
        updated_at: number;
        last_payment_error?: any;
        payment_method_allowed: string[];
        payments: any[];
        next_action?: any;
        payment_method_options?: any;
        metadata?: any;
    };
}
export interface PaymongoPaymentMethod {
    id: string;
    type: 'payment_method';
    attributes: {
        billing: {
            address: {
                city: string;
                country: string;
                line1: string;
                line2?: string;
                postal_code: string;
                state: string;
            };
            email: string;
            name: string;
            phone: string;
        };
        details?: {
            last4?: string;
            exp_month?: number;
            exp_year?: number;
        };
        livemode: boolean;
        type: 'card' | 'gcash' | 'paymaya' | 'grab_pay';
        metadata?: any;
        created_at: number;
        updated_at: number;
    };
}
export interface PaymongoPayment {
    id: string;
    type: 'payment';
    attributes: {
        amount: number;
        billing: {
            address: {
                city: string;
                country: string;
                line1: string;
                line2?: string;
                postal_code: string;
                state: string;
            };
            email: string;
            name: string;
            phone: string;
        };
        currency: string;
        description: string;
        fee: number;
        livemode: boolean;
        net_amount: number;
        payout?: any;
        source: {
            id: string;
            type: string;
        };
        statement_descriptor?: string;
        status: 'paid' | 'failed' | 'pending';
        created_at: number;
        paid_at?: number;
        updated_at: number;
        metadata?: {
            bookingData?: string;
            [key: string]: any;
        };
    };
}
export interface PaymongoQrPhCode {
    id: string;
    type: 'code';
    attributes: {
        kind: string;
        livemode: boolean;
        mobile_number?: string;
        notes?: string;
        qr_image?: string;
        created_at?: number;
        updated_at?: number;
        [key: string]: any;
    };
}
