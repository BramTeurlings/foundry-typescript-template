import { ArcSocketEventType, AfkStatus, renderPlayerAfkStatus } from './arc.js';

let SOCKET_NAME = "module.afk-ready-check";
const socket = game.socket as SocketIOClient.Socket;
let lastMovedMouseTime = new Date();
//let afkTimeoutInMs = 1800000;
let afkTimeoutInMs = 1800;

Hooks.once('init', async function() {
    //Unused for now.
    console.log("UAT - Initializing activity tracker...")
});

Hooks.once('ready', async function() {
    //Set up mouseEventListener here.
    console.log("UAT - Ready hook received for FoundryVTT User Activity Tracker (UAT)");

    //Todo: This is really ugly, I might be registering mouse listeners constantly here and that would be very bad.
    //let mouseInterval = setInterval(() => {
        canvas.controls._onMouseMove({data: {
            getLocalPosition() { 
                //Mouse has moved.
                console.log("UAT - Mouse moved!");
                lastMovedMouseTime = new Date(); 
            }
        }});
    //}, 200);

    //Capturing mouse moved events.
    canvas.controls._onMouseMove = (ev) => canvas.controls._mouseMove(ev);
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

function onMouseMoved(){
    //Mouse has moved.
    console.log("UAT - Mouse moved!");
    lastMovedMouseTime = new Date(); 
}

function sendStatusReportSocketEvent(status: AfkStatus): void {
    const socket = game.socket as SocketIOClient.Socket;
    socket.emit(SOCKET_NAME, { type: ArcSocketEventType.statusReport, data: { name: game.user.name, status: status } });
}

function setPlayerStatus(isAfk: boolean){
    if(isAfk){
        console.log("UAT - Set player status to AFK");
        sendStatusReportSocketEvent(AfkStatus.afk);
        game.playerStatuses.set(game.user.name, AfkStatus.afk);
        renderPlayerAfkStatus(game.user.name, AfkStatus.afk);
    }else{
        console.log("UAT - Set player status to ACTIVE");
        sendStatusReportSocketEvent(AfkStatus.notAfk);
        game.playerStatuses.set(game.user.name, AfkStatus.notAfk);
        renderPlayerAfkStatus(game.user.name, AfkStatus.afk);
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