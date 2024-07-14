import {fromCognitoIdentityPool} from "@aws-sdk/credential-providers";
import { CognitoIdentity } from "../interfaces/cognito-identity";

export const TOURNAMENT_YEAR = '2024'

export const REGION = 'us-east-1'
export const COGNITO_IDENTITY_POOL = 'us-east-1:66bd9702-735d-4e68-a155-76fb7fb20547'
export const COGNITO_UNAUTHENTICATED_IDENTITY_POOL = 'us-east-1:adf17da9-3e55-4f06-b8fa-53554f6f4dbf'
export const COGNITO_USER_POOL = 'us-east-1_sQjlRFiTn'
export const SCOUT_APP_CLIENT = '7hbaqk501t9nd2sqjnl5ocs5e'

export const AUTHENTICATED_COGNITO_IDENTITY: CognitoIdentity = {
    clientId: '5gg17rf05cav1h6qnnvnpeafiv',
    identityPoolId: 'us-east-1:0c736515-3362-4b12-8d19-ac3f85f8d977',
    userPoolId: 'us-east-1_ow53ANKbx'
}

export const COGNITO_IDP_TEMPLATE = (region: string, userPoolId: string) => `cognito-idp.${region}.amazonaws.com/${userPoolId}`
export const DDB_TABLE_NAME = 'Gladiadores'
export const COGNITO_UNAUTHENTICATED_CREDENTIALS = fromCognitoIdentityPool({
    clientConfig: { region: REGION }, // Configure the underlying CognitoIdentityClient.
    identityPoolId: COGNITO_UNAUTHENTICATED_IDENTITY_POOL
})
