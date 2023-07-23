import { 
    AttributeValue, 
    DynamoDBClient, 
    PutItemCommand, 
    PutItemCommandInput, 
    GetItemCommandInput, 
    GetItemCommand,
    QueryCommandInput,
    QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"
import { REGION, DDB_TABLE_NAME } from "./constants";
import { DynamoDbIndex } from "./dynamodb-index"
import { Cognito } from './cognito';

export const PK_KEY = 'pk'
export const SK_KEY = 'sk'
export const SPK_KEY = `s${PK_KEY}`
export const SSK_KEY = `s${SK_KEY}`

export const enum IndexId {
    MAIN_GSI,
    LIST_GSI,
    SK_SPK,
}

export class DynamoDb {

    private client: DynamoDBClient;
    indexes: { [name: string]: DynamoDbIndex }

    constructor(client: DynamoDBClient){
        this.client = client
        this.indexes = {
            [IndexId.MAIN_GSI]: new DynamoDbIndex(SPK_KEY, SSK_KEY),
            [IndexId.LIST_GSI]: new DynamoDbIndex(SK_KEY),
            [IndexId.SK_SPK]: new DynamoDbIndex(SK_KEY, SPK_KEY),

        }
    }

    async putItem(record: Record<string, AttributeValue>) {
        console.log("Storing Item")
        try {
            const input: PutItemCommandInput = {
                TableName: DDB_TABLE_NAME,
                Item: record,
                ReturnValues: "NONE",
                ReturnConsumedCapacity: "TOTAL",
                ReturnItemCollectionMetrics: "SIZE",
            };
            const command = new PutItemCommand(input);

            console.log("command: ", command)
            const response = await this.client.send(command);
            console.log("response: ", response)
        } catch (err) {
            console.error("Error", err);
            throw err
        }
    }

    async getItem(record: Record<string, AttributeValue>): Promise<Record<string, AttributeValue> | undefined> {
        console.log("Reading Item")
        try {
            const input: GetItemCommandInput = {
              TableName: DDB_TABLE_NAME,
              Key: record,
              ReturnConsumedCapacity: "TOTAL",
            };
            const command = new GetItemCommand(input);
            console.log("command: ", command)
            const response = await this.client.send(command);
            console.log("response: ", response)
            return response.Item
        } catch (err) {
            console.log("Error", err);
        }
        return
    }

    async findIdQuery(pk: string, sk: string | undefined): Promise<Record<string, AttributeValue> | undefined> {        
        let item: Record<string, AttributeValue> | undefined
        await this.query(pk, sk,  IndexId.MAIN_GSI).then(
            (items) => {
                if(items != undefined) item = items.pop()
                else item = undefined
            }
        )
        return item
    }

    async listQuery(pk: string, sk?: string | undefined): Promise<Record<string, AttributeValue>[]> {
        let resultItems: Record<string, AttributeValue>[] = []
        let index = sk ? IndexId.SK_SPK : IndexId.LIST_GSI
        let results = await this.query(pk, sk, index).then( (items) => { return items } )
        if(results != undefined) resultItems = resultItems.concat(results)
        return resultItems
    }

    private async query(pk: string, sk: string | undefined, index: IndexId): Promise<Record<string, AttributeValue>[] | undefined> {
        console.log(`Reading Item (pk: ${pk}, sk: ${sk})`)
        
        try {
            const input: QueryCommandInput = {
              TableName: DDB_TABLE_NAME,
              IndexName: this.indexes[index].name(),
              KeyConditionExpression: this.indexes[index].keyConditionExpression(sk),
              ExpressionAttributeValues: this.indexes[index].getExpressionAttributeValues(pk, sk),
              ReturnConsumedCapacity: "TOTAL",
            };
            const command = new QueryCommand(input);
            console.log("command: ", command)
            const response = await this.client.send(command);
            console.log("response: ", response)
            return response?.Items
        } catch (err) {
            console.log("Error", err);
            return undefined
        }
    }

    static async build(username: string, password: string): Promise<DynamoDb> {
        let credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity> | undefined
        await Cognito.getAwsCredentials(username, password).then(
            (creds) => {
                if (creds == undefined) return
                credentials = creds            
            }
        )
        let client =  new DynamoDBClient({ 
            region: REGION,
            credentials: credentials
        }); 
        return new DynamoDb(client)
    }
}