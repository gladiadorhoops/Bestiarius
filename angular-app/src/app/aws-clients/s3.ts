import { S3Client, GetObjectCommand, ListObjectsCommand, ListObjectsCommandInput } from "@aws-sdk/client-s3";
import {fromCognitoIdentityPool} from "@aws-sdk/credential-providers";
import { REGION, COGNITO_CREDENTIALS } from "./constants";

const client = new S3Client({ 
    region: REGION,
    credentials: COGNITO_CREDENTIALS
});
const GLADIADORES_BUCKET_NAME = "gladiadores-hoops"
const MATCH_DATA = "match-data"
const TOURNAMENT_PREFIX = "tournament-"
const CURRENT_TOURNAMENT = "10"
export const TOURNAMENT_YEAR = "2023"
const MATCH_DATA_PATH = `${MATCH_DATA}/${TOURNAMENT_PREFIX}${CURRENT_TOURNAMENT}`

export { client };
export class S3 {
    constructor(){}

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
}