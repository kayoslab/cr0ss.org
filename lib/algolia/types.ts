export interface AlgoliaHit {
  objectID: string;
  title: string;
  summary?: string;
  author?: string;
  categories: string[];
  url: string;
  image?: string;
}

export interface SearchResponse {
  hits: AlgoliaHit[];
  queryID: string;
  page?: number;
  nbHits?: number;
  nbPages?: number;
  hitsPerPage?: number;
  processingTimeMS?: number;
} 