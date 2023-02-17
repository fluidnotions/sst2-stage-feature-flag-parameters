import { ApiHandler } from "sst/node/api";
import { FeatureParameters } from "@sst2-stage-feature-flag-parameters/core/feature-parameters"

export const handler = ApiHandler(async (_evt) => {
  return {
    body: `Hello stage. 
    
      PARAM1: ${FeatureParameters.PARAM1}
      PARAM2: ${FeatureParameters.PARAM2}
      PARAM3: ${FeatureParameters.PARAM3}
    
    `,
  };
});
