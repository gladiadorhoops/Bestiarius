import { 
    AttributeValue, 
    DynamoDBClient, 
    PutItemCommand, 
    PutItemCommandInput, 
    GetItemCommandInput, 
    GetItemCommand,
    QueryCommandInput,
    QueryCommand,
    DeleteItemCommandInput,
    DeleteItemCommand,
    BatchGetItemCommandInput,
    BatchGetItemCommand,
    UpdateItemCommandInput,
    UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { AwsCredentialIdentity, Provider } from "@aws-sdk/types"
import { REGION, DDB_TABLE_NAME, CURRENT_YEAR } from "./constants";
import { DynamoDbIndex } from "./dynamodb-index"

export const PK_KEY = 'pk'
export const SK_KEY = 'sk'
export const CY_KEY = 'cy'
export const SPK_KEY = `s${PK_KEY}`
export const SSK_KEY = `s${SK_KEY}`

export const enum IndexId {
    MAIN_GSI,
    LIST_GSI,
    SK_SPK,
    SK_SSK,
}

export class DynamoDb {

    private client: DynamoDBClient;
    indexes: { [name: string]: DynamoDbIndex }

    constructor(client: DynamoDBClient){
        this.client = client
        this.indexes = {
            [IndexId.MAIN_GSI]: new DynamoDbIndex(SPK_KEY, SSK_KEY),
            [IndexId.LIST_GSI]: new DynamoDbIndex(SK_KEY, CY_KEY),
            [IndexId.SK_SPK]: new DynamoDbIndex(SK_KEY, SPK_KEY),
            [IndexId.SK_SSK]: new DynamoDbIndex(SK_KEY, SSK_KEY),
        }
    }

    async putItem(record: Record<string, AttributeValue>) {
        try {
            const input: PutItemCommandInput = {
                TableName: DDB_TABLE_NAME,
                Item: record,
                ReturnValues: "NONE",
                ReturnConsumedCapacity: "TOTAL",
                ReturnItemCollectionMetrics: "SIZE",
            };
            const command = new PutItemCommand(input);

            const response = await this.client.send(command);
        } catch (err) {
            console.error("Error", err);
            throw err
        }
    }

    async updateItem(key: Record<string, AttributeValue>, updateExpression: string, expressionAttributeNames: Record<string, string>, expressionAttributeValues:  Record<string, AttributeValue>) {
        try {
            const input: UpdateItemCommandInput = {
                TableName: DDB_TABLE_NAME,
                Key: key,
                UpdateExpression: updateExpression, 
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: "NONE",
                ReturnConsumedCapacity: "TOTAL",
                ReturnItemCollectionMetrics: "SIZE",
            };
            const command = new UpdateItemCommand(input);
            console.log('Update Item command', command)
            const response = await this.client.send(command);
            console.log('Update Item response', response)
        } catch (err) {
            console.error("Error", err);
            throw err
        }
    }

    async getItem(record: Record<string, AttributeValue>): Promise<Record<string, AttributeValue> | undefined> {
        try {
            const input: GetItemCommandInput = {
              TableName: DDB_TABLE_NAME,
              Key: record,
              ReturnConsumedCapacity: "TOTAL",
            };
            const command = new GetItemCommand(input);
            const response = await this.client.send(command);
            return response.Item
        } catch (err) {
            console.log("Error", err);
        }
        return
    }

    async batchGetItem(records: Record<string, AttributeValue>[]): Promise<Record<string, AttributeValue>[]> {
        try {
            const input: BatchGetItemCommandInput = {
                RequestItems: {
                    [DDB_TABLE_NAME]: {
                        Keys: records,
                    },                  
                },         
                ReturnConsumedCapacity: "TOTAL",
            };
            const command = new BatchGetItemCommand(input);
            const response = await this.client.send(command);
            let items = response.Responses
            if(items) return items[DDB_TABLE_NAME]
            else return []
        } catch (err) {
            console.log("Error", err);
        }
        return []
    }

    async deleteItem(record: Record<string, AttributeValue>) {
        try {
            const input: DeleteItemCommandInput = {
              TableName: DDB_TABLE_NAME,
              Key: record,
              ReturnConsumedCapacity: "TOTAL",
            };
            const command = new DeleteItemCommand(input);
            const response = await this.client.send(command);
            console.log('Delete response', response)
        } catch (err) {
            console.log("Error", err);
        }
    }

    async findIdQuery(pk: string, sk: string | undefined): Promise<Record<string, AttributeValue> | undefined> {        
        let item: Record<string, AttributeValue> | undefined
        let items = await this.simpleQuery(pk, sk,  IndexId.MAIN_GSI);
        if(items != undefined) item = items.pop();
        else item = undefined;
        return item;
    }

    async listQuery(pk: string, sk?: string | undefined): Promise<Record<string, AttributeValue>[]> {
        let resultItems: Record<string, AttributeValue>[] = [];
        let index = sk ? IndexId.SK_SPK : IndexId.LIST_GSI;
        let results = await this.simpleQuery(pk, sk, index);
        if(results != undefined) resultItems = resultItems.concat(results);
        return resultItems;
    }

    async listSecondaryQuery(sk: string, ssk?: string | undefined): Promise<Record<string, AttributeValue>[]> {
        let resultItems: Record<string, AttributeValue>[] = [];
        let results = await this.simpleQuery(sk, ssk, IndexId.SK_SSK);
        if(results != undefined) resultItems = resultItems.concat(results);
        return resultItems;
    }

    async listByYearQuery(sk: string, cy: string = CURRENT_YEAR): Promise<Record<string, AttributeValue>[]> {
        let resultItems: Record<string, AttributeValue>[] = [];
        let results = await this.simpleQuery(sk, cy, IndexId.LIST_GSI);
        if(results != undefined) resultItems = resultItems.concat(results);
        return resultItems;
    }

    private async simpleQuery(pk: string, sk: string | undefined, index: IndexId): Promise<Record<string, AttributeValue>[] | undefined> {
        console.log(`Reading Item (pk: ${pk}, sk: ${sk})`)

        return await this.query(
            index, 
            this.indexes[index].keyConditionExpression(sk),
            this.indexes[index].getExpressionAttributeValues(pk, sk),            
        )
    }

    async query(index: IndexId, keyConditionExpression: string, expressionAttributeValues:  Record<string, AttributeValue>, filterExpression: string | undefined = undefined, expressionAttributeNames: Record<string, string> | undefined = undefined): Promise<Record<string, AttributeValue>[]> {        
        try {
            const input: QueryCommandInput = {
              TableName: DDB_TABLE_NAME,
              IndexName: this.indexes[index].name(),
              KeyConditionExpression: keyConditionExpression,
              FilterExpression: filterExpression,
              ExpressionAttributeNames: expressionAttributeNames,
              ExpressionAttributeValues: expressionAttributeValues,
              ReturnConsumedCapacity: "TOTAL",
            };
            const command = new QueryCommand(input);
            console.log('query command: ', command)
            const response = await this.client.send(command);
            return response?.Items ? response?.Items : []
        } catch (err) {
            console.log("Error", err);
            return []
        }
    }

    static async build(credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity>): Promise<DynamoDb> {
        let client =  new DynamoDBClient({ 
            region: REGION,
            credentials: credentials
        }); 
        return new DynamoDb(client)
    }

    static convertToStringList(attributeValueList: AttributeValue[]): string[] {
        let values: string[] = []
        attributeValueList.forEach(
            (value: AttributeValue) => {
            values.push(value.S!)
        });
        return values
    }

    static convertFromStringList(valueList: string[]): AttributeValue[] {
        let attributeValueList: AttributeValue[] = []
        valueList.forEach(
            (value: string) => {
                attributeValueList.push({S: value})
        });
        return attributeValueList
    }
}