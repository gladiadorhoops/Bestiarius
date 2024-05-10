import { 
    CognitoIdentityProviderClient, 
    InitiateAuthCommand, 
    InitiateAuthCommandInput, 
    InitiateAuthCommandOutput,
    SignUpCommandInput,
    SignUpCommandOutput,
    SignUpCommand,
    ConfirmSignUpCommandInput,
    ConfirmSignUpCommandOutput,
    ConfirmSignUpCommand,
    ResendConfirmationCodeCommand,
    ResendConfirmationCodeCommandInput,
    ResendConfirmationCodeCommandOutput
} from "@aws-sdk/client-cognito-identity-provider";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"
import { CognitoIdentityCredentialProvider, fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { 
    REGION, 
    COGNITO_IDP_TEMPLATE, 
    AUTHENTICATED_COGNITO_IDENTITY,
} from "./constants";
import { User } from "../interfaces/user";
import { jwtDecode } from "jwt-decode";
import { CognitoIdentity } from "../interfaces/cognito-identity";
import { roleFromString } from "../enum/Role";


const client = new CognitoIdentityProviderClient({region: REGION})

export class Cognito {

    static async getAwsCredentials(tokenId: string, identity: CognitoIdentity = AUTHENTICATED_COGNITO_IDENTITY): Promise<AwsCredentialIdentity | Provider<AwsCredentialIdentity> | undefined> {
        try {
            const cognitoCredentials: CognitoIdentityCredentialProvider = fromCognitoIdentityPool({
                clientConfig: { region: REGION }, // Configure the underlying CognitoIdentityClient.
                identityPoolId: identity.identityPoolId,
                logins: {
                    [COGNITO_IDP_TEMPLATE(REGION, identity.userPoolId)]: tokenId,                            
                }            
            })
            console.log("Found AWS Credentials")
            return cognitoCredentials
        } catch (err) {
            console.log("ERROR: Failed to retreive AWS credentials", err)
            return
        }                
    }

    static async authenticateUser(username: string, password: string, identity: CognitoIdentity = AUTHENTICATED_COGNITO_IDENTITY): Promise<string | undefined> {
        const initiateAuthCommandInput: InitiateAuthCommandInput = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: identity.clientId,
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
          } catch (error) {
            console.log(error)
            return undefined
        }

        if(response == undefined) {
            console.log("ERROR: User authentication returned undefined")
            return
        }
        let token = response.AuthenticationResult?.IdToken
        if(token == undefined) {
            console.log("ERROR: ID Token not found on user authentication output")
            return
        }
        console.log(`Found User ${username} ID Token`)
        return token
    }

    static async signUpUser(name: string, email: string, phoneNumber: string, password: string, role: string): Promise<SignUpCommandOutput  | undefined> {
        const signUpCommandInput: SignUpCommandInput = {
            ClientId: AUTHENTICATED_COGNITO_IDENTITY.clientId,
            Password: password,
            Username: email,
            UserAttributes: [
                {
                    Name: 'name',
                    Value: name
                },
                {
                    Name: 'email',
                    Value: email
                },
                {
                    Name: 'phone_number',
                    Value: phoneNumber
                },
                {
                    Name: 'custom:role',
                    Value: role
                }     
            ],
        }

        try {
            const command = new SignUpCommand(signUpCommandInput);
            console.log("command: ", command)
            let response = await client.send(command);
            return response
          } catch (error) {
            console.log(error)
            return undefined
        }
    }

    static async confirmSignUpUser(code: string, email: string): Promise<ConfirmSignUpCommandOutput  | undefined> {
        const confirmSignUpCommandInput: ConfirmSignUpCommandInput = {
            ClientId: AUTHENTICATED_COGNITO_IDENTITY.clientId,
            ConfirmationCode: code,
            Username: email,
        }

        try {
            const command = new ConfirmSignUpCommand(confirmSignUpCommandInput);
            console.log("command: ", command)
            let response = await client.send(command);
            return response
          } catch (error) {
            console.log(error)
            return undefined
        }
    }

    static async resendConfirmationCode(email: string): Promise<ResendConfirmationCodeCommandOutput  | undefined> {
        const resendConfirmationCodeCommandInput: ResendConfirmationCodeCommandInput = {
            ClientId: AUTHENTICATED_COGNITO_IDENTITY.clientId,
            Username: email,
        }

        try {
            const command = new ResendConfirmationCodeCommand(resendConfirmationCodeCommandInput);
            console.log("command: ", command)
            let response = await client.send(command);
            return response
          } catch (error) {
            console.log(error)
            return undefined
        }        
    }

    static getUserFromToken(idToken: string): User {
        let jwt = jwtDecode(idToken) as {[key:string]: string}
        return {
            id: jwt['sub'],
            name: jwt['name'],
            phone: jwt['phone_number'],
            email: jwt['email'],
            role: roleFromString(jwt['custom:role']),
        }
    }
}
