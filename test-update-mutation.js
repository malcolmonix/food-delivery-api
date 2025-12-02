const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000/graphql';

// Mock user ID for authentication (assuming your dev server allows this or we can bypass)
// In your case, the resolver checks for { user }. 
// If we can't easily mock auth, we might hit an "Authentication required" error, 
// but that would be a 200 OK with errors, not a 400 Bad Request (usually).
// A 400 Bad Request usually implies a syntax error or variable mismatch.

async function testMutation() {
    const mutation = `
    mutation UpdateRestaurant(
      $id: ID!, 
      $name: String, 
      $logoUrl: String
    ) {
      updateRestaurant(
        id: $id, 
        name: $name, 
        logoUrl: $logoUrl
      ) {
        id
        name
        logoUrl
      }
    }
  `;

    const variables = {
        id: "restaurant-123", // We need a valid ID or one that passes type check
        name: "Updated Name Test",
        logoUrl: "http://example.com/logo.png"
    };

    console.log('Sending mutation...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ...' // We might need this
            },
            body: JSON.stringify({
                query: mutation,
                variables: variables
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);

    } catch (error) {
        console.error('Error:', error);
    }
}

testMutation();
