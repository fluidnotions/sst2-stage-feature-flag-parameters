import { StackContext } from "sst/constructs";
import { loadStageFeatures } from "./feature-flag-parameter/loader";
import MicroserviceStack from "./stack.class";

export async function API({ stack, app }: StackContext) {
  const featureParameters = await loadStageFeatures(stack, app.stage);
  new MicroserviceStack(app, "api").addDefaultFunctionBinding(featureParameters)
}
