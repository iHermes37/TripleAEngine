// 对应 app/service/insights/insights.py
// 用户研究（痛点验证） + 市场研究（竞品与趋势） + 获客方式（渠道测试） + 技术评估（可行性） + 财务测算（商业价值） = 完整的产品调研

import { END, START, StateGraph } from "@langchain/langgraph";
import { Send } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";

// 对应 class SharedDoc(TypedDict)
const SharedDocAnnotation = Annotation.Root({
  product: Annotation<string>(),
  session_id: Annotation<string>(),

  // 各个节点的结果
  user_research_results: Annotation<Record<string, unknown> | null>(),
  market_research_results: Annotation<Record<string, unknown> | null>(),
  user_acquisition_results: Annotation<Record<string, unknown> | null>(),
  technical_assessment_results: Annotation<Record<string, unknown> | null>(),
  financial_assessment_results: Annotation<Record<string, unknown> | null>(),

  // 最终报告
  final_report: Annotation<string | null>(),
});

export type SharedDoc = typeof SharedDocAnnotation.State;


export function prepare_node(): void {
  // pass
}

export function user_research_node(product: string): string {
  // pass
  return "";
}

// export function market_research_node(product: string): string {
//   // pass
//   return "";
// }

export function user_acquisition_node(product: string): string {
  // pass
  return "";
}

// export function technical_assessment_node(product: string): string {
//   // pass
//   return "";
// }
//
// export function financial_assessment_node(product: string): string {
//   // pass
//   return "";
// }

export function assessment_node(): void {
  // pass
}

export function generate_report_node(): string {
  // pass
  return "";
}

// -----------
export function route_to_assign_work(state: SharedDoc): Send[] {
  const base_data = {
    session_id: state.session_id,
    product: state.product,
    prepare_results: (state as Record<string, unknown>)["prepare_results"],
  };

  const nodes = [
    "user_research",
    // "market_research",
    "user_acquisition",
    "assessment",
    // "technical_assessment",
    // "financial_assessment"
  ];

  const sends: Send[] = [];

  for (const node of nodes) {
    sends.push(new Send(node, base_data));
  }

  return sends;
}


export class insights {
  constructor() {}

  static build_graph(): StateGraph<typeof SharedDocAnnotation.spec, SharedDoc> {
    const workflow = new StateGraph(SharedDocAnnotation);

    workflow.addNode("prepare", prepare_node);
    workflow.addNode("user_research", user_research_node);
    // workflow.addNode("market_research", market_research_node);
    workflow.addNode("user_acquisition", user_acquisition_node);
    // workflow.addNode("technical_assessment", technical_assessment_node);
    // workflow.addNode("financial_assessment", financial_assessment_node);
    workflow.addNode("assessment", assessment_node);
    workflow.addNode("generate_report", generate_report_node);

    workflow.addEdge(START, "prepare");

    workflow.addConditionalEdges("prepare", route_to_assign_work, [
      "user_research",
      "user_acquisition",
      "assessment",
    ]);

    workflow.addEdge("generate_report", END);

    return workflow;
  }
}
