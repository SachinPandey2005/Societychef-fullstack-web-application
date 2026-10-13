import { AIProvider, PredictionResult } from './ai.provider.interface';

export class MockProvider implements AIProvider {
  /**
   * Safe mock implementation for testing and failover
   */
  async predict(context: string, historicalData: any[]): Promise<PredictionResult> {
    return {
      value: { forecastedGrowth: 0.15 },
      confidenceScore: 0.85,
      reasoning: 'Based on linear mock progression.',
      dataSources: ['MockDB']
    };
  }

  async simulate(scenario: string, baselineData: any): Promise<PredictionResult> {
    return {
      value: { impact: 'Neutral' },
      confidenceScore: 0.9,
      reasoning: 'Simulation constraints limit extreme variance in mock mode.',
      dataSources: ['MockDB']
    };
  }
}
