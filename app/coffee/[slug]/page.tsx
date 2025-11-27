import { notFound } from 'next/navigation';
import { getAllCoffee, getCoffee } from '@/lib/contentful/api/coffee';
import { CoffeeyProps } from '@/lib/contentful/api/props/coffee';
import { getAllCountries } from '@/lib/contentful/api/country';
import { CountryProps } from '@/lib/contentful/api/props/country';
import CoffeeDetail from '@/components/coffee/coffee-detail';
import type { Metadata } from 'next';
import { createCoffeeBreadcrumbJsonLd } from '@/lib/metadata';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const coffee = (await getCoffee(slug)) as unknown as CoffeeyProps;
    if (!coffee) {
      return {
        title: 'Coffee Not Found',
        description: 'The requested coffee could not be found',
      };
    }

    // Build rich description
    const descriptionParts = [
      `${coffee.name} from ${coffee.roaster}`,
      coffee.country?.name,
      coffee.region,
      coffee.process,
      coffee.variety,
    ].filter(Boolean);

    const description = descriptionParts.join(' • ');

    // Add tasting notes to description if available
    const tastingNotesText = coffee.tastingNotes && coffee.tastingNotes.length > 0
      ? ` Tasting notes: ${coffee.tastingNotes.slice(0, 3).join(', ')}`
      : '';

    const fullDescription = `${description}${tastingNotesText}`;

    // Build keywords
    const keywords = [
      'specialty coffee',
      coffee.roaster,
      coffee.country?.name,
      coffee.region,
      coffee.process,
      coffee.variety,
      ...(coffee.tastingNotes || []),
      coffee.decaffeinated ? 'decaf' : 'caffeinated',
    ].filter(Boolean) as string[];

    // Get optimized image URL
    const imageUrl = coffee.photo?.url
      ? (coffee.photo.url.startsWith('http') ? coffee.photo.url : `https:${coffee.photo.url}`)
      : null;

    // Build canonical URL
    const canonicalUrl = `https://cr0ss.org/coffee/${slug}`;

    return {
      title: `${coffee.name} | Coffee Collection`,
      description: fullDescription,
      keywords,
      authors: [{ name: 'Christian Kienle' }],
      openGraph: {
        type: 'article',
        title: `${coffee.name} - ${coffee.roaster}`,
        description: fullDescription,
        siteName: 'cr0ss.org',
        url: canonicalUrl,
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: coffee.photo?.title || coffee.name,
          },
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${coffee.name} - ${coffee.roaster}`,
        description: fullDescription,
        images: imageUrl ? [imageUrl] : undefined,
        creator: '@ckienle',
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Coffee Error',
      description: 'Error loading coffee details',
    };
  }
}

// At build time, fetch all slugs to build the coffee pages so they are static and cached
export async function generateStaticParams() {
  const allCoffees = await getAllCoffee(1, 100);
  return (allCoffees.items as unknown as CoffeeyProps[]).map((coffee: CoffeeyProps) => ({
    slug: coffee.slug,
  }));
}

export default async function CoffeeDetailPage({ params }: Props) {
  try {
    const { slug } = await params;
    const coffee = (await getCoffee(slug)) as unknown as CoffeeyProps;
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

    // Build JSON-LD structured data
    const imageUrl = coffee.photo?.url
      ? (coffee.photo.url.startsWith('http') ? coffee.photo.url : `https:${coffee.photo.url}`)
      : null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: coffee.name,
      description: `${coffee.name} from ${coffee.roaster}${coffee.country ? `, ${coffee.country.name}` : ''}`,
      brand: {
        '@type': 'Brand',
        name: coffee.roaster,
      },
      ...(imageUrl && {
        image: imageUrl,
      }),
      ...(coffee.scaScore && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: coffee.scaScore,
          bestRating: 100,
          worstRating: 0,
        },
      }),
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        ...(coffee.url && {
          url: coffee.url,
        }),
      },
      additionalProperty: [
        ...(coffee.country ? [{
          '@type': 'PropertyValue',
          name: 'Origin Country',
          value: coffee.country.name,
        }] : []),
        ...(coffee.region ? [{
          '@type': 'PropertyValue',
          name: 'Region',
          value: coffee.region,
        }] : []),
        ...(coffee.process ? [{
          '@type': 'PropertyValue',
          name: 'Process',
          value: coffee.process,
        }] : []),
        ...(coffee.variety ? [{
          '@type': 'PropertyValue',
          name: 'Variety',
          value: coffee.variety,
        }] : []),
        ...(coffee.farmer ? [{
          '@type': 'PropertyValue',
          name: 'Farmer',
          value: coffee.farmer,
        }] : []),
        ...(coffee.farm ? [{
          '@type': 'PropertyValue',
          name: 'Farm',
          value: coffee.farm,
        }] : []),
      ],
    };

    const breadcrumbJsonLd = createCoffeeBreadcrumbJsonLd({
      slug,
      name: coffee.name,
    });

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <main className="flex min-h-screen flex-col items-center justify-between bg-white pb-24">
          <CoffeeDetail
            coffee={coffee}
            originCountry={originCountry}
            allCountries={allCountriesData}
          />
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading coffee content:', error);
    notFound();
  }
}
