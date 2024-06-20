import { CardFactory } from "botbuilder";
const ACData = require("adaptivecards-templating");
import { OpenAPIClient } from "openapi-client-axios";
export function generateAdaptiveCard(templatePath: string, result: any) {
  if (!result || !result.data) {
    throw new Error("Get empty result from api call.");
  }
  const adaptiveCardTemplate = require(templatePath);
  const template = new ACData.Template(adaptiveCardTemplate);
  const cardContent = template.expand({
    $root: result.data,
  });
  const card = CardFactory.adaptiveCard(cardContent);
  return card;
}

export function addAuthConfig(client: OpenAPIClient, state: any) {
  // This part is sample code for adding authentication to the client.
  // Please replace it with your own authentication logic.
  // Please refer to https://openapistack.co/docs/openapi-client-axios/intro/ for more info about the client.
  const token = state.temp.authTokens['arm'];
  console.log(`token: ${token}`);
  client.interceptors.request.use((config) => {
    // For Bearer Token
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });
}
