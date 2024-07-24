import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { DisplayReport, Reporte, Section, Skill, Skills, TopReporte } from "../interfaces/reporte";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Scout } from '../interfaces/scout';
import { ReportType, S3 } from '../aws-clients/s3';
import { Category } from '../interfaces/player';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';
import { Role } from '../enum/Role';

@Injectable({
    providedIn: 'root'
})
export class ReporteBuilder {

    constructor(
        private formBuilder: FormBuilder
    ) {}

    async submit(ddb: DynamoDb, evaluation: FormGroup) {
        console.log('Creating Scouting report')

        let posicionSkills: Record<string, AttributeValue> = {};
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
        let categoria: string | undefined;
        
        Object.keys(evaluation.controls).forEach((key: string) => {
            let control = evaluation.get(key)
            if (control == null) return            
            if (control.value == 0 || control.value == false || control.value == '') return
            
            let keyList = key.split('-');
            let section = keyList[0]
            let skill = keyList[1]

            switch(section){
                case Section.POSICION:
                    posicionSkills[skill] = {BOOL: control.value}
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
                    if(key == 'categoria') categoria = control.value
            }            
        })

        if(playerId == undefined || scoutId == undefined || categoria == undefined) {
            throw Error(`Player ${playerId}, Scout ${scoutId}, or Category ${categoria} missing`)
        }

        let record: Record<string, AttributeValue> = {}

        record[PK_KEY] = {S: `${Role.SCOUT}.${scoutId}`}
        record[SK_KEY] = {S: `report.player.${playerId}`}

        record[Section.CATEGORIA] = {S: categoria};
        record[SPK_KEY] = {S: 'reporte'}
        record[SSK_KEY] = {S: TOURNAMENT_YEAR}
        record[CY_KEY] = {S: TOURNAMENT_YEAR};

        if( Object.keys(posicionSkills).length != 0) record[Section.POSICION] = {M: posicionSkills};        
        if( Object.keys(tiroSkills).length != 0) record[Section.TIRO] = {M: tiroSkills};
        if( Object.keys(paseSkills).length != 0) record[Section.PASE] = {M: paseSkills};
        if( Object.keys(defensaSkills).length != 0) record[Section.DEFENSA] = {M: defensaSkills};
        if( Object.keys(boteSkills).length != 0) record[Section.BOTE] = {M: boteSkills};
        if( Object.keys(jugadorSkills).length != 0) record[Section.JUGADOR] = {M: jugadorSkills};
        if( Object.keys(estiloSkills).length != 0) record[Section.ESTILO] = {M: estiloSkills};
        if( Object.keys(generalSkills).length != 0) record[Section.GENERAL] = {M: generalSkills};
        if( Object.keys(nominacionSkills).length != 0) record[Section.NOMINACION] = {M: nominacionSkills};

        console.log(`Report created by scout ${scoutId} from player ${playerId}`)

        await ddb.putItem(record)
    }

    async getReport(ddb: DynamoDb, scout: Scout, playerId: string, equipo: string, categoria: string): Promise<FormGroup> {

        let record: Record<string, AttributeValue> = {
            [PK_KEY]: {S: `${scout.role}.${scout.id}`},
            [SK_KEY]: {S: `report.player.${playerId}`}
        }

        let form = {... ReporteBuilder.defaultForm}

        form[Skills.playerDetails.scoutId] = [scout.id, Validators.required];
        form[Skills.playerDetails.scoutname] = [scout.name, Validators.required];
        form[Skills.playerDetails.playerId] = [playerId, Validators.required];
        form[Skills.playerDetails.equipo] = [equipo, Validators.required];
        form[Skills.playerDetails.categoria] = [categoria, Validators.required];

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

    async retriveEvaluationResults(s3: S3, category: Category): Promise<TopReporte> {
        let topsString = await s3.readObject(`TopPlayers-${category}`, ReportType.TOP_PLAYTERS)
        if(topsString) return JSON.parse(topsString)        
        return []
    }

    async getPlayerCombinedReport(s3: S3, playerId: string): Promise<Reporte | undefined> {
        let topsString = await s3.readObject(playerId, ReportType.PLAYER_REPORT)
        if(topsString) return JSON.parse(topsString)        
        return 
    }

    transformToDisplayReport(report: Reporte): DisplayReport {
        
        var displayReport: DisplayReport = {
            playerId: report.playerId,
            categoria: report.categoria,
            scouts: report.scouts,
        }

        Object.entries(report).forEach( (entry) => {
            let sectionName = entry[0]
            let section = entry[1]

            if(typeof section == 'string' || sectionName == 'scouts') return

            let score = section.score;
            delete section['score'];
            let type = section.type;
            delete section['type'];
            let skillList: Skill[] = [];
            
            Object.entries(section).forEach( (entry) => {
                let skill = entry[1] as Skill
                skillList.push(skill)
            })

            displayReport = {
                ...displayReport, 
                ...{ [sectionName]: {skill: skillList, score: score, type: type}}}
        })
        return displayReport
    }

    static defaultForm = {
    scoutId: ['', Validators.required],
    scoutname: ['', Validators.required],
    playerId: ['', Validators.required],
    equipo: ['', Validators.required],
    categoria: ['', Validators.required],
    [`${Section.POSICION}-${Skills.posicion.base.report}`]: [false],
    [`${Section.POSICION}-${Skills.posicion.escolta.report}`]: [false],
    [`${Section.POSICION}-${Skills.posicion.alero.report}`]: [false],
    [`${Section.POSICION}-${Skills.posicion.ala.report}`]: [false],
    [`${Section.POSICION}-${Skills.posicion.pivot.report}`]: [false],
    [`${Section.TIRO}-${Skills.tiro.colada.report}`]: [0],
    [`${Section.TIRO}-${Skills.tiro.media.report}`]: [0],
    [`${Section.TIRO}-${Skills.tiro.triples.report}`]: [0],
    [`${Section.TIRO}-${Skills.tiro.inteligencia.report}`]: [0],
    [`${Section.PASE}-${Skills.pase.vision.report}`]: [0],
    [`${Section.PASE}-${Skills.pase.creador.report}`]: [0],
    [`${Section.PASE}-${Skills.pase.perdida.report}`]: [0],
    [`${Section.PASE}-${Skills.pase.sentido.report}`]: [0],
    [`${Section.DEFENSA}-${Skills.defensa.conBola.report}`]: [0],
    [`${Section.DEFENSA}-${Skills.defensa.sinBola.report}`]: [0],
    [`${Section.DEFENSA}-${Skills.defensa.transicion.report}`]: [0],
    [`${Section.DEFENSA}-${Skills.defensa.rebote.report}`]: [0],
    [`${Section.BOTE}-${Skills.bote.control.report}`]: [0],
    [`${Section.BOTE}-${Skills.bote.presion.report}`]: [0],
    [`${Section.BOTE}-${Skills.bote.perdida.report}`]: [0],
    [`${Section.BOTE}-${Skills.bote.manoDebil.report}`]: [0],
    [`${Section.BOTE}-${Skills.bote.ritmo.report}`]: [0],
    [`${Section.JUGADOR}-${Skills.jugador.hustle.report}`]: [''],
    [`${Section.JUGADOR}-${Skills.jugador.spacing.report}`]: [0],
    [`${Section.JUGADOR}-${Skills.jugador.juegoEquipo.report}`]: [0],
    [`${Section.JUGADOR}-${Skills.jugador.tiroInteligente.report}`]: [0],
    [`${Section.JUGADOR}-${Skills.jugador.agresividad.report}`]: [0],
    [`${Section.ESTILO}-${Skills.estilo.anotador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilo.defensor.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilo.creador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilo.atletico.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilo.clutch.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilo.rebotador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilo.rol.report}`]: [false],
    [`${Section.GENERAL}-${Skills.general.gladiador.report}`]: [''],
    [`${Section.NOMINACION}-${Skills.nominacion.maximus.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.centuriones.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.scutum.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.spartacus.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.flamma.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.copellarius.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.publius.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.retiarius.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.provocator.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.colosseum.report}`]: [false],
    [`${Section.NOMINACION}-${Skills.nominacion.crixus.report}`]: [false],
  }
}