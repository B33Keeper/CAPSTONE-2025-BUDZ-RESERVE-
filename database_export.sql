-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Nov 13, 2025 at 08:55 PM
-- Server version: 8.4.7
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
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `announcement_type` enum('text','image') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 'Court 1', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(2, 'Court 2', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(3, 'Court 3', 'Maintenance', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(4, 'Court 4', 'Available', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(5, 'Court 5', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(6, 'Court 6', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(7, 'Court 7', 'Available', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(8, 'Court 8', 'Maintenance', 220.00, '2025-10-14 20:57:26.558877', '2025-11-10 21:14:42.000000'),
(9, 'Court 9', 'Available', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(10, 'Court 10', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(11, 'Court 11', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(12, 'Court 12', 'Available', 350.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(13, 'Court 13', 'Available', 500.00, '2025-10-31 10:48:29.719865', '2025-10-31 10:48:29.719865');

-- --------------------------------------------------------

--
-- Table structure for table `equipments`
--

CREATE TABLE `equipments` (
  `id` int NOT NULL,
  `equipment_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `stocks` int NOT NULL DEFAULT '0',
  `price` decimal(10,2) NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Available',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `image_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '/assets/img/equipments/racket.png',
  `unit` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `weight` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tension` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `equipments`
--

INSERT INTO `equipments` (`id`, `equipment_name`, `stocks`, `price`, `status`, `created_at`, `updated_at`, `image_path`, `unit`, `weight`, `tension`) VALUES
(1, 'Yonex GR 303', 1, 150.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-13 20:46:46.000000', '/uploads/equipments/1763066806085-104844781.png', 'Head Heavy', '5U', '30lbs'),
(2, 'Li-Ning Blaze 100', 15, 80.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-13 20:47:24.000000', '/uploads/equipments/1763066844358-713667384.png', NULL, NULL, NULL),
(3, 'YONEX Arcsaber 7 Play', 25, 100.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-13 20:47:29.000000', '/uploads/equipments/1763066849690-775455644.png', NULL, NULL, NULL),
(4, 'Victor Thruster', 30, 15.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-13 20:47:35.000000', '/uploads/equipments/1763066855060-739408470.png', NULL, NULL, NULL),
(5, 'Apacs Power', 50, 20.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-13 20:47:52.000000', '/uploads/equipments/1763066872053-315981378.png', NULL, NULL, NULL),
(6, 'AlpSport', 10, 100.00, 'Available', '2025-11-07 04:47:49.382927', '2025-11-13 20:47:42.000000', '/uploads/equipments/1763066862024-19154608.png', NULL, NULL, NULL);

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
(10, 164, 1, 150.00, NULL, '2025-10-31 03:18:09.102222', '2025-10-31 03:18:09.000000'),
(11, 170, 1, 150.00, NULL, '2025-11-09 10:32:35.929218', '2025-11-09 10:32:35.000000'),
(12, 172, 1, 150.00, NULL, '2025-11-10 12:56:23.445954', '2025-11-10 12:56:23.000000'),
(13, 173, 1, 300.00, NULL, '2025-11-10 14:09:37.333748', '2025-11-10 14:09:37.000000'),
(14, 177, 1, 80.00, NULL, '2025-11-10 20:27:49.580969', '2025-11-10 20:27:49.000000');

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
(11, 10, 1, 1, 1, 150.00, 150.00, '2025-10-31 03:18:09.132273'),
(12, 11, 1, 1, 1, 150.00, 150.00, '2025-11-09 10:32:35.975569'),
(13, 12, 1, 1, 1, 150.00, 150.00, '2025-11-10 12:56:23.494898'),
(14, 13, 1, 1, 2, 150.00, 300.00, '2025-11-10 14:09:37.389912'),
(15, 14, 2, 1, 1, 80.00, 80.00, '2025-11-10 20:27:49.625485');

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
(6, 'Group Photo 6', 'Client group photo from finals', '/assets/img/home-page/GALLERY/IMAGE 6.jpg', 'active', 6, '2025-10-23 02:23:55.779686', '2025-10-23 02:23:56.071189');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int NOT NULL,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('GCash','Maya','GrabPay','Online Banking','QR Ph','Cash') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
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
(105, 168, 220.00, 'Cash', 'Completed', 'CASH1762498094914113', '17624980931341YI1V', 'Payment received in cash', '2025-11-07 06:48:14.920804', '2025-11-07 06:48:14.920804'),
(106, 169, 220.00, 'Cash', 'Completed', 'CASH1762498311082300', '1762498306407FK9U8', 'Payment received in cash', '2025-11-07 06:51:51.122687', '2025-11-07 06:51:51.122687'),
(107, 170, 650.00, 'GCash', 'Completed', 'pay_7uDtcRsYYVgPSwUz7CTXauPF', 'REF1762684355890', 'Badminton Court Booking - November 9, 2025', '2025-11-09 10:32:35.898406', '2025-11-09 10:32:35.898406'),
(108, 172, 400.00, 'Maya', 'Completed', 'pay_kiBPbghLYJCGxUzbapmoPpwx', 'REF1762779383405', 'Badminton Court Booking - November 10, 2025', '2025-11-10 12:56:23.410232', '2025-11-10 12:56:23.410232'),
(110, 173, 550.00, 'GCash', 'Completed', 'pay_t4HTJBPkRwYsc5LhK4ow4NJ7', 'REF1762783777259', 'Badminton Court Booking - November 11, 2025', '2025-11-10 14:09:37.265497', '2025-11-10 14:09:37.265497'),
(111, 174, 250.00, 'QR Ph', 'Pending', 'code_M4FKmbq8Ub6y4VtnZ1ULBkpS', '17628015056865P7LE', 'Pay via QR Ph code generated (code_M4FKmbq8Ub6y4VtnZ1ULBkpS). Notes: Reservation 17628015056865P7LE', '2025-11-10 19:05:14.809018', '2025-11-10 19:05:14.809018'),
(112, 175, 250.00, 'GCash', 'Completed', 'pay_ZDmoDQPhrGP7owJEQUrTnrTt', 'REF1762804195560', 'Badminton Court Booking - November 12, 2025', '2025-11-10 19:49:55.565379', '2025-11-10 19:49:55.565379'),
(113, 176, 250.00, 'QR Ph', 'Pending', 'code_h2wsstMJfZ7JV9tZDnsLzqGG', '1762805594490ET20G', 'Pay via QR Ph code generated (code_h2wsstMJfZ7JV9tZDnsLzqGG). Notes: Reservation 1762805594490ET20G', '2025-11-10 20:13:21.720927', '2025-11-10 20:13:21.720927'),
(114, 177, 330.00, 'GrabPay', 'Completed', 'pay_hRvUdYVRBLVbkG3Xnfjfpi9D', 'REF1762806469519', 'Badminton Court Booking - November 11, 2025', '2025-11-10 20:27:49.528375', '2025-11-10 20:27:49.528375'),
(115, 178, 500.00, 'GCash', 'Completed', 'pay_ymgt6DFc9rsdrWh52iBCnwG7', 'REF1762806652522', 'Badminton Court Booking - November 11, 2025', '2025-11-10 20:30:52.529046', '2025-11-10 20:30:52.529046'),
(116, 180, 250.00, 'Cash', 'Completed', 'CASH1762811042621656', '1762811037910CU6GX', 'Payment received in cash - Walk-in customer: NATHAN | Contact: +639498680515 | Email: zhiky090924@gmail.com', '2025-11-10 21:44:02.641470', '2025-11-10 21:44:02.641470'),
(117, 181, 250.00, 'GCash', 'Completed', 'pay_6WWEtfLLZRMi2mgrTgj9BX7s', 'REF1762811603171', 'Badminton Court Booking - 2025-11-12', '2025-11-10 21:53:23.179321', '2025-11-10 21:53:23.179321'),
(118, 182, 250.00, 'QR Ph', 'Pending', 'code_NVWVnA46NbENrnAykqMWsWnn', '1762856697767WD3LZ', 'Pay via QR Ph code generated (code_NVWVnA46NbENrnAykqMWsWnn). Notes: Reservation 1762856697767WD3LZ - POGI. Walk-in customer: POGI | Contact: 09498680515 | Email: baktolbomb@gmail.com', '2025-11-11 10:25:03.160569', '2025-11-11 10:25:03.160569'),
(119, 183, 250.00, 'QR Ph', 'Pending', 'code_GskUjaSRhb4qAqgLUfBf1Cph', '1762856990342G4BDC', 'Pay via QR Ph code generated (code_GskUjaSRhb4qAqgLUfBf1Cph). Notes: Reservation 1762856990342G4BDC - filbert. Walk-in customer: filbert | Contact: 09498680515 | Email: zhiky090924@gmail.com', '2025-11-11 10:29:52.770267', '2025-11-11 10:29:52.770267'),
(120, 184, 250.00, 'QR Ph', 'Pending', 'code_z2QhpvnJX6CbTH2w8WdoFfbA', '1762857078784NQSLY', 'Pay via QR Ph code generated (code_z2QhpvnJX6CbTH2w8WdoFfbA). Notes: Reservation 1762857078784NQSLY - POGI NAMAN NETO. Walk-in customer: POGI NAMAN NETO | Contact: 09498680515 | Email: baktolbomb@gmail.com', '2025-11-11 10:31:21.157893', '2025-11-11 10:31:21.157893'),
(121, 185, 500.00, 'QR Ph', 'Pending', 'code_CqNxQjrg9kftKnJfK82yHksn', '17628602956507KXW8', 'Pay via QR Ph code generated (code_CqNxQjrg9kftKnJfK82yHksn). Notes: Reservation 17628602956507KXW8 - NATHAN. Walk-in customer: NATHAN | Contact: +639498680515 | Email: zhiky090924@gmail.com', '2025-11-11 11:25:18.559415', '2025-11-11 11:25:18.559415'),
(122, 187, 250.00, 'QR Ph', 'Pending', 'code_xwntBEC3HLFXf628sHxCvkKt', '1762861756706JQP83', 'Pay via QR Ph code generated (code_xwntBEC3HLFXf628sHxCvkKt). Notes: Reservation 1762861756706JQP83 - kukurikabu. Walk-in customer: kukurikabu | Contact: 09498680515 | Email: zhiky090924@gmail.com', '2025-11-11 11:49:23.183615', '2025-11-11 11:49:23.183615');

-- --------------------------------------------------------

--
-- Table structure for table `queueing_courts`
--

CREATE TABLE `queueing_courts` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('available','maintenance','unavailable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `queueing_courts`
--

INSERT INTO `queueing_courts` (`id`, `name`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Court 1', 'available', '2025-11-13 20:36:16.574890', '2025-11-13 20:36:16.574890'),
(2, 'Court 2', 'available', '2025-11-13 20:36:18.190571', '2025-11-13 20:36:18.190571'),
(3, 'Court 3', 'available', '2025-11-13 20:36:19.858695', '2025-11-13 20:36:19.858695');

-- --------------------------------------------------------

--
-- Table structure for table `queue_players`
--

CREATE TABLE `queue_players` (
  `id` int NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sex` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `skill` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `games_played` int NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'In Queue',
  `last_played` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `queue_players`
--

INSERT INTO `queue_players` (`id`, `name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`) VALUES
(1, 'Ivan', 'male', 'Advanced', 0, 'In Queue', '2025-11-13', '2025-11-13 19:52:42.428358', '2025-11-13 19:52:42.428358'),
(2, 'Cielo', 'male', 'Advanced', 0, 'In Queue', '2025-11-13', '2025-11-13 19:52:46.266655', '2025-11-13 19:52:46.266655'),
(3, 'Levy', 'male', 'Advanced', 0, 'In Queue', '2025-11-13', '2025-11-13 19:53:10.299910', '2025-11-13 19:53:10.299910'),
(4, 'Jersey', 'female', 'Intermediate', 0, 'In Queue', '2025-11-13', '2025-11-13 20:36:29.770452', '2025-11-13 20:36:29.770452');

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
  `Updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `Is_Admin_Created` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`Reservation_ID`, `User_ID`, `Court_ID`, `Reservation_Date`, `Start_Time`, `End_Time`, `Status`, `Total_Amount`, `Reference_Number`, `Paymongo_Reference_Number`, `Notes`, `Created_at`, `Updated_at`, `Is_Admin_Created`) VALUES
(126, 1, 4, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 220.00, 'REF1761209997625', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 08:59:57.639695', '2025-10-23 08:59:57.639695', 0),
(127, 1, 4, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 220.00, 'REF1761209997514', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 08:59:57.589384', '2025-10-23 08:59:57.589384', 0),
(128, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Confirmed', 250.00, 'REF1761210255683', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:04:15.708368', '2025-10-23 09:04:15.708368', 0),
(129, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Confirmed', 250.00, 'REF1761210255764', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:04:15.776600', '2025-10-23 09:04:15.776600', 0),
(130, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Confirmed', 250.00, 'REF1761210306465', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:05:06.527248', '2025-10-23 09:05:06.527248', 0),
(131, 1, 2, '2025-10-30', '21:00:00', '22:00:00', 'Confirmed', 250.00, 'REF1761210306786', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:05:06.798997', '2025-10-23 09:05:06.798997', 0),
(132, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Confirmed', 250.00, 'REF1761210412107', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:06:52.138046', '2025-10-23 09:06:52.138046', 0),
(133, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Confirmed', 250.00, 'REF1761210412814', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:06:52.837403', '2025-10-23 09:06:52.837403', 0),
(134, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Confirmed', 250.00, 'REF1761210428945', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:07:08.982440', '2025-10-23 09:07:08.982440', 0),
(135, 1, 2, '2025-10-23', '12:00:00', '13:00:00', 'Confirmed', 250.00, 'REF1761210429084', '{CHECKOUT_SESSION_ID}', 'Payment via Paymongo - {CHECKOUT_SESSION_ID}', '2025-10-23 09:07:09.098226', '2025-10-23 09:07:09.098226', 0),
(136, 1, 1, '2025-10-31', '09:00:00', '10:00:00', 'Confirmed', 220.00, 'REF1761213772967', 'pay_818hur8BGQvst4DnLEyrYL9g', 'Payment via Paymongo - pay_818hur8BGQvst4DnLEyrYL9g', '2025-10-23 10:02:53.236320', '2025-10-23 10:02:53.236320', 0),
(137, 1, 4, '2025-10-31', '12:00:00', '01:00:00', 'Confirmed', 220.00, 'REF1761213785709', 'test_payment_id', 'Test reservation via webhook', '2025-10-23 10:03:09.460394', '2025-10-23 10:03:09.460394', 0),
(138, 1, 1, '2025-10-31', '09:00:00', '10:00:00', 'Confirmed', 250.00, 'REF1761214193082', 'pay_coF9JHRWYN4JagiWDsvMFtP1', 'Payment via Paymongo - pay_coF9JHRWYN4JagiWDsvMFtP1', '2025-10-23 10:09:53.100197', '2025-10-23 10:09:53.100197', 0),
(139, 1, 2, '2025-10-30', '04:00:00', '05:00:00', 'Confirmed', 250.00, 'REF1761814727622', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 08:58:51.541397', '2025-10-30 08:58:51.541397', 0),
(140, 1, 1, '2025-11-01', '05:00:00', '06:00:00', 'Confirmed', 250.00, 'REF1761816775470', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 09:32:56.653191', '2025-10-30 09:32:56.653191', 0),
(141, 1, 1, '2025-11-02', '07:00:00', '08:00:00', 'Confirmed', 250.00, 'REF1761818072449', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 09:54:52.466239', '2025-10-30 09:54:52.466239', 0),
(142, 1, 2, '2025-10-30', '10:00:00', '11:00:00', 'Confirmed', 250.00, 'REF1761818215156', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 09:57:45.012253', '2025-10-30 09:57:45.012253', 0),
(143, 1, 1, '2025-11-01', '10:00:00', '11:00:00', 'Confirmed', 250.00, 'REF1761820858081', 'test_payment_id', 'Test reservation via webhook', '2025-10-30 10:41:37.359419', '2025-10-30 10:41:37.359419', 0),
(144, 1, 1, '2025-11-03', '06:00:00', '07:00:00', 'Confirmed', 250.00, 'REF1761823157093', 'pay_wgyXjDbe6pSZiJzKn6Wwj2rB', 'Payment via Paymongo - pay_wgyXjDbe6pSZiJzKn6Wwj2rB', '2025-10-30 11:19:17.113939', '2025-10-30 11:19:17.113939', 0),
(145, 1, 12, '2025-12-10', '10:00:00', '11:00:00', 'Confirmed', 350.00, 'REF1761823250954', 'pay_gn1XHrmK9XSaBNc3zBXMKuCi', 'Payment via Paymongo - pay_gn1XHrmK9XSaBNc3zBXMKuCi', '2025-10-30 11:20:50.963584', '2025-10-30 11:20:50.963584', 0),
(146, 1, 7, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 220.00, 'REF1761825279438', 'pay_kupruQghp4qaLKLPTURbuFVd', 'Payment via Paymongo - pay_kupruQghp4qaLKLPTURbuFVd', '2025-10-30 11:54:39.444297', '2025-10-30 11:54:39.444297', 0),
(147, 1, 12, '2026-02-24', '08:00:00', '09:00:00', 'Confirmed', 350.00, 'REF1761828198125', 'pay_vNLam3keKEEuLgYahNh5V4AF', 'Payment via Paymongo - pay_vNLam3keKEEuLgYahNh5V4AF', '2025-10-30 12:43:18.141390', '2025-10-30 12:43:18.141390', 0),
(148, 1, 1, '2026-01-01', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761830333111', 'pay_ioESVFmK2TQUdibbpVKuDZfw', 'Payment via Paymongo - pay_ioESVFmK2TQUdibbpVKuDZfw', '2025-10-30 13:18:53.163708', '2025-10-30 13:18:53.163708', 0),
(149, 1, 2, '2025-12-25', '11:00:00', '12:00:00', 'Confirmed', 250.00, 'REF1761830893712', 'pay_YdSshtGyX2uyqJofw7pLMhTo', 'Payment via Paymongo - pay_YdSshtGyX2uyqJofw7pLMhTo', '2025-10-30 13:28:13.745469', '2025-10-30 13:28:13.745469', 0),
(150, 1, 6, '2025-12-20', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761831680847', 'pay_ipjteGNvKBJ4TDtJsnHxaN7P', 'Payment via Paymongo - pay_ipjteGNvKBJ4TDtJsnHxaN7P', '2025-10-30 13:41:20.871192', '2025-10-30 13:41:20.871192', 0),
(151, 1, 11, '2025-11-25', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761872946311', 'pay_nhDhTvbYdGCcqN4xHGukNVmk', 'Payment via Paymongo - pay_nhDhTvbYdGCcqN4xHGukNVmk', '2025-10-31 01:09:06.324260', '2025-10-31 01:09:06.324260', 0),
(152, 1, 12, '2025-11-25', '08:00:00', '09:00:00', 'Confirmed', 350.00, 'REF1761872946349', 'pay_nhDhTvbYdGCcqN4xHGukNVmk', 'Payment via Paymongo - pay_nhDhTvbYdGCcqN4xHGukNVmk', '2025-10-31 01:09:06.352141', '2025-10-31 01:09:06.352141', 0),
(153, 1, 1, '2026-01-01', '09:00:00', '10:00:00', 'Confirmed', 250.00, 'REF1761873070120', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:11:10.128613', '2025-10-31 01:11:10.128613', 0),
(154, 1, 1, '2026-01-01', '10:00:00', '11:00:00', 'Confirmed', 250.00, 'REF1761873070149', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:11:10.155450', '2025-10-31 01:11:10.155450', 0),
(155, 1, 1, '2026-01-01', '09:00:00', '10:00:00', 'Confirmed', 250.00, 'REF1761873130835', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:12:10.840915', '2025-10-31 01:12:10.840915', 0),
(156, 1, 1, '2026-01-01', '10:00:00', '11:00:00', 'Confirmed', 250.00, 'REF1761873130888', 'pay_ZeXSheEG7uGFXw5VFfdsZ2vq', 'Payment via Paymongo - pay_ZeXSheEG7uGFXw5VFfdsZ2vq', '2025-10-31 01:12:10.895466', '2025-10-31 01:12:10.895466', 0),
(157, 1, 2, '2026-02-02', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761873233594', 'pay_EsGWksE8J8wprQSSMTkLVGpu', 'Payment via Paymongo - pay_EsGWksE8J8wprQSSMTkLVGpu', '2025-10-31 01:13:53.598846', '2025-10-31 01:13:53.598846', 0),
(158, 1, 1, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761873307466', 'pay_hqk3PsSh5G235MiBb5L1GAZt', 'Payment via Paymongo - pay_hqk3PsSh5G235MiBb5L1GAZt', '2025-10-31 01:15:07.475536', '2025-10-31 01:15:07.475536', 0),
(159, 1, 2, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761878580564', 'pay_ar2LUR4cdfPnSNVkNjz5YD1D', 'Payment via Paymongo - pay_ar2LUR4cdfPnSNVkNjz5YD1D', '2025-10-31 02:43:00.590646', '2025-10-31 02:43:00.590646', 0),
(160, 1, 5, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761878580690', 'pay_ar2LUR4cdfPnSNVkNjz5YD1D', 'Payment via Paymongo - pay_ar2LUR4cdfPnSNVkNjz5YD1D', '2025-10-31 02:43:00.695643', '2025-10-31 02:43:00.695643', 0),
(161, 1, 12, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 350.00, 'REF1761878685101', 'pay_aEAQhkY7acsRqEyiV1U9dQ17', 'Payment via Paymongo - pay_aEAQhkY7acsRqEyiV1U9dQ17', '2025-10-31 02:44:45.113334', '2025-10-31 02:44:45.113334', 0),
(162, 1, 11, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'REF1761878685150', 'pay_aEAQhkY7acsRqEyiV1U9dQ17', 'Payment via Paymongo - pay_aEAQhkY7acsRqEyiV1U9dQ17', '2025-10-31 02:44:45.154408', '2025-10-31 02:44:45.154408', 0),
(163, 1, 1, '2025-11-25', '02:00:00', '03:00:00', 'Confirmed', 250.00, 'REF1761880103946', 'pay_cHWzQisrsfeu8rPsXiWzPFic', 'Payment via Paymongo - pay_cHWzQisrsfeu8rPsXiWzPFic', '2025-10-31 03:08:23.971190', '2025-10-31 03:08:23.971190', 0),
(164, 1, 1, '2026-01-01', '11:00:00', '12:00:00', 'Confirmed', 250.00, 'REF1761880689009', 'pay_jXPVqN7b5F8qKJvuRZVCqAE5', 'Payment via Paymongo - pay_jXPVqN7b5F8qKJvuRZVCqAE5', '2025-10-31 03:18:09.017559', '2025-10-31 03:18:09.017559', 0),
(165, 1, 13, '2025-10-31', '08:00:00', '09:00:00', 'Confirmed', 500.00, '1761908647381S9QLE', 'pay_sxTigqvKzPHcr9krJsZWosPf', 'Payment via Paymongo - pay_sxTigqvKzPHcr9krJsZWosPf', '2025-10-31 11:04:43.772428', '2025-10-31 11:04:43.772428', 0),
(166, 8, 13, '2025-11-13', '13:30:00', '14:00:00', 'Pending', 500.00, 'REF1762491613727833', NULL, 'kukurikabu', '2025-11-07 05:00:13.932251', '2025-11-07 05:00:13.932251', 0),
(167, 8, 2, '2025-11-08', '10:30:00', '17:30:00', 'Pending', 250.00, 'REF1762494192977578', NULL, NULL, '2025-11-07 05:43:15.117456', '2025-11-07 05:43:15.117456', 0),
(168, 1, 4, '2025-11-26', '13:00:00', '14:00:00', 'Confirmed', 220.00, '17624980931341YI1V', NULL, 'Payment via Cash', '2025-11-07 06:48:14.834652', '2025-11-07 06:48:14.834652', 0),
(169, 3, 9, '2025-11-07', '16:00:00', '17:00:00', 'Confirmed', 220.00, '1762498306407FK9U8', NULL, 'Payment via Cash', '2025-11-07 06:51:50.914160', '2025-11-07 06:51:50.914160', 0),
(170, 1, 1, '2025-11-09', '07:00:00', '08:00:00', 'Confirmed', 250.00, '1762684333180F16B2', 'pay_7uDtcRsYYVgPSwUz7CTXauPF', 'Payment via Paymongo - pay_7uDtcRsYYVgPSwUz7CTXauPF', '2025-11-09 10:32:35.798897', '2025-11-09 10:32:35.798897', 0),
(171, 1, 2, '2025-11-09', '07:00:00', '08:00:00', 'Confirmed', 250.00, '1762684333180F16B2', 'pay_7uDtcRsYYVgPSwUz7CTXauPF', 'Payment via Paymongo - pay_7uDtcRsYYVgPSwUz7CTXauPF', '2025-11-09 10:32:35.868897', '2025-11-09 10:32:35.868897', 0),
(172, 1, 6, '2025-11-10', '10:00:00', '11:00:00', 'Confirmed', 250.00, '1762779365954ORWSS', 'pay_kiBPbghLYJCGxUzbapmoPpwx', 'Payment via Paymongo - pay_kiBPbghLYJCGxUzbapmoPpwx', '2025-11-10 12:56:23.339328', '2025-11-10 12:56:23.339328', 0),
(173, 1, 6, '2025-11-11', '10:00:00', '11:00:00', 'Confirmed', 250.00, '17627837591418F7HV', 'pay_t4HTJBPkRwYsc5LhK4ow4NJ7', 'Payment via Paymongo - pay_t4HTJBPkRwYsc5LhK4ow4NJ7', '2025-11-10 14:09:37.203601', '2025-11-10 14:09:37.203601', 0),
(174, 9, 2, '2025-11-11', '22:00:00', '23:00:00', 'Confirmed', 250.00, '17628015056865P7LE', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: kukurikabu', '2025-11-10 19:05:11.893865', '2025-11-10 19:05:11.893865', 0),
(175, 9, 3, '2025-11-12', '08:00:00', '09:00:00', 'Confirmed', 250.00, '17628041592208W0S8', 'pay_ZDmoDQPhrGP7owJEQUrTnrTt', 'Payment via Paymongo - pay_ZDmoDQPhrGP7owJEQUrTnrTt', '2025-11-10 19:49:55.533116', '2025-11-10 19:49:55.533116', 0),
(176, 1, 6, '2025-11-11', '22:00:00', '23:00:00', 'Confirmed', 250.00, '1762805594490ET20G', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: Filbert', '2025-11-10 20:13:18.686724', '2025-11-10 20:13:18.686724', 0),
(177, 1, 1, '2025-11-11', '07:00:00', '08:00:00', 'Confirmed', 250.00, '17628064498335J9A5', 'pay_hRvUdYVRBLVbkG3Xnfjfpi9D', 'Payment via Paymongo - pay_hRvUdYVRBLVbkG3Xnfjfpi9D', '2025-11-10 20:27:49.290311', '2025-11-10 20:27:49.290311', 0),
(178, 1, 1, '2025-11-11', '08:00:00', '09:00:00', 'Confirmed', 250.00, '17628066267083Q76N', 'pay_ymgt6DFc9rsdrWh52iBCnwG7', 'Payment via Paymongo - pay_ymgt6DFc9rsdrWh52iBCnwG7', '2025-11-10 20:30:52.418424', '2025-11-10 20:30:52.418424', 0),
(179, 1, 2, '2025-11-11', '08:00:00', '09:00:00', 'Confirmed', 250.00, '17628066267083Q76N', 'pay_ymgt6DFc9rsdrWh52iBCnwG7', 'Payment via Paymongo - pay_ymgt6DFc9rsdrWh52iBCnwG7', '2025-11-10 20:30:52.481470', '2025-11-10 20:30:52.481470', 0),
(180, 1, 1, '2025-11-11', '22:00:00', '23:00:00', 'Confirmed', 250.00, '1762811037910CU6GX', NULL, 'Payment via Cash - Walk-in customer: NATHAN | Contact: +639498680515 | Email: zhiky090924@gmail.com', '2025-11-10 21:44:02.576563', '2025-11-10 21:44:02.576563', 0),
(181, 9, 2, '2025-11-12', '09:00:00', '10:00:00', 'Confirmed', 250.00, '1762811558761JEGP8', 'pay_6WWEtfLLZRMi2mgrTgj9BX7s', 'Payment via Paymongo - pay_6WWEtfLLZRMi2mgrTgj9BX7s', '2025-11-10 21:53:23.142153', '2025-11-10 21:53:23.142153', 0),
(182, 10, 1, '2025-12-01', '12:00:00', '13:00:00', 'Confirmed', 250.00, '1762856697767WD3LZ', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: POGI | Contact: 09498680515 | Email: baktolbomb@gmail.com', '2025-11-11 10:25:00.347535', '2025-11-11 10:25:00.347535', 0),
(183, 1, 2, '2025-12-05', '15:00:00', '16:00:00', 'Confirmed', 250.00, '1762856990342G4BDC', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: filbert | Contact: 09498680515 | Email: zhiky090924@gmail.com', '2025-11-11 10:29:51.898826', '2025-11-11 10:29:51.898826', 0),
(184, 10, 1, '2025-11-11', '19:00:00', '20:00:00', 'Confirmed', 250.00, '1762857078784NQSLY', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: POGI NAMAN NETO | Contact: 09498680515 | Email: baktolbomb@gmail.com', '2025-11-11 10:31:20.243016', '2025-11-11 10:31:20.243016', 0),
(185, 1, 1, '2025-12-01', '08:00:00', '09:00:00', 'Confirmed', 250.00, '17628602956507KXW8', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: NATHAN | Contact: +639498680515 | Email: zhiky090924@gmail.com', '2025-11-11 11:25:18.515427', '2025-11-11 11:25:18.515427', 1),
(186, 1, 2, '2025-12-01', '08:00:00', '09:00:00', 'Confirmed', 250.00, '17628602956507KXW8', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: NATHAN | Contact: +639498680515 | Email: zhiky090924@gmail.com', '2025-11-11 11:25:18.541802', '2025-11-11 11:25:18.541802', 1),
(187, 1, 2, '2025-11-12', '08:00:00', '09:00:00', 'Confirmed', 250.00, '1762861756706JQP83', NULL, 'Payment via PayMongo QR Ph - Walk-in customer: kukurikabu | Contact: 09498680515 | Email: zhiky090924@gmail.com', '2025-11-11 11:49:23.155775', '2025-11-11 11:49:23.155775', 1);

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
(3, 'Ivan Louis Cielo', 'dasdsa', 11, '2025-11-13 19:50:48.177958', '2025-11-13 19:50:48.177958');

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
(1, 'Filbert', 20, 'Male', 'filbert', 'zhiky090924@gmail.com', '$2a$12$GJYX0F7gaYLUv4uZ/y/gm.e2cAeOl16hXAT1Cu4HDCyY1tUYKaXaO', '09498680515', '/uploads/avatars/1761183855207-832125080.png', 1, 0, NULL, NULL, NULL, '2025-10-14 17:53:08.085210', '2025-11-11 11:49:23.000000', 'user'),
(2, 'Maria Santos', 28, 'Female', 'maria_santos', 'maria.santos@email.com', '$2a$12$example.hash.1', '09123456789', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(3, 'Juan Dela Cruz', 32, 'Male', 'juan_dc', 'juan.delacruz@email.com', '$2a$12$example.hash.2', '09234567890', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(4, 'Ana Rodriguez', 25, 'Female', 'ana_rod', 'ana.rodriguez@email.com', '$2a$12$example.hash.3', '09345678901', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(5, 'Carlos Mendoza', 35, 'Male', 'carlos_m', 'carlos.mendoza@email.com', '$2a$12$example.hash.4', '09456789012', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508', 'user'),
(6, 'Test User', 25, 'Male', 'testuser123', 'test@example.com', '$2a$12$.WwM9bXnpZy64FA2SuqgaekM1KGNbXTThrieM9Og.Ct2uiteRJ/l.', '1234567890', NULL, 1, 0, NULL, NULL, NULL, '2025-10-15 14:51:31.468010', '2025-10-15 15:02:23.000000', 'user'),
(8, 'admin', 21, 'Male', 'admin', 'rockwell.barrientos1996@gmail.com', '$2a$12$yznI4LmuRWJfoTS6B2UA0e2w8CQYy/PlZhrh5fjiJRuka6jjbXLMm', '09498680515', NULL, 1, 0, NULL, NULL, NULL, '2025-10-31 01:22:24.615642', '2025-11-13 20:49:57.876332', 'admin'),
(9, 'kukurikabu', NULL, NULL, 'guest_1762801511064_hyb2j', 'guest_1762801511064_hyb2j@walkin.local', '$2a$12$ws2m1tw2yrA/lS/xiU.58uMq./hZ5iw31QkOSbBcM0uoy2ybxVdki', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-11-10 19:05:11.779141', '2025-11-10 19:05:11.779141', 'user'),
(10, 'POGI', NULL, NULL, 'guest_1762856699787_2dafn', 'baktolbomb@gmail.com', '$2a$12$TfvFWWt6ocE9N0ADY8E6Iu5dE1xcAT9bTvpeNge8b5LjiS7phsEdO', '09498680515', NULL, 1, 0, NULL, NULL, NULL, '2025-11-11 10:25:00.272395', '2025-11-11 10:25:00.272395', 'user'),
(11, 'Ivan Louis Cielo', 22, 'Male', 'ivan', 'cieloivanlouis@gmail.com', '$2a$12$y3c6Xjzo4WG6w.95WmIo7uWdlKW.QQZqyaWM81dYw82fa9judyNba', '09366274094', '/uploads/avatars/1763065882845-613575116.jpg', 1, 0, NULL, NULL, NULL, '2025-11-13 19:50:17.012848', '2025-11-13 20:49:34.531289', 'user');

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
-- Indexes for table `queueing_courts`
--
ALTER TABLE `queueing_courts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_8998f10fcaf5371581be2dcc42` (`name`);

--
-- Indexes for table `queue_players`
--
ALTER TABLE `queue_players`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `courts`
--
ALTER TABLE `courts`
  MODIFY `Court_Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `equipments`
--
ALTER TABLE `equipments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `equipment_rentals`
--
ALTER TABLE `equipment_rentals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `equipment_rental_items`
--
ALTER TABLE `equipment_rental_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `gallery`
--
ALTER TABLE `gallery`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=123;

--
-- AUTO_INCREMENT for table `queueing_courts`
--
ALTER TABLE `queueing_courts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `queue_players`
--
ALTER TABLE `queue_players`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `Reservation_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=188;

--
-- AUTO_INCREMENT for table `suggestions`
--
ALTER TABLE `suggestions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `time_slots`
--
ALTER TABLE `time_slots`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
