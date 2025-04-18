import { useState } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';

const center = { lat: 32.8031, lng: 130.7079 }; // 熊本駅を中心に設定（例）
const containerStyle = { width: '100%', height: '500px' };
const libraries: ('geometry')[] = ['geometry'];

const dangerPoints = [
    { id: 1, lat: 32.77414525997968, lng: 130.70544323851124 },
//  { id: 1, lat: 32.7756949359551, lng: 130.70118831340451, message: '⚠️ 不審者情報あり' },
//  { id: 2, lat: 32.78799865611062, lng: 130.71117811216305, message: '🚧 工事中：通行注意' }
];

export default function DangerAvoidMap() {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);

  const origin = { lat: 32.7759697000559, lng: 130.698533265187 }; // A地点（仮）
  const destination = { lat: 32.77414525997968, lng: 130.70544323851124 }; // B地点（仮）

  const calculateRoute = () => {
    if (!window.google || !window.google.maps || !window.google.maps.TravelMode) {
      console.warn('Google Maps not loaded, skipping route calculation.');
      return;
    }

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
                return distance < 3000;
              });
            });
          });

          if (!filteredRoute) {
            alert('⚠️ 危険地点を避けるルートが見つかりませんでした。通常ルートを表示します。');
          }

          setDirections(filteredRoute ? { ...result, routes: [filteredRoute] } : result);
        } else {
          console.error('Directions API failed:', status);
        }
      }
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: 16 }}>通学路危険回避マップ（迂回するときとしない時がある　Googleの限界）</h1>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        onLoad={() => {
          console.log('✅ LoadScript onLoad: Google Maps 読み込み完了');
          const isReady =
            typeof window !== 'undefined' &&
            window.google &&
            window.google.maps &&
            window.google.maps.TravelMode;

          if (isReady) {
            calculateRoute();
          } else {
            console.warn('Google Maps API not ready yet!');
          }
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={map => setMap(map)}
        >
          {dangerPoints.map(point => (
            <>
              <Marker
                key={point.id}
                position={{ lat: point.lat, lng: point.lng }}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
              />
              <InfoWindow
                position={{ lat: point.lat, lng: point.lng }}
              >
                <div style={{ fontSize: '14px' }}>{point.message}</div>
              </InfoWindow>
            </>
          ))}
          {directions && (
            <DirectionsRenderer directions={directions} />
          )}
        </GoogleMap>
      </LoadScript>
      <button style={{ marginTop: 16 }} onClick={calculateRoute}>
        ルート再計算
      </button>
    </div>
  );
}
