-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Nov 29, 2025 at 08:29 PM
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

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `image_url`, `announcement_type`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(11, 'Queueing Schedule', NULL, '/uploads/announcements/1763665735979-747450007.jpg', 'image', 1, 8, '2025-11-20 19:08:56.006388', '2025-11-20 19:12:35.000000'),
(12, 'Queueing schedule', NULL, '/uploads/announcements/1763665802776-592725168.jpg', 'image', 1, 8, '2025-11-20 19:10:02.803080', '2025-11-20 19:28:01.000000'),
(13, 'Queueing Schedule', NULL, '/uploads/announcements/1763665822974-992925982.jpg', 'image', 1, 8, '2025-11-20 19:10:23.005518', '2025-11-20 19:28:14.000000'),
(15, 'dadsad', NULL, '/uploads/announcements/1763939103734-49088419.png', 'image', 0, 8, '2025-11-23 23:05:03.747252', '2025-11-24 03:37:09.000000');

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
(2, 'Court 2', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-11-20 18:46:09.000000'),
(3, 'Court 3', 'Maintenance', 250.00, '2025-10-14 20:57:26.558877', '2025-11-20 08:34:56.000000'),
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
(1, 'Yonex GR 303', 5, 150.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-23 13:43:03.000000', '/uploads/equipments/1763665580696-174217441.png', 'Head Heavy', '5U', '30lbs'),
(2, 'Li-Ning Blaze 100', 5, 80.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-23 22:59:44.000000', '/uploads/equipments/1763938769872-935997635.png', 'heavy', '5u', '30lbs'),
(3, 'YONEX Arcsaber 7 Play', 25, 100.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-23 23:05:39.000000', '/uploads/equipments/1763939139699-706814749.png', 'heavy', '5u', '35lbs'),
(4, 'Victor Thruster', 5, 15.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-27 00:11:35.000000', '/uploads/equipments/1763665624609-30605186.png', 'Head Heavy', '5u', '29lbs'),
(5, 'Apacs Power', 5, 20.00, 'Available', '2025-10-14 20:58:18.817183', '2025-11-27 00:11:56.000000', '/uploads/equipments/1763665631982-619789640.png', 'Lightweight', '4U', '33lbs'),
(6, 'AlpSport', 5, 100.00, 'Available', '2025-11-07 04:47:49.382927', '2025-11-27 00:12:17.000000', '/uploads/equipments/1763665638634-241461592.png', 'Balance', '4U', '33lbs');

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
(155, 459, 11, 20.00, NULL, '2025-11-29 16:41:01.555785', '2025-11-29 16:41:01.000000'),
(156, 462, 8, 20.00, NULL, '2025-11-29 18:46:53.371053', '2025-11-29 18:46:53.000000'),
(157, 465, 8, 750.00, NULL, '2025-11-29 19:11:05.885929', '2025-11-29 19:11:05.000000'),
(158, 467, 20, 150.00, NULL, '2025-11-29 19:34:44.294532', '2025-11-29 19:34:44.000000'),
(159, 468, 20, 20.00, NULL, '2025-11-29 19:34:44.392989', '2025-11-29 19:34:44.000000'),
(160, 469, 8, 160.00, NULL, '2025-11-29 19:45:34.342642', '2025-11-29 19:45:34.000000'),
(161, 470, 8, 160.00, NULL, '2025-11-29 19:45:34.422709', '2025-11-29 19:45:34.000000'),
(162, 471, 11, 500.00, NULL, '2025-11-29 19:47:04.252389', '2025-11-29 19:47:04.000000'),
(163, 473, 11, 1000.00, NULL, '2025-11-29 19:53:04.212725', '2025-11-29 19:53:04.000000'),
(164, 475, 8, 300.00, NULL, '2025-11-29 20:10:44.846293', '2025-11-29 20:10:44.000000'),
(165, 476, 8, 300.00, NULL, '2025-11-29 20:10:44.970910', '2025-11-29 20:10:45.000000'),
(166, 477, 11, 600.00, NULL, '2025-11-29 20:18:56.324745', '2025-11-29 20:18:56.000000'),
(167, 479, 11, 330.00, NULL, '2025-11-29 20:21:12.523593', '2025-11-29 20:21:12.000000'),
(168, 482, 8, 20.00, NULL, '2025-11-29 20:23:30.803308', '2025-11-29 20:23:30.000000'),
(169, 483, 8, 20.00, NULL, '2025-11-29 20:23:30.873125', '2025-11-29 20:23:30.000000');

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
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `rental_start_time` datetime DEFAULT NULL,
  `rental_end_time` datetime DEFAULT NULL,
  `stock_restored` tinyint NOT NULL DEFAULT '0',
  `notification_sent` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `equipment_rental_items`
--

INSERT INTO `equipment_rental_items` (`id`, `rental_id`, `equipment_id`, `quantity`, `hours`, `hourly_price`, `subtotal`, `created_at`, `rental_start_time`, `rental_end_time`, `stock_restored`, `notification_sent`) VALUES
(195, 155, 5, 1, 1, 20.00, 20.00, '2025-11-29 16:41:01.574021', '2025-11-30 10:00:00', '2025-11-30 11:00:00', 0, 0),
(196, 156, 5, 1, 1, 20.00, 20.00, '2025-11-29 18:46:53.418749', '2025-11-30 08:00:00', '2025-11-30 09:00:00', 0, 0),
(197, 157, 1, 5, 1, 150.00, 750.00, '2025-11-29 19:11:05.910455', '2025-11-30 13:00:00', '2025-11-30 14:00:00', 0, 0),
(198, 158, 1, 1, 1, 150.00, 150.00, '2025-11-29 19:34:44.335961', '2025-11-30 21:00:00', '2025-11-30 22:00:00', 0, 0),
(199, 159, 5, 1, 1, 20.00, 20.00, '2025-11-29 19:34:44.416327', '2025-11-30 22:00:00', '2025-11-30 23:00:00', 0, 0),
(200, 160, 2, 2, 1, 80.00, 160.00, '2025-11-29 19:45:34.377044', '2025-12-01 08:00:00', '2025-12-01 09:00:00', 0, 0),
(201, 161, 2, 2, 1, 80.00, 160.00, '2025-11-29 19:45:34.447145', '2025-12-01 09:00:00', '2025-12-01 10:00:00', 0, 0),
(202, 162, 6, 5, 1, 100.00, 500.00, '2025-11-29 19:47:04.277911', '2025-12-01 10:00:00', '2025-12-01 11:00:00', 0, 0),
(203, 163, 6, 5, 1, 100.00, 500.00, '2025-11-29 19:53:04.224745', '2025-12-01 12:00:00', '2025-12-01 13:00:00', 0, 0),
(204, 163, 6, 5, 1, 100.00, 500.00, '2025-11-29 19:53:04.237373', '2025-12-01 12:00:00', '2025-12-01 13:00:00', 0, 0),
(205, 164, 6, 3, 1, 100.00, 300.00, '2025-11-29 20:10:44.890475', '2025-12-01 21:00:00', '2025-12-01 22:00:00', 0, 0),
(206, 165, 6, 3, 1, 100.00, 300.00, '2025-11-29 20:10:45.024555', '2025-12-01 22:00:00', '2025-12-01 23:00:00', 0, 0),
(207, 166, 1, 2, 1, 150.00, 300.00, '2025-11-29 20:18:56.340708', '2025-12-02 08:00:00', '2025-12-02 09:00:00', 0, 0),
(208, 166, 1, 2, 1, 150.00, 300.00, '2025-11-29 20:18:56.359321', '2025-12-02 08:00:00', '2025-12-02 09:00:00', 0, 0),
(209, 167, 6, 1, 1, 100.00, 100.00, '2025-11-29 20:21:12.554576', '2025-12-03 08:00:00', '2025-12-03 09:00:00', 0, 0),
(210, 167, 1, 1, 1, 150.00, 150.00, '2025-11-29 20:21:12.585617', '2025-12-03 08:00:00', '2025-12-03 09:00:00', 0, 0),
(211, 167, 2, 1, 1, 80.00, 80.00, '2025-11-29 20:21:12.629406', '2025-12-03 08:00:00', '2025-12-03 09:00:00', 0, 0),
(212, 168, 5, 1, 1, 20.00, 20.00, '2025-11-29 20:23:30.830626', '2025-11-30 15:00:00', '2025-11-30 16:00:00', 0, 0),
(213, 169, 5, 1, 1, 20.00, 20.00, '2025-11-29 20:23:30.899837', '2025-11-30 16:00:00', '2025-11-30 17:00:00', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `fee_management`
--

CREATE TABLE `fee_management` (
  `id` int NOT NULL,
  `player_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `player_name` varchar(120) NOT NULL,
  `player_sex` enum('male','female') NOT NULL,
  `games_played` int NOT NULL DEFAULT '0',
  `shuttle_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `court_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('paid','unpaid') NOT NULL DEFAULT 'unpaid',
  `fee_date` date NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fee_management_history`
--

CREATE TABLE `fee_management_history` (
  `id` int NOT NULL,
  `player_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `player_name` varchar(120) NOT NULL,
  `player_sex` enum('male','female') NOT NULL,
  `games_played` int NOT NULL DEFAULT '0',
  `shuttle_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `court_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('paid','unpaid') NOT NULL DEFAULT 'unpaid',
  `fee_date` date NOT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(7, 'sdadvasd', NULL, '/uploads/gallery/1763886260743-445033276.jpg', 'active', 0, '2025-11-23 08:24:20.762591', '2025-11-23 08:24:20.762591');

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
(1, 1737129600000, 'AddUserIdToQueueTables1737129600000');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `type` enum('equipment_rental_expired') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `equipment_rental_item_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `is_read`, `equipment_rental_item_id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 'equipment_rental_expired', 'Equipment Return Reminder - Apacs Power', 'Ivan Louis Cielo needs to return 1 Apacs Power(s). Rental period ended on November 29, 2025 at 05:00 PM.', 1, 187, 11, '2025-11-29 09:55:00.418778', '2025-11-29 10:13:39.000000');

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
(554, 460, 250.00, 'Maya', 'Completed', 'pay_5GZSaMgCxaVhJbjy7NVt6eQw', '1764434435381PQEXO', 'Badminton Court Booking - 2025-11-30', '2025-11-29 16:41:01.529117', '2025-11-29 16:41:01.529117'),
(555, 459, 250.00, 'Maya', 'Completed', 'pay_5GZSaMgCxaVhJbjy7NVt6eQw', '1764434435381PQEXO', 'Badminton Court Booking - 2025-11-30', '2025-11-29 16:41:01.534372', '2025-11-29 16:41:01.534372'),
(556, 461, 220.00, 'GCash', 'Completed', 'admin_cash_1764441923923', 'REF1764441924539', 'Payment via Paymongo - admin_cash_1764441923923', '2025-11-29 18:45:24.542748', '2025-11-29 18:45:24.542748'),
(557, 462, 490.00, 'GCash', 'Completed', 'admin_qrph_1764442013252', 'REF1764442013348', 'Payment via Paymongo - admin_qrph_1764442013252', '2025-11-29 18:46:53.350814', '2025-11-29 18:46:53.350814'),
(558, 463, 490.00, 'GCash', 'Completed', 'admin_qrph_1764442013252', 'REF1764442013461', 'Payment via Paymongo - admin_qrph_1764442013252', '2025-11-29 18:46:53.464593', '2025-11-29 18:46:53.464593'),
(559, 464, 250.00, 'GCash', 'Completed', 'admin_cash_1764443352728', 'REF1764443352783', 'Payment via Paymongo - admin_cash_1764443352728', '2025-11-29 19:09:12.786454', '2025-11-29 19:09:12.786454'),
(560, 465, 1000.00, 'GCash', 'Completed', 'admin_cash_1764443465783', 'REF1764443465863', 'Payment via Paymongo - admin_cash_1764443465783', '2025-11-29 19:11:05.864811', '2025-11-29 19:11:05.864811'),
(561, 466, 250.00, 'GCash', 'Completed', 'admin_cash_1764443710045', 'REF1764443710196', 'Payment via Paymongo - admin_cash_1764443710045', '2025-11-29 19:15:10.218448', '2025-11-29 19:15:10.218448'),
(562, 467, 670.00, 'GCash', 'Completed', 'admin_cash_1764444883573', 'REF1764444884265', 'Payment via Paymongo - admin_cash_1764444883573', '2025-11-29 19:34:44.268010', '2025-11-29 19:34:44.268010'),
(563, 468, 670.00, 'GCash', 'Completed', 'admin_cash_1764444883573', 'REF1764444884378', 'Payment via Paymongo - admin_cash_1764444883573', '2025-11-29 19:34:44.380010', '2025-11-29 19:34:44.380010'),
(564, 469, 820.00, 'GCash', 'Completed', 'admin_cash_1764445534183', 'REF1764445534321', 'Payment via Paymongo - admin_cash_1764445534183', '2025-11-29 19:45:34.322768', '2025-11-29 19:45:34.322768'),
(565, 470, 820.00, 'GCash', 'Completed', 'admin_cash_1764445534183', 'REF1764445534409', 'Payment via Paymongo - admin_cash_1764445534183', '2025-11-29 19:45:34.411887', '2025-11-29 19:45:34.411887'),
(566, 471, 220.00, 'GrabPay', 'Completed', 'pay_CMHErPzTpj4FnqNTwfYpxoGX', '1764445611478AH9E4', 'Badminton Court Booking - 2025-12-01', '2025-11-29 19:47:04.177494', '2025-11-29 19:47:04.177494'),
(567, 472, 250.00, 'GrabPay', 'Completed', 'pay_CMHErPzTpj4FnqNTwfYpxoGX', '1764445611478AH9E4', 'Badminton Court Booking - 2025-12-01', '2025-11-29 19:47:04.178516', '2025-11-29 19:47:04.178516'),
(568, 474, 250.00, 'Maya', 'Completed', 'pay_AERL9NB7vJkV8j7qbJbTS9er', '1764445975181LNU05', 'Badminton Court Booking - 2025-12-01', '2025-11-29 19:53:04.197091', '2025-11-29 19:53:04.197091'),
(569, 473, 220.00, 'Maya', 'Completed', 'pay_AERL9NB7vJkV8j7qbJbTS9er', '1764445975181LNU05', 'Badminton Court Booking - 2025-12-01', '2025-11-29 19:53:04.198238', '2025-11-29 19:53:04.198238'),
(570, 475, 1100.00, 'GCash', 'Completed', 'admin_cash_1764447044663', 'REF1764447044816', 'Payment via Paymongo - admin_cash_1764447044663', '2025-11-29 20:10:44.823053', '2025-11-29 20:10:44.823053'),
(571, 476, 1100.00, 'GCash', 'Completed', 'admin_cash_1764447044663', 'REF1764447044945', 'Payment via Paymongo - admin_cash_1764447044663', '2025-11-29 20:10:44.948714', '2025-11-29 20:10:44.948714'),
(572, 477, 250.00, 'GrabPay', 'Completed', 'pay_phbqEu9P2r1QtVqPzEtW81o5', '1764447505163O4TS2', 'Badminton Court Booking - 2025-12-02', '2025-11-29 20:18:56.296027', '2025-11-29 20:18:56.296027'),
(573, 478, 220.00, 'GrabPay', 'Completed', 'pay_phbqEu9P2r1QtVqPzEtW81o5', '1764447505163O4TS2', 'Badminton Court Booking - 2025-12-02', '2025-11-29 20:18:56.297158', '2025-11-29 20:18:56.297158'),
(574, 479, 220.00, 'GrabPay', 'Completed', 'pay_xrWMbS4rxzzW8V1jMaBsrQya', '1764447659383NVCLR', 'Badminton Court Booking - 2025-12-03', '2025-11-29 20:21:12.464266', '2025-11-29 20:21:12.464266'),
(575, 481, 250.00, 'GrabPay', 'Completed', 'pay_xrWMbS4rxzzW8V1jMaBsrQya', '1764447659383NVCLR', 'Badminton Court Booking - 2025-12-03', '2025-11-29 20:21:12.467070', '2025-11-29 20:21:12.467070'),
(576, 480, 250.00, 'GrabPay', 'Completed', 'pay_xrWMbS4rxzzW8V1jMaBsrQya', '1764447659383NVCLR', 'Badminton Court Booking - 2025-12-03', '2025-11-29 20:21:12.465574', '2025-11-29 20:21:12.465574'),
(577, 482, 510.00, 'GCash', 'Completed', 'admin_cash_1764447810711', 'REF1764447810790', 'Payment via Paymongo - admin_cash_1764447810711', '2025-11-29 20:23:30.791535', '2025-11-29 20:23:30.791535'),
(578, 483, 510.00, 'GCash', 'Completed', 'admin_cash_1764447810711', 'REF1764447810859', 'Payment via Paymongo - admin_cash_1764447810711', '2025-11-29 20:23:30.861919', '2025-11-29 20:23:30.861919');

-- --------------------------------------------------------

--
-- Table structure for table `queueing_courts`
--

CREATE TABLE `queueing_courts` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('available','occupied','maintenance','unavailable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `queue_matches`
--

CREATE TABLE `queue_matches` (
  `id` int NOT NULL,
  `gameType` enum('mens-doubles','womens-doubles','mixed-doubles') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','active','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `teamA` json NOT NULL,
  `teamB` json NOT NULL,
  `court_id` int DEFAULT NULL,
  `court_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `winner` enum('teamA','teamB','draw') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `queue_matches`
--

INSERT INTO `queue_matches` (`id`, `gameType`, `status`, `teamA`, `teamB`, `court_id`, `court_name`, `started_at`, `completed_at`, `created_at`, `updated_at`, `winner`, `user_id`) VALUES
(144, 'mens-doubles', 'completed', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 135, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-23 08:21:51', '2025-11-23 08:22:00', '2025-11-23 08:21:50.906662', '2025-11-24 05:34:52.000000', 'teamA', 11),
(145, 'mens-doubles', 'completed', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 135, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-23 08:22:36', '2025-11-23 08:32:37', '2025-11-23 08:22:35.522298', '2025-11-24 05:34:52.000000', 'teamB', 11),
(146, 'mens-doubles', 'completed', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 135, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', NULL, 'Court 2', '2025-11-23 08:32:38', '2025-11-23 14:56:21', '2025-11-23 08:22:48.710203', '2025-11-23 14:56:21.000000', 'teamA', 11),
(147, 'mens-doubles', 'completed', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 135, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}, {\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-23 15:17:02', '2025-11-23 15:45:00', '2025-11-23 15:17:02.389460', '2025-11-24 05:34:52.000000', 'teamA', 11),
(148, 'mixed-doubles', 'cancelled', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 139, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 138, \"sex\": \"female\", \"name\": \"Jersey\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-23 15:45:01', '2025-11-23 15:45:08', '2025-11-23 15:17:20.835935', '2025-11-24 05:34:52.000000', NULL, 11),
(149, 'mixed-doubles', 'completed', '[{\"id\": 135, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}, {\"id\": 139, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 138, \"sex\": \"female\", \"name\": \"Jersey\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-23 21:08:27', '2025-11-23 21:08:50', '2025-11-23 21:08:27.293739', '2025-11-24 05:34:52.000000', 'teamB', 11),
(150, 'mixed-doubles', 'completed', '[{\"id\": 135, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}, {\"id\": 138, \"sex\": \"female\", \"name\": \"Jersey\", \"skill\": \"Intermediate\"}]', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 139, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-23 22:55:45', '2025-11-23 22:57:28', '2025-11-23 22:55:45.071410', '2025-11-24 05:34:52.000000', 'teamA', 11),
(151, 'mens-doubles', 'completed', '[{\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 142, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}]', '[{\"id\": 143, \"sex\": \"male\", \"name\": \"Benito\", \"skill\": \"Advanced\"}, {\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', NULL, 'Court 2', '2025-11-23 22:56:10', '2025-11-23 22:56:25', '2025-11-23 22:56:09.870424', '2025-11-23 22:56:25.000000', 'teamA', 11),
(152, 'mens-doubles', 'completed', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 142, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}]', '[{\"id\": 135, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}, {\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-23 22:57:28', '2025-11-23 22:57:33', '2025-11-23 22:56:21.147471', '2025-11-24 05:34:54.000000', 'teamA', 11),
(153, 'mens-doubles', 'completed', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]', '[{\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 142, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-23 23:02:51', '2025-11-23 23:03:37', '2025-11-23 23:02:51.495680', '2025-11-24 05:34:52.000000', 'teamA', 11),
(154, 'mixed-doubles', 'completed', '[{\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 138, \"sex\": \"female\", \"name\": \"Jersey\", \"skill\": \"Intermediate\"}]', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 139, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', NULL, 'Court 2', '2025-11-23 23:03:48', '2025-11-23 23:03:51', '2025-11-23 23:03:14.323304', '2025-11-23 23:03:50.000000', 'teamA', 11),
(155, 'womens-doubles', 'completed', '[{\"id\": 139, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 138, \"sex\": \"female\", \"name\": \"Jersey\", \"skill\": \"Intermediate\"}]', '[{\"id\": 140, \"sex\": \"female\", \"name\": \"lala\", \"skill\": \"Advanced\"}, {\"id\": 141, \"sex\": \"female\", \"name\": \"lele\", \"skill\": \"Advanced\"}]', NULL, 'Court 2', '2025-11-23 23:03:33', '2025-11-23 23:03:47', '2025-11-23 23:03:32.509121', '2025-11-23 23:03:47.000000', 'teamA', 11),
(156, 'mixed-doubles', 'completed', '[{\"id\": 146, \"sex\": \"male\", \"name\": \"levy\", \"skill\": \"Intermediate\"}, {\"id\": 147, \"sex\": \"female\", \"name\": \"mitch\", \"skill\": \"Beginner\"}]', '[{\"id\": 149, \"sex\": \"male\", \"name\": \"bunorks\", \"skill\": \"Beginner\"}, {\"id\": 148, \"sex\": \"female\", \"name\": \"rose\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-24 01:12:59', '2025-11-24 01:13:32', '2025-11-24 01:12:58.860218', '2025-11-24 05:34:52.000000', 'teamA', 18),
(157, 'mixed-doubles', 'active', '[{\"id\": 149, \"sex\": \"male\", \"name\": \"bunorks\", \"skill\": \"Beginner\"}, {\"id\": 147, \"sex\": \"female\", \"name\": \"mitch\", \"skill\": \"Beginner\"}]', '[{\"id\": 146, \"sex\": \"male\", \"name\": \"levy\", \"skill\": \"Intermediate\"}, {\"id\": 148, \"sex\": \"female\", \"name\": \"rose\", \"skill\": \"Intermediate\"}]', NULL, 'Court 2', '2025-11-24 01:13:32', NULL, '2025-11-24 01:13:25.045240', '2025-11-24 01:13:32.000000', NULL, 18),
(158, 'mens-doubles', 'completed', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]', '[{\"id\": 145, \"sex\": \"male\", \"name\": \"Benito\", \"skill\": \"Advanced\"}, {\"id\": 142, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-24 03:32:29', '2025-11-24 03:33:53', '2025-11-24 03:32:29.019179', '2025-11-24 05:34:52.000000', 'teamA', 11),
(159, 'mixed-doubles', 'cancelled', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 141, \"sex\": \"female\", \"name\": \"lele\", \"skill\": \"Advanced\"}]', '[{\"id\": 139, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-24 03:33:53', '2025-11-24 03:34:17', '2025-11-24 03:33:37.369972', '2025-11-24 05:34:54.000000', NULL, 11),
(160, 'mixed-doubles', 'completed', '[{\"id\": 144, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}, {\"id\": 141, \"sex\": \"female\", \"name\": \"lele\", \"skill\": \"Advanced\"}]', '[{\"id\": 142, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}, {\"id\": 139, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-24 03:34:33', '2025-11-24 05:00:29', '2025-11-24 03:34:33.460797', '2025-11-24 05:34:52.000000', 'teamA', 11),
(161, 'mens-doubles', 'completed', '[{\"id\": 136, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 142, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}]', '[{\"id\": 144, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}, {\"id\": 145, \"sex\": \"male\", \"name\": \"Benito\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-24 05:00:30', '2025-11-24 05:00:35', '2025-11-24 03:35:02.933517', '2025-11-24 05:34:52.000000', 'teamA', 11),
(162, 'mens-doubles', 'cancelled', '[{\"id\": 134, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 142, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}]', '[{\"id\": 137, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 144, \"sex\": \"male\", \"name\": \"Filbert\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-24 05:00:35', '2025-11-24 05:00:39', '2025-11-24 03:35:02.972105', '2025-11-24 05:34:52.000000', NULL, 11),
(163, 'mens-doubles', 'completed', '[{\"id\": 155, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 157, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 163, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 160, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-26 00:57:53', '2025-11-26 02:09:04', '2025-11-26 00:57:52.589977', '2025-11-29 19:06:37.000000', 'teamB', 11),
(164, 'mens-doubles', 'completed', '[{\"id\": 155, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 157, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 163, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 160, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-26 21:14:59', '2025-11-27 00:20:50', '2025-11-26 21:14:59.133951', '2025-11-29 19:06:37.000000', 'teamB', 11),
(165, 'mens-doubles', 'cancelled', '[{\"id\": 155, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 157, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 160, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 163, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-27 00:20:51', '2025-11-27 00:20:52', '2025-11-26 21:15:06.602981', '2025-11-29 19:06:37.000000', NULL, 11),
(166, 'mens-doubles', 'completed', '[{\"id\": 169, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 168, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 170, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 167, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 18:28:15', '2025-11-28 18:53:58', '2025-11-28 18:28:14.669580', '2025-11-29 19:06:37.000000', 'teamA', 11),
(169, 'mens-doubles', 'completed', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 19:59:51', '2025-11-28 21:35:33', '2025-11-28 19:59:51.052047', '2025-11-29 19:06:37.000000', 'teamA', 11),
(170, 'mens-doubles', 'completed', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 21:35:34', '2025-11-28 21:35:39', '2025-11-28 20:00:47.504956', '2025-11-29 19:06:37.000000', 'teamB', 11),
(171, 'mens-doubles', 'completed', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 21:35:39', '2025-11-28 21:36:02', '2025-11-28 20:25:40.881896', '2025-11-29 19:06:37.000000', 'teamB', 11),
(172, 'mens-doubles', 'completed', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}]', '[{\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 21:36:02', '2025-11-28 21:36:09', '2025-11-28 20:25:40.936703', '2025-11-29 19:06:37.000000', 'teamB', 11),
(173, 'mens-doubles', 'completed', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 21:36:09', '2025-11-28 21:36:13', '2025-11-28 20:25:40.941760', '2025-11-29 19:06:37.000000', 'teamB', 11),
(174, 'mens-doubles', 'cancelled', '[{\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 21:39:44', '2025-11-28 21:45:34', '2025-11-28 21:39:43.837737', '2025-11-29 19:06:37.000000', NULL, 11),
(178, 'womens-doubles', 'cancelled', '[{\"id\": 176, \"sex\": \"female\", \"name\": \"Jerse\", \"skill\": \"Intermediate\"}, {\"id\": 179, \"sex\": \"female\", \"name\": \"Keke\", \"skill\": \"Beginner\"}]', '[{\"id\": 177, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 178, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Beginner\"}]', NULL, NULL, '2025-11-28 22:09:05', '2025-11-28 22:10:55', '2025-11-28 22:09:04.938824', '2025-11-29 19:06:37.000000', NULL, 11),
(179, 'womens-doubles', 'cancelled', '[{\"id\": 177, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 179, \"sex\": \"female\", \"name\": \"Keke\", \"skill\": \"Beginner\"}]', '[{\"id\": 176, \"sex\": \"female\", \"name\": \"Jerse\", \"skill\": \"Intermediate\"}, {\"id\": 178, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Beginner\"}]', NULL, NULL, '2025-11-28 22:09:05', '2025-11-28 22:10:58', '2025-11-28 22:09:04.979890', '2025-11-29 19:06:37.000000', NULL, 11),
(180, 'womens-doubles', 'cancelled', '[{\"id\": 178, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Beginner\"}, {\"id\": 179, \"sex\": \"female\", \"name\": \"Keke\", \"skill\": \"Beginner\"}]', '[{\"id\": 176, \"sex\": \"female\", \"name\": \"Jerse\", \"skill\": \"Intermediate\"}, {\"id\": 177, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-28 22:09:05', '2025-11-28 22:10:59', '2025-11-28 22:09:04.988286', '2025-11-29 19:06:37.000000', NULL, 11),
(181, 'mens-doubles', 'completed', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 22:10:55', '2025-11-28 22:20:19', '2025-11-28 22:09:20.779500', '2025-11-29 19:06:37.000000', 'teamA', 11),
(182, 'mens-doubles', 'completed', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-28 22:20:19', '2025-11-28 23:34:38', '2025-11-28 22:09:20.786833', '2025-11-29 19:06:37.000000', 'teamA', 11),
(184, 'womens-doubles', 'completed', '[{\"id\": 177, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 179, \"sex\": \"female\", \"name\": \"Keke\", \"skill\": \"Beginner\"}]', '[{\"id\": 176, \"sex\": \"female\", \"name\": \"Jerse\", \"skill\": \"Intermediate\"}, {\"id\": 178, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Beginner\"}]', NULL, NULL, '2025-11-28 22:19:15', '2025-11-28 22:20:21', '2025-11-28 22:19:14.666891', '2025-11-29 19:06:37.000000', 'teamA', 11),
(185, 'womens-doubles', 'completed', '[{\"id\": 177, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 178, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Beginner\"}]', '[{\"id\": 176, \"sex\": \"female\", \"name\": \"Jerse\", \"skill\": \"Intermediate\"}, {\"id\": 179, \"sex\": \"female\", \"name\": \"Keke\", \"skill\": \"Beginner\"}]', NULL, NULL, '2025-11-28 22:20:21', '2025-11-28 23:34:39', '2025-11-28 22:19:14.756766', '2025-11-29 19:06:37.000000', 'teamB', 11),
(259, 'mens-doubles', 'completed', '[{\"id\": 191, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 190, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 189, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-29 00:15:39', '2025-11-29 00:15:58', '2025-11-29 00:15:38.848592', '2025-11-29 19:06:37.000000', 'teamA', 11),
(260, 'womens-doubles', 'completed', '[{\"id\": 195, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 196, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 194, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 193, \"sex\": \"female\", \"name\": \"jersey\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 00:15:50', '2025-11-29 00:15:59', '2025-11-29 00:15:50.194065', '2025-11-29 19:06:37.000000', 'teamB', 11),
(261, 'mixed-doubles', 'completed', '[{\"id\": 191, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 194, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 195, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 00:16:11', '2025-11-29 00:16:15', '2025-11-29 00:16:11.377058', '2025-11-29 19:06:37.000000', 'teamA', 11),
(262, 'mens-doubles', 'completed', '[{\"id\": 191, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 190, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 189, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-29 00:23:00', '2025-11-29 10:02:23', '2025-11-29 00:23:00.438807', '2025-11-29 19:06:37.000000', 'teamB', 11),
(335, 'womens-doubles', 'completed', '[{\"id\": 195, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 196, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 193, \"sex\": \"female\", \"name\": \"jersey\", \"skill\": \"Intermediate\"}, {\"id\": 197, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 00:23:15', '2025-11-29 10:02:25', '2025-11-29 00:23:14.556400', '2025-11-29 19:06:37.000000', 'teamA', 11),
(341, 'mixed-doubles', 'completed', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 196, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 189, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}, {\"id\": 197, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 10:02:54', '2025-11-29 11:29:32', '2025-11-29 10:02:54.268066', '2025-11-29 19:06:37.000000', 'teamB', 11),
(377, 'womens-doubles', 'completed', '[{\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jerse\", \"skill\": \"Intermediate\"}, {\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 13:47:34', '2025-11-29 13:54:46', '2025-11-29 13:47:33.536285', '2025-11-29 19:06:37.000000', 'teamA', 11),
(378, 'womens-doubles', 'completed', '[{\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jerse\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 13:54:46', '2025-11-29 13:54:48', '2025-11-29 13:47:33.555699', '2025-11-29 19:06:37.000000', 'teamA', 11),
(379, 'womens-doubles', 'completed', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jerse\", \"skill\": \"Intermediate\"}, {\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', '[{\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 13:54:48', '2025-11-29 13:54:50', '2025-11-29 13:47:33.560117', '2025-11-29 19:06:37.000000', 'teamA', 11),
(380, 'womens-doubles', 'completed', '[{\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jersey\", \"skill\": \"Beginner\"}, {\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 14:00:46', '2025-11-29 15:16:49', '2025-11-29 14:00:46.411690', '2025-11-29 19:06:37.000000', 'teamA', 11),
(383, 'mens-doubles', 'completed', '[{\"id\": 220, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}, {\"id\": 221, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', '[{\"id\": 219, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 222, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', NULL, NULL, '2025-11-29 14:00:52', '2025-11-29 15:16:53', '2025-11-29 14:00:52.049199', '2025-11-29 19:06:37.000000', 'teamA', 11),
(386, 'womens-doubles', 'completed', '[{\"id\": 233, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 234, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]', '[{\"id\": 232, \"sex\": \"female\", \"name\": \"Jersey\", \"skill\": \"Intermediate\"}, {\"id\": 235, \"sex\": \"female\", \"name\": \"raval\", \"skill\": \"Intermediate\"}]', NULL, NULL, '2025-11-29 15:00:57', '2025-11-29 15:16:51', '2025-11-29 15:00:57.357074', '2025-11-29 19:06:37.000000', 'teamA', 11);

-- --------------------------------------------------------

--
-- Table structure for table `queue_matches_history`
--

CREATE TABLE `queue_matches_history` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `original_id` int NOT NULL,
  `court_id` int DEFAULT NULL,
  `court_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `winner` enum('teamA','teamB','draw') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `archived_at` datetime NOT NULL,
  `gameType` enum('mens-doubles','womens-doubles','mixed-doubles') COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamA` json NOT NULL,
  `teamB` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `queue_matches_history`
--

INSERT INTO `queue_matches_history` (`id`, `user_id`, `original_id`, `court_id`, `court_name`, `started_at`, `completed_at`, `winner`, `created_at`, `updated_at`, `archived_at`, `gameType`, `teamA`, `teamB`) VALUES
(26, 11, 163, 30, 'Court 1', '2025-11-26 00:57:53', '2025-11-26 02:09:04', 'teamB', '2025-11-26 00:57:52.589000', '2025-11-26 02:09:03.000000', '2025-11-26 02:09:04', 'mens-doubles', '[{\"id\": 155, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 157, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 163, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 160, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]'),
(27, 11, 164, 30, 'Court 1', '2025-11-26 21:14:59', '2025-11-27 00:20:50', 'teamB', '2025-11-26 21:14:59.133000', '2025-11-27 00:20:50.000000', '2025-11-27 00:20:50', 'mens-doubles', '[{\"id\": 155, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 157, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 163, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 160, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]'),
(28, 11, 166, 30, 'Court 1', '2025-11-28 18:28:15', '2025-11-28 18:53:58', 'teamA', '2025-11-28 18:28:14.669000', '2025-11-28 18:53:58.000000', '2025-11-28 18:53:58', 'mens-doubles', '[{\"id\": 169, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 168, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 170, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 167, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}]'),
(29, 11, 169, 30, 'Court 1', '2025-11-28 19:59:51', '2025-11-28 21:35:33', 'teamA', '2025-11-28 19:59:51.052000', '2025-11-28 21:35:33.000000', '2025-11-28 21:35:34', 'mens-doubles', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]'),
(30, 11, 170, 31, 'Court 2', '2025-11-28 21:35:34', '2025-11-28 21:35:39', 'teamB', '2025-11-28 20:00:47.504000', '2025-11-28 21:35:38.000000', '2025-11-28 21:35:39', 'mens-doubles', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]'),
(31, 11, 171, 31, 'Court 2', '2025-11-28 21:35:39', '2025-11-28 21:36:02', 'teamB', '2025-11-28 20:25:40.881000', '2025-11-28 21:36:02.000000', '2025-11-28 21:36:02', 'mens-doubles', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]'),
(32, 11, 172, 31, 'Court 2', '2025-11-28 21:36:02', '2025-11-28 21:36:09', 'teamB', '2025-11-28 20:25:40.936000', '2025-11-28 21:36:08.000000', '2025-11-28 21:36:09', 'mens-doubles', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}]', '[{\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]'),
(33, 11, 173, 31, 'Court 2', '2025-11-28 21:36:09', '2025-11-28 21:36:13', 'teamB', '2025-11-28 20:25:40.941000', '2025-11-28 21:36:13.000000', '2025-11-28 21:36:14', 'mens-doubles', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]'),
(34, 11, 181, 30, 'Court 1', '2025-11-28 22:10:55', '2025-11-28 22:20:19', 'teamA', '2025-11-28 22:09:20.779000', '2025-11-28 22:20:18.000000', '2025-11-28 22:20:19', 'mens-doubles', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]'),
(35, 11, 184, 31, 'Court 2', '2025-11-28 22:19:15', '2025-11-28 22:20:21', 'teamA', '2025-11-28 22:19:14.666000', '2025-11-28 22:20:20.000000', '2025-11-28 22:20:21', 'womens-doubles', '[{\"id\": 177, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 179, \"sex\": \"female\", \"name\": \"Keke\", \"skill\": \"Beginner\"}]', '[{\"id\": 176, \"sex\": \"female\", \"name\": \"Jerse\", \"skill\": \"Intermediate\"}, {\"id\": 178, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Beginner\"}]'),
(36, 11, 182, 30, 'Court 1', '2025-11-28 22:20:19', '2025-11-28 23:34:38', 'teamA', '2025-11-28 22:09:20.786000', '2025-11-28 23:34:37.000000', '2025-11-28 23:34:38', 'mens-doubles', '[{\"id\": 171, \"sex\": \"male\", \"name\": \"dfadaw\", \"skill\": \"Advanced\"}, {\"id\": 174, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]', '[{\"id\": 173, \"sex\": \"male\", \"name\": \"dasda\", \"skill\": \"Advanced\"}, {\"id\": 175, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]'),
(37, 11, 185, 31, 'Court 2', '2025-11-28 22:20:21', '2025-11-28 23:34:39', 'teamB', '2025-11-28 22:19:14.756000', '2025-11-28 23:34:39.000000', '2025-11-28 23:34:39', 'womens-doubles', '[{\"id\": 177, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 178, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Beginner\"}]', '[{\"id\": 176, \"sex\": \"female\", \"name\": \"Jerse\", \"skill\": \"Intermediate\"}, {\"id\": 179, \"sex\": \"female\", \"name\": \"Keke\", \"skill\": \"Beginner\"}]'),
(38, 11, 259, 30, 'Court 1', '2025-11-29 00:15:39', '2025-11-29 00:15:58', 'teamA', '2025-11-29 00:15:38.848000', '2025-11-29 00:15:58.000000', '2025-11-29 00:15:58', 'mens-doubles', '[{\"id\": 191, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 190, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 189, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]'),
(39, 11, 260, 31, 'Court 2', '2025-11-29 00:15:50', '2025-11-29 00:15:59', 'teamB', '2025-11-29 00:15:50.194000', '2025-11-29 00:15:59.000000', '2025-11-29 00:15:59', 'womens-doubles', '[{\"id\": 195, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 196, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 194, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 193, \"sex\": \"female\", \"name\": \"jersey\", \"skill\": \"Intermediate\"}]'),
(40, 11, 261, 30, 'Court 1', '2025-11-29 00:16:11', '2025-11-29 00:16:15', 'teamA', '2025-11-29 00:16:11.377000', '2025-11-29 00:16:14.000000', '2025-11-29 00:16:15', 'mixed-doubles', '[{\"id\": 191, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 194, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 195, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]'),
(41, 11, 262, 30, 'Court 1', '2025-11-29 00:23:00', '2025-11-29 10:02:23', 'teamB', '2025-11-29 00:23:00.438000', '2025-11-29 10:02:22.000000', '2025-11-29 10:02:23', 'mens-doubles', '[{\"id\": 191, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}, {\"id\": 190, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}]', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 189, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}]'),
(42, 11, 335, 31, 'Court 2', '2025-11-29 00:23:15', '2025-11-29 10:02:25', 'teamA', '2025-11-29 00:23:14.556000', '2025-11-29 10:02:24.000000', '2025-11-29 10:02:25', 'womens-doubles', '[{\"id\": 195, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 196, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 193, \"sex\": \"female\", \"name\": \"jersey\", \"skill\": \"Intermediate\"}, {\"id\": 197, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]'),
(43, 11, 341, 30, 'Court 1', '2025-11-29 10:02:54', '2025-11-29 11:29:32', 'teamB', '2025-11-29 10:02:54.268000', '2025-11-29 11:29:31.000000', '2025-11-29 11:29:32', 'mixed-doubles', '[{\"id\": 192, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}, {\"id\": 196, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 189, \"sex\": \"male\", \"name\": \"ivan\", \"skill\": \"Advanced\"}, {\"id\": 197, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]'),
(44, 11, 377, 30, 'Court 1', '2025-11-29 13:47:34', '2025-11-29 13:54:46', 'teamA', '2025-11-29 13:47:33.536000', '2025-11-29 13:54:45.000000', '2025-11-29 13:54:46', 'womens-doubles', '[{\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jerse\", \"skill\": \"Intermediate\"}, {\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]'),
(45, 11, 378, 30, 'Court 1', '2025-11-29 13:54:46', '2025-11-29 13:54:48', 'teamA', '2025-11-29 13:47:33.555000', '2025-11-29 13:54:48.000000', '2025-11-29 13:54:48', 'womens-doubles', '[{\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jerse\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]'),
(46, 11, 379, 30, 'Court 1', '2025-11-29 13:54:48', '2025-11-29 13:54:50', 'teamA', '2025-11-29 13:47:33.560000', '2025-11-29 13:54:49.000000', '2025-11-29 13:54:50', 'womens-doubles', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jerse\", \"skill\": \"Intermediate\"}, {\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]', '[{\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]'),
(47, 11, 380, 30, 'Court 1', '2025-11-29 14:00:46', '2025-11-29 15:16:49', 'teamA', '2025-11-29 14:00:46.411000', '2025-11-29 15:16:49.000000', '2025-11-29 15:16:49', 'womens-doubles', '[{\"id\": 225, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}, {\"id\": 226, \"sex\": \"female\", \"name\": \"Raval\", \"skill\": \"Intermediate\"}]', '[{\"id\": 223, \"sex\": \"female\", \"name\": \"jersey\", \"skill\": \"Beginner\"}, {\"id\": 224, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}]'),
(48, 11, 386, 32, 'Court 3', '2025-11-29 15:00:57', '2025-11-29 15:16:51', 'teamA', '2025-11-29 15:00:57.357000', '2025-11-29 15:16:51.000000', '2025-11-29 15:16:51', 'womens-doubles', '[{\"id\": 233, \"sex\": \"female\", \"name\": \"Anne\", \"skill\": \"Intermediate\"}, {\"id\": 234, \"sex\": \"female\", \"name\": \"Bello\", \"skill\": \"Intermediate\"}]', '[{\"id\": 232, \"sex\": \"female\", \"name\": \"Jersey\", \"skill\": \"Intermediate\"}, {\"id\": 235, \"sex\": \"female\", \"name\": \"raval\", \"skill\": \"Intermediate\"}]'),
(49, 11, 383, 31, 'Court 2', '2025-11-29 14:00:52', '2025-11-29 15:16:53', 'teamA', '2025-11-29 14:00:52.049000', '2025-11-29 15:16:53.000000', '2025-11-29 15:16:53', 'mens-doubles', '[{\"id\": 220, \"sex\": \"male\", \"name\": \"Louis\", \"skill\": \"Advanced\"}, {\"id\": 221, \"sex\": \"male\", \"name\": \"Cielo\", \"skill\": \"Advanced\"}]', '[{\"id\": 219, \"sex\": \"male\", \"name\": \"Ivan\", \"skill\": \"Advanced\"}, {\"id\": 222, \"sex\": \"male\", \"name\": \"Degamo\", \"skill\": \"Advanced\"}]');

-- --------------------------------------------------------

--
-- Table structure for table `queue_match_players`
--

CREATE TABLE `queue_match_players` (
  `id` int NOT NULL,
  `queue_match_id` int NOT NULL,
  `queue_player_id` int NOT NULL,
  `team` enum('A','B') COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `queue_players_history`
--

CREATE TABLE `queue_players_history` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `original_id` int NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sex` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `skill` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `games_played` int NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_played` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `archived_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(459, 11, 1, '2025-11-30', '10:00:00', '11:00:00', 'Confirmed', 250.00, '1764434435381PQEXO', 'pay_5GZSaMgCxaVhJbjy7NVt6eQw', 'Payment via Paymongo - pay_5GZSaMgCxaVhJbjy7NVt6eQw', '2025-11-29 16:41:01.457830', '2025-11-29 16:41:01.457830', 0),
(460, 11, 2, '2025-11-30', '09:00:00', '10:00:00', 'Confirmed', 250.00, '1764434435381PQEXO', 'pay_5GZSaMgCxaVhJbjy7NVt6eQw', 'Payment via Paymongo - pay_5GZSaMgCxaVhJbjy7NVt6eQw', '2025-11-29 16:41:01.507226', '2025-11-29 16:41:01.507226', 0),
(461, 8, 4, '2025-11-30', '11:00:00', '12:00:00', 'Confirmed', 220.00, '17644418953919OY1I', 'admin_cash_1764441923923', 'Payment via Paymongo - admin_cash_1764441923923', '2025-11-29 18:45:24.424119', '2025-11-29 18:45:24.424119', 0),
(462, 8, 4, '2025-11-30', '08:00:00', '09:00:00', 'Confirmed', 220.00, '17644419917181H27E', 'admin_qrph_1764442013252', 'Payment via Paymongo - admin_qrph_1764442013252', '2025-11-29 18:46:53.334637', '2025-11-29 18:46:53.334637', 0),
(463, 8, 5, '2025-11-30', '08:00:00', '09:00:00', 'Confirmed', 250.00, '17644419917181H27E', 'admin_qrph_1764442013252', 'Payment via Paymongo - admin_qrph_1764442013252', '2025-11-29 18:46:53.450561', '2025-11-29 18:46:53.450561', 0),
(464, 8, 5, '2025-11-30', '12:00:00', '13:00:00', 'Confirmed', 250.00, '17644433483149OBZ4', 'admin_cash_1764443352728', 'Payment via Paymongo - admin_cash_1764443352728', '2025-11-29 19:09:12.764680', '2025-11-29 19:09:12.764680', 0),
(465, 8, 6, '2025-11-30', '13:00:00', '14:00:00', 'Confirmed', 250.00, '1764443462097U7UA0', 'admin_cash_1764443465783', 'Payment via Paymongo - admin_cash_1764443465783', '2025-11-29 19:11:05.854039', '2025-11-29 19:11:05.854039', 0),
(466, 8, 5, '2025-11-30', '14:00:00', '15:00:00', 'Confirmed', 250.00, '17644437072904OLXT', 'admin_cash_1764443710045', 'Payment via Paymongo - admin_cash_1764443710045', '2025-11-29 19:15:10.116271', '2025-11-29 19:15:10.116271', 0),
(467, 20, 2, '2025-11-30', '21:00:00', '22:00:00', 'Confirmed', 250.00, '1764444878986G5YGQ', 'admin_cash_1764444883573', 'Payment via Paymongo - admin_cash_1764444883573', '2025-11-29 19:34:44.251786', '2025-11-29 19:34:44.251786', 1),
(468, 20, 1, '2025-11-30', '22:00:00', '23:00:00', 'Confirmed', 250.00, '1764444878986G5YGQ', 'admin_cash_1764444883573', 'Payment via Paymongo - admin_cash_1764444883573', '2025-11-29 19:34:44.368360', '2025-11-29 19:34:44.368360', 1),
(469, 8, 1, '2025-12-01', '08:00:00', '09:00:00', 'Confirmed', 250.00, '1764445526666VE0B6', 'admin_cash_1764445534183', 'Payment via Paymongo - admin_cash_1764445534183', '2025-11-29 19:45:34.300442', '2025-11-29 19:45:34.300442', 1),
(470, 8, 2, '2025-12-01', '09:00:00', '10:00:00', 'Confirmed', 250.00, '1764445526666VE0B6', 'admin_cash_1764445534183', 'Payment via Paymongo - admin_cash_1764445534183', '2025-11-29 19:45:34.401444', '2025-11-29 19:45:34.401444', 1),
(471, 11, 4, '2025-12-01', '10:00:00', '11:00:00', 'Confirmed', 220.00, '1764445611478AH9E4', 'pay_CMHErPzTpj4FnqNTwfYpxoGX', 'Payment via Paymongo - pay_CMHErPzTpj4FnqNTwfYpxoGX', '2025-11-29 19:47:04.117281', '2025-11-29 19:47:04.117281', 0),
(472, 11, 5, '2025-12-01', '11:00:00', '12:00:00', 'Confirmed', 250.00, '1764445611478AH9E4', 'pay_CMHErPzTpj4FnqNTwfYpxoGX', 'Payment via Paymongo - pay_CMHErPzTpj4FnqNTwfYpxoGX', '2025-11-29 19:47:04.152122', '2025-11-29 19:47:04.152122', 0),
(473, 11, 4, '2025-12-01', '12:00:00', '13:00:00', 'Confirmed', 220.00, '1764445975181LNU05', 'pay_AERL9NB7vJkV8j7qbJbTS9er', 'Payment via Paymongo - pay_AERL9NB7vJkV8j7qbJbTS9er', '2025-11-29 19:53:04.160389', '2025-11-29 19:53:04.160389', 0),
(474, 11, 5, '2025-12-01', '13:00:00', '14:00:00', 'Confirmed', 250.00, '1764445975181LNU05', 'pay_AERL9NB7vJkV8j7qbJbTS9er', 'Payment via Paymongo - pay_AERL9NB7vJkV8j7qbJbTS9er', '2025-11-29 19:53:04.186501', '2025-11-29 19:53:04.186501', 0),
(475, 8, 2, '2025-12-01', '21:00:00', '22:00:00', 'Confirmed', 250.00, '17644469536256RJ9V', 'admin_cash_1764447044663', 'Payment via Paymongo - admin_cash_1764447044663', '2025-11-29 20:10:44.783566', '2025-11-29 20:10:44.783566', 1),
(476, 8, 1, '2025-12-01', '22:00:00', '23:00:00', 'Confirmed', 250.00, '17644469536256RJ9V', 'admin_cash_1764447044663', 'Payment via Paymongo - admin_cash_1764447044663', '2025-11-29 20:10:44.932693', '2025-11-29 20:10:44.932693', 1),
(477, 11, 2, '2025-12-02', '08:00:00', '09:00:00', 'Confirmed', 250.00, '1764447505163O4TS2', 'pay_phbqEu9P2r1QtVqPzEtW81o5', 'Payment via Paymongo - pay_phbqEu9P2r1QtVqPzEtW81o5', '2025-11-29 20:18:56.247045', '2025-11-29 20:18:56.247045', 0),
(478, 11, 4, '2025-12-02', '09:00:00', '10:00:00', 'Confirmed', 220.00, '1764447505163O4TS2', 'pay_phbqEu9P2r1QtVqPzEtW81o5', 'Payment via Paymongo - pay_phbqEu9P2r1QtVqPzEtW81o5', '2025-11-29 20:18:56.274030', '2025-11-29 20:18:56.274030', 0),
(479, 11, 4, '2025-12-03', '08:00:00', '09:00:00', 'Confirmed', 220.00, '1764447659383NVCLR', 'pay_xrWMbS4rxzzW8V1jMaBsrQya', 'Payment via Paymongo - pay_xrWMbS4rxzzW8V1jMaBsrQya', '2025-11-29 20:21:12.375841', '2025-11-29 20:21:12.375841', 0),
(480, 11, 5, '2025-12-03', '09:00:00', '10:00:00', 'Confirmed', 250.00, '1764447659383NVCLR', 'pay_xrWMbS4rxzzW8V1jMaBsrQya', 'Payment via Paymongo - pay_xrWMbS4rxzzW8V1jMaBsrQya', '2025-11-29 20:21:12.400167', '2025-11-29 20:21:12.400167', 0),
(481, 11, 6, '2025-12-03', '10:00:00', '11:00:00', 'Confirmed', 250.00, '1764447659383NVCLR', 'pay_xrWMbS4rxzzW8V1jMaBsrQya', 'Payment via Paymongo - pay_xrWMbS4rxzzW8V1jMaBsrQya', '2025-11-29 20:21:12.431130', '2025-11-29 20:21:12.431130', 0),
(482, 8, 4, '2025-11-30', '15:00:00', '16:00:00', 'Confirmed', 220.00, '17644477878163Y36J', 'admin_cash_1764447810711', 'Payment via Paymongo - admin_cash_1764447810711', '2025-11-29 20:23:30.783695', '2025-11-29 20:23:30.783695', 1),
(483, 8, 5, '2025-11-30', '16:00:00', '17:00:00', 'Confirmed', 250.00, '17644477878163Y36J', 'admin_cash_1764447810711', 'Payment via Paymongo - admin_cash_1764447810711', '2025-11-29 20:23:30.849977', '2025-11-29 20:23:30.849977', 1);

-- --------------------------------------------------------

--
-- Table structure for table `reservations_history`
--

CREATE TABLE `reservations_history` (
  `History_ID` int NOT NULL,
  `original_id` int NOT NULL,
  `User_ID` int NOT NULL,
  `Court_ID` int NOT NULL,
  `Reservation_Date` date NOT NULL,
  `Start_Time` time NOT NULL,
  `End_Time` time NOT NULL,
  `Status` enum('Pending','Confirmed','Cancelled','Completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Confirmed',
  `Total_Amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Reference_Number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Paymongo_Reference_Number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Notes` text COLLATE utf8mb4_unicode_ci,
  `Is_Admin_Created` tinyint(1) NOT NULL DEFAULT '0',
  `Created_at` datetime NOT NULL,
  `Updated_at` datetime NOT NULL,
  `Archived_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(3, 'Ivan Louis Cielo', 'dasdsa', 11, '2025-11-13 19:50:48.177958', '2025-11-13 19:50:48.177958'),
(5, 'fsadsad', 'adasdasdasd', NULL, '2025-11-24 01:17:54.968694', '2025-11-24 01:17:54.968694'),
(6, 'Ivan Louis Cielo', 'dsadsafsadasdas', 11, '2025-11-24 01:18:42.389427', '2025-11-24 01:18:42.389427');

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
(11, 'Ivan Louis Cielo', 22, 'Male', 'ivan', 'cieloivanlouis@gmail.com', '$2a$12$yxrOwOyaMhWICPKs5hBzsO6Is.6CMrtpg58aA1OrpmWlMSUB76BhG', '+63 936 627 4094', '/uploads/avatars/1763665522840-755203769.jpg', 1, 0, NULL, NULL, NULL, '2025-11-13 19:50:17.012848', '2025-11-28 21:22:24.000000', 'user'),
(14, 'jerjerjer', 22, 'Male', 'jerjer', 'koko@gmail.com', '$2a$12$/3ov1rB.TXUVaeMIiPHRzOkxiWDsTIx.ILHoKp3HTmIRq74OyIHfq', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-11-21 19:30:16.619265', '2025-11-21 19:30:16.619265', 'user'),
(15, 'popopo', 22, 'Male', 'popo', 'dadw@gmail.com', '$2a$12$Zg/XA8hGRY4kXc529EHIJ.ZBIufiyrs5gY5Tc2ESj0vo52D8znWpy', '09366274094', NULL, 1, 0, NULL, NULL, NULL, '2025-11-21 19:43:28.020506', '2025-11-23 07:05:16.000000', 'user'),
(16, 'Oscar kokak', 15, 'Male', 'kokak', 'kokak@gmail.com', '$2a$12$.TOONeE3OPe/1hbrkw86cOE5V0A7mcqwFXZ17g8KQyAR5O4TEGSdO', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-11-23 17:12:08.472796', '2025-11-23 17:12:08.472796', 'user'),
(17, 'lolopo', 25, 'Female', 'lolo', 'ic.ivanlouis.cielo@cvsu.edu.ph', '$2a$12$e0XO3xznV.3biMKo5/RCcuLymmUur.0r3cIsHU6h7/xuxGncSU2T2', '+63 936 627 4094', '/uploads/avatars/1763938274876-277620260.jpg', 1, 0, NULL, NULL, NULL, '2025-11-23 22:49:15.052270', '2025-11-23 22:52:20.000000', 'user'),
(18, 'Levy Cielo', 25, 'Male', 'levycielo27', 'levycielo27@gmai.com', '$2a$12$Q0u1gBJRYqF.WQu0ZPPzvOzWM61X.mIZGcZ9VeDDg5k.XTRhpQQ1i', '+639271800604', NULL, 1, 0, NULL, NULL, NULL, '2025-11-24 01:07:33.318298', '2025-11-24 01:07:33.318298', 'user'),
(19, 'sfes', 22, 'Male', 'sfdsf', 'sdfds@gmail.com', '$2a$12$DBtJB1L1P3wHh0RyQLsgB.UajKgUVKo8EuH4/IV/mKu9T.uQtxjxe', NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-11-28 15:22:08.142230', '2025-11-28 15:22:08.142230', 'user'),
(20, 'Jersey Anne', NULL, NULL, 'guest_1764444883797_spmkf', 'jersecutie06@gmail.com', '$2a$12$a2w/m.IcYo3Djcmmg17pneF9x88j3REK9OEK.Xd.THwf9Ay1y9pw2', '09498680515', NULL, 1, 0, NULL, NULL, NULL, '2025-11-29 19:34:44.219711', '2025-11-29 19:34:44.219711', 'user');

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
-- Indexes for table `fee_management`
--
ALTER TABLE `fee_management`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fee_management_player_id` (`player_id`),
  ADD KEY `idx_fee_management_user_id` (`user_id`),
  ADD KEY `idx_fee_management_fee_date` (`fee_date`),
  ADD KEY `idx_fee_management_payment_status` (`payment_status`);

--
-- Indexes for table `fee_management_history`
--
ALTER TABLE `fee_management_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fee_management_history_player_id` (`player_id`),
  ADD KEY `idx_fee_management_history_user_id` (`user_id`),
  ADD KEY `idx_fee_management_history_fee_date` (`fee_date`),
  ADD KEY `idx_fee_management_history_payment_status` (`payment_status`);

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
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_notifications_is_read` (`is_read`),
  ADD KEY `IDX_notifications_user_id` (`user_id`),
  ADD KEY `IDX_notifications_equipment_rental_item_id` (`equipment_rental_item_id`),
  ADD KEY `IDX_notifications_created_at` (`created_at`);

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
-- Indexes for table `queue_matches`
--
ALTER TABLE `queue_matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_d5a0337f1dac2b96c88cb22799e` (`court_id`);

--
-- Indexes for table `queue_matches_history`
--
ALTER TABLE `queue_matches_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `queue_match_players`
--
ALTER TABLE `queue_match_players`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_queue_match_players_match` (`queue_match_id`),
  ADD KEY `IDX_queue_match_players_player` (`queue_player_id`);

--
-- Indexes for table `queue_players`
--
ALTER TABLE `queue_players`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `queue_players_history`
--
ALTER TABLE `queue_players_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`Reservation_ID`),
  ADD KEY `FK_23593e61d0aa200e5e4a30fa7e7` (`User_ID`),
  ADD KEY `FK_5333eba2d4d90484e8bcfa99110` (`Court_ID`);

--
-- Indexes for table `reservations_history`
--
ALTER TABLE `reservations_history`
  ADD PRIMARY KEY (`History_ID`),
  ADD KEY `IDX_reservations_history_user_id` (`User_ID`),
  ADD KEY `IDX_reservations_history_court_id` (`Court_ID`),
  ADD KEY `IDX_reservations_history_archived_at` (`Archived_at`),
  ADD KEY `IDX_reservations_history_original_id` (`original_id`),
  ADD KEY `IDX_reservations_history_date` (`Reservation_Date`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `courts`
--
ALTER TABLE `courts`
  MODIFY `Court_Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `equipments`
--
ALTER TABLE `equipments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `equipment_rentals`
--
ALTER TABLE `equipment_rentals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=170;

--
-- AUTO_INCREMENT for table `equipment_rental_items`
--
ALTER TABLE `equipment_rental_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=214;

--
-- AUTO_INCREMENT for table `fee_management`
--
ALTER TABLE `fee_management`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `fee_management_history`
--
ALTER TABLE `fee_management_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `gallery`
--
ALTER TABLE `gallery`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=579;

--
-- AUTO_INCREMENT for table `queueing_courts`
--
ALTER TABLE `queueing_courts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `queue_matches`
--
ALTER TABLE `queue_matches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=461;

--
-- AUTO_INCREMENT for table `queue_matches_history`
--
ALTER TABLE `queue_matches_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `queue_match_players`
--
ALTER TABLE `queue_match_players`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `queue_players`
--
ALTER TABLE `queue_players`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=246;

--
-- AUTO_INCREMENT for table `queue_players_history`
--
ALTER TABLE `queue_players_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=171;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `Reservation_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=484;

--
-- AUTO_INCREMENT for table `reservations_history`
--
ALTER TABLE `reservations_history`
  MODIFY `History_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suggestions`
--
ALTER TABLE `suggestions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `time_slots`
--
ALTER TABLE `time_slots`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

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
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `FK_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `FK_9ed5ff4942e09edfd44ee0ccf01` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`Reservation_ID`) ON DELETE CASCADE;

--
-- Constraints for table `queue_matches`
--
ALTER TABLE `queue_matches`
  ADD CONSTRAINT `FK_d5a0337f1dac2b96c88cb22799e` FOREIGN KEY (`court_id`) REFERENCES `queueing_courts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `queue_match_players`
--
ALTER TABLE `queue_match_players`
  ADD CONSTRAINT `FK_queue_match_players_match` FOREIGN KEY (`queue_match_id`) REFERENCES `queue_matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_queue_match_players_player` FOREIGN KEY (`queue_player_id`) REFERENCES `queue_players` (`id`) ON DELETE CASCADE;

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
