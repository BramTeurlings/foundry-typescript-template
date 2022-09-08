//Based on: https://github.com/flamewave000/dragonflagon-fvtt/blob/master/df-chat-enhance/src/archive/DFChatArchive.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class DFChatArchiveEntry {
}
export class DFChatArchive {
    static setUpdateListener(listener) {
        this._updateListener = listener;
    }
    static createArchiveFolderIfMissing() {
        return __awaiter(this, void 0, void 0, function* () {
            const folder = this.PREF_FOLDER;
            yield FilePicker.browse(this.DATA_FOLDER, folder)
                .catch((_) => __awaiter(this, void 0, void 0, function* () {
                if (!(yield FilePicker.createDirectory(this.DATA_FOLDER, folder, {})))
                    throw new Error('Could not access the archive folder: ' + folder);
            }));
        });
    }
    static _generateChatArchiveFile(id, name, userStatuses, visible) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the folder path
            const folderPath = this.PREF_FOLDER;
            // Replace special characters in name to underscores
            const safeName = name.replace(/[^ a-z0-9-_()[\]<>]/gi, '_');
            // Generate the system safe filename
            const fileName = encodeURI(`${id}_${safeName}.json`);
            // Create the File and contents
            const file = new File([JSON.stringify(userStatuses, null, '')], fileName, { type: 'application/json' });
            const response = yield FilePicker.upload(this.DATA_FOLDER, folderPath, file, { notify: false });
            if (!response.path) {
                console.error(`Could not create archive ${fileName}\nReason: ${response}`);
                throw new Error('Could not upload the archive to server: ' + fileName);
            }
            const entry = {
                id: id,
                name: name,
                visible: visible,
                filepath: response.path,
                filename: fileName
            };
            return entry;
        });
    }
    static createChatArchive(name, userStatuses, visible) {
        return __awaiter(this, void 0, void 0, function* () {
            //Todo: This will break.
            const newId = 0;
            //Set the settings id somehow later.
            // SETTINGS.set(this.PREF_CID, newId);
            const entry = yield this._generateChatArchiveFile(newId, name, userStatuses, visible);
            // const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
            // logs.push(entry);
            // await SETTINGS.set(this.PREF_LOGS, logs);
            if (this._updateListener != null)
                this._updateListener();
            return entry;
        });
    }
    static getArchiveContents(archive) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(archive.filepath);
            const data = yield response.json().catch(error => console.error(`Failed to read JSON for archive ${archive.filepath}\n${error}`));
            if (response.ok)
                return data;
            else
                throw new Error('Could not access the archive from server side: ' + archive.filepath);
        });
    }
    static updateChatArchive(archive, newChatData) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (!this.getLogs().find(x => x.id == archive.id))
            // 	throw new Error('Could not locate an archive for the given ID: ' + archive.id.toString());
            // If we are updating the contents of an archive
            if (newChatData) {
                const folderPath = this.PREF_FOLDER;
                const file = new File([JSON.stringify(newChatData)], archive.filename, { type: 'application/json' });
                const response = yield FilePicker.upload(this.DATA_FOLDER, folderPath, file, { notify: false });
                if (!response.path)
                    throw new Error('Could not upload the archive to server side: ' + archive.id.toString());
            }
            // const logs = this.getLogs();
            // const idx = logs.findIndex(x => x.id === archive.id);
            // if (idx < 0) return archive;
            // logs[idx] = archive;
            // await SETTINGS.set(DFChatArchive.PREF_LOGS, logs);
            return archive;
        });
    }
    static deleteAll() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    static deleteChatArchive(id) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
            // logs.splice(entryIdx, 1);
            // await SETTINGS.set(this.PREF_LOGS, logs);
            if (this._updateListener != null)
                this._updateListener();
        });
    }
}
DFChatArchive.PREF_LOGS = 'logs';
DFChatArchive.PREF_CID = 'currentId';
DFChatArchive.DATA_FOLDER = "data";
DFChatArchive.PREF_FOLDER = 'modules/user-activity-tracker';
DFChatArchive.FILE_NAME = 'userActivityLog';
DFChatArchive.PREF_FOLDER_SOURCE = 'archiveFolderSource';
DFChatArchive.PREF_FOLDER_MENU = 'archiveFolderMenu';
DFChatArchive._updateListener = null;
