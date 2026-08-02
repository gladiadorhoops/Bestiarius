import { S3Client, GetObjectCommand, ListObjectsCommand, ListObjectsCommandInput, GetObjectCommandInput, PutObjectCommand, PutObjectCommandInput, DeleteObjectCommand, DeleteObjectCommandInput } from "@aws-sdk/client-s3";
import { REGION, COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR } from "./constants";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"
import { Cache, globalCache } from "./cache";

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
const LIABILITY_WAIVER_PATH = "liability-waiver"

// Blank liability-waiver template coaches hand out to players. Stored under
// the liability-waiver path as `liability-waiver-<year>.pdf`, alongside the
// per-player signed waivers.
const LIABILITY_WAIVER_TEMPLATE_KEY = `${LIABILITY_WAIVER_PATH}/liability-waiver-${TOURNAMENT_YEAR}.pdf`

// Public CloudFront distribution that exposes the blank waiver template at the
// root, keyed only by year (e.g. `liability-waiver-2026.pdf`).
const LIABILITY_WAIVER_CDN_DOMAIN = "https://d21i3xrq1b6i2p.cloudfront.net"
const LIABILITY_WAIVER_TEMPLATE_CDN_URL = `${LIABILITY_WAIVER_CDN_DOMAIN}/liability-waiver-${TOURNAMENT_YEAR}.pdf`

export { LIABILITY_WAIVER_PATH, LIABILITY_WAIVER_TEMPLATE_KEY };


export enum ReportType {
    TOP_PLAYTERS = 'tops',
    PLAYER_REPORT = 'reports',
    // Group-stage tables written by the Retiarius CreateStandings workflow, all
    // categories and groups in a single standings.json.
    STANDINGS = 'standings'
}

// Sent as `response-cache-control` on reads of objects that get rewritten in
// place under a stable key, so the browser never serves a stale copy. It also
// changes the request URL, which evicts anything already cached under the plain
// object URL.
const NO_CACHE = 'no-cache, no-store, must-revalidate'

export { client };
export class S3 {

    client: S3Client;
    // Images keyed per entity only (player photos, team logos). Mutable objects
    // — JSON reports, payment receipts, waivers — bypass this; see readObject and
    // downloadFile's useCache flag.
    //
    // Shared process-wide rather than per instance: every component builds its
    // own S3, so a per-instance cache never gets a hit across views and each one
    // would leak its own cleanup interval.
    cache: Cache = globalCache;

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

    /**
     * Read a JSON report (tops, player reports, standings). Never cached: these
     * files are rewritten in place as matches are scored, so a cached copy would
     * show stale stats and standings.
     */
    async readObject(name: string, type: ReportType): Promise<string | undefined> {
        console.log(`Reading s3 object for ${name}`)
        let input: GetObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: `${REPORT_PATH}/${type}/${name}.json`,
            ResponseCacheControl: NO_CACHE
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

    async uploadFile(fileName: string, fileContent: string | Uint8Array | Buffer, contentType: string, path: string = IMAGE_PATH): Promise<boolean> {
        console.log(`Uploading file: ${fileName}`)

        const objectKey = `${path}/${fileName}`;

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

    async deleteFile(fileName: string): Promise<boolean> {
        const objectKey = `${IMAGE_PATH}/${fileName}`;
        console.log(`Deleting file: ${objectKey}`);

        const input: DeleteObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: objectKey
        };

        try {
            await this.client.send(new DeleteObjectCommand(input));
            console.log('Successfully deleted file:', objectKey);
            if (this.cache.has(objectKey)) {
                this.cache.delete(objectKey);
            }
            return true;
        } catch (err) {
            console.error('Error deleting file:', err);
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
     * Drop everything this instance has cached. The cache is shared across all
     * S3 instances, so this affects every view — it tears down the cleanup
     * interval too, and is not meant for per-component teardown.
     */
    destroy(): void {
        this.cache.destroy();
        console.log('S3 instance destroyed and cache cleaned up');
    }

    /**
     * Download an image under the images/ path. Cached for 24h by default, which
     * suits objects keyed per entity (player photos, team logos) that only change
     * when someone uploads a replacement — and uploadFile invalidates those.
     *
     * Pass useCache=false for keys that are rewritten in place, such as the
     * index-shuffled payment receipts: that skips the in-memory cache and also
     * tells the browser not to reuse its own cached response.
     */
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
            Key: objectKey,
            ...(useCache ? {} : {ResponseCacheControl: NO_CACHE})
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

    /**
     * Download a file along with its content type, used for the signed liability
     * waivers. Not cached: a re-uploaded waiver keeps the same key, so a cached
     * copy would keep showing the superseded document.
     */
    async downloadFileWithType(fileName: string, path: string = IMAGE_PATH): Promise<{data: Uint8Array, contentType: string} | undefined> {
        const objectKey = `${path}/${fileName}`;
        console.log(`Downloading file with type: ${objectKey}`)

        const input: GetObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: objectKey,
            ResponseCacheControl: NO_CACHE
        };

        try {
            const response = await this.client.send(new GetObjectCommand(input));
            const fileContent = await response.Body?.transformToByteArray();

            if (fileContent) {
                return {data: fileContent, contentType: response.ContentType ?? 'application/octet-stream'};
            }

            return undefined;
        } catch (err) {
            console.error('Error downloading file:', err);
            return undefined;
        }
    }

    /**
     * Download the blank liability-waiver template (bucket root, keyed by year).
     * Returns the file bytes + content type, or undefined when the template
     * for the current tournament year has not been uploaded yet.
     *
     * Not cached: the key is only keyed by year, so a corrected template
     * replaces it in place and a stale copy would be handed to coaches. This
     * also doubles as the availability check the modal relies on.
     */
    async downloadLiabilityWaiverTemplate(): Promise<{data: Uint8Array, contentType: string} | undefined> {
        const input: GetObjectCommandInput = {
            Bucket: GLADIADORES_BUCKET_NAME,
            Key: LIABILITY_WAIVER_TEMPLATE_KEY,
            ResponseCacheControl: NO_CACHE
        };

        try {
            const response = await this.client.send(new GetObjectCommand(input));
            const fileContent = await response.Body?.transformToByteArray();

            if (fileContent) {
                return {data: fileContent, contentType: response.ContentType ?? 'application/pdf'};
            }

            return undefined;
        } catch (err) {
            console.error('Error downloading liability waiver template:', err);
            return undefined;
        }
    }

    /**
     * Public CloudFront URL for the blank liability-waiver template so a coach
     * can share a permanent download link (keyed by year).
     */
    getLiabilityWaiverTemplateUrl(): string {
        return LIABILITY_WAIVER_TEMPLATE_CDN_URL;
    }

    static async build(credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity>): Promise<S3> {
        let client =  new S3Client({ 
            region: REGION,
            credentials: credentials
        }); 
        return new S3(client)
    }    
}