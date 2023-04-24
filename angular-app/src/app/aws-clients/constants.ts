
import {fromCognitoIdentityPool} from "@aws-sdk/credential-providers";

export const REGION = 'us-east-1'
export const COGNITO_IDENTITY_POOL = 'us-east-1:adf17da9-3e55-4f06-b8fa-53554f6f4dbf'
export const COGNITO_CREDENTIALS = fromCognitoIdentityPool({
    clientConfig: { region: REGION }, // Configure the underlying CognitoIdentityClient.
    identityPoolId: COGNITO_IDENTITY_POOL
})

export const DDB_TABLE_NAME = 'Gladiadores'

