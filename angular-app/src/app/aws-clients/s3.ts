import { S3Client, GetObjectCommand, ListObjectsCommand, ListObjectsCommandInput, GetObjectCommandInput, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { REGION, COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR } from "./constants";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"

const client = new S3Client({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
});
const GLADIADORES_BUCKET_NAME = "gladiadores-hoops"
const MATCH_DATA = "match-data"
const TOURNAMENT_PREFIX = "tournament-"
const CURRENT_TOURNAMENT = "10"
const MATCH_DATA_PATH = `${MATCH_DATA}/${TOURNAMENT_PREFIX}${CURRENT_TOURNAMENT}`
const REPORT_DATA = "reports"
const REPORT_PATH = `${REPORT_DATA}/${TOURNAMENT_PREFIX}${TOURNAMENT_YEAR}`
const IMAGE_PATH = "images"


export enum ReportType {
    TOP_PLAYTERS = 'tops',
    PLAYER_REPORT = 'reports'
}

export { client };
export class S3 {
    
    client: S3Client;

    constructor(client: S3Client){
        this.client = client
    }
    async listObjects(): Promise<any> {
        console.log("Listing all match files")
        const input: ListObjectsCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Prefix: MATCH_DATA
        }
        try {
            const objectNames = await client.send(
                new ListObjectsCommand(input)
            );
            console.log(objectNames);
            console.log("Successfully listed bucket: ", objectNames.Contents);
            return objectNames.Contents; // For unit tests.
        } catch (err) {
            console.log("Error", err);
        }
    }

    async readObject(name: string, type: ReportType): Promise<string | undefined> {
        console.log(`Reading s3 object for ${name}`)
        let input: GetObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: `${REPORT_PATH}/${type}/${name}.json`
        }
        console.log('input', input)
        try{
            let response = await this.client.send( new GetObjectCommand(input));
            return response.Body?.transformToString()
        } catch (err){
            console.error('Error', err)
            return
        }

    }

    async uploadFile(fileName: string, fileContent: string | Uint8Array | Buffer, contentType: string): Promise<boolean> {
        console.log(`Uploading file: ${fileName}`)
        
        const input: PutObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: `${IMAGE_PATH}/${fileName}`,
            Body: fileContent,
            ContentType: contentType
        };

        console.log('Upload input:', input);
        
        try {
            const response = await this.client.send(new PutObjectCommand(input));
            console.log('Successfully uploaded file:', response);
            return true;
        } catch (err) {
            console.error('Error uploading file:', err);
            return false;
        }
    }

    async downloadFile(fileName: string): Promise<Uint8Array | undefined> {
        console.log(`Downloading file: ${fileName}`)
        
        const input: GetObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: `${IMAGE_PATH}/${fileName}`
        };

        console.log('Download input:', input);
        
        try {
            const response = await this.client.send(new GetObjectCommand(input));
            const fileContent = await response.Body?.transformToByteArray();
            console.log('Successfully downloaded file:', fileName);
            return fileContent;
        } catch (err) {
            console.error('Error downloading file:', err);
            return undefined;
        }
    }

    static async build(credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity>): Promise<S3> {
        let client =  new S3Client({ 
            region: REGION,
            credentials: credentials
        }); 
        return new S3(client)
    }    


}