import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { Section } from "../interfaces/reporte";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { FormGroup } from '@angular/forms';

@Injectable({
    providedIn: 'root'
})
export class ReporteBuilder {

    constructor() {}

    async submit(ddb: DynamoDb, evaluation: FormGroup) {   

        console.log('Creating Scouting report')

        let pocisionSkills: Record<string, AttributeValue> = {};
        let tiroSkills: Record<string, AttributeValue> = {};
        let paseSkills: Record<string, AttributeValue> = {};
        let defensaSkills: Record<string, AttributeValue> = {};
        let boteSkills: Record<string, AttributeValue> = {};
        let jugadorSkills: Record<string, AttributeValue> = {};
        let estiloSkills: Record<string, AttributeValue> = {};
        let generalSkills: Record<string, AttributeValue> = {};
        let nominacionSkills: Record<string, AttributeValue> = {};

        let scoutId: string | undefined;
        let playerId: string | undefined;
        
        Object.keys(evaluation.controls).forEach((key: string) => {
            let control = evaluation.get(key)
            if (control == null) return
            
            let keyList = key.split('-');
            let section = keyList[0]
            let skill = keyList[1]

            switch(section){
                case Section.POCISION:
                    pocisionSkills[skill] = {BOOL: control.value}
                    break;
                case Section.TIRO: 
                    tiroSkills[skill] = {N: control.value};
                    break;
                case Section.PASE:
                    paseSkills[skill] = {N: control.value};
                    break;
                case Section.DEFENSA:
                    defensaSkills[skill] = {N: control.value};
                    break;
                case Section.BOTE:
                    boteSkills[skill] = {N: control.value};
                    break;
                case Section.JUGADOR:
                    jugadorSkills[skill] = {N: control.value};
                    break;
                case Section.ESTILO:
                    estiloSkills[skill] = {BOOL: control.value};
                    break;
                case Section.GENERAL:
                    generalSkills[skill] = {N: control.value};
                    break;
                case Section.NOMINACION:
                    nominacionSkills[skill] = {BOOL: control.value};
                    break;    
                default:
                    if(key == 'scoutId') scoutId = control.value
                    if(key == 'playerId') playerId = control.value
            }            
        })

        if(playerId == undefined || scoutId == undefined) {
            console.error(`Player ${playerId} and/or Scout ${scoutId} missing`)
            return
        }

        let record: Record<string, AttributeValue> = {}

        record[PK_KEY] = {S: `${scoutId}`}
        record[SK_KEY] = {S: `report.${playerId}`}

        record[Section.POCISION] = {M: pocisionSkills};
        record[Section.TIRO] = {M: tiroSkills};
        record[Section.PASE] = {M: paseSkills};
        record[Section.DEFENSA] = {M: defensaSkills};
        record[Section.BOTE] = {M: boteSkills};
        record[Section.JUGADOR] = {M: jugadorSkills};
        record[Section.ESTILO] = {M: estiloSkills};
        record[Section.GENERAL] = {M: generalSkills};
        record[Section.NOMINACION] = {M: nominacionSkills};

        console.log(`Report created by scout ${scoutId} from player ${playerId}`)

        await ddb.putItem(record)
    }
}