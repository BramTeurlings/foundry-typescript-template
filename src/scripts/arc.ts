export enum ArcSocketEventType {
  readyCheck = 'afk-ready-check-event',
  statusReport = 'afk-ready-check-status-report-event',
}

export enum AfkStatus {
    notAfk,
    afk,
    unknown,
}

export function renderPlayerAfkStatus(playerName: string, status: AfkStatus): void {
  console.log('UAT - Rendering player status: ', playerName, status);
  const playerNameSpans = Array.from(document.getElementsByClassName('player-name'));
  console.log('UAT - Found spans: ', playerNameSpans);
  const playerSpan = playerNameSpans.find((pns) => (pns as any).innerText.split(' ')[0] === playerName);
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

export function getIconClass(status: AfkStatus): string {
  if (status === AfkStatus.unknown) {
    return `fas fa-question player-unknown`;
  }
  if (status === AfkStatus.afk) {
    return `fas fa-dice-d20 player-afk`;
  }
  return `fas fa-dice-d20 player-not-afk`;
}