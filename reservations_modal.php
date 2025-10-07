<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/db.php';

$rr_current_rows = [];
$rr_history_rows = [];
if (isset($_SESSION['username'])) {
  $u = $_SESSION['username'];
  // Fetch current user's id
  if ($stmt = $conn->prepare("SELECT id FROM users WHERE username = ? LIMIT 1")) {
    $stmt->bind_param("s", $u);
    if ($stmt->execute()) {
      $res = $stmt->get_result();
      if ($userRow = $res->fetch_assoc()) {
        $uid = (int)$userRow['id'];
        // Upcoming/current reservations (>= today)
        if ($q = $conn->prepare("SELECT Reservation_ID, Reservation_Date, Start_Time, End_Time, Court_ID, Status FROM reservations WHERE User_ID = ? AND Reservation_Date >= CURDATE() ORDER BY Reservation_Date ASC, Start_Time ASC")) {
          $q->bind_param("i", $uid);
          if ($q->execute()) {
            $rs = $q->get_result();
            while ($row = $rs->fetch_assoc()) {
              $rr_current_rows[] = [
                'id' => $row['Reservation_ID'],
                'date' => $row['Reservation_Date'],
                'time_range' => substr($row['Start_Time'],0,5).'-'.substr($row['End_Time'],0,5),
                'court_no' => 'Court ' . $row['Court_ID'],
                'balance' => ($row['Status'] === 'Confirmed' ? 'Paid' : 'Unpaid'),
                'payment_method' => 'GCash'
              ];
            }
          }
          $q->close();
        }
        // History (< today)
        if ($q2 = $conn->prepare("SELECT Reservation_ID, Reservation_Date, Start_Time, End_Time, Court_ID, Status FROM reservations WHERE User_ID = ? AND Reservation_Date < CURDATE() ORDER BY Reservation_Date DESC, Start_Time DESC")) {
          $q2->bind_param("i", $uid);
          if ($q2->execute()) {
            $rs2 = $q2->get_result();
            while ($row = $rs2->fetch_assoc()) {
              $rr_history_rows[] = [
                'id' => $row['Reservation_ID'],
                'date' => $row['Reservation_Date'],
                'time_range' => substr($row['Start_Time'],0,5).'-'.substr($row['End_Time'],0,5),
                'court_no' => 'Court ' . $row['Court_ID'],
                'balance' => ($row['Status'] === 'Confirmed' ? 'Paid' : 'Unpaid'),
                'payment_method' => 'GCash'
              ];
            }
          }
          $q2->close();
        }
      }
    }
    $stmt->close();
  }
}
?>

<div class="modal fade" id="rrModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content rr-modal">
      <div class="rr-left">
        <button type="button" class="rr-tab rr-tab--active" data-panel="current">
          <i class="fa-solid fa-table"></i>
          <span>My reservations</span>
        </button>
        <button type="button" class="rr-tab" data-panel="history">
          <i class="fa-regular fa-clock"></i>
          <span>Reservation History</span>
        </button>
      </div>
      <div class="rr-right">
        <section class="rr-panel" id="rr-current">
          <div class="rr-table-wrap">
            <table class="table rr-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Court no.</th>
                  <th>Balance</th>
                  <th>Mode of Payment</th>
                </tr>
              </thead>
              <tbody>
              <?php foreach($rr_current_rows as $r): ?>
                <tr>
                  <td><?php echo htmlspecialchars($r['id'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['date'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['time_range'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['court_no'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['balance'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['payment_method'] ?? ''); ?></td>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
            <div class="rr-note">
              <p>Note: Payment, Refund & Cancellation</p>
              <ul>
                <li>Pay the given price in order to make reservation.</li>
                <li>Strictly “No Cancellation and refund policy” once you reserved a court there is no cancellation.</li>
              </ul>
            </div>
          </div>
        </section>
        <section class="rr-panel" id="rr-history">
          <div class="rr-table-wrap">
            <table class="table rr-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Court no.</th>
                  <th>Balance</th>
                  <th>Mode of Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
              <?php foreach($rr_history_rows as $r): ?>
                <tr data-reservation-id="<?php echo htmlspecialchars($r['id']); ?>">
                  <td><?php echo htmlspecialchars($r['id'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['date'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['time_range'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['court_no'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['balance'] ?? ''); ?></td>
                  <td><?php echo htmlspecialchars($r['payment_method'] ?? ''); ?></td>
                  <td>
                    <img src="Assets/icons/recycle-bin 1.png" alt="Delete" class="rr-delete" title="Delete reservation">
                  </td>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
            <div class="rr-pagination">
              <button type="button" class="btn btn-light rr-page-prev" disabled><i class="fa-solid fa-angle-left"></i></button>
              <span class="rr-page-indicator">Page 1 out of 3</span>
              <button type="button" class="btn btn-light rr-page-next"><i class="fa-solid fa-angle-right"></i></button>
            </div>
            <div class="rr-note">
              <p>Note: Payment, Refund & Cancellation</p>
              <ul>
                <li>Pay the given price in order to make reservation.</li>
                <li>Strictly “No Cancellation and refund policy” once you reserved a court there is no cancellation.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
      <button class="rr-close" type="button" data-bs-dismiss="modal" aria-label="Close">×</button>
    </div>
  </div>
</div>

