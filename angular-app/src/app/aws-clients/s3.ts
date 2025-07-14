import { S3Client, GetObjectCommand, ListObjectsCommand, ListObjectsCommandInput, GetObjectCommandInput, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { REGION, COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR } from "./constants";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"
import { Cache } from "./cache";

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
    cache: Cache;

    constructor(client: S3Client){
        this.client = client
        this.cache = new Cache();
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
        
        const objectKey = `${IMAGE_PATH}/${fileName}`;

        const input: PutObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: objectKey,
            Body: fileContent,
            ContentType: contentType
        };

        console.log('Upload input:', input);
        
        try {
            const response = await this.client.send(new PutObjectCommand(input));
            console.log('Successfully uploaded file:', response);
            
            // Invalidate cache entry for this file since we just uploaded a new version
            if (this.cache.has(objectKey)) {
                this.cache.delete(objectKey);
                console.log(`Invalidated cache for uploaded file: ${fileName}`);
            }
            
            return true;
        } catch (err) {
            console.error('Error uploading file:', err);
            return false;
        }
    }

    /**
     * Get cache statistics for monitoring
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Clear all cached entries
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Remove specific file from cache
     */
    invalidateCache(fileName: string, path?: string): boolean {
        const cacheKey = path ? `${path}/${fileName}` : `${IMAGE_PATH}/${fileName}`;
        return this.cache.delete(cacheKey);
    }

    /**
     * Check if a file is cached
     */
    isCached(fileName: string, path?: string): boolean {
        const cacheKey = path ? `${path}/${fileName}` : `${IMAGE_PATH}/${fileName}`;
        return this.cache.has(cacheKey);
    }

    /**
     * Manually cleanup expired cache entries
     */
    cleanupCache(): number {
        return this.cache.cleanup();
    }

    /**
     * Destroy the S3 instance and cleanup cache resources
     */
    destroy(): void {
        this.cache.destroy();
        console.log('S3 instance destroyed and cache cleaned up');
    }

    async downloadFile(fileName: string, useCache: boolean = true): Promise<Uint8Array | undefined> {
        const objectKey = `${IMAGE_PATH}/${fileName}`;
        console.log(`Downloading file: ${objectKey}`)
        
        // Check cache first if caching is enabled
        if (useCache) {
            const cachedData = this.cache.get(objectKey);
            if (cachedData) {
                console.log(`Cache hit for file: ${objectKey}`);
                return cachedData;
            }
            console.log(`Cache miss for file: ${objectKey}, downloading from S3`);
        }
        
        const input: GetObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: objectKey
        };

        console.log('Download input:', input);
        
        try {
            const response = await this.client.send(new GetObjectCommand(input));
            const fileContent = await response.Body?.transformToByteArray();
            
            if (fileContent) {
                console.log('Successfully downloaded file:', objectKey);
                
                // Cache the downloaded file if caching is enabled
                if (useCache) {
                    this.cache.set(objectKey, fileContent);
                    console.log(`Cached file: ${objectKey}`);
                }
                
                return fileContent;
            }
            
            return undefined;
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