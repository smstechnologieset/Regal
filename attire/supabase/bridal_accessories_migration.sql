-- =====================================================
-- BRIDAL ACCESSORIES TABLE
-- =====================================================
-- Add this to your Supabase SQL Editor to create the bridal accessories table

CREATE TABLE IF NOT EXISTS public.bridal_accessories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('veil', 'jewelry', 'headpiece', 'shoes', 'clutch')),
  price_rent DECIMAL(10, 2),
  price_buy DECIMAL(10, 2),
  images TEXT[] DEFAULT '{}',
  description TEXT,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.bridal_accessories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read-only access to bridal_accessories" ON public.bridal_accessories;
DROP POLICY IF EXISTS "Admins can manage bridal_accessories" ON public.bridal_accessories;

-- Create policies for bridal_accessories
CREATE POLICY "Allow public read-only access to bridal_accessories" 
  ON public.bridal_accessories FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage bridal_accessories" 
  ON public.bridal_accessories FOR ALL 
  USING (public.is_admin());

-- =====================================================
-- SEED DATA FOR BRIDAL ACCESSORIES
-- =====================================================

INSERT INTO public.bridal_accessories (id, name, category, price_rent, price_buy, images, description, is_new) VALUES
('acc-veil-1', 'Cathedral Length Veil', 'veil', 150, 450, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Elegant cathedral length veil with delicate lace trim. Perfect for a dramatic entrance.', true),
('acc-veil-2', 'Birdcage Veil', 'veil', 80, 200, ARRAY['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop'], 'Vintage-inspired birdcage veil for a classic, sophisticated look.', false),
('acc-veil-3', 'Fingertip Veil', 'veil', 100, 300, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Classic fingertip length veil with subtle beading along the edge.', false),

('acc-jewelry-1', 'Pearl Necklace Set', 'jewelry', 120, 500, ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop'], 'Timeless pearl necklace and earring set. Freshwater pearls with sterling silver.', true),
('acc-jewelry-2', 'Crystal Drop Earrings', 'jewelry', 80, 250, ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=600&fit=crop'], 'Sparkling crystal drop earrings that catch the light beautifully.', false),
('acc-jewelry-3', 'Diamond Bracelet', 'jewelry', 200, 800, ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop'], 'Elegant diamond tennis bracelet with lab-grown diamonds.', true),

('acc-headpiece-1', 'Floral Crown', 'headpiece', 100, 350, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Delicate floral crown with preserved flowers and greenery.', false),
('acc-headpiece-2', 'Crystal Tiara', 'headpiece', 150, 600, ARRAY['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop'], 'Regal crystal tiara perfect for a princess-style wedding.', true),
('acc-headpiece-3', 'Pearl Hair Comb', 'headpiece', 60, 180, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Elegant pearl hair comb for a subtle, sophisticated accent.', false),

('acc-shoes-1', 'Satin Pumps', 'shoes', 80, 250, ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop'], 'Classic ivory satin pumps with 3-inch heel. Comfortable and elegant.', false),
('acc-shoes-2', 'Embellished Heels', 'shoes', 120, 400, ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop'], 'Stunning heels with crystal embellishments. Make a statement with every step.', true),
('acc-shoes-3', 'Ballet Flats', 'shoes', 50, 150, ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop'], 'Comfortable ballet flats with delicate lace detail. Perfect for dancing.', false),

('acc-clutch-1', 'Pearl Clutch', 'clutch', 60, 200, ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=600&fit=crop'], 'Elegant pearl-embellished clutch with chain strap.', false),
('acc-clutch-2', 'Satin Evening Bag', 'clutch', 40, 120, ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=600&fit=crop'], 'Simple and elegant satin evening bag in ivory.', false),
('acc-clutch-3', 'Crystal Minaudière', 'clutch', 100, 350, ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=600&fit=crop'], 'Luxurious crystal-covered minaudière for a glamorous touch.', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Bridal accessories table created and seeded successfully!
-- Total accessories: 15
-- =====================================================
