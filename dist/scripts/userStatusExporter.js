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
    static updateChatArchive(archive, newChatData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newChatData) {
                const folderPath = this.PREF_FOLDER;
                const file = new File([JSON.stringify(newChatData)], archive.filename, { type: 'application/json' });
                const response = yield FilePicker.upload(this.DATA_FOLDER, folderPath, file, { notify: false });
                if (!response.path)
                    throw new Error('Could not upload the archive to server side: ' + archive.id.toString());
            }
            return archive;
        });
    }
}
DFChatArchive.DATA_FOLDER = "data";
DFChatArchive.PREF_FOLDER = 'modules/user-activity-tracker';
