-- Performance optimization: Add indexes for frequently queried columns
-- This migration improves query performance for reservations, especially with large datasets

-- Index on Created_at for date-based queries (used in sales reports, admin dashboard)
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(Created_at);

-- Index on Reservation_Date for booking date queries
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(Reservation_Date);

-- Index on User_ID for user-specific queries
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(User_ID);

-- Index on Status for filtering by reservation status
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(Status);

-- Composite index for common query pattern: user reservations ordered by date
CREATE INDEX IF NOT EXISTS idx_reservations_user_created ON reservations(User_ID, Created_at);

-- Index on Court_ID for court-specific queries
CREATE INDEX IF NOT EXISTS idx_reservations_court_id ON reservations(Court_ID);

-- Index on Is_Admin_Created for filtering admin-created reservations
CREATE INDEX IF NOT EXISTS idx_reservations_admin_created ON reservations(Is_Admin_Created);

-- Index on payments table for reservation_id lookups
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);

-- Index on equipment_rentals for reservation_id lookups
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_reservation_id ON equipment_rentals(reservation_id);

