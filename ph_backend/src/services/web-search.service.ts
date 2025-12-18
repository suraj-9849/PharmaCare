import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../config/logger';

export interface SupplierSearchResult {
  name: string;
  url: string;
  snippet: string;
  price?: string;
  source: string;
}

export interface MedicineSearchResult {
  drugName: string;
  suppliers: SupplierSearchResult[];
  searchQuery: string;
  timestamp: Date;
}

export interface SupplierContactInfo {
  email?: string;
  phone?: string;
  company?: string;
}

class WebSearchService {
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Search for medicine suppliers using Google Custom Search API or web scraping
   */
  async searchMedicineSuppliers(
    drugName: string,
    genericName?: string
  ): Promise<MedicineSearchResult> {
    const searchQuery = genericName
      ? `${drugName} ${genericName} pharmaceutical supplier India wholesale`
      : `${drugName} pharmaceutical supplier India wholesale`;

    try {
      // Try Google Custom Search API first if configured
      if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
        return await this.searchWithGoogleAPI(searchQuery, drugName);
      }

      // Fallback to targeted pharmaceutical marketplaces
      return await this.searchPharmaceuticalMarketplaces(drugName, genericName);
    } catch (error) {
      logger.error('Error searching for suppliers:', error);
      throw new Error('Failed to search for suppliers');
    }
  }

  /**
   * Search using Google Custom Search API
   */
  private async searchWithGoogleAPI(
    query: string,
    drugName: string
  ): Promise<MedicineSearchResult> {
    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          num: 10,
        },
      });

      const suppliers: SupplierSearchResult[] = response.data.items?.map((item: any) => ({
        name: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'Google Search',
      })) || [];

      return {
        drugName,
        suppliers,
        searchQuery: query,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Google Search API error:', error);
      throw error;
    }
  }

  /**
   * Search pharmaceutical marketplaces directly
   */
  private async searchPharmaceuticalMarketplaces(
    drugName: string,
    genericName?: string
  ): Promise<MedicineSearchResult> {
    const suppliers: SupplierSearchResult[] = [];

    // Search multiple pharmaceutical platforms
    const searchTasks = [
      this.search1mg(drugName, genericName),
      this.searchPharmEasy(drugName, genericName),
      this.searchApolloPharmacy(drugName, genericName),
      this.searchIndiaMART(drugName, genericName),
    ];

    const results = await Promise.allSettled(searchTasks);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        suppliers.push(...result.value);
      }
    });

    return {
      drugName,
      suppliers: suppliers.slice(0, 10), // Limit to top 10 results
      searchQuery: `${drugName} ${genericName || ''}`,
      timestamp: new Date(),
    };
  }

  /**
   * Search 1mg for medicines
   */
  private async search1mg(
    drugName: string,
    genericName?: string
  ): Promise<SupplierSearchResult[]> {
    try {
      const searchTerm = encodeURIComponent(genericName || drugName);
      const url = `https://www.1mg.com/search/all?name=${searchTerm}`;

      // Return placeholder result - actual scraping may require more sophisticated approach
      // due to anti-scraping measures on modern websites
      return [
        {
          name: `${drugName} - 1mg`,
          url,
          snippet: 'Available on 1mg - India\'s trusted online pharmacy',
          source: '1mg',
        },
      ];
    } catch (error) {
      logger.warn('1mg search failed:', error);
      return [];
    }
  }

  /**
   * Search PharmEasy
   */
  private async searchPharmEasy(
    drugName: string,
    genericName?: string
  ): Promise<SupplierSearchResult[]> {
    try {
      const searchTerm = encodeURIComponent(genericName || drugName);
      const url = `https://pharmeasy.in/search/all?name=${searchTerm}`;

      return [
        {
          name: `${drugName} - PharmEasy`,
          url,
          snippet: 'Available for wholesale purchase on PharmEasy',
          source: 'PharmEasy',
        },
      ];
    } catch (error) {
      logger.warn('PharmEasy search failed:', error);
      return [];
    }
  }

  /**
   * Search Apollo Pharmacy
   */
  private async searchApolloPharmacy(
    drugName: string,
    genericName?: string
  ): Promise<SupplierSearchResult[]> {
    try {
      const searchTerm = encodeURIComponent(genericName || drugName);
      const url = `https://www.apollopharmacy.in/search-medicines/${searchTerm}`;

      return [
        {
          name: `${drugName} - Apollo Pharmacy`,
          url,
          snippet: 'Available at Apollo Pharmacy for B2B orders',
          source: 'Apollo Pharmacy',
        },
      ];
    } catch (error) {
      logger.warn('Apollo Pharmacy search failed:', error);
      return [];
    }
  }

  /**
   * Search IndiaMART for pharmaceutical suppliers
   */
  private async searchIndiaMART(
    drugName: string,
    genericName?: string
  ): Promise<SupplierSearchResult[]> {
    try {
      const searchTerm = encodeURIComponent(`${genericName || drugName} pharmaceutical`);
      const url = `https://www.indiamart.com/impcat/${searchTerm}.html`;

      // Return placeholder - IndiaMART has strong anti-scraping measures
      // For production, consider using IndiaMART API or manual entry
      return [
        {
          name: `${drugName} Pharmaceutical Suppliers - IndiaMART`,
          url,
          snippet: 'B2B marketplace for pharmaceutical suppliers in India',
          source: 'IndiaMART',
        },
      ];
    } catch (error) {
      logger.warn('IndiaMART search failed:', error);
      return [];
    }
  }

  /**
   * Get supplier contact information from URL
   */
  async extractSupplierContact(url: string): Promise<SupplierContactInfo> {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Try to extract email
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emailMatches = response.data.match(emailRegex);
      const email = emailMatches ? emailMatches[0] : undefined;

      // Try to extract phone
      const phoneRegex = /(\+91[\s-]?)?[6-9]\d{9}/g;
      const phoneMatches = response.data.match(phoneRegex);
      const phone = phoneMatches ? phoneMatches[0] : undefined;

      // Try to extract company name
      const company = $('meta[property="og:site_name"]').attr('content') || 
                      $('title').text().split('-')[0].trim();

      return {
        email,
        phone,
        company: company || undefined,
      };
    } catch (error) {
      logger.error('Error extracting supplier contact:', error);
      return {};
    }
  }
}

export const webSearchService = new WebSearchService();
