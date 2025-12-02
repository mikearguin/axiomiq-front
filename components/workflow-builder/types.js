// components/workflow-builder/types.ts

import { Node, Edge } from 'reactflow';

// Node types for the visual builder
export type WorkflowNodeType = 
  | 'trigger'      // Start nodes (webhook, schedule, manual, event)
  | 'agent'        // AI agent execution
  | 'tool'         // Individual tool call
  | 'condition'    // Branching logic
  | 'transform'    // Data transformation
  | 'loop'         // Iteration over data
  | 'parallel'     // Parallel execution
  | 'humanInput'   // Wait for human input/approval
  | 'output'       // End nodes (response, webhook, email, etc.)
  ;

// Trigger configurations
export interface TriggerNodeData {
  type: 'webhook' | 'schedule' | 'manual' | 'event';
  config: {
    // Webhook
    webhookPath?: string;
    webhookMethod?: 'GET' | 'POST';
    // Schedule
    cronExpression?: string;
    timezone?: string;
    // Event
    eventSource?: string;
    eventType?: string;
  };
}

// Agent node configuration
export interface AgentNodeData {
  agentId: string;           // Reference to agents table
  agentName: string;
  modelOverride?: string;    // Optional model override
  inputMapping: Record<string, string>;  // Map workflow vars to agent input
  outputKey: string;         // Key to store agent output
  maxRetries?: number;
  timeoutMs?: number;
}

// Tool node configuration  
export interface ToolNodeData {
  toolId: string;
  toolName: string;
  inputMapping: Record<string, string>;
  outputKey: string;
}

// Condition node configuration
export interface ConditionNodeData {
  conditionType: 'expression' | 'llm';
  // Expression-based
  expression?: string;  // e.g., "{{lead.score}} > 50"
  // LLM-based
  llmPrompt?: string;
  llmModel?: string;
  branches: {
    id: string;
    label: string;
    condition: string;  // 'true', 'false', or custom
  }[];
}

// Transform node configuration
export interface TransformNodeData {
  transformType: 'jmespath' | 'template' | 'code';
  expression: string;
  inputKey: string;
  outputKey: string;
}

// Complete workflow definition (stored in JSONB)
export interface WorkflowDefinition {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  variables: WorkflowVariable[];
  version: number;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  description?: string;
}