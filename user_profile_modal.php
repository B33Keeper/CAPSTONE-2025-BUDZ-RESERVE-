<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/db.php';

$up_email_value = '';
$up_avatar_url = 'Assets/img/home-page/Ellipse 1.png'; // preset fallback
if (isset($_SESSION['username']) && !empty($_SESSION['username'])) {
    $u = $_SESSION['username'];
    if ($stmt = $conn->prepare("SELECT email, profile_picture FROM users WHERE username = ? LIMIT 1")) {
        $stmt->bind_param("s", $u);
        if ($stmt->execute()) {
            $res = $stmt->get_result();
            if ($row = $res->fetch_assoc()) {
                $up_email_value = $row['email'] ?? '';
                if (!empty($row['profile_picture'])) {
                    $up_avatar_url = $row['profile_picture'];
                }
            }
        }
        $stmt->close();
    }
}
?>
<!-- User Profile Modal (Bootstrap + up- namespace) -->
<div class="modal fade" id="upModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content up-modal">
      <div class="up-left">
            <div class="up-avatar">
                <div class="up-avatar-circle">
                    <img src="<?php echo htmlspecialchars($up_avatar_url); ?>" alt="Avatar" class="up-avatar-img">
                </div>
                <form id="up-photo-form" class="d-none" method="POST" enctype="multipart/form-data" action="upload_avatar.php">
                    <input type="file" name="avatar" id="up-photo-input" accept="image/*">
                </form>
                <button class="up-edit-photo" type="button" id="up-photo-trigger">Edit profile picture</button>
            </div>
            <div class="up-username">
                <i class="fa-solid fa-mars-and-venus"></i>
                <span><?php echo isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User'; ?></span>
            </div>
            <nav class="up-nav">
                <button class="up-nav-btn up-nav-manage up-nav-btn--active" data-panel="manage">
                    <i class="fa-regular fa-user"></i>
                    <span>Manage profile</span>
                </button>
                <button class="up-nav-btn up-nav-password" data-panel="password">
                    <i class="fa-solid fa-lock"></i>
                    <span>Change password</span>
                </button>
                <a class="up-logout" href="logout.php">Logout</a>
            </nav>
      </div>
      <div class="up-right">
            <!-- Manage Profile Panel -->
            <section class="up-panel up-panel-manage up-panel--active" aria-labelledby="up-title">
                <h2 class="up-title" id="up-title">My profile</h2>
                <form class="up-form" id="up-manage-form" autocomplete="off">
                    <label class="up-field">
                        <span class="up-label">Username:</span>
                        <div class="up-input-wrap">
                            <i class="fa-regular fa-user"></i>
                            <input type="text" id="up-username" name="username" placeholder="Username" value="<?php echo isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : ''; ?>">
                        </div>
                    </label>
                    <label class="up-field">
                        <span class="up-label">Email:</span>
                        <div class="up-input-wrap">
                            <i class="fa-regular fa-envelope"></i>
                            <input type="email" id="up-email" name="email" placeholder="email@example.com" value="<?php echo htmlspecialchars($up_email_value); ?>">
                        </div>
                    </label>
                    <div class="up-actions">
                        <button type="submit" class="up-primary">Save Changes</button>
                    </div>
                </form>
            </section>
            <!-- Change Password Panel -->
            <section class="up-panel up-panel-password" aria-labelledby="up-title-password">
                <h2 class="up-title" id="up-title-password">Change Password</h2>
                <form class="up-form" id="up-password-form" autocomplete="off">
                    <label class="up-field">
                        <span class="up-label">Enter current password:</span>
                        <div class="up-input-wrap up-has-toggle">
                            <input type="password" id="up-current" name="current_password" placeholder="Current password">
                            <button type="button" class="up-eye" data-target="up-current" aria-label="Toggle visibility"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </label>
                    <label class="up-field">
                        <span class="up-label">New password:</span>
                        <div class="up-input-wrap up-has-toggle">
                            <input type="password" id="up-new" name="new_password" placeholder="New password">
                            <button type="button" class="up-eye" data-target="up-new" aria-label="Toggle visibility"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </label>
                    <label class="up-field">
                        <span class="up-label">Retype new password</span>
                        <div class="up-input-wrap up-has-toggle">
                            <input type="password" id="up-confirm" name="confirm_password" placeholder="Retype new password">
                            <button type="button" class="up-eye" data-target="up-confirm" aria-label="Toggle visibility"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </label>
                    <div class="up-actions">
                        <button type="submit" class="up-primary">Save Changes</button>
                    </div>
                </form>
            </section>
      </div>
      <button class="up-close" type="button" data-bs-dismiss="modal" aria-label="Close">×</button>
    </div>
  </div>
</div>

