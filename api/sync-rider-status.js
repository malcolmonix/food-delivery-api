/**
 * Sync Rider Status API Endpoint
 * Syncs rider online/offline status from Firestore to Supabase
 * This ensures admin dashboard can see rider status from Supabase
 */

const admin = require('firebase-admin');
const { supabase } = require('../supabase');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { riderId, isOnline, latitude, longitude, timestamp } = req.body;

    // Validate required fields
    if (!riderId) {
      return res.status(400).json({ error: 'riderId is required' });
    }

    console.log(`🔄 Syncing rider status: ${riderId} - ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    // 1. Update Firestore (for real-time features)
    try {
      const firestore = admin.firestore();
      await firestore.collection('riders').doc(riderId).set({
        available: isOnline,
        latitude: latitude || null,
        longitude: longitude || null,
        updatedAt: timestamp || new Date().toISOString(),
      }, { merge: true });
      
      console.log('✅ Firestore updated');
    } catch (firestoreError) {
      console.warn('⚠️  Firestore update failed:', firestoreError.message);
      // Continue to Supabase even if Firestore fails
    }

    // 2. Update Supabase (for admin dashboard queries)
    const { data, error } = await supabase
      .from('users')
      .update({
        is_online: isOnline,
        user_type: 'rider', // Mark as rider
        latitude: latitude || null,
        longitude: longitude || null,
        updated_at: new Date().toISOString(),
      })
      .eq('uid', riderId)
      .select();

    if (error) {
      console.error('❌ Supabase update failed:', error);
      
      // If user doesn't exist in Supabase, try to create basic record
      if (error.code === 'PGRST116') {
        console.log('📝 Creating user record in Supabase...');
        
        const { data: createData, error: createError } = await supabase
          .from('users')
          .insert({
            id: riderId,
            uid: riderId,
            email: `rider-${riderId}@temp.com`, // Temporary email
            user_type: 'rider', // Mark as rider
            is_online: isOnline,
            latitude: latitude || null,
            longitude: longitude || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (createError) {
          console.error('❌ Failed to create user in Supabase:', createError);
          return res.status(500).json({
            error: 'Failed to sync rider status',
            message: createError.message,
          });
        }

        console.log('✅ User created in Supabase');
        return res.status(200).json({
          success: true,
          message: 'Rider status synced (user created)',
          data: createData,
        });
      }

      return res.status(500).json({
        error: 'Failed to sync rider status',
        message: error.message,
      });
    }

    console.log('✅ Supabase updated');

    res.status(200).json({
      success: true,
      message: 'Rider status synced successfully',
      data: data,
    });

  } catch (error) {
    console.error('❌ Error syncing rider status:', error);
    res.status(500).json({
      error: 'Failed to sync rider status',
      message: error.message,
    });
  }
};
