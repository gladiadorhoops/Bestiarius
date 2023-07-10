export const REGION = 'us-east-1'
export const COGNITO_IDENTITY_POOL = 'us-east-1:66bd9702-735d-4e68-a155-76fb7fb20547'
export const COGNITO_USER_POOL = 'us-east-1_VprPEmai4'
export const SCOUT_APP_CLIENT = '32nt6rgni9ri23hagq0quq7dcc'
export const COGNITO_IDP_TEMPLATE = (region: string, userPoolId: string) => `cognito-idp.${region}.amazonaws.com/${userPoolId}`
export const DDB_TABLE_NAME = 'Gladiadores'

