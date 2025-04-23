import type IBTSEWebSocketEvent from "~/shared/interface/IBTSEWebSocketEvent";
import type IBTSEWebsocketSubscribePayload from "~/shared/interface/IBTSEWebsocketSubscribePayload";

interface ILastPriceWebSocketEvent extends IBTSEWebSocketEvent {
  data: Array<{
    side: string; // "BUY" or "SELL"
    size: number;
    price: number;
    tradeId: number;
    timestamp: number;
    symbol: string;
  }>;
}

let _socket: WebSocket | null;
let _previousPrice = NaN;

function isSubscribePayload(
  payload: ILastPriceWebSocketEvent | IBTSEWebsocketSubscribePayload
): payload is IBTSEWebsocketSubscribePayload {
  return (payload as IBTSEWebsocketSubscribePayload).event !== undefined;
}

function init(
  callback: (price: number, compare: "equal" | "greater" | "less") => void
) {
  // sure not to create multiple socket connections
  close();

  _socket = new WebSocket("wss://ws.btse.com/ws/futures");

  _socket.onopen = (event) => {
    console.log("Last Price socket connection opened:", event);
    subscribe();
  };
  _socket.onclose = () => {
    console.log("Last Price socket Closed.");
  };
  _socket.onerror = (error) => {
    console.error("Last Price socket error:", error);
  };

  _socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as
        | ILastPriceWebSocketEvent
        | IBTSEWebsocketSubscribePayload;
      if (isSubscribePayload(data)) {
        return;
      }

      callback(
        data.data[0].price,
        data.data[0].price === _previousPrice
          ? "equal"
          : data.data[0].price > _previousPrice
            ? "greater"
            : "less"
      );
      _previousPrice = data.data[0].price;
    } catch (err) {
      console.error("❌ 解析訊息失敗:", err, event.data);
    }
  };
}

function close() {
  if (_socket) {
    unsubscribe();
    _socket.close();
    _socket = null;
  }
}

function subscribe() {
  _socket?.send(
    JSON.stringify({
      op: "subscribe",
      args: ["tradeHistoryApi:BTCPFC"],
    })
  );
}

function unsubscribe() {
  _socket?.send(
    JSON.stringify({
      op: "unsubscribe",
      args: ["tradeHistoryApi:BTCPFC"],
    })
  );
}

export default {
  init,
  close,
};
