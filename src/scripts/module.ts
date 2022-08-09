import { Console, time } from 'console';
import { ArcSocketEventType, AfkStatus } from './arc';

let SOCKET_NAME = "module.afk-ready-check";
const socket = game.socket as SocketIOClient.Socket;
let lastMovedMouseTime = new Date();
let afkTimeoutInMs = 1800000;

Hooks.once('init', async function() {
    //Unused for now.
});

Hooks.once('ready', async function() {
    //Set up mouseEventListener here.
    canvas.controls._onMouseMove({data: {
        getLocalPosition() { 
            //Mouse has moved.
            lastMovedMouseTime = new Date(); 
        }
    }});

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
    }, 60000)
});

function sendStatusReportSocketEvent(status: AfkStatus): void {
    const socket = game.socket as SocketIOClient.Socket;
    socket.emit(SOCKET_NAME, { type: ArcSocketEventType.statusReport, data: { name: game.user.name, status: status } });
}

function setPlayerStatus(isAfk: boolean){
    if(isAfk){
        sendStatusReportSocketEvent(AfkStatus.afk);
        game.playerStatuses.set(game.user.name, AfkStatus.afk);
    }else{
        sendStatusReportSocketEvent(AfkStatus.notAfk);
        game.playerStatuses.set(game.user.name, AfkStatus.notAfk);
    }
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
    console.log("Player statuses: " + playerStatuses);
    return playerStatuses;
  }