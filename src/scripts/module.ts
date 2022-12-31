import { ArcSocketEventType, AfkStatus, renderPlayerAfkStatus } from './arc.js';
import { DFChatArchive, DFChatArchiveEntry } from './userStatusExporter.js';

let AFK_READY_CHECK_SOCKET_NAME = "module.afk-ready-check";
let STATUS_SOCKET_NAME = "module.user-activity-tracker-status";
let TIMESTAMP_SOCKET_NAME = "module.user-activity-tracker-timestamp";
const socket = game.socket as SocketIOClient.Socket;
let lastMovedMouseTime = new Date();
let afkTimeoutInMs = 1800000;
// let afkTimeoutInMs = 2000;
let updatingJSON = 0;
let mouseMoveEventSkipperCount = 0;

//Todo: This name is hard-coded because we only want to use one specific file. Save this in a nice location and make it consistent with userStatusExporter.ts
let activityLogFileName = "UserActivityLog.json";
let activityLogId = 0;

Hooks.once('init', async function() {
    //Unused for now.
    console.log("UAT - Initializing activity tracker...")
});

Hooks.once('canvasReady', async () => {
    console.log("UAT - Setting up socket...");

    //Registering our socket to broadcast activity data to HTTP clients.
    const activityStatusSocket = game.socket as SocketIOClient.Socket;
    activityStatusSocket.on('module.user-activity-tracker', (request, ack) => {
        console.log("UAT - Received socket event with request name: ", request);
        updateUserStatusJson();
    });
    activityStatusSocket.on(STATUS_SOCKET_NAME, (request, ack) => {
        const name = request.data.name;
        const status = request.data.status;
        game.playerStatuses.set(name, status);
    });
    activityStatusSocket.on(TIMESTAMP_SOCKET_NAME, (request, ack) => {
        const name = request.data.name;
        const timestamp = request.data.timestamp;
        game.playerTimestamps.set(name, timestamp);
    });

    console.log("UAT - Populating game user data...");
    initializeAllUserGameData();
    game.playerStatuses.set(game.user.name, AfkStatus.notAfk);
    game.playerTimestamps.set(game.user.name, new Date());
    updateUserStatusJson();
});

Hooks.once('ready', async function() {
    //Set up mouseEventListener here.
    console.log("UAT - Ready hook received for FoundryVTT User Activity Tracker (UAT)");

    //Todo: Maybe somehow listen or act on fewer of these, right now we're getting these events at a rapid rate.
    //Capturing mouse moved events.
    window.addEventListener("mousemove", onMouseMoved);

    //Start program loop.
    let intervalId = setInterval(() => {
        //Todo: This doesn't work 100% of the time, we should listen for when the app has dispatched the notifications somehow and suppress those specifically.
        //Ensure the notification queue is cleared only after the JSON file has been updated.
        if(updatingJSON > 0){
            //Ensure the missed notifications are not shown after the fact:
            $('#notifications').empty();
            updatingJSON = 0;
        }

        //Ensure the notification state is nominal here.
        $('#notifications').show();

        //Todo: Make this AFK time a user setting.
        //Check if the current time is X minutes greater than the lastMovedMouseTime.
        let currentTime = new Date();
        if(currentTime.getTime() > (lastMovedMouseTime.getTime() + afkTimeoutInMs)){
            //If the time passed between now and the previous user update is greater than the adkTimeoutInMs, mark the user as AFK.
            setPlayerStatus(true);
        }else{
            //User is still active if he has moved his mouse recently.
            setPlayerStatus(false);
        }

        //Todo: Update last moved mouse time:
        setplayerTimestamp(lastMovedMouseTime);

        //Update the JSON
        updateUserStatusJson();
    }, 30000)
});

function initializeAllUserGameData() {
    if (!game.playerStatuses) {
        game.playerStatuses = new Map<string, AfkStatus>();
    }
    if (!game.playerTimestamps) {
        game.playerTimestamps = new Map<string, Date>();
    }
}

function sleep(ms) {
    var start = new Date().getTime(), expire = start + ms;
    while (new Date().getTime() < expire) { }
    return;
  }

function writeUserActivityToFile(userData: any) {
    let entry = new DFChatArchiveEntry();
    entry.id = activityLogId;
    entry.filename = activityLogFileName;

    //Supress notifications:
    $('#notifications').hide();
    updatingJSON = 1;

    //This updates our archive entry but it shows a notification to all users that a file has been written to the drive.
    //Todo: This could overwrites the last log since we are not generating a unique entry here. It also creates a new log if it doesn't yet exist.
    DFChatArchive.updateChatArchive(entry, userData);
}

function onMouseMoved(){
    //Mouse has moved.
    if(mouseMoveEventSkipperCount > 30){
        console.log("UAT - User mouse moved, updating last time active...");
        lastMovedMouseTime = new Date(); 
        mouseMoveEventSkipperCount = 0;
    }else{
        mouseMoveEventSkipperCount++;
    }
}

function sendStatusReportSocketEvent(status: AfkStatus): void {
    const socket = game.socket as SocketIOClient.Socket;
    socket.emit(AFK_READY_CHECK_SOCKET_NAME, { type: ArcSocketEventType.statusReport, data: { name: game.user.name, status: status } });
    socket.emit(STATUS_SOCKET_NAME, { type: ArcSocketEventType.statusReport, data: { name: game.user.name, status: status } });
}

function sendTimestampReportSocketEvent(timestamp: Date): void {
    const socket = game.socket as SocketIOClient.Socket;
    socket.emit(TIMESTAMP_SOCKET_NAME, { type: ArcSocketEventType.statusReport, data: { name: game.user.name, timestamp: timestamp } });
}

function setPlayerStatus(isAfk: boolean){
    let playerStatusesArray = Array.from(game.playerStatuses).map(([name, status]) => {
        return { name, status: status.toString() };
      });

    if(isAfk){
        for (let i = 0; i < playerStatusesArray.length; i++) {
            //Check username and activity status.
            if(playerStatusesArray[i].name == game.user.name && playerStatusesArray[i].status == AfkStatus.afk.toString()){
                //User is AFK! No need to update!
                return;
            }
        }

        console.log("UAT - Set player status to AFK");
        //Notify AFK status UI
        sendStatusReportSocketEvent(AfkStatus.afk);
        game.playerStatuses.set(game.user.name, AfkStatus.afk);
        renderPlayerAfkStatus(game.user.name, AfkStatus.afk);
    }else{
        for (let i = 0; i < playerStatusesArray.length; i++) {
            //Check username and activity status.
            if(playerStatusesArray[i].name == game.user.name && playerStatusesArray[i].status == AfkStatus.notAfk.toString()){
                //User is ACTIVE! No need to update!
                return;
            }
        }

        console.log("UAT - Set player status to ACTIVE");
        //Notify AFK status UI
        sendStatusReportSocketEvent(AfkStatus.notAfk);
        game.playerStatuses.set(game.user.name, AfkStatus.notAfk);
        renderPlayerAfkStatus(game.user.name, AfkStatus.notAfk);
    }

    //Log the current user statuses.
    logUserData();
}

function setplayerTimestamp(timestamp: Date) {
    //Update the timestamp for the currently logged in user.
    game.playerTimestamps.set(game.user.name, timestamp);
    sendTimestampReportSocketEvent(timestamp);
}

//Todo: A function that checks if all player statuses are set to AFK, and then shuts down the server.
//Todo: Make this in Python through HTTP api, or log this to the debug.log somehow.
function checkIfAllPlayersAreAfk(): boolean{
    let playerStatuses = getUserStatus();
    playerStatuses.forEach(element => {
        if(element === "notAfk"){
            return false;
        }
    });
    return true;
}

function getUserStatus(options = {}): any {
    let playerStatuses = Array.from(game.playerStatuses).map(([name, status]) => {
        return { name, status: status.toString() };
    });

    return playerStatuses;
}

function getUserTimestamp(options = {}): any {
    let playerStatuses = Array.from(game.playerTimestamps).map(([name, timestamp]) => {
        return { name, timestamp: timestamp };
    });

    return playerStatuses;
}

function getCombinedUserData(options = {}): any {
    type UserData = { status: string; timestamp: Date };
    let statuses = getUserStatus();
    let timestamps = getUserTimestamp();
    let combined : Map<string, UserData> = new Map<string, UserData>();

    for(let statusIndex = 0; statusIndex < statuses.length; statusIndex++){
        for(let timestampIndex = 0; timestampIndex < timestamps.length; timestampIndex++){
            if(statuses[statusIndex].name == timestamps[timestampIndex].name) {
                //Names match, append data to new map.
                combined.set(statuses[statusIndex].name, {status: statuses[statusIndex].status, timestamp: timestamps[timestampIndex].timestamp});
            }
        }
    }

    let result = Array.from(combined).map(([name, data]) => {
        return {name, status: data.status, timestamp: data.timestamp}
    });

    return result;
}

function logUserData() {
    let playerStatuses = getUserStatus();

    //Todo: Remove this as it takes up lots of processing and isn't needed.
    var playerStrings: Array<string> = [];
    for (let i = 0; i < playerStatuses.length; i++) {
        playerStrings.push(playerStatuses[i].name + playerStatuses[i].status);
    }

    console.log("Player statuses: " + playerStrings);
}

async function updateUserStatusJson(){
    //Writes user status data to a JSON file on host.
    let gameStatus = getCombinedUserData();
    gameStatus.unshift({ name: "world name", status: game.world.data.title.toString() })
    writeUserActivityToFile(gameStatus);

    //Todo: We don't want this unless we can track which user has sent the request.
    //This downloads the file on clients
    //saveDataToFile(JSON.stringify(getData()), "json", "userStatuses.json");
}
