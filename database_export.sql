-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Nov 09, 2025 at 01:01 PM
-- Server version: 8.0.37
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `budz_reserve`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `announcement_type` enum('text','image') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `image_url`, `announcement_type`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 'Queueing Schedule', NULL, '/uploads/announcements/1762278216805-87989781.jpg', 'image', 0, 8, '2025-11-04 17:43:36.872851', '2025-11-08 17:34:06.000000'),
(3, 'Queueing Schedule', NULL, '/uploads/announcements/1762278583346-669654582.jpg', 'image', 0, 8, '2025-11-04 17:49:43.374438', '2025-11-05 09:36:18.000000'),
(4, 'Queueing Schedule', NULL, '/uploads/announcements/1762278596052-718407516.jpg', 'image', 1, 8, '2025-11-04 17:49:56.092527', '2025-11-08 17:34:10.000000'),
(5, 'We are Close', 'We are close this upcoming november 1', NULL, 'text', 0, 8, '2025-11-04 17:58:49.981190', '2025-11-04 17:58:59.000000'),
(7, 'Pogi', NULL, '/uploads/announcements/1762623246631-725578571.jpg', 'image', 0, 8, '2025-11-08 17:34:06.680171', '2025-11-08 17:34:10.000000');

-- --------------------------------------------------------

--
-- Table structure for table `courts`
--

CREATE TABLE `courts` (
  `Court_Id` int NOT NULL,
  `Court_Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Status` enum('Available','Maintenance','Unavailable') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Available',
  `Price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `Updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courts`
--

INSERT INTO `courts` (`Court_Id`, `Court_Name`, `Status`, `Price`, `Created_at`, `Updated_at`) VALUES
(1, 'Court 1', 'Available', 280.00, '2025-10-14 20:57:26.558877', '2025-11-08 17:11:40.000000'),
(2, 'Court 2', 'Maintenance', 250.00, '2025-10-14 20:57:26.558877', '2025-11-04 09:31:09.000000'),
(3, 'Court 3', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-11-04 15:47:57.000000'),
(4, 'Court 4', 'Maintenance', 220.00, '2025-10-14 20:57:26.558877', '2025-11-04 09:31:11.000000'),
(5, 'Court 5', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(6, 'Court 6', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(7, 'Court 7', 'Available', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(8, 'Court 8', 'Maintenance', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(9, 'Court 9', 'Available', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(10, 'Court 10', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(11, 'Court 11', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(12, 'Court 12', 'Available', 350.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(13, 'Court 13', 'Available', 250.00, '2025-10-31 10:48:29.719865', '2025-11-04 09:50:38.000000'),
(15, 'Court 14', 'Available', 250.00, '2025-11-04 13:12:07.429142', '2025-11-04 13:12:07.429142');

-- --------------------------------------------------------

--
-- Table structure for table `equipments`
--

CREATE TABLE `equipments` (
  `id` int NOT NULL,
  `equipment_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `stocks` int NOT NULL DEFAULT '0',
  `price` decimal(10,2) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Available',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `image_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '/assets/img/equipments/racket.png'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `equipments`
--

INSERT INTO `equipments` (`id`, `equipment_name`, `stocks`, `price`, `description`, `status`, `created_at`, `updated_at`, `image_path`) VALUES
(6, 'Yonex Astrox lite 45i', 2, 100.00, '', 'Available', '2025-11-08 11:18:33.306778', '2025-11-08 12:25:51.000000', '/uploads/general/1762604751839-252024275.png'),
(9, 'Lining 600', 1, 160.00, '', 'Unavailable', '2025-11-08 13:07:30.575247', '2025-11-08 14:45:40.000000', '/uploads/general/1762607250545-257793203.png'),
(10, 'Apacs Power ', 1, 150.00, '', 'Available', '2025-11-08 14:05:45.054763', '2025-11-08 17:36:31.000000', '/uploads/general/1762617313221-750455021.png'),
(11, 'Yonex Power Play', 1, 100.00, '', 'Available', '2025-11-08 14:06:56.971103', '2025-11-08 14:29:49.000000', '/uploads/general/1762610816944-617619289.png'),
(12, 'Victor Cluster 1', 1, 125.00, '', 'Available', '2025-11-08 14:08:13.446309', '2025-11-08 14:08:13.446309', '/uploads/general/1762610893408-547214709.png');

-- --------------------------------------------------------

--
-- Table structure for table `equipment_rentals`
--

CREATE TABLE `equipment_rentals` (
  `id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `user_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notes` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `equipment_rentals`
--

INSERT INTO `equipment_rentals` (`id`, `reservation_id`, `user_id`, `total_amount`, `notes`, `created_at`, `updated_at`) VALUES
(1, 149, 1, 320.00, NULL, '2025-10-30 13:28:13.824265', '2025-10-30 13:28:13.000000'),
(2, 150, 1, 230.00, NULL, '2025-10-30 13:41:20.933232', '2025-10-30 13:41:21.000000'),
(3, 151, 1, 40.00, NULL, '2025-10-31 01:09:06.393895', '2025-10-31 01:09:06.000000'),
(4, 153, 1, 150.00, NULL, '2025-10-31 01:11:10.242484', '2025-10-31 01:11:10.000000'),
(5, 155, 1, 150.00, NULL, '2025-10-31 01:12:10.932383', '2025-10-31 01:12:10.000000'),
(6, 157, 1, 160.00, NULL, '2025-10-31 01:13:53.678911', '2025-10-31 01:13:53.000000'),
(7, 158, 1, 300.00, NULL, '2025-10-31 01:15:07.527575', '2025-10-31 01:15:07.000000'),
(8, 159, 1, 80.00, NULL, '2025-10-31 02:43:00.793482', '2025-10-31 02:43:00.000000'),
(9, 161, 1, 300.00, NULL, '2025-10-31 02:44:45.240235', '2025-10-31 02:44:45.000000'),
(10, 164, 1, 150.00, NULL, '2025-10-31 03:18:09.102222', '2025-10-31 03:18:09.000000');

-- --------------------------------------------------------

--
-- Table structure for table `equipment_rental_items`
--

CREATE TABLE `equipment_rental_items` (
  `id` int NOT NULL,
  `rental_id` int NOT NULL,
  `equipment_id` int NOT NULL,
  `quantity` int NOT NULL,
  `hours` int NOT NULL,
  `hourly_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `equipment_rental_items`
--

INSERT INTO `equipment_rental_items` (`id`, `rental_id`, `equipment_id`, `quantity`, `hours`, `hourly_price`, `subtotal`, `created_at`) VALUES
(1, 1, 2, 1, 2, 80.00, 320.00, '2025-10-30 13:28:13.892574'),
(2, 2, 1, 1, 1, 150.00, 150.00, '2025-10-30 13:41:20.955639'),
(3, 2, 2, 1, 1, 80.00, 80.00, '2025-10-30 13:41:20.998462'),
(4, 3, 5, 1, 2, 20.00, 40.00, '2025-10-31 01:09:06.419475'),
(5, 4, 1, 1, 1, 150.00, 150.00, '2025-10-31 01:11:10.270803'),
(6, 5, 1, 1, 1, 150.00, 150.00, '2025-10-31 01:12:10.952737'),
(7, 6, 2, 1, 2, 80.00, 160.00, '2025-10-31 01:13:53.733347'),
(8, 7, 3, 1, 3, 100.00, 300.00, '2025-10-31 01:15:07.551766'),
(9, 8, 2, 1, 1, 80.00, 80.00, '2025-10-31 02:43:00.824241'),
(10, 9, 1, 2, 1, 150.00, 300.00, '2025-10-31 02:44:45.301931'),
(11, 10, 1, 1, 1, 150.00, 150.00, '2025-10-31 03:18:09.132273');

-- --------------------------------------------------------

--
-- Table structure for table `gallery`
--

CREATE TABLE `gallery` (
  `id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_path` varchar(500) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `gallery`
--

INSERT INTO `gallery` (`id`, `title`, `description`, `image_path`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Group Photo 1', 'Client group photo from tournament', '/assets/img/home-page/GALLERY/IMAGE 1.jpg', 'active', 1, '2025-10-23 02:23:55.779686', '2025-10-23 02:23:56.071189'),
(2, 'Group Photo 2', 'Client group photo from event', '/assets/img/home-page/GALLERY/IMAGE 2.jpg', 'active', 2, '2025-10-23 02:23:55.779686', '2025-10-23 02:23:56.071189'),
(3, 'Group Photo 3', 'Client group photo from competition', '/assets/img/home-page/GALLERY/IMAGE 3.jpg', 'active', 3, '2025-10-23 02:23:55.779686', '2025-10-23 02:23:56.071189'),
(4, 'Group Photo 4', 'Client group photo from match', '/assets/img/home-page/GALLERY/IMAGE 4.jpg', 'active', 4, '2025-10-23 02:23:55.779686', '2025-10-23 02:23:56.071189'),
(5, 'Group Photo 5', 'Client group photo from championship', '/assets/img/home-page/GALLERY/IMAGE 5.jpg', 'active', 5, '2025-10-23 02:23:55.779686', '2025-10-23 02:23:56.071189'),
(6, 'Group Photo 6', 'Client group photo from finals', '/assets/img/home-page/GALLERY/IMAGE 6.jpg', 'active', 6, '2025-10-23 02:23:55.779686', '2025-10-23 02:23:56.071189'),
(8, 'Ivan Louis Cielo', 'Singles A Badminton Champion', '/uploads/gallery/1762284209691-651939627.jpg', 'active', 0, '2025-11-04 19:23:29.707899', '2025-11-04 19:23:29.707899'),
(10, 'Flower', NULL, '/uploads/gallery/1762693120005-360474136.jpg', 'active', 0, '2025-11-09 12:58:40.046153', '2025-11-09 12:58:40.046153');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int NOT NULL,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES
(1, 1731082800000, 'AddEquipmentSpecFields1731082800000');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('GCash','Maya','GrabPay','Online Banking','Cash') COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('Pending','Completed','Failed','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pending',
  `transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reference_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `reservation_id`, `amount`, `payment_method`, `status`, `transaction_id`, `reference_number`, `notes`, `created_at`, `updated_at`) VALUES
(68, 127, 220.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761209997804', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 08:59:57.824040', '2025-10-23 08:59:57.824040'),
(69, 126, 220.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761209997808', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 08:59:57.832210', '2025-10-23 08:59:57.832210'),
(70, 128, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210255760', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:04:15.770842', '2025-10-23 09:04:15.770842'),
(71, 129, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210255805', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:04:15.810440', '2025-10-23 09:04:15.810440'),
(72, 130, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210306710', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:05:06.748664', '2025-10-23 09:05:06.748664'),
(73, 131, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210306850', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:05:06.867594', '2025-10-23 09:05:06.867594'),
(74, 132, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210412805', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:06:52.829794', '2025-10-23 09:06:52.829794'),
(75, 133, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210413207', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:06:53.219679', '2025-10-23 09:06:53.219679'),
(76, 134, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210429129', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:07:09.171961', '2025-10-23 09:07:09.171961'),
(77, 135, 250.00, 'GCash', 'Completed', '{CHECKOUT_SESSION_ID}', 'REF1761210429282', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:07:09.302054', '2025-10-23 09:07:09.302054'),
(79, 136, 220.00, 'Maya', 'Completed', 'pay_818hur8BGQvst4DnLEyrYL9g', 'REF1761213773964', 'Badminton Court Booking - October 31, 2025', '2025-10-23 10:02:53.972219', '2025-10-23 10:02:53.972219'),
(80, 137, 220.00, 'Maya', 'Completed', 'pay_test123', 'REF1761213789495', 'Test payment - paymaya', '2025-10-23 10:03:09.503216', '2025-10-23 10:03:09.503216'),
(81, 138, 250.00, 'GrabPay', 'Completed', 'pay_coF9JHRWYN4JagiWDsvMFtP1', 'REF1761214193180', 'Badminton Court Booking - October 31, 2025', '2025-10-23 10:09:53.191372', '2025-10-23 10:09:53.191372'),
(82, 139, 220.00, 'Maya', 'Completed', 'pay_test123', 'REF1761814731593', 'Test payment - paymaya', '2025-10-30 08:58:51.599719', '2025-10-30 08:58:51.599719'),
(83, 140, 220.00, 'Maya', 'Completed', 'pay_test123', 'REF1761816776719', 'Test payment - paymaya', '2025-10-30 09:32:56.724713', '2025-10-30 09:32:56.724713'),
(84, 141, 220.00, 'Maya', 'Completed', 'pay_test123', 'REF1761818092523', 'Test payment - paymaya', '2025-10-30 09:54:52.529734', '2025-10-30 09:54:52.529734'),
(85, 142, 220.00, 'Maya', 'Completed', 'pay_test123', 'REF1761818265035', 'Test payment - paymaya', '2025-10-30 09:57:45.042454', '2025-10-30 09:57:45.042454'),
(86, 143, 220.00, 'Maya', 'Completed', 'pay_test123', 'REF1761820897448', 'Test payment - paymaya', '2025-10-30 10:41:37.453059', '2025-10-30 10:41:37.453059'),
(87, 144, 250.00, 'GrabPay', 'Completed', 'pay_wgyXjDbe6pSZiJzKn6Wwj2rB', 'REF1761823157168', 'Badminton Court Booking - November 3, 2025', '2025-10-30 11:19:17.174508', '2025-10-30 11:19:17.174508'),
(88, 145, 350.00, 'GCash', 'Completed', 'pay_gn1XHrmK9XSaBNc3zBXMKuCi', 'REF1761823251011', 'Badminton Court Booking - December 10, 2025', '2025-10-30 11:20:51.019615', '2025-10-30 11:20:51.019615'),
(90, 146, 370.00, 'GrabPay', 'Completed', 'pay_kupruQghp4qaLKLPTURbuFVd', 'REF1761825279474', 'Badminton Court Booking - October 31, 2025', '2025-10-30 11:54:39.479324', '2025-10-30 11:54:39.479324'),
(91, 147, 750.00, 'GrabPay', 'Completed', 'pay_vNLam3keKEEuLgYahNh5V4AF', 'REF1761828198209', 'Badminton Court Booking - February 24, 2026', '2025-10-30 12:43:18.215466', '2025-10-30 12:43:18.215466'),
(92, 148, 550.00, 'GCash', 'Completed', 'pay_ioESVFmK2TQUdibbpVKuDZfw', 'REF1761830333249', 'Badminton Court Booking - January 1, 2026', '2025-10-30 13:18:53.267687', '2025-10-30 13:18:53.267687'),
(93, 149, 570.00, 'Maya', 'Completed', 'pay_YdSshtGyX2uyqJofw7pLMhTo', 'REF1761830893785', 'Badminton Court Booking - December 25, 2025', '2025-10-30 13:28:13.790329', '2025-10-30 13:28:13.790329'),
(94, 150, 480.00, 'Maya', 'Completed', 'pay_ipjteGNvKBJ4TDtJsnHxaN7P', 'REF1761831680901', 'Badminton Court Booking - December 20, 2025', '2025-10-30 13:41:20.908500', '2025-10-30 13:41:20.908500'),
(95, 151, 640.00, 'GrabPay', 'Completed', 'pay_nhDhTvbYdGCcqN4xHGukNVmk', 'REF1761872946367', 'Badminton Court Booking - November 25, 2025', '2025-10-31 01:09:06.373445', '2025-10-31 01:09:06.373445'),
(96, 153, 650.00, 'Maya', 'Completed', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'REF1761873070189', 'Badminton Court Booking - January 1, 2026', '2025-10-31 01:11:10.200240', '2025-10-31 01:11:10.200240'),
(97, 155, 650.00, 'Maya', 'Completed', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'REF1761873130909', 'Badminton Court Booking - January 1, 2026', '2025-10-31 01:12:10.913757', '2025-10-31 01:12:10.913757'),
(98, 157, 410.00, 'GrabPay', 'Completed', 'pay_EsGWksE8J8wprQSSMTkLVGpu', 'REF1761873233625', 'Badminton Court Booking - February 2, 2026', '2025-10-31 01:13:53.632449', '2025-10-31 01:13:53.632449'),
(99, 158, 550.00, 'Maya', 'Completed', 'pay_hqk3PsSh5G235MiBb5L1GAZt', 'REF1761873307493', 'Badminton Court Booking - October 31, 2025', '2025-10-31 01:15:07.500067', '2025-10-31 01:15:07.500067'),
(100, 159, 580.00, 'GrabPay', 'Completed', 'pay_ar2LUR4cdfPnSNVkNjz5YD1D', 'REF1761878580723', 'Badminton Court Booking - October 31, 2025', '2025-10-31 02:43:00.735427', '2025-10-31 02:43:00.735427'),
(101, 161, 900.00, 'Maya', 'Completed', 'pay_aEAQhkY7acsRqEyiV1U9dQ17', 'REF1761878685183', 'Badminton Court Booking - October 31, 2025', '2025-10-31 02:44:45.194355', '2025-10-31 02:44:45.194355'),
(102, 163, 250.00, 'Maya', 'Completed', 'pay_cHWzQisrsfeu8rPsXiWzPFic', 'REF1761880104045', 'Badminton Court Booking - November 25, 2025', '2025-10-31 03:08:24.072206', '2025-10-31 03:08:24.072206'),
(103, 164, 400.00, 'GrabPay', 'Completed', 'pay_jXPVqN7b5F8qKJvuRZVCqAE5', 'REF1761880689055', 'Badminton Court Booking - January 1, 2026', '2025-10-31 03:18:09.077328', '2025-10-31 03:18:09.077328'),
(104, 165, 500.00, 'Maya', 'Completed', 'pay_sxTigqvKzPHcr9krJsZWosPf', 'REF1761908683810', 'Badminton Court Booking - October 31, 2025', '2025-10-31 11:04:43.816536', '2025-10-31 11:04:43.816536'),
(105, 167, 220.00, 'Maya', 'Completed', 'pay_test123', 'REF1762605695257', 'Test payment - paymaya', '2025-11-08 12:41:35.260086', '2025-11-08 12:41:35.260086'),
(106, 168, 250.00, 'Cash', 'Completed', 'CASH1762605869380813', '1762605857662LT0VN', 'Payment received in cash - Walk-in customer: Ivan', '2025-11-08 12:44:29.385127', '2025-11-08 12:44:29.385127'),
(107, 169, 1070.00, 'Cash', 'Completed', 'CASH1762607551054443', '17626075492795UFGY', 'Payment received in cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 13:12:31.056846', '2025-11-08 13:12:31.056846'),
(108, 173, 250.00, 'Cash', 'Completed', 'CASH1762607598299150', '1762607596958X96DJ', 'Payment received in cash - Walk-in customer: dawd', '2025-11-08 13:13:18.302855', '2025-11-08 13:13:18.302855'),
(109, 174, 750.00, 'Cash', 'Completed', 'CASH1762635695055797', '17626356937289O2MF', 'Payment received in cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 21:01:35.060592', '2025-11-08 21:01:35.060592'),
(110, 177, 250.00, 'Cash', 'Completed', 'CASH1762635877956211', '17626358764855QKHD', 'Payment received in cash - Walk-in customer: Filbert', '2025-11-08 21:04:37.964209', '2025-11-08 21:04:37.964209');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `Reservation_ID` int NOT NULL,
  `User_ID` int NOT NULL,
  `Court_ID` int NOT NULL,
  `Reservation_Date` date NOT NULL,
  `Start_Time` time NOT NULL,
  `End_Time` time NOT NULL,
  `Status` enum('Pending','Confirmed','Cancelled','Completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pending',
  `Total_Amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Reference_Number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Paymongo_Reference_Number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `Updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`Reservation_ID`, `User_ID`, `Court_ID`, `Reservation_Date`, `Start_Time`, `End_Time`, `Status`, `Total_Amount`, `Reference_Number`, `Paymongo_Reference_Number`, `Notes`, `Created_at`, `Updated_at`) VALUES
(126, 1, 4, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 220.00, 'REF1761209997625', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 08:59:57.639695', '2025-11-08 20:04:49.000000'),
(127, 1, 4, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 220.00, 'REF1761209997514', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 08:59:57.589384', '2025-11-08 20:04:49.000000'),
(128, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Completed', 250.00, 'REF1761210255683', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:04:15.708368', '2025-11-08 20:04:49.000000'),
(129, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Completed', 250.00, 'REF1761210255764', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:04:15.776600', '2025-11-08 20:04:49.000000'),
(130, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Completed', 250.00, 'REF1761210306465', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:05:06.527248', '2025-11-08 20:04:49.000000'),
(131, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Completed', 250.00, 'REF1761210306786', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:05:06.798997', '2025-11-08 20:04:49.000000'),
(132, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Completed', 250.00, 'REF1761210412107', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:06:52.138046', '2025-11-08 20:04:49.000000'),
(133, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Completed', 250.00, 'REF1761210412814', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:06:52.837403', '2025-11-08 20:04:49.000000'),
(134, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Completed', 250.00, 'REF1761210428945', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:07:08.982440', '2025-11-08 20:04:49.000000'),
(135, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Completed', 250.00, 'REF1761210429084', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:07:09.098226', '2025-11-08 20:04:49.000000'),
(136, 1, 1, '2025-10-31', '09:00:00', '10:00:00', 'Completed', 220.00, 'REF1761213772967', 'pay_818hur8BGQvst4DnLEyrYL9g', 'Payment via Paymongo - pay_818hur8BGQvst4DnLEyrYL9g', '2025-10-23 10:02:53.236320', '2025-11-08 20:04:49.000000'),
(137, 1, 4, '2025-10-31', '12:00:00', '01:00:00', 'Completed', 220.00, 'REF1761213785709', 'test_payment_id', 'Test reservation via webhook', '2025-10-23 10:03:09.460394', '2025-11-08 20:04:49.000000'),
(138, 1, 1, '2025-10-31', '09:00:00', '10:00:00', 'Completed', 250.00, 'REF1761214193082', 'pay_coF9JHRWYN4JagiWDsvMFtP1', 'Payment via Paymongo - pay_coF9JHRWYN4JagiWDsvMFtP1', '2025-10-23 10:09:53.100197', '2025-11-08 20:04:49.000000'),
(139, 1, 2, '2025-10-30', '04:00:00', '05:00:00', 'Completed', 250.00, 'REF1761814727622', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 08:58:51.541397', '2025-11-08 20:04:49.000000'),
(140, 1, 1, '2025-11-01', '05:00:00', '06:00:00', 'Completed', 250.00, 'REF1761816775470', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 09:32:56.653191', '2025-11-08 20:04:49.000000'),
(141, 1, 1, '2025-11-02', '07:00:00', '08:00:00', 'Completed', 250.00, 'REF1761818072449', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 09:54:52.466239', '2025-11-08 20:04:49.000000'),
(142, 1, 2, '2025-10-30', '10:00:00', '11:00:00', 'Completed', 250.00, 'REF1761818215156', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 09:57:45.012253', '2025-11-08 20:04:49.000000'),
(143, 1, 1, '2025-11-01', '10:00:00', '11:00:00', 'Completed', 250.00, 'REF1761820858081', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 10:41:37.359419', '2025-11-08 20:04:49.000000'),
(144, 1, 1, '2025-11-03', '06:00:00', '07:00:00', 'Completed', 250.00, 'REF1761823157093', 'pay_wgyXjDbe6pSZiJzKn6Wwj2rB', 'Payment via Paymongo - pay_wgyXjDbe6pSZiJzKn6Wwj2rB', '2025-10-30 11:19:17.113939', '2025-11-08 20:04:49.000000'),
(145, 1, 12, '2025-12-10', '10:00:00', '11:00:00', 'Confirmed', 350.00, 'REF1761823250954', 'pay_gn1XHrmK9XSaBNc3zBXMKuCi', 'Payment via Paymongo - pay_gn1XHrmK9XSaBNc3zBXMKuCi', '2025-10-30 11:20:50.963584', '2025-10-30 11:20:50.963584'),
(146, 1, 7, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 220.00, 'REF1761825279438', 'pay_kupruQghp4qaLKLPTURbuFVd', 'Payment via Paymongo - pay_kupruQghp4qaLKLPTURbuFVd', '2025-10-30 11:54:39.444297', '2025-11-08 20:04:49.000000'),
(147, 1, 12, '2026-02-24', '08:00:00', '09:00:00', 'Confirmed', 350.00, 'REF1761828198125', 'pay_vNLam3keKEEuLgYahNh5V4AF', 'Payment via Paymongo - pay_vNLam3keKEEuLgYahNh5V4AF', '2025-10-30 12:43:18.141390', '2025-10-30 12:43:18.141390'),
(148, 1, 1, '2026-01-01', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761830333111', 'pay_ioESVFmK2TQUdibbpVKuDZfw', 'Payment via Paymongo - pay_ioESVFmK2TQUdibbpVKuDZfw', '2025-10-30 13:18:53.163708', '2025-10-30 13:18:53.163708'),
(149, 1, 2, '2025-12-25', '11:00:00', '12:00:00', 'Confirmed', 250.00, 'REF1761830893712', 'pay_YdSshtGyX2uyqJofw7pLMhTo', 'Payment via Paymongo - pay_YdSshtGyX2uyqJofw7pLMhTo', '2025-10-30 13:28:13.745469', '2025-10-30 13:28:13.745469'),
(150, 1, 6, '2025-12-20', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761831680847', 'pay_ipjteGNvKBJ4TDtJsnHxaN7P', 'Payment via Paymongo - pay_ipjteGNvKBJ4TDtJsnHxaN7P', '2025-10-30 13:41:20.871192', '2025-10-30 13:41:20.871192'),
(151, 1, 11, '2025-11-25', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761872946311', 'pay_nhDhTvbYdGCcqN4xHGukNVmk', 'Payment via Paymongo - pay_nhDhTvbYdGCcqN4xHGukNVmk', '2025-10-31 01:09:06.324260', '2025-10-31 01:09:06.324260'),
(152, 1, 12, '2025-11-25', '08:00:00', '09:00:00', 'Confirmed', 350.00, 'REF1761872946349', 'pay_nhDhTvbYdGCcqN4xHGukNVmk', 'Payment via Paymongo - pay_nhDhTvbYdGCcqN4xHGukNVmk', '2025-10-31 01:09:06.352141', '2025-10-31 01:09:06.352141'),
(153, 1, 1, '2026-01-01', '09:00:00', '10:00:00', 'Confirmed', 250.00, 'REF1761873070120', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:11:10.128613', '2025-10-31 01:11:10.128613'),
(154, 1, 1, '2026-01-01', '10:00:00', '11:00:00', 'Confirmed', 250.00, 'REF1761873070149', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:11:10.155450', '2025-10-31 01:11:10.155450'),
(155, 1, 1, '2026-01-01', '09:00:00', '10:00:00', 'Confirmed', 250.00, 'REF1761873130835', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:12:10.840915', '2025-10-31 01:12:10.840915'),
(156, 1, 1, '2026-01-01', '10:00:00', '11:00:00', 'Confirmed', 250.00, 'REF1761873130888', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:12:10.895466', '2025-10-31 01:12:10.895466'),
(157, 1, 2, '2026-02-02', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761873233594', 'pay_EsGWksE8J8wprQSSMTkLVGpu', 'Payment via Paymongo - pay_EsGWksE8J8wprQSSMTkLVGpu', '2025-10-31 01:13:53.598846', '2025-10-31 01:13:53.598846'),
(158, 1, 1, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 250.00, 'REF1761873307466', 'pay_hqk3PsSh5G235MiBb5L1GAZt', 'Payment via Paymongo - pay_hqk3PsSh5G235MiBb5L1GAZt', '2025-10-31 01:15:07.475536', '2025-11-08 20:04:49.000000'),
(159, 1, 2, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 250.00, 'REF1761878580564', 'pay_ar2LUR4cdfPnSNVkNjz5YD1D', 'Payment via Paymongo - pay_ar2LUR4cdfPnSNVkNjz5YD1D', '2025-10-31 02:43:00.590646', '2025-11-08 20:04:49.000000'),
(160, 1, 5, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 250.00, 'REF1761878580690', 'pay_ar2LUR4cdfPnSNVkNjz5YD1D', 'Payment via Paymongo - pay_ar2LUR4cdfPnSNVkNjz5YD1D', '2025-10-31 02:43:00.695643', '2025-11-08 20:04:49.000000'),
(161, 1, 12, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 350.00, 'REF1761878685101', 'pay_aEAQhkY7acsRqEyiV1U9dQ17', 'Payment via Paymongo - pay_aEAQhkY7acsRqEyiV1U9dQ17', '2025-10-31 02:44:45.113334', '2025-11-08 20:04:49.000000'),
(162, 1, 11, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 250.00, 'REF1761878685150', 'pay_aEAQhkY7acsRqEyiV1U9dQ17', 'Payment via Paymongo - pay_aEAQhkY7acsRqEyiV1U9dQ17', '2025-10-31 02:44:45.154408', '2025-11-08 20:04:49.000000'),
(163, 1, 1, '2025-11-25', '02:00:00', '03:00:00', 'Confirmed', 250.00, 'REF1761880103946', 'pay_cHWzQisrsfeu8rPsXiWzPFic', 'Payment via Paymongo - pay_cHWzQisrsfeu8rPsXiWzPFic', '2025-10-31 03:08:23.971190', '2025-10-31 03:08:23.971190'),
(164, 1, 1, '2026-01-01', '11:00:00', '12:00:00', 'Confirmed', 250.00, 'REF1761880689009', 'pay_jXPVqN7b5F8qKJvuRZVCqAE5', 'Payment via Paymongo - pay_jXPVqN7b5F8qKJvuRZVCqAE5', '2025-10-31 03:18:09.017559', '2025-10-31 03:18:09.017559'),
(165, 1, 13, '2025-10-31', '08:00:00', '09:00:00', 'Completed', 500.00, '1761908647381S9QLE', 'pay_sxTigqvKzPHcr9krJsZWosPf', 'Payment via Paymongo - pay_sxTigqvKzPHcr9krJsZWosPf', '2025-10-31 11:04:43.772428', '2025-11-08 20:04:49.000000'),
(166, 8, 1, '2025-11-05', '11:00:00', '13:30:00', 'Pending', 280.00, 'REF176228118014113', NULL, 'dasd', '2025-11-04 18:33:00.178309', '2025-11-04 18:33:00.178309'),
(167, 1, 3, '2025-11-08', '10:00:00', '11:00:00', 'Completed', 250.00, '1762605610860LTMDB', 'test_payment_id', 'Test reservation via webhook', '2025-11-08 12:41:35.221779', '2025-11-08 20:04:49.000000'),
(168, 9, 3, '2025-11-08', '22:00:00', '23:00:00', 'Confirmed', 250.00, '1762605857662LT0VN', NULL, 'Payment via Cash - Walk-in customer: Ivan', '2025-11-08 12:44:29.367571', '2025-11-08 12:44:29.367571'),
(169, 9, 9, '2025-11-08', '22:00:00', '23:00:00', 'Confirmed', 220.00, '17626075492795UFGY', NULL, 'Payment via Cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 13:12:30.991885', '2025-11-08 13:12:30.991885'),
(170, 9, 10, '2025-11-08', '22:00:00', '23:00:00', 'Confirmed', 250.00, '17626075492795UFGY', NULL, 'Payment via Cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 13:12:31.015990', '2025-11-08 13:12:31.015990'),
(171, 9, 11, '2025-11-08', '22:00:00', '23:00:00', 'Confirmed', 250.00, '17626075492795UFGY', NULL, 'Payment via Cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 13:12:31.029543', '2025-11-08 13:12:31.029543'),
(172, 9, 12, '2025-11-08', '22:00:00', '23:00:00', 'Confirmed', 350.00, '17626075492795UFGY', NULL, 'Payment via Cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 13:12:31.044552', '2025-11-08 13:12:31.044552'),
(173, 10, 3, '2025-11-11', '16:00:00', '17:00:00', 'Confirmed', 250.00, '1762607596958X96DJ', NULL, 'Payment via Cash - Walk-in customer: dawd', '2025-11-08 13:13:18.289775', '2025-11-08 13:13:18.289775'),
(174, 9, 3, '2025-11-09', '12:00:00', '13:00:00', 'Confirmed', 250.00, '17626356937289O2MF', NULL, 'Payment via Cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 21:01:34.954176', '2025-11-08 21:01:34.954176'),
(175, 9, 5, '2025-11-09', '12:00:00', '13:00:00', 'Confirmed', 250.00, '17626356937289O2MF', NULL, 'Payment via Cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 21:01:35.007019', '2025-11-08 21:01:35.007019'),
(176, 9, 6, '2025-11-09', '12:00:00', '13:00:00', 'Confirmed', 250.00, '17626356937289O2MF', NULL, 'Payment via Cash - Walk-in customer: Ivan Louis Cielo', '2025-11-08 21:01:35.035058', '2025-11-08 21:01:35.035058'),
(177, 1, 3, '2025-11-09', '13:00:00', '14:00:00', 'Confirmed', 250.00, '17626358764855QKHD', NULL, 'Payment via Cash - Walk-in customer: Filbert', '2025-11-08 21:04:37.927560', '2025-11-08 21:04:37.927560');

-- --------------------------------------------------------

--
-- Table structure for table `suggestions`
--

CREATE TABLE `suggestions` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `suggestions`
--

INSERT INTO `suggestions` (`id`, `name`, `message`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 'Filbert', 'Filbertaafdfadf', 1, '2025-10-31 09:44:33.539769', '2025-10-31 09:44:33.539769'),
(2, 'zhiky', 'TEST', NULL, '2025-10-31 09:45:28.340323', '2025-10-31 09:45:28.340323'),
(3, 'Ivan Louis Cielo', 'dasdadvas', 9, '2025-11-04 08:48:21.060800', '2025-11-04 08:48:21.060800'),
(4, 'Ivan Louis Cielo', 'sdadsav', 9, '2025-11-04 09:05:12.600148', '2025-11-04 09:05:12.600148'),
(6, 'Ivan Louis Cielo', 'fsnddddddddddddddddddddddddddddddddddddddddddddddddddxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 9, '2025-11-04 09:49:19.784668', '2025-11-04 09:49:19.784668'),
(7, 'Ivan Louis Cielo', 'dfsefddddddddddddddddddddddddddddddddd', 9, '2025-11-04 09:58:25.028382', '2025-11-04 09:58:25.028382'),
(8, 'Ivan Louis Cielo', 'dfsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss', 9, '2025-11-04 09:58:30.303531', '2025-11-04 09:58:30.303531'),
(9, 'Ivan Louis Cielo', 'dfssssssssssssssssssssssssssss', 9, '2025-11-04 09:58:33.450477', '2025-11-04 09:58:33.450477'),
(10, 'Ivan Louis Cielo', 'hjibi jimnjk,l', 9, '2025-11-04 15:47:07.473153', '2025-11-04 15:47:07.473153'),
(11, 'Filbert', 'oknoio p,[', NULL, '2025-11-04 15:47:16.240546', '2025-11-04 15:47:16.240546'),
(12, 'Big Black Bro', 'napaka angas kaibigang osooo', NULL, '2025-11-04 19:44:16.368793', '2025-11-04 19:44:16.368793'),
(13, 'Ivan Louis Cielo', 'fabsfafdg', 9, '2025-11-05 10:29:17.008377', '2025-11-05 10:29:17.008377'),
(14, 'Ivan Louis Cielo', 'gh;lf', 9, '2025-11-08 21:06:38.581718', '2025-11-08 21:06:38.581718'),
(15, 'Ivan Louis Cielo', 'asdvad', 9, '2025-11-09 10:07:08.782011', '2025-11-09 10:07:08.782011'),
(16, 'Ishi Cielo', 'dasbdasjfdgdh', NULL, '2025-11-09 10:22:37.951070', '2025-11-09 10:22:37.951070');

-- --------------------------------------------------------

--
-- Table structure for table `time_slots`
--

CREATE TABLE `time_slots` (
  `id` int NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `sex` enum('Male','Female','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `contact_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `profile_picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `is_verified` tinyint NOT NULL DEFAULT '0',
  `verification_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_password_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_password_expires` timestamp NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `age`, `sex`, `username`, `email`, `password`, `contact_number`, `profile_picture`, `is_active`, `is_verified`, `verification_token`, `reset_password_token`, `reset_password_expires`, `created_at`, `updated_at`, `role`) VALUES
(1, 'Filbert', 20, 'Male', 'filbert', 'zhiky090924@gmail.com', '$2a$12$GJYX0F7gaYLUv4uZ/y/gm.e2cAeOl16hXAT1Cu4HDCyY1tUYKaXaO', '09498680515', '/uploads/avatars/1761183855207-832125080.png', 1, 0, NULL, NULL, NULL, '2025-10-14 17:53:08.085210', '2025-10-23 01:44:15.000000', 'user'),
(2, 'Maria Santos', 28, 'Female', 'maria_santos', 'maria.santos@email.com', '$2a$12$example.hash.1', '09123456789', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(3, 'Juan Dela Cruz', 32, 'Male', 'juan_dc', 'juan.delacruz@email.com', '$2a$12$example.hash.2', '09234567890', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(4, 'Ana Rodriguez', 25, 'Female', 'ana_rod', 'ana.rodriguez@email.com', '$2a$12$example.hash.3', '09345678901', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(5, 'Carlos Mendoza', 35, 'Male', 'carlos_m', 'carlos.mendoza@email.com', '$2a$12$example.hash.4', '09456789012', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(6, 'Test User', 25, 'Male', 'testuser123', 'test@example.com', '$2a$12$.WwM9bXnpZy64FA2SuqgaekM1KGNbXTThrieM9Og.Ct2uiteRJ/l.', '1234567890', NULL, 1, 0, NULL, NULL, NULL, '2025-10-15 14:51:31.468010', '2025-10-15 15:02:23.000000', 'user'),
(8, 'Filbert', 21, 'Male', 'admin', 'ic.filbert.delacruz@cvsu.edu.ph', '$2a$12$3.w7mjsDbBmm90GkQhisuu.dB0N81RbUmGflnuCNtx0P4hnAo8AN.', '09498680515', NULL, 1, 0, NULL, NULL, NULL, '2025-10-31 01:22:24.615642', '2025-11-04 09:19:19.127082', 'admin'),
(9, 'Ivan Louis Cielo', 22, 'Male', 'ivan', 'cieloivanlouis@gmail.com', '$2a$12$lNTuxPafOjh3ixl.vGlrmOs8LnSSuzmSjBCIXnDfXT/VzW1CS8XOG', '09366274094', '/uploads/avatars/1762246058189-428479525.jpg', 1, 0, NULL, NULL, NULL, '2025-11-04 08:47:22.014786', '2025-11-04 09:55:19.000000', 'user'),
(10, 'dawd', NULL, NULL, 'guest_1762607597991_ik7go', 'guest_1762607597991_ik7go@walkin.local', '$2a$12$d7IHcYhQUM2Xv5.5cGJHpe7HAjtwy4UEsGZcYQRB6b/wuv.21aPoi', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-11-08 13:13:18.272338', '2025-11-08 13:13:18.272338', 'user');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_40bd4946a00669c5fb7e6d972f0` (`created_by`);

--
-- Indexes for table `courts`
--
ALTER TABLE `courts`
  ADD PRIMARY KEY (`Court_Id`);

--
-- Indexes for table `equipments`
--
ALTER TABLE `equipments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `equipment_rentals`
--
ALTER TABLE `equipment_rentals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `equipment_rental_items`
--
ALTER TABLE `equipment_rental_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_070274580234fd00c598779da3e` (`rental_id`);

--
-- Indexes for table `gallery`
--
ALTER TABLE `gallery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_9ed5ff4942e09edfd44ee0ccf01` (`reservation_id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`Reservation_ID`),
  ADD KEY `FK_23593e61d0aa200e5e4a30fa7e7` (`User_ID`),
  ADD KEY `FK_5333eba2d4d90484e8bcfa99110` (`Court_ID`);

--
-- Indexes for table `suggestions`
--
ALTER TABLE `suggestions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_d5f8b29a35d481f2c4200dae9e8` (`user_id`);

--
-- Indexes for table `time_slots`
--
ALTER TABLE `time_slots`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  ADD UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `courts`
--
ALTER TABLE `courts`
  MODIFY `Court_Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `equipments`
--
ALTER TABLE `equipments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `equipment_rentals`
--
ALTER TABLE `equipment_rentals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `equipment_rental_items`
--
ALTER TABLE `equipment_rental_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `gallery`
--
ALTER TABLE `gallery`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `Reservation_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=178;

--
-- AUTO_INCREMENT for table `suggestions`
--
ALTER TABLE `suggestions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `time_slots`
--
ALTER TABLE `time_slots`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `FK_40bd4946a00669c5fb7e6d972f0` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `equipment_rental_items`
--
ALTER TABLE `equipment_rental_items`
  ADD CONSTRAINT `FK_070274580234fd00c598779da3e` FOREIGN KEY (`rental_id`) REFERENCES `equipment_rentals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `FK_9ed5ff4942e09edfd44ee0ccf01` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`Reservation_ID`);

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `FK_23593e61d0aa200e5e4a30fa7e7` FOREIGN KEY (`User_ID`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `FK_5333eba2d4d90484e8bcfa99110` FOREIGN KEY (`Court_ID`) REFERENCES `courts` (`Court_Id`);

--
-- Constraints for table `suggestions`
--
ALTER TABLE `suggestions`
  ADD CONSTRAINT `FK_d5f8b29a35d481f2c4200dae9e8` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
