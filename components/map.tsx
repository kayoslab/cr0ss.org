import { CountryProps } from '@/lib/contentful/api/props/country';
import { getAllCountries } from '@/lib/contentful/api/country';

export default async function Map() {
  const countries = await getAllCountries();

  return (
    <svg
          xmlns="http://www.w3.org/2000/svg"
          id="world"
          width="1009.6727"
          height="665.96301"
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
          {/* <circle cx="3.75" cy="3.75" r="3.75" fill="blue" id="GEO" name="Location" /> */}
        </svg>
  )
}