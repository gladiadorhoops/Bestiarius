import { CognitoIdentityProviderClient, InitiateAuthCommand, InitiateAuthCommandInput, InitiateAuthCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"
import { REGION, SCOUT_APP_CLIENT } from "./constants";
import { CognitoIdentityCredentialProvider, fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { COGNITO_IDENTITY_POOL, COGNITO_IDP_TEMPLATE, COGNITO_USER_POOL } from "./constants";

const client = new CognitoIdentityProviderClient({region: REGION})

export class Cognito {

    static async getAwsCredentials(username: string, password: string): Promise<AwsCredentialIdentity | Provider<AwsCredentialIdentity> | undefined> {
        
        let credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity> | undefined

        let output = await Cognito.authenticateUser(username.toLowerCase(), password)
 
        if(output == undefined) {
            credentials = undefined
            console.log("ERROR: User authentication returned undefined")
            return
        }
        let token = output.AuthenticationResult?.IdToken
        if(token == undefined) {
            console.log("ERROR: ID Token not found on user authentication output")
            credentials = undefined
            return
        }
        console.log(`Found User ${username} ID Token`)
        try {
            const cognitoCredentials: CognitoIdentityCredentialProvider = fromCognitoIdentityPool({
                clientConfig: { region: REGION }, // Configure the underlying CognitoIdentityClient.
                identityPoolId: COGNITO_IDENTITY_POOL,
                logins: {
                    [COGNITO_IDP_TEMPLATE(REGION, COGNITO_USER_POOL)]: token,                            
                }            
            })
            console.log("Found AWS Credentials")
            return cognitoCredentials
            
            return
        } catch (err) {
            console.log("ERROR: Failed to retreive AWS credentials", err)
            return
        }                
    }


    static async authenticateUser(username: string, password: string): Promise<InitiateAuthCommandOutput | undefined> {
        const initiateAuthCommandInput: InitiateAuthCommandInput = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: SCOUT_APP_CLIENT,
            AuthParameters: {
                "USERNAME": username, 
                "PASSWORD": password
            }
        }

        let response: InitiateAuthCommandOutput | undefined

        try {
            const command = new InitiateAuthCommand(initiateAuthCommandInput);
            console.log("command: ", command)
            response = await client.send(command);
            return response
          } catch (error) {
            console.log(error)
            return undefined
        }

    }

    
}
