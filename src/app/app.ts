import { MemoryStorage } from "botbuilder";
import * as path from "path";
import config from "../config";

// See https://aka.ms/teams-ai-library to learn more about the Teams AI library.
import { Application, ActionPlanner, OpenAIModel, PromptManager } from "@microsoft/teams-ai";

const model = new OpenAIModel({
  azureApiKey: config.azureOpenAIKey,
  azureDefaultDeployment: config.azureOpenAIDeployment,
  azureEndpoint: config.azureOpenAIEndpoint,

  useSystemMessages: true,
  logRequests: true,
});
const prompts = new PromptManager({
  promptsFolder: path.join(__dirname, "../prompts"),
});
const planner = new ActionPlanner({
  model,
  prompts,
  defaultPrompt: "chat",
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application({
  storage,
  ai: {
    planner,
  },
  authentication: {
    settings: {
      arm: {
        scopes: ['https://management.azure.com/user_impersonation'],
        msalConfig: {
          auth: {
              clientId: process.env.AAD_APP_CLIENT_ID!,
              clientSecret: process.env.AAD_APP_CLIENT_SECRET!,
              authority: `${process.env.AAD_APP_OAUTH_AUTHORITY_HOST}/${process.env.AAD_APP_TENANT_ID}`
          }
        },
        signInLink: `https://${process.env.BOT_DOMAIN}/auth-start.html`,
        endOnInvalidMessage: true,
      }
    }
  }
});

app.authentication.get('arm').onUserSignInSuccess(async (context: TurnContext, state: ApplicationTurnState) => {
  // Successfully logged in
  await context.sendActivity('Successfully logged in');
});

import { generateAdaptiveCard, addAuthConfig } from "./utility";
import { TurnContext, ConversationState } from "botbuilder";
import { TurnState, Memory } from "@microsoft/teams-ai";
import yaml from "js-yaml";
import { OpenAPIClientAxios, Document } from "openapi-client-axios";
const fs = require("fs-extra");
type ApplicationTurnState = TurnState<ConversationState>;
// Define a prompt function for getting the current status of the lights
planner.prompts.addFunction("getAction", async (context: TurnContext, memory: Memory) => {
  const specFilePath = path.join(__dirname, "../prompts/chat/actions.json");
  const specFileContent = fs.readFileSync(specFilePath);
  return specFileContent.toString();
});
const specPath = path.join(__dirname, "../../appPackage/apiSpecificationFile/openapi.json");
const specContent = yaml.load(fs.readFileSync(specPath, "utf8")) as Document;
const api = new OpenAPIClientAxios({ definition: specContent });
api.init();


app.ai.action("Apis_List", async (context: TurnContext, state: ApplicationTurnState, parameter: any) => {
  const client = await api.getClient();
  addAuthConfig(client, state);
  const path = client.paths["/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiCenter/services/{serviceName}/workspaces/{workspaceName}/apis"];
  if (path && path.get) {
    const result = await path.get(parameter.path, parameter.body, {
      params: parameter.query,
    });
    const card = generateAdaptiveCard("../adaptiveCards/Apis_List.json", result);
    await context.sendActivity({ attachments: [card] });
  } else {
    await context.sendActivity("no result");
  }
  return "result";
});
  

export default app;
