// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { Profile } from '../../utils/supabase/types'; // Import custom types

// This is the standard client creation function from the Vercel example
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Helper function to get profile with role (client-side)
export async function getProfileWithRoleClientSide(userId: string): Promise<Profile | null> {
  const supabase = createClient(); // Uses the client defined above
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*') // Select all fields including role
    .eq('id', userId)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile (client-side):', profileError?.message);
    return null;
  }
  return profileData as Profile;
}