import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { QueueNames, StoredLocation } from "@tutorify/shared";
import { firstValueFrom, timeout } from "rxjs";

type UserPreferencesData = {
    classCategoryIds: string[];
    location: StoredLocation;
}
type UserPreferences = {
    userId: string,
    preferences: UserPreferencesData,
}

@Injectable()
export class UserPreferencesProxy {
    constructor(
        @Inject(QueueNames.USER_PREFERENCES) private readonly client: ClientProxy,
    ) { }

    async fetchUserPreferences(userId: string): Promise<UserPreferences> {
        // Limit as most 1s to fetch proficiencies
        try {
            return await firstValueFrom(
                this.client.send<UserPreferences>({ cmd: 'getUserPreferencesByUserId' }, userId)
                    .pipe(timeout(1000))
            );
        } catch (error) {
            // Optionally, log the error or handle it as needed.
            console.error("Error fetching tutor proficiencies:", error);
            return await Promise.resolve(null);
        }
    }
}