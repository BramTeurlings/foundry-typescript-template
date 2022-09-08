//Based on: https://github.com/flamewave000/dragonflagon-fvtt/blob/master/df-chat-enhance/src/archive/DFChatArchive.ts

export class DFChatArchiveEntry {
	id: number;
	name: string;
	visible: boolean;
	filename: string;
	filepath: string;
}

export class DFChatArchive {
	private static readonly PREF_LOGS = 'logs';
	private static readonly PREF_CID = 'currentId';
	private static readonly DATA_FOLDER = "data";
	static readonly PREF_FOLDER = 'modules/user-activity-tracker';
	static readonly FILE_NAME = 'userActivityLog';
	static readonly PREF_FOLDER_SOURCE = 'archiveFolderSource';
	private static readonly PREF_FOLDER_MENU = 'archiveFolderMenu';
	private static _updateListener: () => void = null;

	static setUpdateListener(listener: () => void) {
		this._updateListener = listener;
	}

	private static async createArchiveFolderIfMissing() {
		const folder: string = this.PREF_FOLDER;
		await FilePicker.browse(this.DATA_FOLDER, folder)
			.catch(async _ => {
				if (!await FilePicker.createDirectory(this.DATA_FOLDER, folder, {}))
					throw new Error('Could not access the archive folder: ' + folder);
			});
	}

	private static async _generateChatArchiveFile(id: number, name: string, userStatuses: any, visible: boolean): Promise<DFChatArchiveEntry> {
		// Get the folder path
		const folderPath = this.PREF_FOLDER;
		// Replace special characters in name to underscores
		const safeName = name.replace(/[^ a-z0-9-_()[\]<>]/gi, '_');
		// Generate the system safe filename
		const fileName = encodeURI(`${id}_${safeName}.json`);
		// Create the File and contents
		const file = new File([JSON.stringify(userStatuses, null, '')], fileName, { type: 'application/json' });
		const response: { path?: string; message?: string } = <any>await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {notify: false});
		if (!response.path) {
			console.error(`Could not create archive ${fileName}\nReason: ${response}`);
			throw new Error('Could not upload the archive to server: ' + fileName);
		}
		const entry: DFChatArchiveEntry = {
			id: id,
			name: name,
			visible: visible,
			filepath: response.path,
			filename: fileName
		};
		return entry;
	}

	static async createChatArchive(name: string, userStatuses: any, visible: boolean): Promise<DFChatArchiveEntry> {
		//Todo: This will break.
		const newId = 0;
		//Set the settings id somehow later.
		// SETTINGS.set(this.PREF_CID, newId);
		const entry = await this._generateChatArchiveFile(newId, name, userStatuses, visible);
		// const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		// logs.push(entry);
		// await SETTINGS.set(this.PREF_LOGS, logs);
		if (this._updateListener != null)
			this._updateListener();
		return entry;
	}

	static async getArchiveContents(archive: DFChatArchiveEntry): Promise<(string)[]> {
		const response = await fetch(archive.filepath);
		const data = await response.json().catch(error => console.error(`Failed to read JSON for archive ${archive.filepath}\n${error}`));
		if (response.ok)
			return data as (string)[];
		else
			throw new Error('Could not access the archive from server side: ' + archive.filepath);
	}

	static async updateChatArchive(archive: DFChatArchiveEntry, newChatData?: (any)[]): Promise<DFChatArchiveEntry> {
		// if (!this.getLogs().find(x => x.id == archive.id))
		// 	throw new Error('Could not locate an archive for the given ID: ' + archive.id.toString());
		// If we are updating the contents of an archive
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
		// const logs = this.getLogs();
		// const idx = logs.findIndex(x => x.id === archive.id);
		// if (idx < 0) return archive;
		// logs[idx] = archive;
		// await SETTINGS.set(DFChatArchive.PREF_LOGS, logs);
		return archive;
	}

	static async deleteAll() {
		const folderPath = this.PREF_FOLDER;
		// const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		// Can not delete files currently, truncate instead to make filtering easier.
		// await Promise.all(archive => {
		// 	const file = new File([''], archive.filename, { type: 'application/json' });
		// 	return FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		// });
		// await SETTINGS.set(this.PREF_LOGS, []);
		if (this._updateListener != null)
			this._updateListener();
	}

	static async deleteChatArchive(id: number) {
		const folderPath = this.PREF_FOLDER;
		// const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		// const entryIdx = logs.findIndex(x => x.id === id);
		// if (entryIdx < 0) {
		// 	console.error(`Could not find entry for ID#${id}`);
		// 	return;
		// }
		// const entry = logs[entryIdx];
		// Cannot delete file currently, instead truncate the file and move along.
		const file = new File([''], this.FILE_NAME, { type: 'application/json' });
		await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		// logs.splice(entryIdx, 1);
		// await SETTINGS.set(this.PREF_LOGS, logs);
		if (this._updateListener != null)
			this._updateListener();
	}
}