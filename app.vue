<template>
  <section class="order-book">
    <div class="order-book__header">Order Book</div>
    <table class="quote-table">
      <thead>
        <tr>
          <th class="cell text-left">Price (USD)</th>
          <th class="cell text-right">Size</th>
          <th class="cell text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(
            {
              price,
              size,
              dependencySum,
              dependencyPercentage,
              isNew,
              sizeCompare,
            },
            index
          ) of asksWithSum"
          :key="index"
          :class="{ 'new-order--sell': isNew }"
        >
          <td class="cell text-left text-sell">
            <formattedNumber :value="price" :digits="1" />
          </td>
          <td class="cell text-right" :class="`size--${sizeCompare}`">
            <formattedNumber :value="size" />
          </td>
          <td class="cell text-right">
            <div
              class="quote-table__sum-percentage quote-table__sum-percentage--sell"
              :data-percentage="100 - dependencyPercentage * 100"
            />
            <span><formattedNumber :value="dependencySum" /></span>
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <td colspan="3">
            <div class="last-price" :class="`last-price--${lastPriceCompare}`">
              <div class="last-price__content">
                <formattedNumber
                  v-if="lastPriceAmount"
                  :value="lastPriceAmount"
                  :digits="1"
                />
                <img
                  v-if="lastPriceCompare === 'greater'"
                  src="~/public/arrow_upward.svg"
                  alt="Arrow Upward"
                  width="16px"
                >
                <img
                  v-else-if="lastPriceCompare === 'less'"
                  src="~/public/arrow_downward.svg"
                  alt="Arrow Downward"
                  width="16px"
                >
              </div>
            </div>
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr
          v-for="(
            {
              price,
              size,
              dependencySum,
              dependencyPercentage,
              isNew,
              sizeCompare,
            },
            index
          ) of bidsWithSum"
          :key="index"
          :class="{ 'new-order--buy': isNew }"
        >
          <td class="cell text-left text-buy">
            <formattedNumber :value="price" :digits="1" />
          </td>
          <td class="cell text-right" :class="`size--${sizeCompare}`">
            <formattedNumber :value="size" />
          </td>
          <td class="cell text-right">
            <div
              class="quote-table__sum-percentage quote-table__sum-percentage--buy"
              :data-percentage="100 - dependencyPercentage * 100"
            />
            <span><formattedNumber :value="dependencySum" /></span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
<script lang="ts" setup>
import OrderBook from "./server/websocket/OrderBook";
import LastPrice from "./server/websocket/LastPrice";

import FormattedNumber from "./components/FormattedNumber.vue";
import type IStoreOrder from "./shared/interface/IStoreOrder";
import type TCompareStatus from "./shared/type/TCompareStatus";

interface IOrder extends IStoreOrder {
  dependencySum: number;
  dependencyPercentage: number;
}

const showLimit = 8;

const bidsWithSum = ref<IOrder[]>([]);
const asksWithSum = ref<IOrder[]>([]);

const lastPriceAmount = ref(0);
const lastPriceCompare = ref<TCompareStatus>("equal");

OrderBook.init((storeBids, storeAsks) => {
  const shortStoreBids = storeBids.slice(0, showLimit);
  const accBids = sum(shortStoreBids);
  const shortStoreAsks = storeAsks.slice(0, showLimit);
  const accAsks = sum(shortStoreAsks);

  bidsWithSum.value = shortStoreBids.map(
    ({ price, size, isNew, sizeCompare }, index) => {
      const sumAbove = sum(shortStoreBids.slice(0, index + 1));

      return {
        price,
        size,
        isNew,
        sizeCompare,
        dependencySum: sumAbove,
        dependencyPercentage: sumAbove / accBids,
      };
    }
  );
  asksWithSum.value = shortStoreAsks.map(
    ({ price, size, isNew, sizeCompare }, index) => {
      const sumBelow = sum(shortStoreAsks.slice(index, showLimit));

      return {
        price,
        size,
        isNew,
        sizeCompare,
        dependencySum: sumBelow,
        dependencyPercentage: sumBelow / accAsks,
      };
    }
  );
});
LastPrice.init((price, compare) => {
  lastPriceAmount.value = price;
  lastPriceCompare.value = compare;
});

function sum(entries: IStoreOrder[]) {
  return entries.reduce((acc, { size }) => {
    return acc + Number(size);
  }, 0);
}

onUnmounted(() => {
  OrderBook.close();
  LastPrice.close();
});
</script>
<style lang="scss">
$gap: 8px;
$backgroundColor: #131b29;
$defaultTextColor: #f0f4f8;
$quoteTableHeadTextColor: #8698aa;
$buyQuotePriceTextColor: #00b15d;
$sellQuotePriceTextColor: #ff5b5a;
$quoteRowHoverBackgroundColor: #1e3059;
$BuyQuoteAccumulativeTotalSizeBarColor: rgba($buyQuotePriceTextColor, 0.12);
$SellQuoteAccumulativeTotalSizeBarColor: rgba($sellQuotePriceTextColor, 0.12);
$AnimationFlashGreenBackgroundColor: rgba($buyQuotePriceTextColor, 0.5);
$AnimationFlashRedBackgroundColor: rgba($sellQuotePriceTextColor, 0.5);

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.text-buy {
  color: $buyQuotePriceTextColor;
}

.text-sell {
  color: $sellQuotePriceTextColor;
}

.order-book {
  background-color: $backgroundColor;
  color: $defaultTextColor;
  max-width: 320px;
  margin: auto;

  &__header {
    padding: $gap;
    border-bottom: 1px solid rgba(white, 0.12);
    font-weight: 600;
  }
}

.quote-table {
  width: 100%;
  background-color: $backgroundColor;
  color: $defaultTextColor;
  font-size: 0.75em;
  border-spacing: 0;

  thead {
    color: $quoteTableHeadTextColor;
    font-weight: bold;
  }

  tbody .cell {
    cursor: pointer;
    font-weight: 600;
  }

  .cell {
    position: relative;
    width: calc(100% / 3);
    padding: calc($gap / 2) $gap;
    border: 0;
  }

  &__sum-percentage {
    position: absolute;
    top: 0;
    bottom: 0;
    left: attr(data-percentage %);
    right: 0;

    & + span {
      position: relative;
      z-index: 1;
    }

    &--buy {
      background-color: $BuyQuoteAccumulativeTotalSizeBarColor;
    }

    &--sell {
      background-color: $SellQuoteAccumulativeTotalSizeBarColor;
    }
  }
  &__body > tr {
    position: relative;
  }

  .new-order {
    &--buy {
      animation: ease-in-out FlashGreenBg 0.3s;
    }
    &--sell {
      animation: ease-in-out FlashRedBg 0.3s;
    }
  }
  .size {
    &--greater {
      animation: ease-in-out FlashGreenBg 0.3s;
    }
    &--less {
      animation: ease-in-out FlashRedBg 0.3s;
    }
  }
}

.last-price {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(2ex + $gap * 1.5);
  background-color: rgba($quoteTableHeadTextColor, 0.12);
  padding: 0 calc($gap / 2);
  font-size: 1.4em;
  font-weight: bold;

  &--greater {
    color: $buyQuotePriceTextColor;
    background-color: $BuyQuoteAccumulativeTotalSizeBarColor;
  }

  &--less {
    color: $sellQuotePriceTextColor;
    background-color: $SellQuoteAccumulativeTotalSizeBarColor;
  }

  &__content {
    position: relative;
    display: flex;

    & > img {
      position: absolute;
      right: calc(-16px - $gap / 2);
      top: calc(50% - 8px);
    }
  }
}

@keyframes FlashGreenBg {
  0% {
    background-color: #0000;
  }
  15% {
    background-color: $AnimationFlashGreenBackgroundColor;
  }
  100% {
    background-color: #0000;
  }
}
@keyframes FlashRedBg {
  0% {
    background-color: #0000;
  }
  15% {
    background-color: $AnimationFlashRedBackgroundColor;
  }
  100% {
    background-color: #0000;
  }
}
</style>
