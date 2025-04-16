import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const center = { lat: 32.8031, lng: 130.7079 }; // 熊本駅を中心に設定（例）
const containerStyle = { width: '100%', height: '500px' };
const libraries: ('geometry')[] = ['geometry'];

const dangerPoints = [
//  { id: 1, lat: 32.789139073201945, lng: 130.71619414051773 },
//  { id: 2, lat: 32.784195979371965, lng: 130.70525417068092 }

//32.7862811959385, 130.7089393028537
//32.78555756383564, 130.71185628829946
];

export default function DangerAvoidMap() {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const origin = { lat: 32.789139073201945, lng: 130.71619414051773 }; // A地点（仮）
  const destination = { lat: 32.784195979371965, lng: 130.70525417068092 }; // B地点（仮）


  const calculateRoute = () => {
    if (!window.google || !window.google.maps || !window.google.maps.TravelMode) return;
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        console.log('Directions status:', status);
        if (status === 'OK' && result.routes) {
          console.log('Directions response object:', result);
          const filteredRoute = result.routes.find(route => {
            return !route.overview_path.some(point => {
              return dangerPoints.some(danger => {
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                  new window.google.maps.LatLng(point.lat(), point.lng()),
                  new window.google.maps.LatLng(danger.lat, danger.lng)
                );
                return distance < 50; // 50m以内の危険地点を避ける
              });
            });
          });
          setDirections(filteredRoute ? { routes: [filteredRoute] } : result);
        } else {
          console.error('Directions API failed:', status);
        }
      }
    );
  };

  useEffect(() => {
    const isReady =
      typeof window !== 'undefined' &&
      window.google &&
      window.google.maps &&
      window.google.maps.TravelMode;
      console.log('Google Maps ready check:', isReady);
    if (isReady) {
      console.log('Calling calculateRoute...');
      calculateRoute();
    }
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: 16 }}>通学路危険回避マップ</h1>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={map => setMap(map)}
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
            <DirectionsRenderer directions={directions} key={JSON.stringify(directions)} />
          )}
        </GoogleMap>
      </LoadScript>
      <button style={{ marginTop: 16 }} onClick={calculateRoute}>
        ルート再計算
      </button>
    </div>
  );
}
