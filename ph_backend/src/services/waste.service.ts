import axios from 'axios';

interface WasteStats {
  totalWasteValue: number;
  totalWasteQuantity: number;
  expiredCount: number;
  damagedCount: number;
  wasteTrendData: Array<{ month: string; value: number; quantity: number }>;
  categoryWaste: Array<{ name: string; value: number }>;
  topWastedDrugs: Array<{ drugName: string; quantity: number; value: number }>;
}

interface WasteRecord {
  id: string;
  drugName: string;
  batchNumber: string;
  quantity: number;
  reason: string;
  wasteDate: string;
  expiryDate: string;
  value: number;
}

class WasteService {
  private openRouterApiKey: string;
  private openRouterApiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.openRouterApiKey = process.env.OPENAI_API_KEY || '';

    if (!this.openRouterApiKey) {
      console.warn('Warning: OPENAI_API_KEY not set in environment variables');
    }
  }

  /**
   * Generate AI-powered waste analysis summary
   */
  async generateAISummary(stats: WasteStats, recentRecords: WasteRecord[]): Promise<string> {
    if (!this.openRouterApiKey) {
      console.warn('OpenRouter API key not configured, using fallback summary');
      return this.getFallbackSummary(stats);
    }

    try {
      const prompt = this.buildPrompt(stats, recentRecords);

      console.log('Calling OpenRouter API for waste analytics...');

      const response = await axios.post(
        this.openRouterApiUrl,
        {
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert pharmaceutical inventory analyst specializing in waste reduction and inventory optimization. Provide actionable insights in a professional yet friendly tone using markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pharmacare.com',
            'X-Title': 'PharmaCare Waste Analytics',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('OpenRouter API response status:', response.status);

      const aiMessage = response.data?.choices?.[0]?.message?.content;

      if (!aiMessage || aiMessage.trim() === '') {
        console.warn('No AI response content received, using fallback');
        return this.getFallbackSummary(stats);
      }

      console.log('Successfully received AI summary');
      return aiMessage;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('OpenRouter API error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        console.error('Error calling OpenRouter API:', error);
      }
      return this.getFallbackSummary(stats);
    }
  }

  /**
   * Build the prompt for AI analysis
   */
  private buildPrompt(stats: WasteStats, recentRecords: WasteRecord[]): string {
    const topWastedDrug = stats.topWastedDrugs[0];
    const topCategory = stats.categoryWaste[0];
    const lastMonthTrend = stats.wasteTrendData[stats.wasteTrendData.length - 1];
    const prevMonthTrend = stats.wasteTrendData[stats.wasteTrendData.length - 2];

    const trendDirection = lastMonthTrend.value > prevMonthTrend.value ? 'increased' : 'decreased';
    const trendPercent = Math.abs(
      ((lastMonthTrend.value - prevMonthTrend.value) / prevMonthTrend.value) * 100
    ).toFixed(1);

    const recentExpiredDrugs = recentRecords
      .filter((r) => r.reason === 'Expired')
      .slice(0, 3)
      .map((r) => `${r.drugName} (${r.quantity} units, ₹${r.value})`)
      .join(', ');

    return `Analyze this pharmacy's waste data and provide actionable recommendations:

**Current Month Summary:**
- Total Waste Value: ₹${stats.totalWasteValue.toLocaleString()}
- Total Quantity Wasted: ${stats.totalWasteQuantity} units
- Expired Items: ${stats.expiredCount} batches
- Damaged Items: ${stats.damagedCount} batches

**Trends:**
- Last month (${prevMonthTrend.month}): ₹${prevMonthTrend.value.toLocaleString()}
- This month (${lastMonthTrend.month}): ₹${lastMonthTrend.value.toLocaleString()}
- Trend: ${trendDirection} by ${trendPercent}%

**Top Issues:**
- Most wasted drug: ${topWastedDrug.drugName} (${topWastedDrug.quantity} units, ₹${topWastedDrug.value})
- Highest waste category: ${topCategory.name} (₹${topCategory.value})
- Recent expired drugs: ${recentExpiredDrugs}

**Recent Waste Events:**
${recentRecords
  .slice(0, 3)
  .map(
    (r) =>
      `- ${r.drugName}: ${r.quantity} units wasted due to ${r.reason} (Expiry: ${new Date(r.expiryDate).toLocaleDateString()})`
  )
  .join('\n')}

Create a well-structured analysis with the following sections (use markdown headings ##, ###):

## 📊 Key Findings
Provide 3-4 bullet points highlighting the most critical observations

## ⚠️ Risk Assessment
Identify 2-3 patterns or risks in bullet points

## 💡 Actionable Recommendations
List 4-5 specific, numbered action items the pharmacy should take immediately

## 🎯 Prevention Strategy
Provide 2-3 long-term strategies to avoid future waste

## 📈 Expected Impact
Summarize the potential savings and improvements

IMPORTANT: 
- Use proper markdown headings (## for main sections, ### for subsections)
- Add blank lines between sections for better readability
- Keep bullet points concise (1-2 lines each)
- Use bold (**text**) to highlight important numbers or drug names
- Structure the response with clear visual hierarchy`;
  }

  /**
   * Fallback summary when AI is unavailable
   */
  private getFallbackSummary(stats: WasteStats): string {
    const topWastedDrug = stats.topWastedDrugs[0];
    const topCategory = stats.categoryWaste[0];
    const lastMonthTrend = stats.wasteTrendData[stats.wasteTrendData.length - 1];
    const prevMonthTrend = stats.wasteTrendData[stats.wasteTrendData.length - 2];

    const trendDirection = lastMonthTrend.value > prevMonthTrend.value ? 'increased' : 'decreased';
    const trendPercent = Math.abs(
      ((lastMonthTrend.value - prevMonthTrend.value) / prevMonthTrend.value) * 100
    ).toFixed(1);

    return `## 📊 Key Findings

- Your pharmacy wasted **₹${stats.totalWasteValue.toLocaleString()}** worth of medicines this period
- Waste has **${trendDirection}** by **${trendPercent}%** compared to last month
- **${topWastedDrug.drugName}** is your most wasted medicine (${topWastedDrug.quantity} units, ₹${topWastedDrug.value})

## ⚠️ Areas of Concern

- **${topCategory.name}** category shows highest waste (₹${topCategory.value})
- ${stats.expiredCount} batches expired before use
- ${stats.damagedCount} batches were damaged

## 💡 Recommendations

### Immediate Actions:

1. Review inventory ordering patterns for **${topWastedDrug.drugName}**
2. Implement FEFO (First Expiry, First Out) system for **${topCategory.name}** category
3. Conduct staff training on proper storage and handling

### Prevention Strategy:

1. Order smaller quantities of **${topWastedDrug.drugName}** more frequently
2. Set up expiry alerts 60 days in advance
3. Audit storage conditions weekly to prevent damage
4. Consider returning near-expiry items to suppliers

## 🎯 Expected Impact

Implementing these recommendations could reduce waste by **20-30%**, saving approximately **₹${Math.round(stats.totalWasteValue * 0.25).toLocaleString()}** monthly.`;
  }
}

export const wasteService = new WasteService();
