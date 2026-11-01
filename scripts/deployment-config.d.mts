export interface DeploymentConfigurationInput {
  installationId: string;
  composeProject: string;
  databaseName: string;
  databaseUser: string;
  domain: string;
  appImage: string;
  postgresImage: string;
  caddyImage: string;
  databaseUrl: string;
  postgresPassword: string;
}

export declare function validateDeploymentConfiguration(
  configuration: DeploymentConfigurationInput,
): Pick<DeploymentConfigurationInput, "installationId" | "composeProject" | "databaseName" | "domain">;
