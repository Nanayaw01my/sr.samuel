// ============================================
// COMPREHENSIVE MOMO PAYMENT INTEGRATION
// Supports: MTN MoMo, Telecel MoMo, AirtelTigo MoMo
// All payments routed through Paystack
// ============================================

// Paystack Configuration
const PAYSTACK_CONFIG = {
    // 🔴 REPLACE WITH YOUR ACTUAL LIVE KEY
    LIVE_KEY: '', // Replace with your key
    TEST_KEY: 'pk_test_8d8b9e8c6d9c4b2a1f3d5e7a9c0b2a4f6e8d1a3c', // Test key for development
    
    // Set to false for live, true for test mode
    IS_TEST_MODE: true,
    
    // Business details
    BUSINESS_NAME: 'Sr. Samuel Data',
    BUSINESS_EMAIL: 'payments@samueldata.com',
    
    // Callback URLs (optional - for server-side verification)
    CALLBACK_URL: 'https://yourdomain.com/payment-callback',
    
    // MoMo specific channels
    MOMO_CHANNELS: {
        MTN: 'mtn_momo',
        TELECEL: 'telecel_momo',
        AIRTELTIGO: 'airteltigo_momo'
    }
};

// ============================================
// MOMO PAYMENT HANDLER CLASS
// ============================================
class MoMoPaymentHandler {
    constructor() {
        this.currentPayment = null;
        this.paymentHistory = [];
        this.initPaystack();
    }

    // Initialize Paystack
    initPaystack() {
        if (!window.PaystackPop) {
            console.error('Paystack library not loaded!');
            this.loadPaystackScript();
        }
    }

    // Load Paystack script if not present
    loadPaystackScript() {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.head.appendChild(script);
    }

    // ========================================
    // MTN MOMO PAYMENT
    // ========================================
    payWithMTNMoMo(params) {
        const {
            amount,
            phone,
            email = PAYSTACK_CONFIG.BUSINESS_EMAIL,
            reference = this.generateReference('MTN'),
            metadata = {},
            onSuccess,
            onClose
        } = params;

        // Validate MTN phone number (starts with 024, 054, 055, 059, 025)
        if (!this.validateMTNPhone(phone)) {
            this.showError('Please enter a valid MTN phone number');
            return;
        }

        const paymentParams = {
            key: this.getPaystackKey(),
            email: email,
            amount: amount * 100, // Convert to pesewas
            currency: 'GHS',
            ref: reference,
            channels: ['mobile_money'], // Restrict to mobile money
            'mobile_money': {
                phone: phone,
                provider: 'mtn'
            },
            metadata: {
                ...metadata,
                network: 'MTN',
                payment_method: 'mtn_momo',
                phone_number: phone,
                business: PAYSTACK_CONFIG.BUSINESS_NAME
            },
            callback: (response) => {
                this.handleSuccess(response, {
                    network: 'MTN',
                    amount: amount,
                    phone: phone,
                    reference: response.reference
                }, onSuccess);
            },
            onClose: () => {
                this.handleClose('MTN', onClose);
            }
        };

        this.processPayment(paymentParams);
    }

    // ========================================
    // TELECEL MOMO PAYMENT
    // ========================================
    payWithTelecelMoMo(params) {
        const {
            amount,
            phone,
            email = PAYSTACK_CONFIG.BUSINESS_EMAIL,
            reference = this.generateReference('TEL'),
            metadata = {},
            onSuccess,
            onClose
        } = params;

        // Validate Telecel phone number (starts with 020, 050)
        if (!this.validateTelecelPhone(phone)) {
            this.showError('Please enter a valid Telecel phone number');
            return;
        }

        const paymentParams = {
            key: this.getPaystackKey(),
            email: email,
            amount: amount * 100,
            currency: 'GHS',
            ref: reference,
            channels: ['mobile_money'],
            'mobile_money': {
                phone: phone,
                provider: 'telecel' // Paystack uses 'telecel' as provider
            },
            metadata: {
                ...metadata,
                network: 'Telecel',
                payment_method: 'telecel_momo',
                phone_number: phone,
                business: PAYSTACK_CONFIG.BUSINESS_NAME
            },
            callback: (response) => {
                this.handleSuccess(response, {
                    network: 'Telecel',
                    amount: amount,
                    phone: phone,
                    reference: response.reference
                }, onSuccess);
            },
            onClose: () => {
                this.handleClose('Telecel', onClose);
            }
        };

        this.processPayment(paymentParams);
    }

    // ========================================
    // AIRTELTIGO MOMO PAYMENT
    // ========================================
    payWithAirtelTigoMoMo(params) {
        const {
            amount,
            phone,
            email = PAYSTACK_CONFIG.BUSINESS_EMAIL,
            reference = this.generateReference('ATL'),
            metadata = {},
            onSuccess,
            onClose
        } = params;

        // Validate AirtelTigo phone number (starts with 026, 056)
        if (!this.validateAirtelTigoPhone(phone)) {
            this.showError('Please enter a valid AirtelTigo phone number');
            return;
        }

        const paymentParams = {
            key: this.getPaystackKey(),
            email: email,
            amount: amount * 100,
            currency: 'GHS',
            ref: reference,
            channels: ['mobile_money'],
            'mobile_money': {
                phone: phone,
                provider: 'airteltigo' // Paystack uses 'airteltigo' as provider
            },
            metadata: {
                ...metadata,
                network: 'AirtelTigo',
                payment_method: 'airteltigo_momo',
                phone_number: phone,
                business: PAYSTACK_CONFIG.BUSINESS_NAME
            },
            callback: (response) => {
                this.handleSuccess(response, {
                    network: 'AirtelTigo',
                    amount: amount,
                    phone: phone,
                    reference: response.reference
                }, onSuccess);
            },
            onClose: () => {
                this.handleClose('AirtelTigo', onClose);
            }
        };

        this.processPayment(paymentParams);
    }

    // ========================================
    // UNIVERSAL MOMO PAYMENT (auto-detect network)
    // ========================================
    payWithMoMo(params) {
        const { phone, amount, ...rest } = params;
        
        // Auto-detect network from phone number
        const network = this.detectNetwork(phone);
        
        if (!network) {
            this.showError('Could not detect network from phone number');
            return;
        }

        // Route to appropriate network-specific method
        switch(network) {
            case 'MTN':
                this.payWithMTNMoMo({ phone, amount, ...rest });
                break;
            case 'Telecel':
                this.payWithTelecelMoMo({ phone, amount, ...rest });
                break;
            case 'AirtelTigo':
                this.payWithAirtelTigoMoMo({ phone, amount, ...rest });
                break;
            default:
                this.showError('Unsupported network');
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    // Generate unique reference
    generateReference(prefix = 'PAY') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `${prefix}-${timestamp}-${random}`;
    }

    // Get appropriate Paystack key
    getPaystackKey() {
        return PAYSTACK_CONFIG.IS_TEST_MODE ? 
               PAYSTACK_CONFIG.TEST_KEY : 
               PAYSTACK_CONFIG.LIVE_KEY;
    }

    // Phone number validation
    validateMTNPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return /^(024|054|055|059|025)\d{7}$/.test(cleaned);
    }

    validateTelecelPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return /^(020|050)\d{7}$/.test(cleaned);
    }

    validateAirtelTigoPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return /^(026|056)\d{7}$/.test(cleaned);
    }

    // Detect network from phone number
    detectNetwork(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (/^(024|054|055|059|025)/.test(cleaned)) return 'MTN';
        if (/^(020|050)/.test(cleaned)) return 'Telecel';
        if (/^(026|056)/.test(cleaned)) return 'AirtelTigo';
        
        return null;
    }

    // Process payment through Paystack
    processPayment(params) {
        try {
            const handler = PaystackPop.setup(params);
            handler.openIframe();
            this.currentPayment = params;
        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError('Failed to initialize payment');
        }
    }

    // Handle successful payment
    handleSuccess(response, paymentDetails, callback) {
        // Add to payment history
        this.paymentHistory.push({
            ...paymentDetails,
            status: 'success',
            timestamp: new Date().toISOString(),
            paystack_ref: response.reference
        });

        // Store in localStorage for persistence
        this.savePaymentHistory();

        // Show success message
        this.showSuccess(`Payment successful! Reference: ${response.reference}`);

        // Call custom callback if provided
        if (callback && typeof callback === 'function') {
            callback(response, paymentDetails);
        }

        // Trigger custom event for other parts of the app
        this.triggerPaymentEvent('paymentSuccess', { response, paymentDetails });
    }

    // Handle payment close
    handleClose(network, callback) {
        console.log(`${network} payment window closed`);
        
        if (callback && typeof callback === 'function') {
            callback();
        }
        
        this.triggerPaymentEvent('paymentClosed', { network });
    }

    // Show error message
    showError(message) {
        alert(`❌ ${message}`);
        console.error(message);
    }

    // Show success message
    showSuccess(message) {
        alert(`✅ ${message}`);
        console.log(message);
    }

    // Save payment history to localStorage
    savePaymentHistory() {
        try {
            localStorage.setItem('momoPaymentHistory', 
                JSON.stringify(this.paymentHistory));
        } catch (e) {
            console.warn('Could not save payment history');
        }
    }

    // Load payment history from localStorage
    loadPaymentHistory() {
        try {
            const saved = localStorage.getItem('momoPaymentHistory');
            if (saved) {
                this.paymentHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load payment history');
        }
    }

    // Trigger custom events
    triggerPaymentEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    // Get payment history
    getPaymentHistory() {
        return this.paymentHistory;
    }

    // Clear payment history
    clearPaymentHistory() {
        this.paymentHistory = [];
        localStorage.removeItem('momoPaymentHistory');
    }
}

// ============================================
// NETWORK-SPECIFIC PAYMENT BUTTON HANDLERS
// ============================================

// Initialize payment handler
const momoHandler = new MoMoPaymentHandler();

// MTN MoMo Payment Button Handler
function setupMTNMoMoButton(buttonId, amountInputId, phoneInputId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById(amountInputId)?.value);
        const phone = document.getElementById(phoneInputId)?.value.trim();
        
        if (!amount || amount < 1) {
            momoHandler.showError('Please enter a valid amount');
            return;
        }

        momoHandler.payWithMTNMoMo({
            amount: amount,
            phone: phone,
            metadata: {
                product: 'Data Bundle',
                source: 'web_app'
            },
            onSuccess: (response, details) => {
                console.log('MTN MoMo payment successful', details);
                // Update UI or trigger next steps
                document.dispatchEvent(new CustomEvent('mtnPaymentSuccess', { 
                    detail: details 
                }));
            },
            onClose: () => {
                console.log('MTN MoMo payment cancelled');
            }
        });
    });
}

// Telecel MoMo Payment Button Handler
function setupTelecelMoMoButton(buttonId, amountInputId, phoneInputId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById(amountInputId)?.value);
        const phone = document.getElementById(phoneInputId)?.value.trim();
        
        if (!amount || amount < 1) {
            momoHandler.showError('Please enter a valid amount');
            return;
        }

        momoHandler.payWithTelecelMoMo({
            amount: amount,
            phone: phone,
            metadata: {
                product: 'Data Bundle',
                source: 'web_app'
            },
            onSuccess: (response, details) => {
                console.log('Telecel MoMo payment successful', details);
                document.dispatchEvent(new CustomEvent('telecelPaymentSuccess', { 
                    detail: details 
                }));
            }
        });
    });
}

// AirtelTigo MoMo Payment Button Handler
function setupAirtelTigoMoMoButton(buttonId, amountInputId, phoneInputId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById(amountInputId)?.value);
        const phone = document.getElementById(phoneInputId)?.value.trim();
        
        if (!amount || amount < 1) {
            momoHandler.showError('Please enter a valid amount');
            return;
        }

        momoHandler.payWithAirtelTigoMoMo({
            amount: amount,
            phone: phone,
            metadata: {
                product: 'Data Bundle',
                source: 'web_app'
            },
            onSuccess: (response, details) => {
                console.log('AirtelTigo MoMo payment successful', details);
                document.dispatchEvent(new CustomEvent('airteltigoPaymentSuccess', { 
                    detail: details 
                }));
            }
        });
    });
}

// Universal MoMo Payment Button (auto-detects network)
function setupUniversalMoMoButton(buttonId, amountInputId, phoneInputId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById(amountInputId)?.value);
        const phone = document.getElementById(phoneInputId)?.value.trim();
        
        if (!amount || amount < 1) {
            momoHandler.showError('Please enter a valid amount');
            return;
        }

        if (!phone || phone.length < 10) {
            momoHandler.showError('Please enter a valid phone number');
            return;
        }

        momoHandler.payWithMoMo({
            amount: amount,
            phone: phone,
            metadata: {
                product: 'Data Bundle',
                source: 'web_app'
            },
            onSuccess: (response, details) => {
                console.log(`${details.network} MoMo payment successful`, details);
            }
        });
    });
}

// ============================================
// USAGE EXAMPLES FOR YOUR HTML FILES
// ============================================

/*
// In mtn-bundles.html:
<script src="momo-payment.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        setupMTNMoMoButton('payAirtimeBtn', 'amountInput', 'phoneInput');
        
        // Listen for successful payments
        document.addEventListener('mtnPaymentSuccess', (e) => {
            const { network, amount, phone, reference } = e.detail;
            // Send airtime or data bundle
            console.log(`Credit ${amount} GHS to ${phone}`);
        });
    });
</script>

// In airteltigo-bundles.html:
<script>
    document.addEventListener('DOMContentLoaded', () => {
        setupAirtelTigoMoMoButton('payAirtimeBtn', 'amountInput', 'phoneInput');
    });
</script>

// In telecel-bundles.html:
<script>
    document.addEventListener('DOMContentLoaded', () => {
        setupTelecelMoMoButton('payAirtimeBtn', 'amountInput', 'phoneInput');
    });
</script>

// For checker.html (universal payment):
<script>
    document.addEventListener('DOMContentLoaded', () => {
        setupUniversalMoMoButton('payBECEBtn', 'beceQuantity', 'becePhone');
        setupUniversalMoMoButton('payWASCEBtn', 'wasceQuantity', 'wascePhone');
    });
</script>
*/

// ============================================
// PAYMENT VERIFICATION FUNCTION (optional)
// ============================================
async function verifyPayment(reference) {
    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${PAYSTACK_CONFIG.LIVE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status && data.data.status === 'success') {
            console.log('Payment verified:', data.data);
            return data.data;
        } else {
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        console.error('Verification error:', error);
        return null;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MoMoPaymentHandler,
        setupMTNMoMoButton,
        setupTelecelMoMoButton,
        setupAirtelTigoMoMoButton,
        setupUniversalMoMoButton,
        verifyPayment
    };
}
