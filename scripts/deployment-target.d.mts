export interface DeploymentTargetInput {
  databaseUrl: string;
  installationId: string;
  confirmation: string;
}

export declare function validateDeploymentTarget(input: DeploymentTargetInput): URL;
