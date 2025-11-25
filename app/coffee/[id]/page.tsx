import { notFound } from 'next/navigation';
import { getAllCoffee, getCoffee } from '@/lib/contentful/api/coffee';
import { CoffeeyProps } from '@/lib/contentful/api/props/coffee';
import { getAllCountries } from '@/lib/contentful/api/country';
import { CountryProps } from '@/lib/contentful/api/props/country';
import CoffeeDetail from '@/components/coffee/coffee-detail';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const coffee = (await getCoffee(id)) as unknown as CoffeeyProps;
    if (!coffee) {
      return {
        title: 'Coffee Not Found',
        description: 'The requested coffee could not be found',
      };
    }

    return {
      title: `${coffee.name} | Coffee Collection`,
      description: `${coffee.name} from ${coffee.roaster}${coffee.country ? `, ${coffee.country.name}` : ''}`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Coffee Error',
      description: 'Error loading coffee details',
    };
  }
}

// At build time, fetch all IDs to build the coffee pages so they are static and cached
export async function generateStaticParams() {
  const allCoffees = await getAllCoffee(1, 100);
  return (allCoffees.items as unknown as CoffeeyProps[]).map((coffee: CoffeeyProps) => ({
    id: coffee.sys.id,
  }));
}

export default async function CoffeeDetailPage({ params }: Props) {
  try {
    const { id } = await params;
    const coffee = (await getCoffee(id)) as unknown as CoffeeyProps;
    if (!coffee) {
      notFound();
    }

    // Fetch all countries for the map
    const allCountries = await getAllCountries();
    const allCountriesData = (allCountries as unknown as CountryProps[]);

    // Find the origin country
    const originCountry = coffee.country?.sys?.id
      ? allCountriesData.find((c) => c.sys.id === coffee.country?.sys?.id) || null
      : null;

    return (
      <main className="flex min-h-screen flex-col items-center justify-between bg-white pb-24">
        <CoffeeDetail
          coffee={coffee}
          originCountry={originCountry}
          allCountries={allCountriesData}
        />
      </main>
    );
  } catch (error) {
    console.error('Error loading coffee content:', error);
    notFound();
  }
}
