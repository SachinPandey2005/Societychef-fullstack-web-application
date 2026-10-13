export interface PredictionResult {
  value: any;
  confidenceScore: number; // 0.0 to 1.0
  reasoning: string;
  dataSources: string[];
}

export interface AIProvider {
  /**
   * Stage 3: AI Provider Interface
   */
  predict(context: string, historicalData: any[]): Promise<PredictionResult>;
  simulate(scenario: string, baselineData: any): Promise<PredictionResult>;
}
