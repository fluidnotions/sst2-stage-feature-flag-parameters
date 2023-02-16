import { Api, App, Stack, StackProps } from "sst/constructs";

export default class MicroserviceStack extends Stack {

	constructor(app: App, id: string, props?: StackProps) {
        super(app, id, props)

        const api = new Api(app, "api", {
            routes: {
              "GET /": "packages/functions/src/lambda.handler",
            },
          })
          
          this.addOutputs({
            ApiEndpoint: api.url,
          })
    }
}