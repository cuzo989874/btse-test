export default interface IBTSEWebsocketSubscribePayload {
  channel: [string];
  event: "subscribe" | "unsubscribe";
}
