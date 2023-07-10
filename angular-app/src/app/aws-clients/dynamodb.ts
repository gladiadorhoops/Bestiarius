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

export class DynamoDb {

    client: DynamoDBClient;

    constructor(credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity>){
       this.client = new DynamoDBClient({ 
            region: REGION,
            credentials: credentials
        });
    }

    async putItem(record: Record<string, AttributeValue>): Promise<any> {
        console.log("Storing Item")
        try {
            const input: PutItemCommandInput = { // PutItemInput
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
            console.log("Error", err);
        }
    }

    async getItem(record: Record<string, AttributeValue>): Promise<any> {
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
        } catch (err) {
            console.log("Error", err);
        }
    }

    async query(sk: string, lk: string): Promise<Record<string, AttributeValue> | undefined> {
        console.log("Reading Item")
        try {
            const input: QueryCommandInput = {
              TableName: DDB_TABLE_NAME,
              IndexName: 'sk-lk-index',
              KeyConditionExpression: 'sk = :sk and lk = :lk',
              ExpressionAttributeValues: {
                ':sk': {S: sk},
                ':lk' : {S: lk},
              },
              ReturnConsumedCapacity: "TOTAL",
            };
            const command = new QueryCommand(input);
            console.log("command: ", command)
            const response = await this.client.send(command);
            console.log("response: ", response)
            return response?.Items?.pop()
        } catch (err) {
            console.log("Error", err);
            return undefined
        }
    }

}