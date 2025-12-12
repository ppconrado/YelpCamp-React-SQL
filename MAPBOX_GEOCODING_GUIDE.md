# 📍 Mapbox Geocoding Integration Guide

## Overview

This guide explains how Mapbox geocoding works and how to implement precise location input with autocomplete in your campground application.

---

## 🎯 How Mapbox Geocoding Works

### Current Implementation (Simple Text Input)

```javascript
// User types: "New York"
// Backend geocodes: → [longitude, latitude]
// Stored: location: "New York", geometry: { coordinates: [-74.0, 40.7] }
```

**Limitations:**

- ❌ No autocomplete suggestions
- ❌ Ambiguous locations (multiple "New York"s worldwide)
- ❌ Limited precision (city-level only)
- ❌ No address components (street, postal code, etc.)
- ❌ Poor UX (user must type perfectly)

---

### Enhanced Implementation (Mapbox Autocomplete)

```javascript
// User types: "1234 Main"
// Shows suggestions:
//   📍 1234 Main St, Los Angeles, CA 90012
//   📍 1234 Main Ave, New York, NY 10001
//   📍 1234 Main Rd, Chicago, IL 60601
// User selects → Full location data returned
```

**Benefits:**

- ✅ Real-time autocomplete with suggestions
- ✅ Precise addresses (street + number)
- ✅ Complete address components
- ✅ Exact coordinates
- ✅ Better UX (guided selection)
- ✅ No ambiguity

---

## 📦 What Data Mapbox Returns

### Basic Location Object

```javascript
{
  placeName: "1234 Main Street, Los Angeles, California 90012, United States",
  coordinates: [-118.2437, 34.0522], // [longitude, latitude]

  // Address components
  address: "1234",          // Street number
  text: "Main Street",      // Street name
  postcode: "90012",
  place: "Los Angeles",
  locality: "Downtown",
  neighborhood: "Arts District",
  region: "California",
  country: "United States",

  // Type of location
  placeType: "address",  // address, poi, place, locality, etc.
}
```

### Place Types Supported

| Type           | Example                    | Precision                 |
| -------------- | -------------------------- | ------------------------- |
| `address`      | 1234 Main St, LA 90012     | 🎯 Highest (street-level) |
| `poi`          | Yosemite Valley Campground | 🎯 Exact place            |
| `neighborhood` | Venice Beach               | 🎯 Area within city       |
| `locality`     | Santa Monica               | 🎯 Small town/suburb      |
| `place`        | Los Angeles                | ⭐ City                   |
| `postcode`     | 90210                      | ⭐ Zip code area          |
| `region`       | California                 | ⭐ State/Province         |
| `country`      | United States              | ⭐ Country                |

---

## 🛠️ Implementation Steps

### Step 1: Install Dependencies (Already Done)

```bash
npm install axios  # For API calls
```

### Step 2: Use the MapboxGeocoder Component

**In CampgroundForm.jsx:**

```jsx
import MapboxGeocoder from './MapboxGeocoder';

const CampgroundForm = () => {
  const [locationData, setLocationData] = useState(null);

  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
    setLocationData(location);

    // Now you have:
    // - location.placeName (for display)
    // - location.coordinates (for map)
    // - location.address, postcode, etc. (for details)
  };

  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Location</label>
        <MapboxGeocoder
          onSelect={handleLocationSelect}
          placeholder="Search for campground location..."
          types="address,poi,locality"
          country="us" // Optional: limit to USA
        />

        {locationData && (
          <div className="alert alert-info mt-2">
            <strong>Selected:</strong> {locationData.placeName}
            <br />
            <small>
              Coordinates: {locationData.coordinates[1].toFixed(4)},
              {locationData.coordinates[0].toFixed(4)}
            </small>
          </div>
        )}
      </div>
    </form>
  );
};
```

### Step 3: Update Backend to Store Rich Location Data

**Update Campground Model (models/campground.js):**

```javascript
const campgroundSchema = new Schema({
  title: String,

  // Rich location data
  location: {
    placeName: String, // Full formatted address
    address: String, // Street number
    street: String, // Street name
    postcode: String,
    city: String,
    neighborhood: String,
    region: String,
    country: String,
    placeType: String, // address, poi, place, etc.
  },

  // Keep geometry for map
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },

  // ... rest of schema
});
```

### Step 4: Update Controller to Handle Rich Data

**In controllers/campgrounds.js:**

```javascript
module.exports.createCampground = async (req, res, next) => {
  const campground = new Campground({
    title: req.body.campground.title,
    description: req.body.campground.description,
    price: req.body.campground.price,

    // Store rich location data from frontend
    location: {
      placeName: req.body.campground.location.placeName,
      address: req.body.campground.location.address,
      street: req.body.campground.location.text,
      postcode: req.body.campground.location.postcode,
      city: req.body.campground.location.place,
      neighborhood: req.body.campground.location.neighborhood,
      region: req.body.campground.location.region,
      country: req.body.campground.location.country,
      placeType: req.body.campground.location.placeType,
    },

    geometry: {
      type: 'Point',
      coordinates: req.body.campground.location.coordinates,
    },

    author: req.user._id,
  });

  // No need for backend geocoding anymore - frontend provides everything!

  await campground.save();
  res.json({ success: true, campground });
};
```

---

## 🎨 Features of MapboxGeocoder Component

### 1. **Real-time Autocomplete**

- Suggestions appear as user types
- Debounced (300ms) to avoid excessive API calls
- Shows top 5 most relevant results

### 2. **Keyboard Navigation**

- ↓/↑ arrows to navigate suggestions
- Enter to select
- Escape to close

### 3. **Visual Indicators**

- Icons for each place type (📍 address, 🏙️ city, etc.)
- Loading spinner during search
- Highlighted selection

### 4. **Smart Filtering**

```jsx
<MapboxGeocoder
  types="address,poi,locality" // Only show addresses and places
  country="us" // Limit to USA
  onSelect={handleSelect}
/>
```

### 5. **Rich Data Return**

Returns complete location object with all address components

---

## 💰 Mapbox API Costs

### Free Tier (Generous)

- **100,000 requests/month FREE**
- Perfect for small/medium apps
- Includes autocomplete (each keystroke = 1 request)

### Pricing After Free Tier

- $0.50 per 1,000 requests
- Very affordable

### Cost Example

- 1,000 users × 10 searches each × 5 keystrokes average = 50,000 requests
- **Still FREE** (under 100k limit)

---

## 🚀 Migration Strategy

### Phase 1: Add Component (Non-Breaking)

1. Create MapboxGeocoder component ✅
2. Update backend model to accept both formats
3. Keep old simple location field working

### Phase 2: Update Forms

1. Replace location input with MapboxGeocoder
2. Update CampgroundForm.jsx
3. Test thoroughly

### Phase 3: Migrate Data (Optional)

1. Create migration script to geocode existing locations
2. Enrich old campground data with address components
3. Run migration on production database

---

## 📊 Database Schema Comparison

### Before (Current)

```javascript
{
  location: "New York",  // Simple string
  geometry: {
    type: "Point",
    coordinates: [-74.0, 40.7]
  }
}
```

### After (Enhanced)

```javascript
{
  location: {
    placeName: "1234 Main Street, New York, NY 10001, USA",
    address: "1234",
    street: "Main Street",
    postcode: "10001",
    city: "New York",
    neighborhood: "Midtown",
    region: "New York",
    country: "United States",
    placeType: "address"
  },
  geometry: {
    type: "Point",
    coordinates: [-73.9851, 40.7580]  // More precise
  }
}
```

---

## 🧪 Testing the Component

### Test Cases

1. **Basic Search**

   - Type "Los Angeles"
   - Should show city suggestions
   - Select one → coordinates returned

2. **Precise Address**

   - Type "1234 Main St, Los Angeles"
   - Should show street-level addresses
   - Select → full address components

3. **POI Search**

   - Type "Yosemite Campground"
   - Should show campground locations
   - Select → exact POI coordinates

4. **Keyboard Navigation**

   - Type query
   - Use arrow keys
   - Press Enter on selection

5. **Edge Cases**
   - Empty input → no suggestions
   - Invalid query → "No locations found"
   - No Mapbox token → warning message

---

## 🔧 Customization Options

### Limit to Specific Types

```jsx
// Only campgrounds and parks
<MapboxGeocoder types="poi" onSelect={handleSelect} />
```

### Geographic Boundaries

```jsx
// Only USA locations
<MapboxGeocoder
  country="us"
  onSelect={handleSelect}
/>

// Multiple countries
<MapboxGeocoder
  country="us,ca,mx"  // USA, Canada, Mexico
  onSelect={handleSelect}
/>
```

### Proximity Bias (Search Near)

```jsx
// Prefer results near San Francisco
<MapboxGeocoder
  proximity={[-122.4194, 37.7749]} // [lng, lat]
  onSelect={handleSelect}
/>
```

---

## 📝 Next Steps

### Immediate (Recommended)

1. ✅ Component created: `MapboxGeocoder.jsx`
2. ⏳ Integrate into `CampgroundForm.jsx`
3. ⏳ Update backend model (backwards compatible)
4. ⏳ Test with real data

### Future Enhancements

1. Add map preview showing selected location
2. Allow manual pin placement on map
3. Add "Use my current location" button
4. Store elevation data (Mapbox provides this)
5. Add distance calculations between campgrounds

---

## 🆘 Troubleshooting

### "No suggestions appear"

- Check `VITE_MAPBOX_TOKEN` in `.env.local`
- Verify token has Geocoding API enabled
- Check browser console for errors

### "Suggestions are slow"

- Increase debounce delay (currently 300ms)
- Reduce limit from 5 to 3 suggestions

### "Wrong country results"

- Add `country` prop to limit results
- Use proximity bias for better relevance

---

## 📚 Resources

- [Mapbox Geocoding API Docs](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox Place Types](https://docs.mapbox.com/api/search/geocoding/#data-types)
- [Mapbox Pricing](https://www.mapbox.com/pricing)
- [Component Source](./client/src/components/MapboxGeocoder.jsx)

---

## ✨ Summary

**What You Get:**

- 🎯 Precise location input (street-level accuracy)
- 🔍 Real-time autocomplete suggestions
- 📍 Rich address components (postcode, neighborhood, etc.)
- 🗺️ Better map markers (exact coordinates)
- 🚀 Improved UX (no typing errors)
- 💰 Free for 100k requests/month

**Impact:**

- Users can find exact campground locations
- Maps show precise pinpoints (not just city centers)
- Better search and filtering capabilities
- Professional, modern UX

**Next Action:**
Integrate `MapboxGeocoder` component into your campground form! 🎉
