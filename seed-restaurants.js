const { dbHelpers, db, generateId } = require('./database');

async function seed() {
  try {
    console.log('Seeding sample owners and restaurants (idempotent)...');
    const now = new Date().toISOString();

    // Create seed owners (idempotent)
    const owners = [
      { uid: 'seed-owner-1', email: 'owner1@example.com', displayName: 'Seed Owner 1' },
      { uid: 'seed-owner-2', email: 'owner2@example.com', displayName: 'Seed Owner 2' },
      { uid: 'seed-owner-3', email: 'owner3@example.com', displayName: 'Seed Owner 3' },
    ];

    owners.forEach(o => {
      const existing = dbHelpers.getUserByUid(o.uid);
      if (!existing) {
        dbHelpers.createUser({
          uid: o.uid,
          email: o.email,
          password: '',
          displayName: o.displayName,
          phoneNumber: null,
          photoURL: null,
          createdAt: now,
          updatedAt: now,
        });
        console.log('Created owner:', o.uid);
      }
    });

    // Duplicate cleanup: keep earliest created restaurant per (lower(name), lower(address))
    console.log('Cleaning up duplicate restaurants (if any)...');
    const dupStmt = db.prepare(`
      SELECT name, address, COUNT(*) as cnt
      FROM restaurants
      GROUP BY LOWER(name), LOWER(address)
      HAVING COUNT(*) > 1
    `);
    const duplicates = dupStmt.all();
    for (const d of duplicates) {
      // fetch all ids for this group ordered by createdAt asc
      const rows = db.prepare('SELECT id FROM restaurants WHERE LOWER(name)=? AND LOWER(address)=? ORDER BY createdAt ASC').all(d.name.toLowerCase(), d.address.toLowerCase());
      if (rows.length > 1) {
        const keep = rows[0].id;
        const toDelete = rows.slice(1).map(r => r.id);
        const del = db.prepare('DELETE FROM restaurants WHERE id = ?');
        toDelete.forEach(id => { del.run(id); console.log('Removed duplicate restaurant id=', id); });
      }
    }

    // Restaurants to insert (Calabar, Ikom, Uyo)
    const restaurants = [
      // Calabar
      {
        name: 'Calabar Kitchen',
        description: 'Local Calabar specialties and seafood',
        address: 'Marina, Calabar, Cross River',
        lat: 4.9510,
        lng: 8.3264,
        cuisine: ['Nigerian', 'Seafood'],
        ownerUid: 'seed-owner-1',
      },
      {
        name: 'Riverside Bites',
        description: 'Casual riverside dining in Calabar',
        address: 'Riverside Road, Calabar',
        lat: 4.9525,
        lng: 8.3275,
        cuisine: ['Casual', 'Grill'],
        ownerUid: 'seed-owner-1',
      },
      // Ikom
      {
        name: 'Ikom Local Grill',
        description: 'Traditional grill and local flavours',
        address: 'Market Rd, Ikom, Cross River',
        lat: 5.9650,
        lng: 8.7270,
        cuisine: ['Local', 'Grill'],
        ownerUid: 'seed-owner-2',
      },
      {
        name: 'Cross River Eats',
        description: 'Family-friendly restaurant in Ikom',
        address: 'Main St, Ikom',
        lat: 5.9605,
        lng: 8.7300,
        cuisine: ['Family', 'Nigerian'],
        ownerUid: 'seed-owner-2',
      },
      // Uyo
      {
        name: 'Uyo Delights',
        description: 'Uyo local favourites and street food',
        address: 'Akwa Ibom Rd, Uyo',
        lat: 5.0320,
        lng: 7.9185,
        cuisine: ['Akwa Ibom', 'Nigerian'],
        ownerUid: 'seed-owner-3',
      },
      {
        name: 'Akwa Bites',
        description: 'Comfort food and quick bites in Uyo',
        address: 'Town Centre, Uyo',
        lat: 5.0305,
        lng: 7.9200,
        cuisine: ['Fast Food', 'Local'],
        ownerUid: 'seed-owner-3',
      },
    ];

    const created = [];

    for (const r of restaurants) {
      // check if restaurant exists by normalized name+address
      const existing = db.prepare('SELECT * FROM restaurants WHERE LOWER(name)=? AND LOWER(address)=? LIMIT 1').get(r.name.toLowerCase(), r.address.toLowerCase());
      if (existing) {
        // Update cuisine and lat/lng if missing or different
        const needUpdate = (existing.latitude === null || existing.longitude === null || JSON.stringify(JSON.parse(existing.cuisine || '[]')) !== JSON.stringify(r.cuisine));
        if (needUpdate) {
          db.prepare('UPDATE restaurants SET cuisine = ?, latitude = ?, longitude = ?, updatedAt = ? WHERE id = ?')
            .run(JSON.stringify(r.cuisine || []), r.lat, r.lng, now, existing.id);
          console.log('Updated existing restaurant lat/lng/cuisine:', existing.id);
        } else {
          console.log('Restaurant exists, skipping insert:', existing.id);
        }
        created.push({ id: existing.id, name: r.name, address: r.address, lat: r.lat, lng: r.lng, skipped: true });
        continue;
      }

      const restaurantData = {
        name: r.name,
        description: r.description,
        contactEmail: null,
        phoneNumber: null,
        address: r.address,
        cuisine: r.cuisine,
        priceRange: null,
        openingHours: [],
        isActive: true,
        rating: null,
        reviewCount: 0,
        ownerId: r.ownerUid,
        createdAt: now,
        updatedAt: now,
      };

      const id = dbHelpers.createRestaurant(restaurantData);

      // Set latitude/longitude using direct update
      try {
        const upd = db.prepare('UPDATE restaurants SET latitude = ?, longitude = ? WHERE id = ?');
        upd.run(r.lat, r.lng, id);
      } catch (e) {
        console.warn('Failed to set lat/lng for', id, e.message || e);
      }

      created.push({ id, name: r.name, address: r.address, lat: r.lat, lng: r.lng, skipped: false });
      console.log('Inserted restaurant:', r.name, 'id=', id);
    }

    console.log('\nSeeding complete. Restaurants processed:');
    console.log(JSON.stringify(created, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
