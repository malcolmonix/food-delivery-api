/**
 * Error Tracking API Endpoint
 * Receives errors from all apps and stores them in Supabase
 */

const admin = require('firebase-admin');
const { supabase } = require('../supabase');

// Initialize Firebase Admin if not already initialized (for FCM notifications only)
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
    const errorData = req.body;

    // Validate required fields
    if (!errorData.message || !errorData.app) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine if this is a critical error
    const isCritical = 
      errorData.severity === 'critical' ||
      errorData.message?.toLowerCase().includes('crash') ||
      errorData.message?.toLowerCase().includes('fatal') ||
      (errorData.graphQLErrors && errorData.graphQLErrors.length > 0);

    // Prepare error data for Supabase (snake_case columns)
    const errorRecord = {
      app: errorData.app,
      message: errorData.message,
      stack: errorData.stack || null,
      name: errorData.name || 'Error',
      code: errorData.code || null,
      
      // GraphQL specific
      graphql_errors: errorData.graphQLErrors || null,
      network_error: errorData.networkError || null,

      // Context
      page: errorData.page || null,
      url: errorData.url || null,
      severity: errorData.severity || 'error',
      context: errorData.context || null,
      error_info: errorData.errorInfo || null,

      // Device & Browser
      device_info: errorData.device || null,
      ip: errorData.ip || null,

      // User info
      user_id: errorData.userId || null,
      user_email: errorData.userEmail || null,

      // Session info
      session_id: errorData.sessionId || null,
      
      // Status
      is_critical: isCritical,
      resolved: false,
      notes: null,
      
      // Timestamps
      client_timestamp: errorData.timestamp || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store in Supabase
    const { data, error } = await supabase
      .from('errors')
      .insert(errorRecord)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error insert failed:', error);
      return res.status(500).json({
        error: 'Failed to log error',
        message: error.message,
      });
    }

    const errorId = data.id;

    // If critical, send notification to admins via FCM
    if (isCritical && admin.messaging) {
      await notifyAdmins(errorData, errorId).catch(err => {
        console.warn('Failed to notify admins:', err);
      });
    }

    console.log(`✅ Error logged: ${errorId} from ${errorData.app}`);

    res.status(200).json({
      success: true,
      errorId,
      message: 'Error logged successfully',
    });
  } catch (error) {
    console.error('Error logging error:', error);
    res.status(500).json({
      error: 'Failed to log error',
      message: error.message,
    });
  }
};

/**
 * Notify admins of critical errors via FCM
 */
async function notifyAdmins(errorData, errorId) {
  try {
    // Get all admin users from Supabase
    const { data: admins, error } = await supabase
      .from('users')
      .select('uid, email, display_name')
      .eq('role', 'admin');

    if (error) {
      console.warn('Failed to fetch admins:', error);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('No admin users found for notifications');
      return;
    }

    // Get FCM tokens from Firestore (riders collection stores FCM tokens)
    const notifications = [];
    
    for (const admin of admins) {
      try {
        const doc = await admin.firestore().collection('users').doc(admin.uid).get();
        const userData = doc.data();
        
        if (userData && userData.fcmToken) {
          notifications.push({
            token: userData.fcmToken,
            notification: {
              title: `🚨 Critical Error in ${errorData.app}`,
              body: errorData.message.substring(0, 100),
            },
            data: {
              type: 'critical_error',
              errorId: errorId.toString(),
              app: errorData.app,
              page: errorData.page || '',
              severity: errorData.severity,
            },
            webpush: {
              fcmOptions: {
                link: `/errors/${errorId}`,
              },
            },
          });
        }
      } catch (err) {
        console.warn(`Failed to get FCM token for admin ${admin.uid}:`, err);
      }
    }

    // Send notifications
    if (notifications.length > 0) {
      const messaging = admin.messaging();
      await Promise.all(
        notifications.map((notification) =>
          messaging.send(notification).catch((err) => {
            console.warn('Failed to send notification:', err);
          })
        )
      );
      console.log(`📧 Sent ${notifications.length} admin notifications`);
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
}
