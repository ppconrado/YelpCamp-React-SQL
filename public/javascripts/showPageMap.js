mapboxgl.accessToken = mapToken;
// RENDERIZACAO DO MAPA
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/outdoors-v11", // stylesheet location
  center: campground.geometry.coordinates, // starting position [lng, lat] do acampamento escolhido
  zoom: 10, // starting zoom
});
// ADICIONA FERRAMENTA ZOOM E ROTACAO
map.addControl(new mapboxgl.NavigationControl());
// APRESENTA O ACAMPAMENTO NO MAPA COM O MARCADOR e POPUP
new mapboxgl.Marker()
  .setLngLat(campground.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h3>${campground.title}</h3><p>${campground.location}</p>`
    )
  )
  .addTo(map);
