import { ArcSocketEventType, AfkStatus, renderPlayerAfkStatus } from './arc.js';
import { DFChatArchive, DFChatArchiveEntry } from './userStatusExporter.js';

let SOCKET_NAME = "module.afk-ready-check";
const socket = game.socket as SocketIOClient.Socket;
let lastMovedMouseTime = new Date();
// let afkTimeoutInMs = 1800000;
let afkTimeoutInMs = 2000;
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
    const activityStatusReplySocket = game.socket as SocketIOClient.Socket;
    const activityStatusSocket = game.socket as SocketIOClient.Socket;
    activityStatusSocket.on('module.user-activity-tracker', (request, ack) => {
        console.log("UAT - Received socket event with request name: ", request);
        updateUserStatusJson();
    });
});

Hooks.once('ready', async function() {
    //Set up mouseEventListener here.
    console.log("UAT - Ready hook received for FoundryVTT User Activity Tracker (UAT)");

    //Todo: Maybe somehow listen or act on fewer of these, right now we're getting these events at a rapid rate.
    //Capturing mouse moved events.
    window.addEventListener("mousemove", onMouseMoved);

    //Start program loop.
    let intervalId = setInterval(() => {
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
    // }, 60000)
    }, 2000)
});

function sleep(ms) {
    var start = new Date().getTime(), expire = start + ms;
    while (new Date().getTime() < expire) { }
    return;
  }

function writeUserActivityToFile(userData: any) {
    let entry = new DFChatArchiveEntry();
    entry.id = activityLogId;
    entry.filename = activityLogFileName;

    updatingJSON++;

    //Supress notifications:
    $('#notifications').hide();

    //This updates our archive entry but it shows a notification to all users that a file has been written to the drive.
    //Todo: This could overwrites the last log since we are not generating a unique entry here. It also creates a new log if it doesn't yet exist.
    DFChatArchive.updateChatArchive(entry, userData);

    //Supress notifications:
    $('#notifications').hide();

    //Sleep to ensure the file is written before we unhide notifications, this is fine since Foundry is multithreaded.
    sleep(500);

    //Ensure the missed notifications are not shown after the fact:
    $('#notifications').empty();

    updatingJSON--;

    if(updatingJSON <= 0){
        //Unhide notifications.
        $('#notifications').show();
    }
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
    socket.emit(SOCKET_NAME, { type: ArcSocketEventType.statusReport, data: { name: game.user.name, status: status } });
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
    getData();
    //Update the JSON
    updateUserStatusJson();
}

//Todo: A function that checks if all player statuses are set to AFK, and then shuts down the server.
//Todo: Make this in Python through HTTP api, or log this to the debug.log somehow.
function checkIfAllPlayersAreAfk(): boolean{
    let playerStatuses = getData();
    playerStatuses.forEach(element => {
        if(element === "notAfk"){
            return false;
        }
    });
    return true;
}

function getData(options = {}): any {
    let playerStatuses = Array.from(game.playerStatuses).map(([name, status]) => {
        return { name, status: status.toString() };
    });

    //Todo: Remove this as it takes up lots of processing and isn't needed.
    var playerStrings: Array<string> = [];
    for (let i = 0; i < playerStatuses.length; i++) {
        playerStrings.push(playerStatuses[i].name + playerStatuses[i].status);
    }
    console.log("Player statuses: " + playerStrings);
    return playerStatuses;
}

async function updateUserStatusJson(){
    //Writes user status data to a JSON file on host.
    let gameStatus = getData();
    gameStatus.unshift({ name: "world name", status: game.world.data.title.toString() })
    writeUserActivityToFile(gameStatus);

    //Todo: We don't want this unless we can track which user has sent the request.
    //This downloads the file on clients
    //saveDataToFile(JSON.stringify(getData()), "json", "userStatuses.json");
}
