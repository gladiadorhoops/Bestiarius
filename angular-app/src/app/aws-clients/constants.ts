import {fromCognitoIdentityPool} from "@aws-sdk/credential-providers";

export const REGION = 'us-east-1'
export const COGNITO_IDENTITY_POOL = 'us-east-1:66bd9702-735d-4e68-a155-76fb7fb20547'
export const COGNITO_UNAUTHENTICATED_IDENTITY_POOL = 'us-east-1:adf17da9-3e55-4f06-b8fa-53554f6f4dbf'
export const COGNITO_USER_POOL = 'us-east-1_sQjlRFiTn'
export const SCOUT_APP_CLIENT = '7hbaqk501t9nd2sqjnl5ocs5e'
export const COGNITO_IDP_TEMPLATE = (region: string, userPoolId: string) => `cognito-idp.${region}.amazonaws.com/${userPoolId}`
export const DDB_TABLE_NAME = 'Gladiadores'
export const COGNITO_UNAUTHENTICATED_CREDENTIALS = fromCognitoIdentityPool({
    clientConfig: { region: REGION }, // Configure the underlying CognitoIdentityClient.
    identityPoolId: COGNITO_UNAUTHENTICATED_IDENTITY_POOL
})

