<?php
session_start();
include_once __DIR__ . '/db.php';

// If not logged in, redirect to login page
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

// Handle booking data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'select_court':
                // Convert JSON strings back to arrays so step 3 has structured data
                $decoded = [];
                if (!empty($_POST['selected_courts']) && is_array($_POST['selected_courts'])) {
                    foreach ($_POST['selected_courts'] as $item) {
                        $obj = json_decode($item, true);
                        if (is_array($obj)) {
                            $decoded[] = $obj;
                        }
                    }
                }
                $_SESSION['selected_courts'] = $decoded;
                
                // Also save equipment data if provided
                if (!empty($_POST['equipment']) && is_array($_POST['equipment'])) {
                    $_SESSION['selected_equipment'] = $_POST['equipment'];
                }
                break;
            case 'select_equipment':
                $_SESSION['selected_equipment'] = $_POST['equipment'] ?? [];
                break;
            case 'update_payment':
                $_SESSION['payment_data'] = $_POST;
                break;
        }
    }
}

// Get current step
$current_step = isset($_GET['step']) ? (int)$_GET['step'] : 1; // default to Step 1

// Fetch equipment data from database
$equipment_query = "SELECT * FROM equipments WHERE status = 'Available' ORDER BY equipment_name";
$equipment_result = mysqli_query($conn, $equipment_query);
$equipments = [];
if ($equipment_result) {
    while ($row = mysqli_fetch_assoc($equipment_result)) {
        $equipments[] = $row;
    }
}

// Clear session data when starting fresh (step 1 with no date parameter)
if ($current_step == 1 && !isset($_GET['date']) && !isset($_POST['date'])) {
    unset($_SESSION['selected_courts']);
    unset($_SESSION['selected_equipment']);
    unset($_SESSION['selected_date']);
}

// Selected date source precedence: GET > POST > SESSION > today
if (isset($_GET['date']) && $_GET['date'] !== '') {
    $_SESSION['selected_date'] = $_GET['date'];
}
if (isset($_POST['date']) && $_POST['date'] !== '') {
    $_SESSION['selected_date'] = $_POST['date'];
}
$selected_date = isset($_SESSION['selected_date']) ? $_SESSION['selected_date'] : date('Y-m-d');
$selected_courts = $_SESSION['selected_courts'] ?? [];
$selected_equipment = $_SESSION['selected_equipment'] ?? [];
$payment_data = $_SESSION['payment_data'] ?? [];

// Generate reference number
if (!isset($_SESSION['reference_number'])) {
    $_SESSION['reference_number'] = 'REF' . time() . rand(1000, 9999);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book a Court - Budz Badminton Court</title>
    <link rel="stylesheet" type="text/css" href="Assets/styles/index_style.css">
    <link rel="stylesheet" type="text/css" href="Assets/styles/book_style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <script src="Assets/js/index.js"></script>
    
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="logo">
                <img src="Assets/icons/BBC ICON.png" alt="BBC Logo">
            </div>
            <nav class="nav">
                <ul>
                    <li><a href="index.php">Home</a></li>
                    <li><a href="#about">About Us</a></li>
                    <li><a href="#gallery">Gallery</a></li>
                    <li><a href="#contact">Contact us</a></li>
                    <li><a href="Book.php" class="active">Book a court</a></li>
                    <li><a href="#queue" class="queue-btn">Manage Queuing</a></li>
                </ul>
            </nav>
            
            <div class="user-profile">
                <div class="profile-info">
                    <img src="#" alt="Profile Picture" class="profile-pic">
                    <span class="username"><?php echo htmlspecialchars($_SESSION['username']); ?></span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </div>
                <div class="dropdown-menu">
                    <a href="#profile" class="dropdown-item">
                        <i class="fas fa-user"></i>
                        <span>Profile</span>
                    </a>
                    <a href="#reservations" class="dropdown-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>My Reservations</span>
                    </a>
                    <a href="logout.php" class="dropdown-item logout-item">
                        <i class="fas fa-power-off"></i>
                        <span>Log Out</span>
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Progress Indicator -->
    <div class="progress-container">
        <div class="progress-steps">
            <div class="step <?php echo $current_step >= 1 ? 'completed' : ''; ?>">
                <div class="step-circle">
                    <span>1</span>
                </div>
                <span class="step-label">Select a date</span>
            </div>
            <div class="step-line"></div>
            <div class="step <?php echo $current_step >= 2 ? 'active' : ''; ?>">
                <div class="step-circle">
                    <span>2</span>
                </div>
                <span class="step-label">Select time & court no.</span>
            </div>
            <div class="step-line"></div>
            <div class="step <?php echo $current_step >= 3 ? 'active' : ''; ?>">
                <div class="step-circle">
                    <span>3</span>
                </div>
                <span class="step-label">Select payment method.</span>
            </div>
            <div class="step-line"></div>
            <div class="step <?php echo $current_step >= 4 ? 'active' : ''; ?>">
                <div class="step-circle">
                    <span>4</span>
                </div>
                <span class="step-label">completed</span>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="booking-container">
        <div class="booking-card">
            <?php if ($current_step === 1): ?>
            <!-- Step 1: Select a date -->
            <div class="booking-header">
                <span class="booking-title">Select a date</span>
            </div>
            <div class="tab-content active">
                <div class="custom-datepicker">
                    <div class="dp-header">
                        <button type="button" class="dp-nav dp-prev" id="dp-prev">◀</button>
                        <div class="dp-month" id="dp-month"></div>
                        <button type="button" class="dp-nav dp-next" id="dp-next">▶</button>
                    </div>
                    <div class="dp-weekdays">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>
                    <div class="dp-grid" id="dp-grid"></div>
                </div>
                <form id="dp-form" action="Book.php" method="GET" style="display:flex;gap:16px;align-items:center;justify-content:center;margin-top:20px;">
                    <input type="hidden" name="step" value="2">
                    <input type="hidden" id="dp-input" name="date" value="<?php echo htmlspecialchars($selected_date); ?>">
                    <button type="submit" class="proceed-btn">Proceed</button>
                </form>
            </div>
            <?php endif; ?>

            <?php if ($current_step == 2): ?>
            <!-- Step 2: Show selection header and tabs -->
            <div class="booking-header">
                <span class="booking-title">Select from the available time and court:</span>
                <div class="booking-tabs">
                    <button class="tab-btn active" onclick="showTab('sheet1')">Sheet 1</button>
                    <button class="tab-btn" onclick="showTab('sheet2')">Sheet 2</button>
                    <button class="tab-btn" onclick="showTab('equipment')">Rent an equipment</button>
                    <button class="tab-btn" onclick="showTab('details')">Booking details</button>
                </div>
            </div>

            <!-- Selected Date -->
            <div class="selected-date">
                <span>Selected date: <strong><?php echo date('F j, Y', strtotime($selected_date)); ?></strong></span>
            </div>
            <?php endif; ?>

            <?php if ($current_step == 2): ?>
            <!-- Court Selection Tabs -->
            <div id="sheet1" class="tab-content active">
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color available"></div>
                        <span>Available</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color reserved"></div>
                        <span>Reserved</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color maintenance"></div>
                        <span>Maintenance</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color selected"></div>
                        <span>Selected</span>
                    </div>
                </div>

                <div class="court-table">
                    <table>
                        <thead>
                            <tr>
                                <th>TIME</th>
                                <th>COURT 1</th>
                                <th>COURT 2</th>
                                <th>COURT 3</th>
                                <th>COURT 4</th>
                                <th>COURT 5</th>
                                <th>COURT 6</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            // Build time slots map => start/end in 24h
                            $time_slots = [
                                '8:00 am - 9:00 am' => ['08:00:00','09:00:00'],
                                '9:00 am - 10:00 am' => ['09:00:00','10:00:00'],
                                '10:00 am - 11:00 am' => ['10:00:00','11:00:00'],
                                '11:00 am - 12:00 pm' => ['11:00:00','12:00:00'],
                                '12:00 pm - 1:00 pm' => ['12:00:00','13:00:00'],
                                '1:00 pm - 2:00 pm' => ['13:00:00','14:00:00'],
                                '2:00 pm - 3:00 pm' => ['14:00:00','15:00:00'],
                                '3:00 pm - 4:00 pm' => ['15:00:00','16:00:00'],
                                '4:00 pm - 5:00 pm' => ['16:00:00','17:00:00'],
                                '5:00 pm - 6:00 pm' => ['17:00:00','18:00:00'],
                                '6:00 pm - 7:00 pm' => ['18:00:00','19:00:00'],
                                '7:00 pm - 8:00 pm' => ['19:00:00','20:00:00'],
                                '8:00 pm - 9:00 pm' => ['20:00:00','21:00:00'],
                                '9:00 pm - 10:00 pm' => ['21:00:00','22:00:00'],
                                '10:00 pm - 11:00 pm' => ['22:00:00','23:00:00'],
                            ];

                            // Fetch courts 1-6 with prices & statuses
                            $courts_rs = $conn->query("SELECT Court_Id, Court_Name, Status, Price FROM courts WHERE Court_Id BETWEEN 1 AND 6 ORDER BY Court_Id");
                            $courts = [];
                            while ($row = $courts_rs->fetch_assoc()) { $courts[$row['Court_Id']] = $row; }

                            // Fetch reservations for selected date
                            $dateEsc = $conn->real_escape_string($selected_date);
                            $res_rs = $conn->query("SELECT Court_ID, Start_Time, End_Time, Status FROM reservations WHERE Reservation_Date='{$dateEsc}' AND Status IN ('Pending','Confirmed')");
                            $reserved = [];
                            while ($r = $res_rs->fetch_assoc()) {
                                $key = $r['Court_ID'] . '|' . $r['Start_Time'] . '|' . $r['End_Time'];
                                $reserved[$key] = true;
                            }

                            foreach ($time_slots as $label => $range) {
                                echo '<tr>';
                                echo '<td class="time-slot">' . $label . '</td>';
                                for ($court = 1; $court <= 6; $court++) {
                                    $price = isset($courts[$court]) ? number_format((float)$courts[$court]['Price'], 2) : '0.00';
                                    $courtStatus = isset($courts[$court]) ? $courts[$court]['Status'] : 'Available';
                                    $statusNorm = strtoupper(trim((string)$courtStatus));
                                    // Treat '', 'UNAVAILABLE', or 'MAINTENANCE' as maintenance
                                    $isUnavailable = ($statusNorm === '' || $statusNorm === 'UNAVAILABLE' || $statusNorm === 'MAINTENANCE');
                                    $key = $court . '|' . $range[0] . '|' . $range[1];
                                    $isReserved = isset($reserved[$key]);
                                    $cellClass = $isUnavailable ? 'maintenance' : ($isReserved ? 'reserved' : 'available');
                                    echo '<td class="court-cell ' . $cellClass . '" data-court="' . $court . '" data-time="' . $label . '" data-start="' . $range[0] . '" data-end="' . $range[1] . '" data-price="' . $price . '">';
                                    echo $price . ' php';
                                    echo '</td>';
                                }
                                echo '</tr>';
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="sheet2" class="tab-content">
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color available"></div>
                        <span>Available</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color reserved"></div>
                        <span>Reserved</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color maintenance"></div>
                        <span>Maintenance</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color selected"></div>
                        <span>Selected</span>
                    </div>
                </div>

                <div class="court-table">
                    <table>
                        <thead>
                            <tr>
                                <th>TIME</th>
                                <th>COURT 7</th>
                                <th>COURT 8</th>
                                <th>COURT 9</th>
                                <th>COURT 10</th>
                                <th>COURT 11</th>
                                <th>COURT 12</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            // reuse $time_slots, fetch courts 7-12
                            $courts_rs2 = $conn->query("SELECT Court_Id, Court_Name, Status, Price FROM courts WHERE Court_Id BETWEEN 7 AND 12 ORDER BY Court_Id");
                            $courts2 = [];
                            while ($row = $courts_rs2->fetch_assoc()) { $courts2[$row['Court_Id']] = $row; }
                            foreach ($time_slots as $label => $range) {
                                echo '<tr>';
                                echo '<td class="time-slot">' . $label . '</td>';
                                for ($court = 7; $court <= 12; $court++) {
                                    $price = isset($courts2[$court]) ? number_format((float)$courts2[$court]['Price'], 2) : '0.00';
                                    $courtStatus = isset($courts2[$court]) ? $courts2[$court]['Status'] : 'Available';
                                    $statusNorm = strtoupper(trim((string)$courtStatus));
                                    $isUnavailable = ($statusNorm === '' || $statusNorm === 'UNAVAILABLE' || $statusNorm === 'MAINTENANCE');
                                    $key = $court . '|' . $range[0] . '|' . $range[1];
                                    $isReserved = isset($reserved[$key]);
                                    $cellClass = $isUnavailable ? 'maintenance' : ($isReserved ? 'reserved' : 'available');
                                    echo '<td class="court-cell ' . $cellClass . '" data-court="' . $court . '" data-time="' . $label . '" data-start="' . $range[0] . '" data-end="' . $range[1] . '" data-price="' . $price . '">';
                                    echo $price . ' php';
                                    echo '</td>';
                                }
                                echo '</tr>';
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="equipment" class="tab-content">
                <div class="equipment-grid">
                    <?php foreach ($equipments as $equipment): ?>
                    <div class="equipment-card" data-equipment-id="<?php echo $equipment['id']; ?>">
                        <div class="card-inner">
                            <!-- Front of the card -->
                            <div class="card-front">
                                <h3><?php echo htmlspecialchars($equipment['equipment_name']); ?></h3>
                                <div class="equipment-image">
                                    <?php 
                                    // Map equipment names to their corresponding image files
                                    $imageMap = [
                                        'Badminton Racket' => 'racket.png',
                                        'Badminton Shoes' => 'shoes.png', 
                                        'Badminton Socks' => 'socks.png'
                                    ];
                                    
                                    // Try to get the mapped image, or fall back to a generic approach
                                    $imageFile = $imageMap[$equipment['equipment_name']] ?? 
                                                strtolower(str_replace(' ', '_', $equipment['equipment_name'])) . '.png';
                                    ?>
                                    <img src="Assets/img/equipments/<?php echo $imageFile; ?>" 
                                         alt="<?php echo htmlspecialchars($equipment['equipment_name']); ?>"
                                         onerror="this.src='Assets/icons/racket icon.png'">
                                </div>
                                <div class="equipment-price">₱<?php echo number_format($equipment['price'], 2); ?></div>
                                <div class="hover-hint">
                                    <span>Hover to see details & quantity controls</span>
                                </div>
                            </div>
                            <!-- Back of the card -->
                            <div class="card-back">
                                <h3><?php echo htmlspecialchars($equipment['equipment_name']); ?></h3>
                                <div class="equipment-description">
                                    <p><?php echo htmlspecialchars($equipment['description']); ?></p>
                                </div>
                                <div class="equipment-stock">
                                    <span>Stock: <?php echo $equipment['stocks']; ?> available</span>
                                </div>
                                <div class="equipment-price-back">₱<?php echo number_format($equipment['price'], 2); ?></div>
                                <div class="quantity-selector">
                                    <span>Quantity</span>
                                    <div class="quantity-controls">
                                        <button class="qty-btn minus" onclick="changeQuantity('<?php echo $equipment['id']; ?>', -1)">-</button>
                                        <span class="quantity" id="<?php echo $equipment['id']; ?>-qty">0</span>
                                        <button class="qty-btn plus" onclick="changeQuantity('<?php echo $equipment['id']; ?>', 1)">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div id="details" class="tab-content">
                <div class="booking-summary">
                    <div class="selected-date-display">
                        <strong>Selected date: <?php echo date('F j, Y', strtotime($selected_date)); ?></strong>
                    </div>
                    
                    <h3>Court Bookings</h3>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Court</th>
                                <th>Schedule</th>
                                <th>Sub total</th>
                            </tr>
                        </thead>
                        <tbody id="court-summary">
                            <!-- Court bookings will be populated here -->
                        </tbody>
                    </table>

                    <h3>Equipment Rental</h3>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody id="equipment-summary">
                            <!-- Equipment will be populated here -->
                        </tbody>
                    </table>

                    <div class="total-section">
                        <span class="total-label">TOTAL:</span>
                        <span class="total-amount" id="total-amount">0</span>
                    </div>
                </div>
            </div>
           
            <div class="proceed-section">
                <button class="back-btn" onclick="goBack()">Back</button>
                <button class="proceed-btn" onclick="proceedToNext()">Proceed</button>
            </div>
            <?php endif; ?>

            <?php if ($current_step == 3): ?>
            <!-- Payment Method Selection -->
            <div class="payment-section">
                <div class="payment-header">
                    <span class="payment-title">Select payment method:</span>
                </div>

                <div class="reference-banner">
                    <span>Reference Number: <?php echo $_SESSION['reference_number']; ?></span>
                </div>

                <div class="selected-date-display">
                    <strong>Selected date: <?php echo date('F j, Y', strtotime($selected_date)); ?></strong>
                </div>

                <div class="user-info">
                    <div class="info-row">
                        <div class="info-field">
                            <label>Name:</label>
                            <input type="text" placeholder="Enter your Complete Name" name="name" required>
                        </div>
                        <div class="info-field">
                            <label>Contact Number:</label>
                            <input type="tel" placeholder="Enter your Contact Number" name="contact" required>
                        </div>
                        <div class="info-field">
                            <label>Email Address:</label>
                            <input type="email" placeholder="Enter your Email Address" name="email" required>
                        </div>
                    </div>
                </div>

                <div class="booking-summary">
                    <h3>Court Bookings</h3>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Court</th>
                                <th>Schedule</th>
                                <th>Sub total</th>
                            </tr>
                        </thead>
                        <tbody id="payment-court-summary">
                            <!-- Court bookings will be populated here -->
                        </tbody>
                    </table>

                    <h3>Equipment Rental</h3>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody id="payment-equipment-summary">
                            <!-- Equipment will be populated here -->
                        </tbody>
                    </table>

                    <div class="total-section">
                        <span class="total-label">TOTAL:</span>
                        <span class="total-amount" id="payment-total">0</span>
                    </div>
                </div>

                <div class="payment-methods">
                    <h3>Payment method:</h3>
                    <div class="payment-options">
                        <div class="payment-option" onclick="selectPayment('gcash')">
                            <div class="payment-icon gcash-icon">G</div>
                            <span>GCash</span>
                        </div>
                        <div class="payment-option" onclick="selectPayment('maya')">
                            <div class="payment-icon maya-icon">maya</div>
                            <span>Maya</span>
                        </div>
                        <div class="payment-option" onclick="selectPayment('grabpay')">
                            <div class="payment-icon grabpay-icon">Grab Pay</div>
                            <span>GrabPay</span>
                        </div>
                        <div class="payment-option" onclick="selectPayment('banking')">
                            <div class="payment-icon banking-icon">🏦</div>
                            <span>Online Banking</span>
                        </div>
                    </div>
                </div>

                <div class="payment-policy">
                    <h4>Payment Confirmation & Refund Policy:</h4>
                    <p>By proceeding with payment, you confirm that you agreed to our payment terms and conditions.. If you agree, please continue with the payment.</p>
                </div>

                <div class="pay-now-section">
                    <button class="back-btn" onclick="goBack()">Back</button>
                    <button class="pay-now-btn" onclick="processPayment()">
                        <i class="fas fa-credit-card"></i>
                        Pay now
                    </button>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <script>
        // Declare and initialize variables before loading external script
        var selectedCourts = <?php echo json_encode($selected_courts); ?>;
        var selectedEquipment = <?php echo json_encode($selected_equipment); ?>;
        var currentStep = <?php echo $current_step; ?>;
        
        console.log('Variables initialized:', {
            selectedCourts: selectedCourts,
            selectedEquipment: selectedEquipment,
            currentStep: currentStep
        });
    </script>
    <script src="Assets/js/book.js"></script>
</body>
</html>
