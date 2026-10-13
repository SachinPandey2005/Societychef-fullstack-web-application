import { AIFactory } from './ai/ai_factory';

export class SimulationService {
  /**
   * Stage 9: Scenario Simulation (What-If Analysis)
   */
  static async runScenario(scenarioDescription: string, parameters: any) {
    const aiProvider = AIFactory.getProvider();
    const result = await aiProvider.simulate(scenarioDescription, parameters);
    return result;
  }
}
