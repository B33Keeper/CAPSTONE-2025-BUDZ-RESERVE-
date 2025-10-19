-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 15, 2025 at 12:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `courts`
--

DROP TABLE IF EXISTS `courts`;
CREATE TABLE `courts` (
  `Court_Id` int(11) NOT NULL,
  `Court_Name` varchar(100) NOT NULL,
  `Status` enum('Available','Maintenance','Unavailable') NOT NULL DEFAULT 'Available',
  `Price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `Updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
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
(8, 'Court 8', 'Maintenance', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(9, 'Court 9', 'Available', 220.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(10, 'Court 10', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(11, 'Court 11', 'Available', 250.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877'),
(12, 'Court 12', 'Available', 350.00, '2025-10-14 20:57:26.558877', '2025-10-14 20:57:26.558877');

-- --------------------------------------------------------

--
-- Table structure for table `equipments`
--

DROP TABLE IF EXISTS `equipments`;
CREATE TABLE `equipments` (
  `id` int(11) NOT NULL,
  `equipment_name` varchar(100) NOT NULL,
  `stocks` int(11) NOT NULL DEFAULT 0,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Available',
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `equipments`
--

INSERT INTO `equipments` (`id`, `equipment_name`, `stocks`, `price`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Badminton Racket', 20, 150.00, 'Professional badminton racket for rent', 'Available', '2025-10-14 20:58:18.817183', '2025-10-14 20:58:18.817183'),
(2, 'Shuttlecock (Pack of 12)', 15, 80.00, 'High-quality shuttlecock pack', 'Available', '2025-10-14 20:58:18.817183', '2025-10-14 20:58:18.817183'),
(3, 'Badminton Shoes', 25, 100.00, 'Comfortable badminton shoes for rent', 'Available', '2025-10-14 20:58:18.817183', '2025-10-14 20:58:18.817183'),
(4, 'Grip Tape', 30, 15.00, 'Racket grip tape for better handling', 'Available', '2025-10-14 20:58:18.817183', '2025-10-14 20:58:18.817183'),
(5, 'Towel', 50, 20.00, 'Sports towel for rent', 'Available', '2025-10-14 20:58:18.817183', '2025-10-14 20:58:18.817183');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('GCash','Maya','GrabPay','Online Banking') NOT NULL,
  `status` enum('Pending','Completed','Failed','Cancelled') NOT NULL DEFAULT 'Pending',
  `transaction_id` varchar(255) DEFAULT NULL,
  `reference_number` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `reservation_id`, `amount`, `payment_method`, `status`, `transaction_id`, `reference_number`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 250.00, 'GCash', 'Completed', 'GCASH-2025-001', 'PAY-2025-001', 'Payment for morning practice', '2025-10-15 13:04:01.263187', '2025-10-15 13:04:01.263187'),
(2, 2, 250.00, 'GCash', 'Pending', 'GCASH-2025-002', 'PAY-2025-002', 'Payment pending for training session', '2025-10-15 13:04:01.263187', '2025-10-15 13:04:01.263187'),
(3, 3, 250.00, 'Maya', 'Completed', 'MAYA-2025-001', 'PAY-2025-003', 'Weekend match preparation payment', '2025-10-15 13:04:01.263187', '2025-10-15 13:04:01.263187'),
(4, 4, 250.00, 'GrabPay', 'Completed', 'GRAB-2025-001', 'PAY-2025-004', 'Regular practice payment', '2025-10-15 13:04:01.263187', '2025-10-15 13:04:01.263187'),
(5, 5, 220.00, 'GCash', 'Pending', 'GCASH-2025-003', 'PAY-2025-005', 'Evening session payment pending', '2025-10-15 13:04:01.263187', '2025-10-15 13:04:01.263187'),
(6, 1, 250.00, 'GCash', 'Completed', 'GCASH-2025-001', 'PAY-2025-001', 'Payment for morning practice', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(7, 2, 250.00, 'GCash', 'Pending', 'GCASH-2025-002', 'PAY-2025-002', 'Payment pending for training session', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(8, 3, 250.00, 'Maya', 'Completed', 'MAYA-2025-001', 'PAY-2025-003', 'Weekend match preparation payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(9, 4, 250.00, 'GrabPay', 'Completed', 'GRAB-2025-001', 'PAY-2025-004', 'Regular practice payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(10, 5, 220.00, 'GCash', 'Pending', 'GCASH-2025-003', 'PAY-2025-005', 'Evening session payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(11, 6, 250.00, 'GCash', 'Completed', 'GCASH-2025-004', 'PAY-2025-006', 'Maria morning session payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(12, 7, 250.00, 'Maya', 'Pending', 'MAYA-2025-002', 'PAY-2025-007', 'Maria training payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(13, 8, 250.00, 'GrabPay', 'Completed', 'GRAB-2025-002', 'PAY-2025-008', 'Maria practice payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(14, 9, 220.00, 'GCash', 'Cancelled', 'GCASH-2025-005', 'PAY-2025-009', 'Maria cancelled payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(15, 10, 250.00, 'Maya', 'Completed', 'MAYA-2025-003', 'PAY-2025-010', 'Maria evening session payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(16, 11, 250.00, 'GrabPay', 'Completed', 'GRAB-2025-003', 'PAY-2025-011', 'Juan morning practice payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(17, 12, 250.00, 'GCash', 'Pending', 'GCASH-2025-006', 'PAY-2025-012', 'Juan training payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(18, 13, 220.00, 'Maya', 'Completed', 'MAYA-2025-004', 'PAY-2025-013', 'Juan afternoon session payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(19, 14, 250.00, 'GrabPay', 'Completed', 'GRAB-2025-004', 'PAY-2025-014', 'Juan practice payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(20, 15, 250.00, 'GCash', 'Pending', 'GCASH-2025-007', 'PAY-2025-015', 'Juan evening session payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(21, 16, 250.00, 'Maya', 'Completed', 'MAYA-2025-005', 'PAY-2025-016', 'Ana morning session payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(22, 17, 220.00, 'GrabPay', 'Pending', 'GRAB-2025-005', 'PAY-2025-017', 'Ana training payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(23, 18, 250.00, 'GCash', 'Completed', 'GCASH-2025-008', 'PAY-2025-018', 'Ana practice payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(24, 19, 250.00, 'Maya', 'Completed', 'MAYA-2025-006', 'PAY-2025-019', 'Ana evening session payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(25, 20, 250.00, 'GrabPay', 'Pending', 'GRAB-2025-006', 'PAY-2025-020', 'Ana night session payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(26, 21, 220.00, 'GCash', 'Completed', 'GCASH-2025-009', 'PAY-2025-021', 'Carlos morning practice payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(27, 22, 250.00, 'Maya', 'Pending', 'MAYA-2025-007', 'PAY-2025-022', 'Carlos training payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(28, 23, 250.00, 'GrabPay', 'Completed', 'GRAB-2025-007', 'PAY-2025-023', 'Carlos afternoon session payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(29, 24, 250.00, 'GCash', 'Completed', 'GCASH-2025-010', 'PAY-2025-024', 'Carlos practice payment', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833'),
(30, 25, 250.00, 'Maya', 'Pending', 'MAYA-2025-008', 'PAY-2025-025', 'Carlos evening session payment pending', '2025-10-15 13:04:01.331833', '2025-10-15 13:04:01.331833');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
  `Reservation_ID` int(11) NOT NULL,
  `User_ID` int(11) NOT NULL,
  `Court_ID` int(11) NOT NULL,
  `Reservation_Date` date NOT NULL,
  `Start_Time` time NOT NULL,
  `End_Time` time NOT NULL,
  `Status` enum('Pending','Confirmed','Cancelled','Completed') NOT NULL DEFAULT 'Pending',
  `Total_Amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Reference_Number` varchar(255) DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  `Created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `Updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`Reservation_ID`, `User_ID`, `Court_ID`, `Reservation_Date`, `Start_Time`, `End_Time`, `Status`, `Total_Amount`, `Reference_Number`, `Notes`, `Created_at`, `Updated_at`) VALUES
(1, 1, 1, '2025-01-15', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'RES-2025-001', 'Morning practice session', '2025-10-15 13:04:01.236677', '2025-10-15 13:04:01.236677'),
(2, 1, 2, '2025-01-16', '10:00:00', '11:00:00', 'Pending', 250.00, 'RES-2025-002', 'Training with coach', '2025-10-15 13:04:01.236677', '2025-10-15 13:04:01.236677'),
(3, 1, 3, '2025-01-18', '14:00:00', '15:00:00', 'Confirmed', 250.00, 'RES-2025-003', 'Weekend match preparation', '2025-10-15 13:04:01.236677', '2025-10-15 13:04:01.236677'),
(4, 1, 4, '2025-01-20', '16:00:00', '17:00:00', 'Confirmed', 250.00, 'RES-2025-004', 'Regular practice', '2025-10-15 13:04:01.236677', '2025-10-15 13:04:01.236677'),
(5, 1, 5, '2025-01-22', '18:00:00', '19:00:00', 'Pending', 220.00, 'RES-2025-005', 'Evening session with friends', '2025-10-15 13:04:01.236677', '2025-10-15 13:04:01.236677'),
(6, 2, 2, '2025-01-17', '09:00:00', '10:00:00', 'Confirmed', 250.00, 'RES-2025-006', 'Maria morning session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(7, 2, 3, '2025-01-19', '11:00:00', '12:00:00', 'Pending', 250.00, 'RES-2025-007', 'Maria training', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(8, 2, 4, '2025-01-21', '15:00:00', '16:00:00', 'Confirmed', 250.00, 'RES-2025-008', 'Maria practice', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(9, 2, 5, '2025-01-23', '17:00:00', '18:00:00', 'Cancelled', 220.00, 'RES-2025-009', 'Maria cancelled session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(10, 2, 1, '2025-01-25', '19:00:00', '20:00:00', 'Confirmed', 250.00, 'RES-2025-010', 'Maria evening session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(11, 3, 3, '2025-01-18', '08:00:00', '09:00:00', 'Confirmed', 250.00, 'RES-2025-011', 'Juan morning practice', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(12, 3, 4, '2025-01-20', '10:00:00', '11:00:00', 'Pending', 250.00, 'RES-2025-012', 'Juan training', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(13, 3, 5, '2025-01-22', '14:00:00', '15:00:00', 'Confirmed', 220.00, 'RES-2025-013', 'Juan afternoon session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(14, 3, 1, '2025-01-24', '16:00:00', '17:00:00', 'Confirmed', 250.00, 'RES-2025-014', 'Juan practice', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(15, 3, 2, '2025-01-26', '18:00:00', '19:00:00', 'Pending', 250.00, 'RES-2025-015', 'Juan evening session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(16, 4, 4, '2025-01-19', '09:00:00', '10:00:00', 'Confirmed', 250.00, 'RES-2025-016', 'Ana morning session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(17, 4, 5, '2025-01-21', '11:00:00', '12:00:00', 'Pending', 220.00, 'RES-2025-017', 'Ana training', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(18, 4, 1, '2025-01-23', '15:00:00', '16:00:00', 'Confirmed', 250.00, 'RES-2025-018', 'Ana practice', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(19, 4, 2, '2025-01-25', '17:00:00', '18:00:00', 'Confirmed', 250.00, 'RES-2025-019', 'Ana evening session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(20, 4, 3, '2025-01-27', '19:00:00', '20:00:00', 'Pending', 250.00, 'RES-2025-020', 'Ana night session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(21, 5, 5, '2025-01-20', '08:00:00', '09:00:00', 'Confirmed', 220.00, 'RES-2025-021', 'Carlos morning practice', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(22, 5, 1, '2025-01-22', '10:00:00', '11:00:00', 'Pending', 250.00, 'RES-2025-022', 'Carlos training', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(23, 5, 2, '2025-01-24', '14:00:00', '15:00:00', 'Confirmed', 250.00, 'RES-2025-023', 'Carlos afternoon session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(24, 5, 3, '2025-01-26', '16:00:00', '17:00:00', 'Confirmed', 250.00, 'RES-2025-024', 'Carlos practice', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035'),
(25, 5, 4, '2025-01-28', '18:00:00', '19:00:00', 'Pending', 250.00, 'RES-2025-025', 'Carlos evening session', '2025-10-15 13:04:01.309035', '2025-10-15 13:04:01.309035');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `sex` enum('Male','Female','Other') DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `is_verified` tinyint(4) NOT NULL DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` timestamp NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `age`, `sex`, `username`, `email`, `password`, `contact_number`, `profile_picture`, `is_active`, `is_verified`, `verification_token`, `reset_password_token`, `reset_password_expires`, `created_at`, `updated_at`) VALUES
(1, 'Filbert', 20, 'Male', 'filbert', 'zhiky090924@gmail.com', '$2a$12$GJYX0F7gaYLUv4uZ/y/gm.e2cAeOl16hXAT1Cu4HDCyY1tUYKaXaO', '09498680515', '/uploads/avatars/1760445680214-640927583.png', 1, 0, NULL, NULL, NULL, '2025-10-14 17:53:08.085210', '2025-10-15 15:26:30.000000'),
(2, 'Maria Santos', 28, 'Female', 'maria_santos', 'maria.santos@email.com', '$2a$12$example.hash.1', '09123456789', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508'),
(3, 'Juan Dela Cruz', 32, 'Male', 'juan_dc', 'juan.delacruz@email.com', '$2a$12$example.hash.2', '09234567890', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508'),
(4, 'Ana Rodriguez', 25, 'Female', 'ana_rod', 'ana.rodriguez@email.com', '$2a$12$example.hash.3', '09345678901', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508'),
(5, 'Carlos Mendoza', 35, 'Male', 'carlos_m', 'carlos.mendoza@email.com', '$2a$12$example.hash.4', '09456789012', NULL, 1, 1, NULL, NULL, NULL, '2025-10-15 13:04:01.282508', '2025-10-15 13:04:01.282508'),
(6, 'Test User', 25, 'Male', 'testuser123', 'test@example.com', '$2a$12$.WwM9bXnpZy64FA2SuqgaekM1KGNbXTThrieM9Og.Ct2uiteRJ/l.', '1234567890', NULL, 1, 0, NULL, NULL, NULL, '2025-10-15 14:51:31.468010', '2025-10-15 15:02:23.000000');

--
-- Indexes for dumped tables
--

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
-- AUTO_INCREMENT for table `courts`
--
ALTER TABLE `courts`
  MODIFY `Court_Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `equipments`
--
ALTER TABLE `equipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `Reservation_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `FK_9ed5ff4942e09edfd44ee0ccf01` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`Reservation_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `FK_23593e61d0aa200e5e4a30fa7e7` FOREIGN KEY (`User_ID`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_5333eba2d4d90484e8bcfa99110` FOREIGN KEY (`Court_ID`) REFERENCES `courts` (`Court_Id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
