-- Body profile: one logical row (id=1). Easy to extend later if you ever add users.
CREATE TABLE IF NOT EXISTS body_profile (
  id                   integer PRIMARY KEY,
  weight_kg            numeric(6,2) NOT NULL CHECK (weight_kg > 0),
  height_cm            integer      NULL CHECK (height_cm > 0),
  vd_l_per_kg          numeric(4,3) NULL CHECK (vd_l_per_kg > 0),   -- ~0.6 L/kg default
  half_life_hours      numeric(4,2) NULL CHECK (half_life_hours > 0),
  caffeine_sensitivity numeric(4,2) NULL CHECK (caffeine_sensitivity > 0), -- multiplier 0.5..2
  bioavailability      numeric(4,3) NULL CHECK (bioavailability > 0 AND bioavailability <= 1),
  updated_at           timestamptz  NOT NULL DEFAULT now()
);

-- Seed a row if none exists (neutral defaults that match your previous env defaults)
INSERT INTO body_profile (id, weight_kg, height_cm, vd_l_per_kg, half_life_hours, caffeine_sensitivity, bioavailability)
SELECT 1, 75.00, 180, 0.600, 5.00, 1.00, 0.900
WHERE NOT EXISTS (SELECT 1 FROM body_profile WHERE id = 1);
