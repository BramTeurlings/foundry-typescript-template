export enum ArcSocketEventType {
  readyCheck = 'afk-ready-check-event',
  statusReport = 'afk-ready-check-status-report-event',
}

export enum AfkStatus {
    notAfk,
    afk,
    unknown,
}