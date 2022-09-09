export var ArcSocketEventType;
(function (ArcSocketEventType) {
    ArcSocketEventType["readyCheck"] = "afk-ready-check-event";
    ArcSocketEventType["statusReport"] = "afk-ready-check-status-report-event";
})(ArcSocketEventType || (ArcSocketEventType = {}));
export var AfkStatus;
(function (AfkStatus) {
    AfkStatus[AfkStatus["notAfk"] = 0] = "notAfk";
    AfkStatus[AfkStatus["afk"] = 1] = "afk";
    AfkStatus[AfkStatus["unknown"] = 2] = "unknown";
})(AfkStatus || (AfkStatus = {}));
export function renderPlayerAfkStatus(playerName, status) {
    console.log('UAT - Rendering player status: ', playerName, status);
    const playerNameSpans = Array.from(document.getElementsByClassName('player-name'));
    console.log('UAT - Found spans: ', playerNameSpans);
    const playerSpan = playerNameSpans.find((pns) => pns.innerText.split(' ')[0] === playerName);
    console.log('UAT - Found specific span for this player: ', playerSpan);
    if (playerSpan) {
        const icon = document.createElement('i');
        icon.className = getIconClass(status);
        if (playerSpan.hasChildNodes()) {
            playerSpan.childNodes.forEach((n) => {
                if (!n.textContent) {
                    playerSpan.removeChild(n);
                }
            });
        }
        playerSpan.appendChild(icon);
    }
}
export function getIconClass(status) {
    if (status === AfkStatus.unknown) {
        return `fas fa-question player-unknown`;
    }
    if (status === AfkStatus.afk) {
        return `fas fa-dice-d20 player-afk`;
    }
    return `fas fa-dice-d20 player-not-afk`;
}
