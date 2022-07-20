import { S3Client, GetObjectCommand, ListObjectsCommand, ListObjectsCommandInput } from "@aws-sdk/client-s3";
const REGION = "us-east-1"
const s3Client = new S3Client({ region: REGION });
const GLADIADORES_BUCKET_NAME = "gladiadores-hoops"
const MATCH_DATA = "match-data"
const TOURNAMENT_PREFIX = "tournament-"
const CURRENT_TOURNAMENT = "10"
const MATCH_DATA_PATH = `${MATCH_DATA}/${TOURNAMENT_PREFIX}${CURRENT_TOURNAMENT}`

export { s3Client };
export class S3 {
    constructor(){}
    // function getObjects(name: string): string {

    //     try {
    //         const data = s3Client.send(
    //             new GetObjectCommand({ Bucket:  })
    //         );
    //         console.log(data);
    //         console.log("Successfully created a bucket called ", data.Location);
    //         return data; // For unit tests.
    //     } catch (err) {
    //         console.log("Error", err);
    //     }
    //     GetObjectCommand()
    // }

    async listObjects(): Promise<any> {
        console.log("Listing all match files")
        const input: ListObjectsCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Prefix: MATCH_DATA
        }
        try {
            const objectNames = await s3Client.send(
                new ListObjectsCommand(input)
            );
            console.log(objectNames);
            console.log("Successfully created a bucket called ", objectNames.Contents);
            return objectNames.Contents; // For unit tests.
        } catch (err) {
            console.log("Error", err);
        }
    }
}