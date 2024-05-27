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
    ResendConfirmationCodeCommandOutput,
    ForgotPasswordCommandInput,
    ForgotPasswordCommand,
    ForgotPasswordCommandOutput,
    ConfirmForgotPasswordCommandInput,
    ConfirmForgotPasswordCommandOutput,
    ConfirmForgotPasswordCommand,
    DeleteUserCommandInput,
    DeleteUserCommand
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

    static async authenticateUser(username: string, password: string, identity: CognitoIdentity = AUTHENTICATED_COGNITO_IDENTITY): Promise<InitiateAuthCommandOutput | undefined> {
        const initiateAuthCommandInput: InitiateAuthCommandInput = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: identity.clientId,
            AuthParameters: {
                "USERNAME": username, 
                "PASSWORD": password
            }
        }

        const command = new InitiateAuthCommand(initiateAuthCommandInput);
        console.log("command: ", command);
        return await client.send(command); 
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
        
        const command = new SignUpCommand(signUpCommandInput);
        console.log("command: ", command)
        let response = await client.send(command);
        return response
    }

    static async confirmSignUpUser(code: string, email: string): Promise<ConfirmSignUpCommandOutput  | undefined> {
        const confirmSignUpCommandInput: ConfirmSignUpCommandInput = {
            ClientId: AUTHENTICATED_COGNITO_IDENTITY.clientId,
            ConfirmationCode: code,
            Username: email,
        }

        const command = new ConfirmSignUpCommand(confirmSignUpCommandInput);
        console.log("command: ", command)
        let response = await client.send(command);
        return response
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
            console.log("resendConfirmationCode respose", response);
            return response
          } catch (error) {
            console.log(error)
            return undefined
        }        
    }

    static async forgotPassword(email: string): Promise<ForgotPasswordCommandOutput  | undefined> {
        const forgotPasswordCommandInput: ForgotPasswordCommandInput = {
            ClientId: AUTHENTICATED_COGNITO_IDENTITY.clientId,
            Username: email,            
        }

        try {
            const command = new ForgotPasswordCommand(forgotPasswordCommandInput);
            console.log("command: ", command)
            let response = await client.send(command);
            console.log("forgotPassword respose", response);
            return response
          } catch (error) {
            console.log(error)
            return undefined
        }
    }

    static async confirmForgotPassword(email: string, password: string, code: string): Promise<ConfirmForgotPasswordCommandOutput  | undefined> {
        const confirmForgotPasswordCommandInput: ConfirmForgotPasswordCommandInput = {
            ClientId: AUTHENTICATED_COGNITO_IDENTITY.clientId,
            Username: email,
            ConfirmationCode: code, 
            Password: password,       
        }

        try {
            const command = new ConfirmForgotPasswordCommand(confirmForgotPasswordCommandInput);
            console.log("command: ", command)
            let response = await client.send(command);
            return response
          } catch (error) {
            console.log(error)
            return undefined
        }
    }

    static async deleteUser(accessToken: string) {
        const deleteUserCommandInput: DeleteUserCommandInput = {
            AccessToken: accessToken
        }

        try {
            const command = new DeleteUserCommand(deleteUserCommandInput);
            console.log("command: ", command);
            let response = await client.send(command);
            console.log("response: ", command);
          } catch (error) {
            console.log(error)
        }
    }

    static getUserFromToken(idToken: string, accessToken?: string): User {
        let jwt = jwtDecode(idToken) as {[key:string]: string}
        return {
            id: jwt['sub'],
            name: jwt['name'],
            phone: jwt['phone_number'],
            email: jwt['email'],
            role: roleFromString(jwt['custom:role']),
            accessToken: accessToken,
            idToken: idToken
        }
    }
}
