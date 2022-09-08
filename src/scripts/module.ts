import { ArcSocketEventType, AfkStatus, renderPlayerAfkStatus } from './arc.js';
import { DFChatArchive, DFChatArchiveEntry } from './userStatusExporter.js';
import * as fs from 'node:fs';

let SOCKET_NAME = "module.afk-ready-check";
const socket = game.socket as SocketIOClient.Socket;
let lastMovedMouseTime = new Date();
//let afkTimeoutInMs = 1800000;
let afkTimeoutInMs = 1800;
let mouseMoveEventSkipperCount = 0;

//Todo: This name is hard-coded because we only want to use one specific file. Save this in a nice location and make it consistent with userStatusExporter.ts
let activityLogFileName = "0_UserActivityLog.json";
let activityLogBaseFileName = "UserActivityLog";
let activityLogId = 0;

Hooks.once('init', async function() {
    //Unused for now.
    console.log("UAT - Initializing activity tracker...")
});

Hooks.once('canvasReady', async () => {
    console.log("UAT - Setting up socket...");

    //Try to create a user status entry:
    //Todo: This could either return an error or overwrite the last log since we are not generating a unique entry here. Verify which one.
    //DFChatArchive.createChatArchive(activityLogBaseFileName, getData(), false);

    //Registering our socket to broadcast activity data to HTTP clients.
    const activityStatusReplySocket = game.socket as SocketIOClient.Socket;
    const activityStatusSocket = game.socket as SocketIOClient.Socket;
    activityStatusSocket.on('module.user-activity-tracker', (request, ack) => {
        //ack = typeof ack == "function" ? ack : () => {};

        console.log("UAT - Received socket event with request name: ", request);
        //Todo: Log data to file here:
        writeUserActivityToFile(JSON.stringify(getData()));
        // let playerStatuses = getData();
        // fetch('modules/user-activity-tracker/UserActivity.txt', {
        //     method: 'POST', // or 'PUT'
        //     headers: {
        //         // 'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(playerStatuses),
        // })
        // .then((response) => response.json())
        // .then((data) => {
        //     console.log("UAT - Wrote user activity data to UserActivity.txt!", data);
        // })
        // .catch((error) => {
        //     console.error(console.error("UAT - An error has occurred while attempting user activity data to file: " + error));
        // });

        // const response = getData();
        //ack({status: "test response"});
        // activityStatusReplySocket.emit('module.user-activity-tracker-reply', response, response, (response) => {
        //     console.log("Reply has been received!");
        // });
        // console.log("Emitted reply on socket!");
    });
});

Hooks.once('ready', async function() {
    //Set up mouseEventListener here.
    console.log("UAT - Ready hook received for FoundryVTT User Activity Tracker (UAT)");

    saveDataToFile(JSON.stringify(getData()), "json", "userStatuses.json");

    //Todo: Maybe somehow listen or act on fewer of these, right now we're getting these events at a rapid rate.
    //Capturing mouse moved events.
    //canvas.controls._onMouseMove = (ev) => canvas.controls._mouseMove(ev);
    window.addEventListener("mousemove", onMouseMoved);

    //Start program loop.
    let intervalId = setInterval(() => {
        //Check if the current time is X minutes greater than the lastMovedMouseTime.
        let currentTime = new Date();
        if(currentTime.getTime() > (lastMovedMouseTime.getTime() + afkTimeoutInMs)){
            //If the time passed between now and the previous user update is greater than the adkTimeoutInMs, mark the user as AFK.
            setPlayerStatus(true);
        }else{
            //User is still active if he has moved his mouse recently.
            setPlayerStatus(false);
        }
    //}, 60000)
    }, 2000)
});

function writeUserActivityToFile(userData: string) {
    let entry = new DFChatArchiveEntry();
    entry.id = activityLogId;
    entry.filename = activityLogFileName;

    //This should update our archive entry.
    //DFChatArchive.updateChatArchive(entry, getData());

    // fs.writeFile('UserActivity.txt', userData,  function(err) {
    //     if (err) {
    //         return console.error("UAT - An error has occurred while attempting user activity data to file: " + err);
    //     }
    //     console.log("UAT - Wrote user activity data to UserActivity.txt!");
    // });
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
        sendStatusReportSocketEvent(AfkStatus.notAfk);
        game.playerStatuses.set(game.user.name, AfkStatus.notAfk);
        renderPlayerAfkStatus(game.user.name, AfkStatus.notAfk);
    }

    //Log the current user statuses.
    getData();
}

function getPlayerStatus(player): any{
    
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