export const REGION = 'us-east-1'
export const COGNITO_IDENTITY_POOL = 'us-east-1:66bd9702-735d-4e68-a155-76fb7fb20547'
export const COGNITO_USER_POOL = 'us-east-1_sQjlRFiTn'
export const SCOUT_APP_CLIENT = '7hbaqk501t9nd2sqjnl5ocs5e'
export const COGNITO_IDP_TEMPLATE = (region: string, userPoolId: string) => `cognito-idp.${region}.amazonaws.com/${userPoolId}`
export const DDB_TABLE_NAME = 'Gladiadores'

