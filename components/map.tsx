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

function calculatePixels(mapWidth: number, mapHeight: number, lat: number, lon: number) {
  let totalLon = 360
  let totalLat = 180
  let mapLeftLon = -169.110266 
  let mapRightLon = 190.486279
  let mapTotalLon = mapRightLon - mapLeftLon
  let lonFactor = mapTotalLon / totalLon
  let mapShiftLon = ((totalLon / 2) + mapLeftLon)
  let newLon = (lon - mapShiftLon) * lonFactor

  let mapTopLat = 83.600842 
  let mapBottomLat= -58.508473
  let mapTotalLat = mapTopLat - mapBottomLat
  let relativeLat = lat * (mapTotalLat / totalLat)
  let latFactor = mapTotalLat / totalLat


  let latitudeToRadians = ((relativeLat * Math.PI * latFactor) / mapTotalLat);
  let mercN = Math.log(Math.tan((Math.PI * latFactor / 4 ) + (latitudeToRadians / 2 * latFactor )));
  
  let y = ((mapHeight * lonFactor / 2) - ((mapWidth * lonFactor * mercN) / (2 * Math.PI)))
 
  let x = ((newLon + mapTotalLon / 2) * (mapWidth / mapTotalLon));
  return { x, y };
}