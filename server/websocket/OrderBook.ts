import type IBTSEWebSocketEvent from "~/shared/interface/IBTSEWebSocketEvent";
import type IBTSEWebsocketSubscribePayload from "~/shared/interface/IBTSEWebsocketSubscribePayload";
import type IStoreOrder from "~/shared/interface/IStoreOrder";
import type TCompareStatus from "~/shared/type/TCompareStatus";

interface IOrderBookWebSocketEvent extends IBTSEWebSocketEvent {
  data: {
    bids: [string, string][]; // string will be string number
    asks: [string, string][]; // string will be string number
    seqNum: number;
    prevSeqNum: number; // should be confirm currentSequence must equal to prevSeqNum when event come in.
    type: string;
    timestamp: number;
    symbol: string;
  };
}

const MAX_STORE_LENGTH = 2000;

let _socket: WebSocket | null;
let currentSequence = NaN;
const storeBids: IStoreOrder[] = [];
const storeAsks: IStoreOrder[] = [];

function isSubscribePayload(
  payload: IOrderBookWebSocketEvent | IBTSEWebsocketSubscribePayload
): payload is IBTSEWebsocketSubscribePayload {
  return (payload as IBTSEWebsocketSubscribePayload).event !== undefined;
}

function init(callback: (bids: IStoreOrder[], asks: IStoreOrder[]) => void) {
  // sure not to create multiple socket connections
  close();

  _socket = new WebSocket("wss://ws.btse.com/ws/oss/futures");

  _socket.onopen = (event) => {
    console.log("Order Book socket connection opened:", event);
    subscribe();
  };
  _socket.onclose = () => {
    console.log("Order Book socket Closed.");
  };
  _socket.onerror = (error) => {
    console.error("Order Book socket error:", error);
  };

  _socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as
        | IOrderBookWebSocketEvent
        | IBTSEWebsocketSubscribePayload;
      if (isSubscribePayload(data)) {
        return;
      }
      if (currentSequence !== data.data.prevSeqNum && !isNaN(currentSequence)) {
        unsubscribe();
        subscribe();

        throw new Error(
          `當前序號與上次序號不一致 \n current: ${currentSequence} \n prev: ${data.data.prevSeqNum}`
        );
      }

      currentSequence = data.data.seqNum;
      solveSocketRawData(data.data.bids, storeBids);
      solveSocketRawData(data.data.asks, storeAsks);

      callback(storeBids, storeAsks);
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
  currentSequence = NaN;
  _socket?.send(
    JSON.stringify({
      op: "subscribe",
      args: ["update:BTCPFC_0"],
    })
  );
}

function unsubscribe() {
  currentSequence = NaN;
  _socket?.send(
    JSON.stringify({
      op: "unsubscribe",
      args: ["update:BTCPFC_0"],
    })
  );
}

function solveSocketRawData(
  newOrderList: [string, string][],
  targetStore: IStoreOrder[]
): void {
  const numberingOrderList = newOrderList
    .filter(([, size]) => size !== "0")
    .map(
      ([price, size]) =>
        [Number(price), Number(size)] satisfies [number, number]
    );
  const newOrderMap = new Map<number, number>(numberingOrderList);
  const duplicatePriceSizeCompareMap = new Map<number, TCompareStatus>();

  for (let i = 0; i < targetStore.length; i++) {
    const newSize = newOrderMap.get(targetStore[i].price);
    if (newSize) {
      const [oldBid] = targetStore.splice(i, 1);
      duplicatePriceSizeCompareMap.set(
        oldBid.price,
        newSize > oldBid.size
          ? 'greater'
          : newSize < oldBid.size
           ? 'less'
           : 'equal'
      );
      i--;
    }
  }

  targetStore.unshift(
    ...numberingOrderList.map(([price, size]) => ({
      price,
      size,
      isNew: !duplicatePriceSizeCompareMap.has(price),
      sizeCompare: duplicatePriceSizeCompareMap.get(price) ?? 'equal',
    }))
  );
  targetStore.splice(MAX_STORE_LENGTH);
}

export default {
  init,
  close,
};
