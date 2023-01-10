/* eslint-disable import/prefer-default-export */
/* eslint-disable no-undef */

export const displayMap = (locations) => {
  const map = new maplibregl.Map({
    container: "map",
    style:
      "https://api.maptiler.com/maps/basic-v2/style.json?key=Y5PyS66GOjDCER6rErLI", // stylesheet location
    // center: coords, // starting position [lng, lat]
    // zoom: 4, // starting zoom
    // We disabled the zoom on scroll because it creates a bad user experience
    scrollZoom: false,
  });

  // this creates a bounding box defined by its southwest and northeast points in longitude and latitude
  // If no arguments are provided it creates a null bounding box
  const bounds = new maplibregl.LngLatBounds();

  locations.forEach((loc) => {
    // * With this  we create markers on the map with default styling
    // const marker = new maplibregl.Marker()
    //   .setLngLat(loc.coordinates)
    //   .addTo(map);
    // * With this we can create custom markers
    const el = document.createElement("div");
    // We have a css class named marker that has a custom background image
    el.className = "marker";

    // Add Marker
    const marker = new maplibregl.Marker({
      // element is the DOM element to be used as a marker
      element: el,
      // anchor is the part of the marked that should be positioned closest to the marker
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .setPopup(
        new maplibregl.Popup({ offset: 30, closeOnClick: false }).setHTML(
          `<p>Day ${loc.day}: ${loc.description}</p>`
        )
      )
      .addTo(map);
    marker.togglePopup();

    // * I have added this functionality above and bound the popups to markers
    // Add Popup
    // We use the .setHTML() method because it allows us to add content into the popup
    // They overlap the markers to fix that we use the offset option
    // new maplibregl.Popup({ offset: 30 })
    //   .setLngLat(loc.coordinates)
    //   .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    //   .addTo(map);
    // Extends the map bounds to include current location
    // When we first create the bounding box it is null
    // We extend it so that it includes the locations
    bounds.extend(loc.coordinates);
  });
  // Make sure that the map fits the bounds
  // Because of the design of the map other elements overlap it
  // and because of this only a part of the map is visible and fitBOunds doesn't know this
  // So because tof this we only see some of the markers
  // To fix this we can specify a padding in the options object
  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
