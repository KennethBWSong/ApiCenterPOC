@maxLength(20)
@minLength(4)
@description('Used to generate names for all resources in this file')
param resourceBaseName string

@description('Required when create Azure Bot service')
param botAadAppClientId string

@secure()
@description('Required by Bot Framework package in your bot project')
param botAadAppClientSecret string

@secure()
param azureOpenAIKey string

@secure()
param azureOpenAIEndpoint string

@secure()
param azureOpenAIDeployment string

param webAppSKU string

@maxLength(42)
param botDisplayName string

param aadAppClientId string
param aadAppClientSecret string
param aadAppTenantId string
param aadAppOuathAuthority string

param serverfarmsName string = resourceBaseName
param webAppName string = resourceBaseName
param location string = resourceGroup().location

// Compute resources for your Web App
resource serverfarm 'Microsoft.Web/serverfarms@2021-02-01' = {
  kind: 'app'
  location: location
  name: serverfarmsName
  sku: {
    name: webAppSKU
  }
}

// Web App that hosts your bot
resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  kind: 'app'
  location: location
  name: webAppName
  properties: {
    serverFarmId: serverfarm.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1' // Run Azure App Service from a package file
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18' // Set NodeJS version to 18.x for your site
        }
        {
          name: 'RUNNING_ON_AZURE'
          value: '1'
        }
        {
          name: 'BOT_ID'
          value: botAadAppClientId
        }
        {
          name: 'BOT_PASSWORD'
          value: botAadAppClientSecret
        }
        {
          name: 'AZURE_OPENAI_API_KEY'
          value: azureOpenAIKey
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: azureOpenAIEndpoint
        }
        {
          name: 'AZURE_OPENAI_DEPLOYMENT'
          value: azureOpenAIDeployment
        }
        {
          name: 'AAD_APP_CLIENT_ID'
          value: aadAppClientId
        }
        {
          name: 'SECRET_AAD_APP_CLIENT_SECRET'
          value: aadAppClientSecret
        }
        {
          name: 'AAD_APP_TENANT_ID'
          value: aadAppTenantId
        }
        {
          name: 'AAD_APP_OAUTH_AUTHORITY_HOST'
          value: aadAppOuathAuthority
        }
      ]
      ftpsState: 'FtpsOnly'
    }
  }
}

// Register your web service as a bot with the Bot Framework
module azureBotRegistration './botRegistration/azurebot.bicep' = {
  name: 'Azure-Bot-registration'
  params: {
    resourceBaseName: resourceBaseName
    botAadAppClientId: botAadAppClientId
    botAppDomain: webApp.properties.defaultHostName
    botDisplayName: botDisplayName
  }
}

resource webAppSettings 'Microsoft.Web/sites/config@2021-02-01' = {
  name: '${webAppName}/appsettings'
  properties: {
    AAD_APP_CLIENT_ID: aadAppClientId
    AAD_APP_CLIENT_SECRET: aadAppClientSecret
    AAD_APP_OAUTH_AUTHORITY_HOST: aadAppOuathAuthority
    AAD_APP_TENANT_ID: 'common'
    BOT_ID: botAadAppClientId
    BOT_PASSWORD: botAadAppClientSecret
    RUNNING_ON_AZURE: '1'
    WEBSITE_RUN_FROM_PACKAGE: '1'
    WEBSITE_NODE_DEFAULT_VERSION: '~18'
    AZURE_OPENAI_API_KEY: azureOpenAIKey
    AZURE_OPENAI_ENDPOINT: azureOpenAIEndpoint
    AZURE_OPENAI_DEPLOYMENT: azureOpenAIDeployment
    BOT_DOMAIN: webApp.properties.defaultHostName
  }
}

// The output will be persisted in .env.{envName}. Visit https://aka.ms/teamsfx-actions/arm-deploy for more details.
output BOT_AZURE_APP_SERVICE_RESOURCE_ID string = webApp.id
output BOT_DOMAIN string = webApp.properties.defaultHostName
