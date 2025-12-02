# Fix Required for Restaurant Settings

## Issue Summary
The MenuVerse settings page is not displaying restaurant data because:

1. **GraphQL Mutation Signature Mismatch** ✅ FIXED in MenuVerse
   - Settings page was using `input: RestaurantInput!` but the API expects individual parameters
   - Fixed in `MenuVerse/src/app/(app)/settings/page.tsx`

2. **Missing Parameters in API Schema** ⚠️ NEEDS FIX
   - The `updateRestaurant` mutation doesn't accept `logoUrl` and `bannerUrl` parameters
   - Need to add these to both the GraphQL schema and resolver

3. **Wrong Restaurant ID** ✅ FIXED in MenuVerse
   - Was using `user.uid` instead of `restaurantData?.restaurantByOwner?.id`
   - Fixed in `MenuVerse/src/app/(app)/settings/page.tsx`

## Required Changes to API

### 1. Update GraphQL Schema (api/schema.js line 221-232)

Change from:
```graphql
    updateRestaurant(
      id: ID!
      name: String
      description: String
      contactEmail: String
      phoneNumber: String
      address: String
      cuisine: [String!]
      priceRange: String
      openingHours: [OpeningHourInput!]
      isActive: Boolean
    ): Restaurant!
```

To:
```graphql
    updateRestaurant(
      id: ID!
      name: String
      description: String
      contactEmail: String
      phoneNumber:String
      address: String
      cuisine: [String!]
      priceRange: String
      openingHours: [OpeningHourInput!]
      isActive: Boolean
      logoUrl: String
      bannerUrl: String
    ): Restaurant!
```

### 2. Update Resolver (api/schema.js around line 1135)

Change the function signature from:
```javascript
updateRestaurant: async (_, { id, name, description, contactEmail, phoneNumber, address, cuisine, priceRange, openingHours, isActive }, { user }) => {
```

To:
```javascript
updateRestaurant: async (_, { id, name, description, contactEmail, phoneNumber, address, cuisine, priceRange, openingHours, isActive, logoUrl, bannerUrl }, { user }) => {
```

And add these two lines after line 1153 (after `if (isActive !== undefined) updateData.isActive = isActive;`):
```javascript
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
        if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
```

## Testing
After making these changes, the settings page should:
1. Load existing restaurant data
2. Allow updating logoUrl and bannerUrl fields
3. Properly save all restaurant information
