import { CountryProps } from '@/lib/contentful/api/props/country';
import { getAllCountries } from '@/lib/contentful/api/country';
import { map } from 'zod';

export default async function Map(location: { lat: number; lon: number }) {
  const countries = await getAllCountries();
  const mapWidth = 1009.6727;
  const mapHeight = 665.96301;

  const { x, y } = calculatePixels(mapWidth, mapHeight, location.lat, location.lon);
  const r = + 3.75;

  if (!countries) {
    return <svg></svg>
  }

  return (
    <svg
          xmlns="http://www.w3.org/2000/svg"
          id="world"
          viewBox={ "0 0 " +  mapWidth + " " + mapHeight }
          width={ mapWidth }
          height={ mapHeight }
          style={{ width: "100%", height: "auto" }}
          fill="#ececec"
          stroke="#666666" 
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth=".1"
        >
          { 
            countries?.map(
              (country: CountryProps) => (
                <path
                  id={country.id}
                  key={country.id}
                  d={ country.data.path }
                  fill={ country.visited ? "gray" : "#ececec" }
                />
              )
            ) 
          }
          <circle cx={ x + r / 2 } cy= { y + r / 2 } r={ r } fill="blue" id="GEO" name="Location" />
        </svg>
  )
}

function calculatePixels(
  mapWidth: number,
  mapHeight: number, 
  lat: number, 
  lon: number
) {
  let mapLeftLon = -169.110266 
  let mapRightLon = 190.486279
  let mapTopLat = 83.600842 
  let mapBottomLat= -58.508473
  return convertGeoToPixel(lat, lon, mapWidth, mapHeight, mapLeftLon, mapRightLon, mapBottomLat);
}

// https://stackoverflow.com/questions/2103924/mercator-longitude-and-latitude-calculations-to-x-and-y-on-a-cropped-map-of-the
function convertGeoToPixel(
  latitude: number, 
  longitude: number,
  mapWidth: number,
  mapHeight: number,
  mapLngLeft: number,
  mapLngRight: number,
  mapLatBottom: number
) {
  const mapLatBottomRad = mapLatBottom * Math.PI / 180
  const latitudeRad = latitude * Math.PI / 180
  const mapLngDelta = (mapLngRight - mapLngLeft)

  const worldMapWidth = ((mapWidth / mapLngDelta) * 360) / (2 * Math.PI)
  const mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomRad)) / (1 - Math.sin(mapLatBottomRad))))

  const x = (longitude - mapLngLeft) * (mapWidth / mapLngDelta)
  const y = mapHeight - ((worldMapWidth / 2 * Math.log((1 + Math.sin(latitudeRad)) / (1 - Math.sin(latitudeRad)))) - mapOffsetY)

  return {x, y}
}