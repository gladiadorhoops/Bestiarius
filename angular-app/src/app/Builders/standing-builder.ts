import { Injectable } from '@angular/core';
import { ReportType, S3 } from '../aws-clients/s3';
import { GroupStanding } from '../interfaces/standing';

// readObject appends the extension, so this reads standings.json.
const STANDINGS_FILE_NAME = 'standings'

@Injectable({
    providedIn: 'root'
})
export class StandingBuilder {

    /**
     * Read the group-stage standings the Retiarius CreateStandings workflow
     * publishes for the current tournament year — every category and group in one
     * file. Returns an empty list when the workflow hasn't run yet.
     */
    async getStandings(s3: S3): Promise<GroupStanding[]> {
        let standingsString = await s3.readObject(STANDINGS_FILE_NAME, ReportType.STANDINGS)
        if (!standingsString) return []

        try {
            let standings: GroupStanding[] = JSON.parse(standingsString)
            return standings
        } catch (err) {
            console.error('Error parsing standings file', err)
            return []
        }
    }
}
