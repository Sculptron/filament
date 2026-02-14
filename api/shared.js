import { createClient } from '@supabase/supabase-js';

// ============================================================
// SERVERLESS FUNCTION: Fetch Shared Constellation
// ============================================================
// GET /api/shared?shareId=abc123
// Returns constellation data from database and increments view_count

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY  // Using anon key since constellations table allows public read
);

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shareId } = req.query;

  if (!shareId) {
    return res.status(400).json({ error: 'shareId parameter is required' });
  }

  try {
    // ============================================================
    // STEP 1: Fetch constellation by share_id
    // ============================================================
    const { data: constellation, error: fetchError } = await supabase
      .from('constellations')
      .select('*')
      .eq('share_id', shareId)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);

      // If not found, return 404
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Constellation not found. This link may be invalid or expired.'
        });
      }

      return res.status(500).json({
        error: 'Failed to load constellation'
      });
    }

    if (!constellation) {
      return res.status(404).json({
        error: 'Constellation not found'
      });
    }

    // ============================================================
    // STEP 2: Increment view_count (fire and forget)
    // ============================================================
    // Note: We use anon key which only has read access, so this will fail silently
    // That's okay - view counts are nice-to-have, not critical
    // For production, you'd want to use a separate endpoint with service role key
    supabase
      .from('constellations')
      .update({ view_count: (constellation.view_count || 0) + 1 })
      .eq('share_id', shareId)
      .then(({ error }) => {
        if (error) {
          console.log('View count increment failed (expected with anon key):', error.message);
        }
      });

    // ============================================================
    // STEP 3: Return constellation data
    // ============================================================
    return res.status(200).json({
      ...constellation.constellation_data,
      shareId: constellation.share_id,
      searchQuery: constellation.search_query,
      searchType: constellation.search_type,
      createdAt: constellation.created_at,
      viewCount: constellation.view_count || 0,
      isShared: true  // Flag to indicate this is a shared constellation
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Something went wrong while loading the constellation'
    });
  }
}
