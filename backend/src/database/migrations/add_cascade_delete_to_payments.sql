-- Migration: Add CASCADE delete to payments.reservation_id foreign key
-- This allows deleting reservations even when they have associated payments
-- The payments will be automatically deleted when the reservation is deleted

-- Drop the existing foreign key constraint
ALTER TABLE `payments` 
DROP FOREIGN KEY `FK_9ed5ff4942e09edfd44ee0ccf01`;

-- Re-add the foreign key constraint with CASCADE delete
ALTER TABLE `payments`
ADD CONSTRAINT `FK_9ed5ff4942e09edfd44ee0ccf01` 
FOREIGN KEY (`reservation_id`) 
REFERENCES `reservations` (`Reservation_ID`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;


