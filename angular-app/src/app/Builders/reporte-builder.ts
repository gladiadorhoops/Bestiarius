import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { Section, Skills } from "../interfaces/reporte";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Scout } from '../interfaces/scout';

@Injectable({
    providedIn: 'root'
})
export class ReporteBuilder {

    constructor(
        private formBuilder: FormBuilder
    ) {}

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

    async getReport(ddb: DynamoDb, scout: Scout, playerId: string, equipo: string): Promise<FormGroup> {

        let record: Record<string, AttributeValue> = {
            [PK_KEY]: {S: `${scout.id}`},
            [SK_KEY]: {S: `report.${playerId}`}
        }

        let form = {... ReporteBuilder.defaultForm}

        form[Skills.playerDetails.scoutId] = [scout.id, Validators.required];
        form[Skills.playerDetails.scoutname] = [scout.nombre, Validators.required];
        form[Skills.playerDetails.playerId] = [playerId, Validators.required];
        form[Skills.playerDetails.equipo] = [equipo, Validators.required];

        await ddb.getItem(record).then(
            (item) => {
                if(item == undefined) return

                Object.keys(item).forEach( (sectionName: string) => {
                    let sectionSkills = item[sectionName].M
                    
                    if( sectionSkills == undefined) {
                        console.log(`Section ${sectionName} undefined`)
                        return
                    }

                    Object.keys(sectionSkills).forEach( (skillName: string) => {
                        if(sectionSkills == undefined) return
                        let skillAttribute = sectionSkills[skillName]
                        
                        Object.entries(skillAttribute).forEach( (attribute: [key: string, value: any]) => {
                            form[`${sectionName}-${skillName}`] = attribute[1]
                        })
                    })         
                })
            }            
        )
        return this.formBuilder.group(form)        
    }

    static defaultForm = {
    scoutId: ['', Validators.required],
    scoutname: ['', Validators.required],
    playerId: ['', Validators.required],
    equipo: ['', Validators.required],
    [`${Section.POCISION}-${Skills.posiciones.base.report}`]: [false],
    [`${Section.POCISION}-${Skills.posiciones.escolta.report}`]: [false],
    [`${Section.POCISION}-${Skills.posiciones.alero.report}`]: [false],
    [`${Section.POCISION}-${Skills.posiciones.ala.report}`]: [false],
    [`${Section.POCISION}-${Skills.posiciones.pivot.report}`]: [false],
    [`${Section.TIRO}-${Skills.tiros.colada.report}`]: ['0'],
    [`${Section.TIRO}-${Skills.tiros.media.report}`]: ['0'],
    [`${Section.TIRO}-${Skills.tiros.triples.report}`]: ['0'],
    [`${Section.TIRO}-${Skills.tiros.inteligencia.report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.vision.report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.creador.report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.perdida.report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.sentido.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.conBola.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.sinBola.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.transicion.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.rebote.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.control.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.presion.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.perdida.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.manoDebil.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.ritmo.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.hustle.report}`]: [''],
    [`${Section.JUGADOR}-${Skills.jugadores.spacing.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.juegoEquipo.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.tiroInteligente.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.agresividad.report}`]: ['0'],
    [`${Section.ESTILO}-${Skills.estilos.anotador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.defensor.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.creador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.atletico.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.clutch.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.rebotador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.rol.report}`]: [false],
    [`${Section.GENERAL}-${Skills.general.gladiador.report}`]: [''],
    [`${Section.NOMINACION}-${Skills.nominacion.maximus.report}`]: [false],
  }
}