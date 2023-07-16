import { 
    AttributeValue, 
} from "@aws-sdk/client-dynamodb";
export class DynamoDbIndex {
    pkKey: string;
    skKey: string | undefined;

    pkAttributeKey = ':pk'
    skAttributeKey = ':sk'

    constructor(pkKey: string, skKey?: string | undefined) {
        this.pkKey = pkKey;
        this.skKey = skKey;
    }

    name(): string {
        var name = `${this.pkKey}`
        if(this.skKey != undefined) name = name.concat(`-${this.skKey}`)
        name = name.concat('-index')
        return name
    }
    
    keyConditionExpression(sk: string | undefined): string {
        var keyExpresion = `${this.pkKey} = ${this.pkAttributeKey}`
        if(sk != undefined) keyExpresion = keyExpresion.concat(` and ${this.skKey} = ${this.skAttributeKey}`)
        return keyExpresion
    }
    
    getExpressionAttributeValues(pk: string, sk: string | undefined): Record<string, AttributeValue> {
        let expressionAttributeValues: Record<string, AttributeValue> = {
            [`${this.pkAttributeKey}`]: {S: pk}
        }
        if(sk != undefined) {
            expressionAttributeValues[`${this.skAttributeKey}`] = {S: sk}
        }
        return expressionAttributeValues 
    }
}