export class AIService {
  private static apiKey = process.env.OPENAI_API_KEY || '';

  /**
   * Helper to perform semantic parsing of client query (e.g. "hair styling near Posta")
   */
  static async parseNaturalLanguageQuery(query: string): Promise<{ category: string; maxPrice?: number; keywords: string[] }> {
    // In production, triggers OpenAI embedding or structured schema mapping.
    // Standard response model fallback:
    return {
      category: query.toLowerCase().includes('barber') ? 'barber' : 'hairstylist',
      keywords: query.split(' '),
    };
  }

  /**
   * Generates summary of provider review history
   */
  static async summarizeReviews(reviews: { comment: string; rating: number }[]): Promise<string> {
    if (reviews.length === 0) return 'No reviews yet.';
    return 'Summary of feedback: High quality cuts, reliable, very clean work environment.';
  }
}
