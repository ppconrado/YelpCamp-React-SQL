import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// O token deve ser fornecido via variável de ambiente
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapboxMap = ({
  geoJson,
  zoom = 9,
  center = [-74.5, 40],
  height = 380,
  fitToBounds = true,
  projection = 'globe', // 'globe' for 3D earth, 'mercator' default
  spinOnLoad = false, // rotate the globe (continuous gentle spin)
  // Limit how far the map will zoom in when fitting to current page markers (keeps pages consistent)
  fitMaxZoom = 3,
  // Desabilitar interação do mapa em telas pequenas para não atrapalhar o scroll da página
  disableInteractionOnMobile = false,
  // Only animate fitBounds on initial load, not on geoJson updates
  animateOnlyOnce = false,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // Center can be shown externally if needed; internal state not required
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const hasToken = Boolean(mapboxgl.accessToken && mapboxgl.accessToken.trim());

  useEffect(() => {
    // Avoid initializing without a valid token
    if (!hasToken) return;

    // initialize map only once
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    // Basic controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      try {
        if (projection && typeof map.current.setProjection === 'function') {
          map.current.setProjection(projection);
        }
        // Em telas pequenas, desabilitar interações que dificultam o scroll vertical
        const isSmallScreen =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(max-width: 767px)').matches;
        if (disableInteractionOnMobile && isSmallScreen) {
          try {
            map.current.dragPan.disable();
            map.current.scrollZoom.disable();
            map.current.touchZoomRotate.disable();
            map.current.doubleClickZoom.disable();
            // manter popups e cliques em marcadores funcionais
          } catch {
            // ignore
          }
        }
        // Optional initial full spin for visibility
        if (spinOnLoad) {
          const startBearing = map.current.getBearing() || 0;
          map.current.rotateTo(startBearing + 360, {
            duration: 3000,
            easing: (t) => t,
          });

          // Gentle continuous spin (pauses on interaction)
          let userInteracting = false;
          const spinOnce = () => {
            if (!map.current) return;
            if (userInteracting) return;
            const zoom = map.current.getZoom();
            if (zoom > 5) return; // avoid spinning when zoomed in
            const currentBearing = map.current.getBearing() || 0;
            // rotate slowly: +120 degrees per minute (~0.002 deg/ms)
            map.current.rotateTo(currentBearing + 0.2, { duration: 100 });
          };

          const resume = () => {
            userInteracting = false;
          };
          const pause = () => {
            userInteracting = true;
          };

          map.current.on('mousedown', pause);
          map.current.on('dragstart', pause);
          map.current.on('zoomstart', pause);
          map.current.on('mouseup', resume);
          map.current.on('dragend', resume);
          map.current.on('zoomend', resume);
          map.current.on('moveend', () => {
            // schedule next small rotation
            setTimeout(spinOnce, 100);
          });

          // kick off continuous after initial spin starts
          setTimeout(spinOnce, 800);
        }
      } catch (e) {
        // Projection might not be supported in older versions
        console.warn('Mapbox projection/spin not applied:', e);
      }
      setIsLoaded(true);
    });

    // Track move if needed (disabled to avoid unused state)

    // Cleanup: remove and reset ref (fixes React StrictMode double-effect)
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsLoaded(false);
    };
    // We create the map once on mount; center/zoom changes would require custom handling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add markers once the map is loaded and whenever geoJson changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    if (!geoJson || !geoJson.features) return;

    const markers = [];
    try {
      // Fit to bounds if multiple features and allowed
      const coords = geoJson.features
        .map((f) => f?.geometry?.coordinates)
        .filter(Boolean);

      // Only animate if not animateOnlyOnce, or if animateOnlyOnce and hasn't animated yet
      const shouldAnimate = !animateOnlyOnce || !hasAnimated;

      if (fitToBounds && coords.length > 0) {
        if (coords.length === 1) {
          // Single location: center on it
          map.current.flyTo({
            center: coords[0],
            zoom: fitMaxZoom || 10,
            duration: shouldAnimate ? 2000 : 0,
          });
        } else {
          // Multiple locations: fit bounds with animation
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
          );
          map.current.fitBounds(bounds, {
            padding: 40,
            maxZoom: fitMaxZoom,
            duration: shouldAnimate ? 2000 : 0,
          });
        }

        // Mark that we've animated once
        if (animateOnlyOnce && !hasAnimated) {
          setHasAnimated(true);
        }
      }

      geoJson.features.forEach((feature) => {
        if (!feature?.geometry?.coordinates) return;
        const popupHtml = feature?.properties?.popUpMarkup || '';
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml);
        const marker = new mapboxgl.Marker()
          .setLngLat(feature.geometry.coordinates)
          .setPopup(popup)
          .addTo(map.current);
        markers.push(marker);
      });
    } catch (e) {
      // fail silently but avoid breaking the app
      console.error('Erro ao adicionar marcadores no Mapbox:', e);
    }

    // Cleanup markers on geoJson change/unmount
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [
    geoJson,
    isLoaded,
    fitToBounds,
    fitMaxZoom,
    animateOnlyOnce,
    hasAnimated,
  ]);

  if (!hasToken) {
    return (
      <div
        style={{
          width: '100%',
          height: '300px',
          display: 'grid',
          placeItems: 'center',
          background: '#f7f7f7',
          border: '1px solid #eee',
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: 'center', padding: 16 }}>
          <strong>Mapbox não configurado</strong>
          <div style={{ marginTop: 8, color: '#555' }}>
            Defina VITE_MAPBOX_TOKEN em um arquivo .env.local dentro de{' '}
            <code>client/</code> e reinicie o servidor.
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} style={{ width: '100%', height }} />;
};

export default MapboxMap;
