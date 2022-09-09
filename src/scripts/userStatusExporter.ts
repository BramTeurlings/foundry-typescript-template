//Based on: https://github.com/flamewave000/dragonflagon-fvtt/blob/master/df-chat-enhance/src/archive/DFChatArchive.ts

export class DFChatArchiveEntry {
	id: number;
	name: string;
	visible: boolean;
	filename: string;
	filepath: string;
}

export class DFChatArchive {
	private static readonly DATA_FOLDER = "data";
	static readonly PREF_FOLDER = 'modules/user-activity-tracker';

	static async updateChatArchive(archive: DFChatArchiveEntry, newChatData?: (any)[]): Promise<DFChatArchiveEntry> {
		if (newChatData) {
			const folderPath = this.PREF_FOLDER;
			const file = new File([JSON.stringify(newChatData)], archive.filename, { type: 'application/json' });
			const response: {
				path?: string;
				message?: string;
			} = <any>await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {notify: false});
			if (!response.path)
				throw new Error('Could not upload the archive to server side: ' + archive.id.toString());
		}

		return archive;
	}
}