
// Global variables - these are set from PHP in the HTML
// selectedCourts, selectedEquipment, and currentStep are declared in Book.php

// Custom Datepicker for Step 1
function initDatePicker() {
    if (currentStep !== 1) return;
    
    const monthEl = document.getElementById('dp-month');
    const gridEl = document.getElementById('dp-grid');
    const inputEl = document.getElementById('dp-input');
    const prevBtn = document.getElementById('dp-prev');
    const nextBtn = document.getElementById('dp-next');
    if (!monthEl || !gridEl || !inputEl) return;

    const today = new Date();
    let view = new Date(today.getFullYear(), today.getMonth(), 1);

    function fmt(d){
        const m = (d.getMonth()+1).toString().padStart(2,'0');
        const day = d.getDate().toString().padStart(2,'0');
        return `${d.getFullYear()}-${m}-${day}`;
    }

    function render(){
        monthEl.textContent = view.toLocaleString('default', { month: 'long', year: 'numeric' });
        gridEl.innerHTML = '';
        const firstDayIdx = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
        const daysInMonth = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
        
        // Fill leading blanks
        for (let i=0;i<firstDayIdx;i++) {
            const blank = document.createElement('div');
            gridEl.appendChild(blank);
        }

        for (let d=1; d<=daysInMonth; d++) {
            const dateObj = new Date(view.getFullYear(), view.getMonth(), d);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dp-day';
            btn.textContent = d;
            // disable past dates
            const isPast = dateObj.setHours(0,0,0,0) < today.setHours(0,0,0,0);
            if (isPast) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }
            btn.addEventListener('click', function(){
                inputEl.value = fmt(dateObj);
                gridEl.querySelectorAll('.dp-day').forEach(x=>x.classList.remove('selected'));
                btn.classList.add('selected');
            });
            gridEl.appendChild(btn);
        }

        // Preselect previously chosen date if in view
        if (inputEl.value) {
            const sel = new Date(inputEl.value);
            if (sel.getFullYear()===view.getFullYear() && sel.getMonth()===view.getMonth()) {
                const idx = firstDayIdx + sel.getDate()-1;
                const btn = gridEl.children[idx];
                if (btn && btn.classList.contains('dp-day') && !btn.disabled) btn.classList.add('selected');
            }
        }
    }

    prevBtn && prevBtn.addEventListener('click', function(){
        view.setMonth(view.getMonth()-1);
        render();
    });
    nextBtn && nextBtn.addEventListener('click', function(){
        view.setMonth(view.getMonth()+1);
        render();
    });

    // Initialize
    render();
}

// Tab functionality
function showTab(tabName) {
    // Remove active class from all tab contents
    const tabs = document.querySelectorAll('.tab-content');
    if (tabs && tabs.length) {
        tabs.forEach(tab => tab.classList.remove('active'));
    }
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons && tabButtons.length) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    // Add active class to target tab content
    const target = document.getElementById(tabName);
    if (target) {
        target.classList.add('active');
    }
    
    // Add active class to corresponding tab button
    const targetButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (targetButton) {
        targetButton.classList.add('active');
    }
}

// Equipment quantity
function changeQuantity(item, change) {
    const qtyElement = document.getElementById(item + '-qty');
    let currentQty = parseInt(qtyElement.textContent);
    let newQty = Math.max(0, currentQty + change);
    
    qtyElement.textContent = newQty;
    
    selectedEquipment[item] = newQty;
    updateSummary();
}

// Update summary
function updateSummary() {
    updateCourtSummary();
    updateEquipmentSummary();
    updateTotal();
}

function updateCourtSummary() {
    const tbody = document.getElementById('court-summary') || document.getElementById('payment-court-summary');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Check if there are any valid court selections
    const validCourts = (selectedCourts || []).filter(item => 
        item && item.court && item.time && item.price
    );
    
    if (validCourts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" style="text-align: center; color: #666; font-style: italic;">
                No court selections yet. Click on available time slots to make reservations.
            </td>
        `;
        tbody.appendChild(row);
    } else {
        validCourts.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.court ? 'Court ' + item.court : ''}</td>
                <td>${item.time ? item.time : ''}</td>
                <td>${item.price ? item.price : ''}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

function updateEquipmentSummary() {
    const tbody = document.getElementById('equipment-summary') || document.getElementById('payment-equipment-summary');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Check if there are any equipment selections
    const hasEquipment = Object.keys(selectedEquipment || {}).some(item => 
        selectedEquipment[item] > 0
    );
    
    if (!hasEquipment) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" style="text-align: center; color: #666; font-style: italic;">
                No equipment selected yet. Use the quantity controls to add equipment.
            </td>
        `;
        tbody.appendChild(row);
    } else {
        // Get equipment data from the page
        const equipmentCards = document.querySelectorAll('.equipment-card');
        const equipmentData = {};
        
        equipmentCards.forEach(card => {
            const equipmentId = card.getAttribute('data-equipment-id');
            const equipmentName = card.querySelector('h3').textContent;
            const priceElement = card.querySelector('.equipment-price');
            if (priceElement) {
                const price = parseFloat(priceElement.textContent.replace('₱', '').replace(',', ''));
                equipmentData[equipmentId] = { name: equipmentName, price: price };
            }
        });
        
        Object.keys(selectedEquipment || {}).forEach(item => {
            if (selectedEquipment[item] > 0 && equipmentData[item]) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${equipmentData[item].name}</td>
                    <td>${selectedEquipment[item]}</td>
                    <td>₱${(equipmentData[item].price * selectedEquipment[item]).toFixed(2)}</td>
                `;
                tbody.appendChild(row);
            }
        });
    }
}

function updateTotal() {
    let total = 0;
    
    // Add court costs
    (selectedCourts || []).forEach(item => {
        const val = parseFloat(item && item.price ? item.price : 0);
        if (!isNaN(val)) total += val;
    });
    
    // Add equipment costs
    const equipmentCards = document.querySelectorAll('.equipment-card');
    const equipmentData = {};
    
    equipmentCards.forEach(card => {
        const equipmentId = card.getAttribute('data-equipment-id');
        const priceElement = card.querySelector('.equipment-price');
        if (priceElement) {
            const price = parseFloat(priceElement.textContent.replace('₱', '').replace(',', ''));
            equipmentData[equipmentId] = price;
        }
    });
    
    Object.keys(selectedEquipment || {}).forEach(item => {
        if (equipmentData[item]) {
            total += equipmentData[item] * (selectedEquipment[item] || 0);
        }
    });
    
    const totalElement = document.getElementById('total-amount') || document.getElementById('payment-total');
    if (totalElement) {
        totalElement.textContent = total.toFixed(0);
    }
}

// Go back to previous step
function goBack() {
    console.log('goBack called, currentStep:', currentStep);
    if (currentStep == 2) {
        console.log('Going back to step 1');
        window.location.href = 'Book.php?step=1';
    } else if (currentStep == 3) {
        console.log('Going back to step 2');
        window.location.href = 'Book.php?step=2';
    }
}

// Proceed to next step
function proceedToNext() {
    console.log('proceedToNext called, currentStep:', currentStep);
    if (currentStep == 2) {
        console.log('Proceeding to step 3, selectedCourts:', selectedCourts);
        // Save selections and go to payment
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'Book.php?step=3';
        
        const actionInput = document.createElement('input');
        actionInput.type = 'hidden';
        actionInput.name = 'action';
        actionInput.value = 'select_court';
        form.appendChild(actionInput);
        
        // Save court selections
        (selectedCourts || []).forEach((court, index) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `selected_courts[${index}]`;
            input.value = JSON.stringify(court);
            form.appendChild(input);
        });
        
        // Save equipment selections
        Object.keys(selectedEquipment || {}).forEach(item => {
            if (selectedEquipment[item] > 0) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = `equipment[${item}]`;
                input.value = selectedEquipment[item];
                form.appendChild(input);
            }
        });
        
        document.body.appendChild(form);
        form.submit();
    }
}

// Payment method selection
function selectPayment(method) {
    // Remove selected class from all payment options
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    const selectedOption = document.querySelector(`[onclick="selectPayment('${method}')"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Store selected payment method for API integration
    window.selectedPaymentMethod = method;
    console.log('Selected payment method:', method);
}

// Process payment
function processPayment() {
    // Check if a payment method is selected
    if (!window.selectedPaymentMethod) {
        alert('Please select a payment method first.');
        return;
    }
    
    // Validate form fields
    const nameField = document.querySelector('input[name="name"]');
    const contactField = document.querySelector('input[name="contact"]');
    const emailField = document.querySelector('input[name="email"]');
    
    if (!nameField.value.trim() || !contactField.value.trim() || !emailField.value.trim()) {
        alert('Please fill in all required fields (Name, Contact Number, Email Address).');
        return;
    }
    
    // Prepare payment data for API
    const paymentData = {
        paymentMethod: window.selectedPaymentMethod,
        customerInfo: {
            name: nameField.value.trim(),
            contact: contactField.value.trim(),
            email: emailField.value.trim()
        },
        bookingData: {
            courts: selectedCourts || [],
            equipment: selectedEquipment || {},
            totalAmount: calculateTotalAmount(),
            referenceNumber: document.querySelector('.reference-banner span').textContent.replace('Reference Number: ', ''),
            selectedDate: document.querySelector('.selected-date-display strong').textContent
        }
    };
    
    console.log('Payment data prepared for API:', paymentData);
    
    // TODO: Replace with actual API call
    // Example API call structure:
    // fetch('/api/process-payment', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(paymentData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         // Redirect to success page or show confirmation
    //         window.location.href = '/booking-success?ref=' + data.referenceNumber;
    //     } else {
    //         alert('Payment failed: ' + data.message);
    //     }
    // })
    // .catch(error => {
    //     console.error('Payment error:', error);
    //     alert('Payment processing failed. Please try again.');
    // });
    
    alert(`Payment processing with ${window.selectedPaymentMethod}... This would integrate with actual payment gateway.`);
}

// Helper function to calculate total amount
function calculateTotalAmount() {
    let total = 0;
    
    // Add court costs
    (selectedCourts || []).forEach(item => {
        const val = parseFloat(item && item.price ? item.price : 0);
        if (!isNaN(val)) total += val;
    });
    
    // Add equipment costs
    const equipmentCards = document.querySelectorAll('.equipment-card');
    const equipmentData = {};
    
    equipmentCards.forEach(card => {
        const equipmentId = card.getAttribute('data-equipment-id');
        const priceElement = card.querySelector('.equipment-price');
        if (priceElement) {
            const price = parseFloat(priceElement.textContent.replace('₱', '').replace(',', ''));
            equipmentData[equipmentId] = price;
        }
    });
    
    Object.keys(selectedEquipment || {}).forEach(item => {
        if (equipmentData[item]) {
            total += equipmentData[item] * (selectedEquipment[item] || 0);
        }
    });
    
    return total;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, currentStep:', currentStep);
    console.log('selectedCourts:', selectedCourts);
    console.log('selectedEquipment:', selectedEquipment);
    console.log('Functions available:', {
        goBack: typeof goBack,
        proceedToNext: typeof proceedToNext,
        showTab: typeof showTab,
        changeQuantity: typeof changeQuantity
    });
    
    // Initialize equipment quantities from session data
    Object.keys(selectedEquipment || {}).forEach(item => {
        const qtyElement = document.getElementById(item + '-qty');
        if (qtyElement) {
            qtyElement.textContent = selectedEquipment[item] || 0;
        }
    });
    
    // Initialize date picker
    initDatePicker();
    
    // Initialize court selection
    initCourtSelection();
    
    updateSummary();
});

// Initialize court selection
function initCourtSelection() {
    const courtCells = document.querySelectorAll('.court-cell');
    courtCells.forEach(cell => {
        cell.addEventListener('click', function() {
            if (this.classList.contains('available')) {
                this.classList.remove('available');
                this.classList.add('selected');
                
                const court = this.dataset.court;
                const time = this.dataset.time;
                const price = this.dataset.price;
                
                selectedCourts.push({
                    court: court,
                    time: time,
                    price: price
                });
                
                updateSummary();
            } else if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                this.classList.add('available');
                
                const court = this.dataset.court;
                const time = this.dataset.time;
                
                selectedCourts = selectedCourts.filter(item => 
                    !(item.court === court && item.time === time)
                );
                
                updateSummary();
            }
        });
    });
}
