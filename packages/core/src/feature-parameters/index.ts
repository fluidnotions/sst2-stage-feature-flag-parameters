// adapted from https://github.com/serverless-stack/sst
import {
  GetParametersCommand,
  SSMClient,
  Parameter,
} from "@aws-sdk/client-ssm";
import { ParameterResources } from "sst/node/config";
import { buildSsmPath, createProxy, parseEnvironment, ssmNameToConstructId } from "./utlis";
const ssm = new SSMClient({});

export type ParameterTypes = {
  [T in keyof ParameterResources]: string;
};

export const FeatureParameters = createProxy<ParameterTypes>(
  "Config"
);
const metadata = parseMetadataEnvironment();
const parametersRaw = parseEnvironment("Parameter", ["value"]);
const parameters = flattenConfigValues(parametersRaw);
await replaceFeatureParametersWithRealValues();
Object.assign(FeatureParameters, metadata, parameters);

///////////////
// Functions
///////////////

function parseMetadataEnvironment() {
  // If SST_APP and SST_STAGE are not set, it is likely the
  // user is using an older version of SST.
  const errorMsg =
    "This is usually the case when you are using an older version of SST. Please update SST to the latest version to use the SST Config feature.";
  if (!process.env.SST_APP) {
    throw new Error(
      `Cannot find the SST_APP environment variable. ${errorMsg}`
    );
  }
  if (!process.env.SST_STAGE) {
    throw new Error(
      `Cannot find the SST_STAGE environment variable. ${errorMsg}`
    );
  }
  return {
    APP: process.env.SST_APP,
    STAGE: process.env.SST_STAGE,
  };
}

function flattenConfigValues(
  configValues: ReturnType<typeof parseEnvironment>
) {
  const acc: Record<string, string> = {};
  Object.keys(configValues).forEach((name) => {
    acc[name] = configValues[name].value;
  });
  return acc;
}

async function replaceFeatureParametersWithRealValues() {
  // Find all the secrets and params that match the prefix
  const names = Object.keys(parameters).filter(
    (name) => parameters[name] === "__FETCH_FROM_SSM__"
  );
  if (names.length === 0) {
    return;
  }

  const paths = names.map((name) => buildSsmPath("Parameter", name, "value"));
  const results = await loadFeatureFlags(paths);
  results.validParams.forEach((item) => {
    const name = ssmNameToConstructId(item.Name!);
    parameters[name] = item.Value!;
  });

}

async function loadFeatureFlags(paths: string[]) {
  // Split paths into chunks of 10
  const chunks = [];
  for (let i = 0; i < paths.length; i += 10) {
    chunks.push(paths.slice(i, i + 10));
  }

  const validParams: Parameter[] = [];
  const invalidParams: string[] = [];
  await Promise.all(
    chunks.map(async (chunk) => {
      const command = new GetParametersCommand({
        Names: chunk
      });
      const result = await ssm.send(command);
      validParams.push(...(result.Parameters || []));
      invalidParams.push(...(result.InvalidParameters || []));
    })
  );
  return { validParams, invalidParams };
}

