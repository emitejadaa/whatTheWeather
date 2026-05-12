-- Create the trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  destination_query TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (start_date <= end_date),
  CONSTRAINT valid_trip_duration CHECK ((end_date - start_date) <= '30 days'::INTERVAL)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);

-- Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own trips
CREATE POLICY "Users can SELECT their own trips"
  ON trips
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own trips
CREATE POLICY "Users can INSERT their own trips"
  ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own trips
CREATE POLICY "Users can UPDATE their own trips"
  ON trips
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own trips
CREATE POLICY "Users can DELETE their own trips"
  ON trips
  FOR DELETE
  USING (auth.uid() = user_id);
