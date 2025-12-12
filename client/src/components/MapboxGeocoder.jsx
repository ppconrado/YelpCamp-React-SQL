import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

/**
 * MapboxGeocoder - Autocomplete location input with Mapbox Geocoding API
 *
 * Features:
 * - Real-time autocomplete suggestions
 * - Precise address selection
 * - Returns full location details (coordinates, address components)
 * - Supports all Mapbox place types: address, poi, locality, etc.
 */
const MapboxGeocoder = ({
  onSelect,
  placeholder = 'Search for a location...',
  initialValue = '',
  types = 'address,poi,place,locality,neighborhood',
  country = '', // Optional: limit to specific country (e.g., "us")
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const timeoutRef = useRef(null);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const GEOCODING_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (searchQuery) => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        limit: 5,
        types: types,
        autocomplete: true,
      });

      if (country) {
        params.append('country', country);
      }

      const url = `${GEOCODING_API}/${encodeURIComponent(
        searchQuery
      )}.json?${params}`;
      const response = await axios.get(url);

      setSuggestions(response.data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const handleSelectSuggestion = (feature) => {
    const locationData = {
      // Display name
      placeName: feature.place_name,

      // Coordinates [longitude, latitude]
      coordinates: feature.geometry.coordinates,

      // Address components
      address: feature.address || '',
      text: feature.text || '',

      // Context (additional details)
      postcode: getContext(feature, 'postcode'),
      place: getContext(feature, 'place'),
      locality: getContext(feature, 'locality'),
      neighborhood: getContext(feature, 'neighborhood'),
      region: getContext(feature, 'region'),
      country: getContext(feature, 'country'),

      // Place type
      placeType: feature.place_type?.[0] || 'unknown',

      // Full feature for advanced use
      fullFeature: feature,
    };

    setQuery(feature.place_name);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onSelect) {
      onSelect(locationData);
    }
  };

  // Helper to extract context information
  const getContext = (feature, type) => {
    if (!feature.context) return null;
    const item = feature.context.find((c) => c.id.startsWith(type));
    return item?.text || null;
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  const formatPlaceType = (type) => {
    const typeMap = {
      address: '📍 Address',
      poi: '📌 Place',
      place: '🏙️ City',
      locality: '🏘️ Locality',
      neighborhood: '🏡 Neighborhood',
      postcode: '📮 Postal Code',
      region: '🗺️ Region',
      country: '🌍 Country',
    };
    return typeMap[type] || '📍 Location';
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="alert alert-warning">
        <strong>Mapbox not configured.</strong> Please set VITE_MAPBOX_TOKEN in
        your .env file.
      </div>
    );
  }

  return (
    <div className="mapbox-geocoder-wrapper" style={{ position: 'relative' }}>
      <div className="input-group">
        <span className="input-group-text">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isLoading && (
          <span className="input-group-text">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </span>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="mapbox-suggestions"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '-1px',
          }}
        >
          {suggestions.map((feature, index) => (
            <div
              key={feature.id}
              className={`suggestion-item ${
                index === selectedIndex ? 'active' : ''
              }`}
              onClick={() => handleSelectSuggestion(feature)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom:
                  index < suggestions.length - 1 ? '1px solid #f1f3f5' : 'none',
                backgroundColor: index === selectedIndex ? '#f8f9fa' : 'white',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#6c757d',
                  marginBottom: '2px',
                }}
              >
                {formatPlaceType(feature.place_type?.[0])}
              </div>
              <div style={{ fontWeight: 500, color: '#212529' }}>
                {feature.text}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#6c757d',
                  marginTop: '2px',
                }}
              >
                {feature.place_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && query && suggestions.length === 0 && !isLoading && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '0 0 8px 8px',
            padding: '16px',
            textAlign: 'center',
            color: '#6c757d',
          }}
        >
          No locations found
        </div>
      )}
    </div>
  );
};

export default MapboxGeocoder;
