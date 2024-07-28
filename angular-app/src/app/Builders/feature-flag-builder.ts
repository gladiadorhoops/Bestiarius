import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Feature } from '../enum/feature-flag';
import { FeatureFlag } from '../interfaces/feature-flag';


@Injectable({
    providedIn: 'root'
})
export class FeatureFlagBuilder {

    async setFeatureValue(ddb: DynamoDb, feature: Feature, value: boolean) {
        console.log(`Setting feature flag ${feature} value: ${value}`);
        let key = {
            [PK_KEY]: {S: `features`},
            [SK_KEY]: {S: `data`}
        };
        let updateExpression = 'SET #flag = :val';
        let expressionAttributeNames: Record<string, string> = {
            '#flag': `${feature}`,
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':val': {BOOL: value},
        };

        await ddb.updateItem(key, updateExpression, expressionAttributeNames, expressionAttributeValues);
    }

    async getFeatureFlags(ddb: DynamoDb): Promise<FeatureFlag | undefined> {
        console.log(`Getting feature flags`);

        let record = {
            [PK_KEY]: {S: `features`},
            [SK_KEY]: {S: `data`}
        };
        let item = await ddb.getItem(record);

        if(item === undefined) return;

        return {
            [Feature.EDIT_TEAMS]: item[Feature.EDIT_TEAMS] ? item[Feature.EDIT_TEAMS].BOOL! : false,
            [Feature.SHOW_AWARDS]: item[Feature.SHOW_AWARDS] ? item[Feature.SHOW_AWARDS].BOOL! : false,
            [Feature.SHOW_BRACKETS]: item[Feature.SHOW_BRACKETS] ? item[Feature.SHOW_BRACKETS].BOOL! : false,
            [Feature.SHOW_GROUPS]: item[Feature.SHOW_GROUPS] ? item[Feature.SHOW_GROUPS].BOOL! : false,
            [Feature.SHOW_STANDINGS]: item[Feature.SHOW_STANDINGS] ? item[Feature.SHOW_STANDINGS].BOOL! : false,
            [Feature.SHOW_PARTICIPANTS]: item[Feature.SHOW_PARTICIPANTS] ? item[Feature.SHOW_PARTICIPANTS].BOOL! : false
        };
    }
}