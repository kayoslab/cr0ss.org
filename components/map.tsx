import { CountryProps } from '@/lib/contentful/api/props/country';
import { getAllCountries } from '@/lib/contentful/api/country';

export default async function Map(location: { lat: number; lon: number }) {
  const countries = await getAllCountries();
  const mapWidth = 1009.6727;
  const mapHeight = 665.96301;

  const { x, y } = calculatePixels(mapWidth, mapHeight, location.lat, location.lon);

  return (
    <svg
          xmlns="http://www.w3.org/2000/svg"
          id="world"
          width={ mapWidth }
          height={ mapHeight }
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
          <circle cx={ x } cy= { y } r="3.75" fill="blue" id="GEO" name="Location" />
        </svg>
  )
}

function calculatePixels(mapWidth: number, mapHeight: number, lat: number, lon: number) {
  let latitudeToRadians = ((lat * Math.PI) / 180);
  let mercN = Math.log(Math.tan((Math.PI / 4) + (latitudeToRadians / 2)));

  let x = ((lon + 180) * (mapWidth / 360));
  let y = ((mapHeight / 2) - ((mapWidth * mercN) / (2 * Math.PI)))

  return { x, y };
}