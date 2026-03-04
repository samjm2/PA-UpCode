const SUPABASE_URL = "https://wxpddafbeygpgulejswi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cGRkYWZiZXlncGd1bGVqc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTU3MjMsImV4cCI6MjA4Nzk5MTcyM30.kQ7NUjWFjKb5hZc74_NA3adRTkG_jE_lTPiyolNbD2M";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// -----------------------------
// RPC CALL
// -----------------------------
export async function getTractsWithinRadius(lat, lon, radiusMeters) {
  const { data, error } = await supabase.rpc(
    "tracts_within_radius",
    {
      center_lat: lat,
      center_lon: lon,
      radius_meters: radiusMeters
    }
  );

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }
  console.log(data)
  return data;
}

export async function getSchoolsWithinRadius(lat, lon, radiusMeters) {
  const { data, error } = await supabase.rpc(
    "schools_within_radius",
    {
      center_lat: lat,
      center_lon: lon,
      radius_meters: radiusMeters
    }
  );

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }
  console.log(data)
  return data;
}
