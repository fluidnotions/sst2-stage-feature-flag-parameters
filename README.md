# Type Safe Feature Flags

## Explanation

You could either use secrets for feature flags, but this may be messy. Alternatively I've implemented a [FeatureParameters](packages/core/src/feature-parameters/index.ts) proxy to Config which is based off sst [packages/sst/src/node/config/index.ts](https://github.com/serverless-stack/sst/blob/01027cf62e8beb479775673f09a1428a442076e1/packages/sst/src/node/config/index.ts) and fetches parameters during lambda bootstrap.

The usage within a lambda handler can be seen [here](packages/functions/src/lambda.ts) and includes type safety on `FeatureParameters`

## SST Implementation

If you look at [packages/sst/src/node/config/index.ts](https://github.com/serverless-stack/sst/blob/01027cf62e8beb479775673f09a1428a442076e1/packages/sst/src/node/config/index.ts#L109) you will see that secrets are fetched and placed in lambda cache, via the runtime Config import since packaging is esm and allows top level await, but parameters are not fetched, during lambda bootstrap.

SSM parameters only exist in the sst implementation for use in testing as described in their documentation.

> Storing the parameter values in SSM might seem redundant.

is mentioned [here](https://docs.sst.dev/config#copy-to-ssm)

The standard sst implementation around secrets has it's own conveniences which are described in the sst docs

## Clearing a specific lambda's cache

In order for secrets or feature parameters to become active at runtime the lambda cache needs to be cleared. This will happen with the next cold start.

## The performance impact of redeploying for a feature flag environment variable change

The current implementation clears the cache of the whole service cluster of lambdas, since we are using 

```
this.setDefaultFunctionProps(..., environment: {...})
```

Any change to a stage .env and subsequent redeploy will restart ever lambda in the service cluster since they all share the environment variables. Resulting in cold starts across the service.

## The lesser performance impact approach  

Alternatively you can restart only lambda(s) affected by the feature flag. This would only be necessary if you wanted the change to take effect immediately. Even a warm lambda will eventually be restarted and the cache cleared.

There are various ways to restart an individual lambda. Since a feature flag might actually affect multiple lambdas, I suggest a cli, where the handler names can be specified and just those lambda's restarted. 

## How to use this across stages that are across multiple aws accounts

### Is stacks/feature-flag-parameter/environments necessary ?

This implementation merely illustrates a path to a cleaner way. It was mentioned on the sst discord channel, in response to a related question about dealing with stages across multiple accounts. But is not implemented. The dotenv package that .env files are read by, constructs an object of key value pairs. You could get feature flag parameters from .env files in a specific root directory and use the resulting object in `stacks/feature-flag-parameter/loader.ts` in place of the import on line 5

## How are the types made on synth

You can see the function [codegenTypes()](https://github.com/serverless-stack/sst/blob/01027cf62e8beb479775673f09a1428a442076e1/packages/sst/src/constructs/App.ts#L281) is called during the synth stage. The proxy I used in my implementation [here](./packages/core/src/feature-parameters/index.ts) reuses the same mechanism