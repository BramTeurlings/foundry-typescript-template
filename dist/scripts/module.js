var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArcSocketEventType, AfkStatus, renderPlayerAfkStatus } from './arc.js';
let SOCKET_NAME = "module.afk-ready-check";
const socket = game.socket;
let lastMovedMouseTime = new Date();
//let afkTimeoutInMs = 1800000;
let afkTimeoutInMs = 1800;
let mouseMoveEventSkipperCount = 0;
Hooks.once('init', function () {
    return __awaiter(this, void 0, void 0, function* () {
        //Unused for now.
        console.log("UAT - Initializing activity tracker...");
    });
});
Hooks.once('ready', function () {
    return __awaiter(this, void 0, void 0, function* () {
        //Set up mouseEventListener here.
        console.log("UAT - Ready hook received for FoundryVTT User Activity Tracker (UAT)");
        //Todo: Maybe somehow listen or act on fewer of these, right now we're getting these events at a rapid rate.
        //Capturing mouse moved events.
        //canvas.controls._onMouseMove = (ev) => canvas.controls._mouseMove(ev);
        window.addEventListener("mousemove", onMouseMoved);
        //Start program loop.
        let intervalId = setInterval(() => {
            //Check if the current time is X minutes greater than the lastMovedMouseTime.
            let currentTime = new Date();
            if (currentTime.getTime() > (lastMovedMouseTime.getTime() + afkTimeoutInMs)) {
                //If the time passed between now and the previous user update is greater than the adkTimeoutInMs, mark the user as AFK.
                setPlayerStatus(true);
            }
            else {
                //User is still active if he has moved his mouse recently.
                setPlayerStatus(false);
            }
            //}, 60000)
        }, 2000);
    });
});
function onMouseMoved() {
    //Mouse has moved.
    if (mouseMoveEventSkipperCount > 30) {
        console.log("UAT - User mouse moved, updating last time active...");
        lastMovedMouseTime = new Date();
        mouseMoveEventSkipperCount = 0;
    }
    else {
        mouseMoveEventSkipperCount++;
    }
}
function sendStatusReportSocketEvent(status) {
    const socket = game.socket;
    socket.emit(SOCKET_NAME, { type: ArcSocketEventType.statusReport, data: { name: game.user.name, status: status } });
}
function setPlayerStatus(isAfk) {
    let playerStatusesArray = Array.from(game.playerStatuses).map(([name, status]) => {
        return { name, status: status.toString() };
    });
    if (isAfk) {
        for (let i = 0; i < playerStatusesArray.length; i++) {
            //Check username and activity status.
            if (playerStatusesArray[i].name == game.user.name && playerStatusesArray[i].status == AfkStatus.afk.toString()) {
                //User is AFK! No need to update!
                return;
            }
        }
        console.log("UAT - Set player status to AFK");
        sendStatusReportSocketEvent(AfkStatus.afk);
        game.playerStatuses.set(game.user.name, AfkStatus.afk);
        renderPlayerAfkStatus(game.user.name, AfkStatus.afk);
    }
    else {
        for (let i = 0; i < playerStatusesArray.length; i++) {
            //Check username and activity status.
            if (playerStatusesArray[i].name == game.user.name && playerStatusesArray[i].status == AfkStatus.notAfk.toString()) {
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
function getPlayerStatus(player) {
}
//Todo: A function that checks if all player statuses are set to AFK, and then shuts down the server.
//Todo: Make this in Python through HTTP api, or log this to the debug.log somehow.
function checkIfAllPlayersAreAfk() {
    let playerStatuses = getData();
    playerStatuses.forEach(element => {
        if (element === "notAfk") {
            return false;
        }
    });
    return true;
}
function getData(options = {}) {
    let playerStatuses = Array.from(game.playerStatuses).map(([name, status]) => {
        return { name, status: status.toString() };
    });
    //Todo: Remove this as it takes up lots of processing and isn't needed.
    var playerStrings = [];
    for (let i = 0; i < playerStatuses.length; i++) {
        playerStrings.push(playerStatuses[i].name + playerStatuses[i].status);
    }
    console.log("Player statuses: " + playerStrings);
    return playerStatuses;
}
