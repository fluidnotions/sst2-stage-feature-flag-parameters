import { Config, Stack } from "sst/constructs";
import { FeatureParameter } from "./environments";

export async function loadStageFeatures(stack: Stack, stage: string): Promise<Array<Config.Parameter>> {
  const stageFeatures: Record<string, Array<FeatureParameter>> = await import(
    "./environments"
  );
  const stg: [string, Array<FeatureParameter>] | undefined = Object.entries(
    stageFeatures
  ).find(([stage]) => stage === stage);
  if (!stg) {
    throw new Error(`No feature flags found for stage: ${stage}`);
  }
  const [_, features] = stg;
  return features.map(([name, value]) => {
    return new Config.Parameter(stack, name, { value });
  });
}
