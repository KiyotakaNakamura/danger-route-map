import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const center = { lat: 32.8031, lng: 130.7079 };
const containerStyle = { width: '100%', height: '500px' };

const dangerPoints = [
  { id: 1, lat: 32.784989727371894, lng: 130.7060 },
  { id: 2, lat: 32.784195979371965, lng: 130.70525417068092 }
];

export default function Home() {
  const [directions, setDirections] = useState(null);
  const origin = { lat: 32.8015, lng: 130.7072 };
  const destination = { lat: 32.8090, lng: 130.7120 };

  const calculateRoute = () => {
    if (!window.google || !origin || !destination) return;
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        if (status === 'OK' && result.routes) {
          const filteredRoute = result.routes.find(route => {
            return !route.overview_path.some(point => {
              return dangerPoints.some(danger => {
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                  new window.google.maps.LatLng(point.lat(), point.lng()),
                  new window.google.maps.LatLng(danger.lat, danger.lng)
                );
                return distance < 50;
              });
            });
          });
          setDirections(filteredRoute ? { routes: [filteredRoute] } : result);
        }
      }
    );
  };

  useEffect(() => {
    if (window.google && window.google.maps) calculateRoute();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>通学路危険回避マップ</h1>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={['geometry']}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
        >
          {dangerPoints.map(point => (
            <Marker
              key={point.id}
              position={{ lat: point.lat, lng: point.lng }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }}
            />
          ))}
          {directions && (
            <DirectionsRenderer directions={directions} />
          )}
        </GoogleMap>
      </LoadScript>
      <button onClick={calculateRoute} style={{ marginTop: 12 }}>
        ルート再計算
      </button>
    </div>
  );
}
