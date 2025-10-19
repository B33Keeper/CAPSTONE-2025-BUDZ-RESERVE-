
// Global variables - these are set from PHP in the HTML
// selectedCourts, selectedEquipment, and currentStep are declared in Book.php

// Custom Alert Modal System
function showCustomAlert(message, title = 'Notification') {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 0;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
        overflow: hidden;
    `;
    
    // Create modal header
    const header = document.createElement('div');
    header.style.cssText = `
        background: #2196F3;
        color: white;
        padding: 20px;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    header.innerHTML = `
        <div style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">!</div>
        ${title}
    `;
    
    // Create modal body
    const body = document.createElement('div');
    body.style.cssText = `
        padding: 25px;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
    `;
    body.textContent = message;
    
    // Create modal footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 20px 25px;
        background: #f8f9fa;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    `;
    
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
        background: #2196F3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s ease;
    `;
    
    okButton.addEventListener('mouseenter', () => {
        okButton.style.background = '#1976D2';
    });
    
    okButton.addEventListener('mouseleave', () => {
        okButton.style.background = '#2196F3';
    });
    
    okButton.addEventListener('click', () => {
        closeCustomModal();
    });
    
    footer.appendChild(okButton);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeCustomModal();
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeCustomModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Focus the OK button
    okButton.focus();
}

function closeCustomModal() {
    const overlay = document.querySelector('.custom-modal-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

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
            btn.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                
                // Update input value
                inputEl.value = fmt(dateObj);
                
                // Remove selected class from all days
                gridEl.querySelectorAll('.dp-day').forEach(x=>x.classList.remove('selected'));
                
                // Add selected class to clicked day
                btn.classList.add('selected');
                
                // Force a reflow to ensure the class is applied
                btn.offsetHeight;
                
                // Trigger a custom event for any additional handling
                btn.dispatchEvent(new CustomEvent('dateSelected', {
                    detail: { date: dateObj, formatted: fmt(dateObj) }
                }));
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
        // Get equipment data from the page or session
        const equipmentCards = document.querySelectorAll('.equipment-card');
        const equipmentData = {};
        
        // Try to get equipment data from DOM first (step 2)
        equipmentCards.forEach(card => {
            const equipmentId = card.getAttribute('data-equipment-id');
            const equipmentName = card.querySelector('h3').textContent;
            const priceElement = card.querySelector('.equipment-price');
            if (priceElement) {
                const price = parseFloat(priceElement.textContent.replace('₱', '').replace(',', ''));
                equipmentData[equipmentId] = { name: equipmentName, price: price };
            }
        });
        
        // If no equipment cards found (step 3), use session data
        if (Object.keys(equipmentData).length === 0 && typeof equipmentNames !== 'undefined' && typeof equipmentPrices !== 'undefined') {
            Object.keys(equipmentNames).forEach(item => {
                equipmentData[item] = {
                    name: equipmentNames[item],
                    price: parseFloat(equipmentPrices[item])
                };
            });
        }
        
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
    
    // Try to get equipment data from DOM first (step 2)
    equipmentCards.forEach(card => {
        const equipmentId = card.getAttribute('data-equipment-id');
        const priceElement = card.querySelector('.equipment-price');
        if (priceElement) {
            const price = parseFloat(priceElement.textContent.replace('₱', '').replace(',', ''));
            equipmentData[equipmentId] = price;
        }
    });
    
    // If no equipment cards found (step 3), use session data
    if (Object.keys(equipmentData).length === 0 && typeof equipmentPrices !== 'undefined') {
        Object.keys(equipmentPrices).forEach(item => {
            equipmentData[item] = parseFloat(equipmentPrices[item]);
        });
    }
    
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
        
        // Check if user has selected anything
        const hasCourtSelection = selectedCourts && selectedCourts.length > 0;
        const hasEquipmentSelection = selectedEquipment && Object.keys(selectedEquipment).some(item => selectedEquipment[item] > 0);
        
        if (!hasCourtSelection && !hasEquipmentSelection) {
            showCustomAlert('Please select at least one court or equipment before proceeding.');
            return;
        }
        
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
        
        // Save equipment selections with equipment data
        Object.keys(selectedEquipment || {}).forEach(item => {
            if (selectedEquipment[item] > 0) {
                // Get equipment data from DOM
                const equipmentCard = document.querySelector(`[data-equipment-id="${item}"]`);
                if (equipmentCard) {
                    const equipmentName = equipmentCard.querySelector('h3').textContent;
                    const priceElement = equipmentCard.querySelector('.equipment-price');
                    if (priceElement) {
                        const price = parseFloat(priceElement.textContent.replace('₱', '').replace(',', ''));
                        
                        // Save equipment quantity
                        const quantityInput = document.createElement('input');
                        quantityInput.type = 'hidden';
                        quantityInput.name = `equipment[${item}]`;
                        quantityInput.value = selectedEquipment[item];
                        form.appendChild(quantityInput);
                        
                        // Save equipment name
                        const nameInput = document.createElement('input');
                        nameInput.type = 'hidden';
                        nameInput.name = `equipment_name[${item}]`;
                        nameInput.value = equipmentName;
                        form.appendChild(nameInput);
                        
                        // Save equipment price
                        const priceInput = document.createElement('input');
                        priceInput.type = 'hidden';
                        priceInput.name = `equipment_price[${item}]`;
                        priceInput.value = price;
                        form.appendChild(priceInput);
                    }
                }
            }
        });
        
        document.body.appendChild(form);
        form.submit();
    }
}


// Process payment
function processPayment() {
    showCustomAlert('PAYMONGO API NOT INTEGRATED YET', 'Payment Processing');
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
