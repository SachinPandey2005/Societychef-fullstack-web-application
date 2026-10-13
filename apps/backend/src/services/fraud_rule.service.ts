import { FraudRule } from '../types/fraud';
import { FraudRepository } from '../repositories/fraud.repository';

export class FraudRuleService {
  /**
   * Extremely basic Pure-Function Evaluator to avoid `eval()`.
   * In a real system, use `json-logic-js` or similar AST parsed engine.
   * Format example: { field: "amount", operator: ">", value: 5000 }
   */
  static evaluateCondition(payload: any, condition: any): boolean {
    if (!condition) return true;
    
    const { field, operator, value } = condition;
    const actual = payload[field];

    switch (operator) {
      case '>': return actual > value;
      case '<': return actual < value;
      case '==': return actual === value;
      case 'IN': return Array.isArray(value) && value.includes(actual);
      default: return false;
    }
  }

  static async evaluateEvent(eventType: string, payload: any): Promise<string[]> {
    const rules = await FraudRepository.getActiveRules();
    
    const triggeredActions = new Set<string>();

    for (const rule of rules) {
      // Very naive check for demo architecture:
      // If rule.conditions.eventType matches, and the field logic passes
      if (rule.conditions.eventType === eventType) {
        const isMatch = this.evaluateCondition(payload, rule.conditions.logic);
        if (isMatch) {
          rule.actions.forEach(a => triggeredActions.add(a));
        }
      }
    }

    return Array.from(triggeredActions);
  }
}
